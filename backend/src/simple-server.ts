import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import winston from 'winston';
import path from 'path';
import dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

// Load environment variables
dotenv.config();

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

class CareerateServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private llm: ChatOpenAI | null = null;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true
      }
    });

    this.initializeLLM();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private initializeLLM() {
    if (process.env.OPENAI_API_KEY) {
      this.llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4-turbo-preview',
        streaming: true,
        temperature: 0.7,
      });
      logger.info('✅ OpenAI LLM initialized');
    } else {
      logger.warn('⚠️  OpenAI API key not found');
    }
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    }));
    
    this.app.set('trust proxy', 1);

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "http://localhost:5173"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 200,
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files
    const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
    this.app.use(express.static(frontendBuildPath));
    
    logger.info('✅ Middleware configured');
  }

  private setupRoutes() {
    // API info route
    this.app.get('/api', (req, res) => {
      res.json({
        message: '🚀 Careerate AI DevOps Platform',
        version: '1.0.0',
        status: 'operational',
        features: {
          aiAgents: !!this.llm,
          streaming: true,
          authentication: false,
          secretsManager: false
        },
        agents: {
          terraform: 'Infrastructure as Code specialist',
          kubernetes: 'Container orchestration expert',
          aws: 'Cloud platform specialist',
          monitoring: 'Observability and alerting expert',
          incident: 'Emergency response specialist',
          general: 'DevOps generalist'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          llm: hasOpenAI ? 'operational' : 'not_configured'
        }
      });
    });

    // AI chat endpoint with streaming
    this.app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
      try {
        const { messages, agent } = req.body;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          res.status(400).json({ error: 'Messages array is required' });
          return;
        }

        if (!this.llm) {
          res.status(503).json({ error: 'AI service not available' });
          return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        // Convert messages to LangChain format
        const langchainMessages = messages.map((msg: any) => {
          return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
        });

        // Add system prompt based on selected agent
        const systemPrompts = {
          terraform: "You are a Terraform expert specializing in Infrastructure as Code. Help with Terraform configurations, best practices, and troubleshooting.",
          kubernetes: "You are a Kubernetes expert specializing in container orchestration. Help with K8s deployments, troubleshooting, and best practices.",
          aws: "You are an AWS cloud expert. Help with AWS services, architecture, and best practices.",
          monitoring: "You are a monitoring and observability expert. Help with metrics, alerting, and system monitoring.",
          incident: "You are an incident response expert. Help with troubleshooting, root cause analysis, and emergency procedures.",
          general: "You are a DevOps expert. Help with general DevOps practices, automation, and system administration."
        };

        const selectedAgent = agent || 'general';
        const systemPrompt = systemPrompts[selectedAgent as keyof typeof systemPrompts] || systemPrompts.general;
        
        // Prepend system message
        const messagesWithSystem = [new HumanMessage(`System: ${systemPrompt}\n\nUser: ${messages[messages.length - 1].content}`)];

        const stream = await this.llm.stream(messagesWithSystem);

        for await (const chunk of stream) {
          const data = {
            type: 'chunk',
            data: chunk.content
          };
          res.write(`data: ${JSON.stringify(data)}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ type: 'complete', data: null })}\n\n`);
        res.end();

      } catch (error) {
        logger.error('Chat endpoint error:', error);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Internal server error',
            message: 'Chat service temporarily unavailable'
          });
        } else {
          res.end();
        }
      }
    });

    // Get available agents
    this.app.get('/api/agents', (req: Request, res: Response) => {
      const agents = [
        {
          name: 'Terraform',
          icon: '🏗️',
          expertise: 'Infrastructure as Code specialist',
          description: 'Expert in Terraform configurations, best practices, and troubleshooting'
        },
        {
          name: 'Kubernetes',
          icon: '☸️',
          expertise: 'Container orchestration expert',
          description: 'Specialist in K8s deployments, troubleshooting, and best practices'
        },
        {
          name: 'AWS',
          icon: '☁️',
          expertise: 'Cloud platform specialist',
          description: 'Expert in AWS services, architecture, and best practices'
        },
        {
          name: 'Monitoring',
          icon: '📊',
          expertise: 'Observability and alerting expert',
          description: 'Specialist in metrics, alerting, and system monitoring'
        },
        {
          name: 'Incident',
          icon: '🚨',
          expertise: 'Emergency response specialist',
          description: 'Expert in troubleshooting, root cause analysis, and emergency procedures'
        },
        {
          name: 'General',
          icon: '🛠️',
          expertise: 'DevOps generalist',
          description: 'Expert in general DevOps practices, automation, and system administration'
        }
      ];
      res.json(agents);
    });

    // Default handler
    this.app.get('/', (req, res) => {
      res.redirect('/api');
    });
    
    logger.info('✅ Routes configured');
  }

  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info('Client connected:', socket.id);

      socket.on('join-room', (roomId) => {
        socket.join(roomId);
        logger.info(`Client ${socket.id} joined room ${roomId}`);
      });

      socket.on('chat-message', async (data) => {
        try {
          const { messages, agent, roomId } = data;
          
          if (!this.llm) {
            socket.emit('chat-error', { error: 'AI service not available' });
            return;
          }

          // Process chat similarly to HTTP endpoint
          const langchainMessages = messages.map((msg: any) => {
            return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
          });

          const stream = await this.llm.stream(langchainMessages);

          for await (const chunk of stream) {
            const event = {
              type: 'chunk',
              data: chunk.content
            };
            
            if (roomId) {
              this.io.to(roomId).emit('chat-event', event);
            } else {
              socket.emit('chat-event', event);
            }
          }

          const completeEvent = { type: 'complete', data: null };
          if (roomId) {
            this.io.to(roomId).emit('chat-event', completeEvent);
          } else {
            socket.emit('chat-event', completeEvent);
          }

        } catch (error) {
          logger.error('WebSocket chat error:', error);
          socket.emit('chat-error', { error: 'Message processing failed' });
        }
      });

      socket.on('disconnect', () => {
        logger.info('Client disconnected:', socket.id);
      });
    });
  }

  public start(): void {
    const port = process.env.PORT || 8081;
    
    this.server.listen(port, () => {
      logger.info(`🚀 Careerate Server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'default'}`);
      logger.info('📍 Available routes:');
      logger.info('  GET  /api        - API info');
      logger.info('  GET  /health     - Health check');
      logger.info('  GET  /api/agents - List agents');
      logger.info('  POST /api/chat   - Chat with AI');
      logger.info('✅ Server ready to handle requests');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Server closed');
        process.exit(0);
      });
    });
  }
}

// Start the server
const server = new CareerateServer();
server.start();