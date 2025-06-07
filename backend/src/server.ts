import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

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

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP'
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes() {
    // Root route - what you're probably hitting
    this.app.get('/', (req, res) => {
      res.json({
        message: '🚀 Careerate API is running!',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          chat: 'POST /api/chat',
          agents: 'GET /api/agents'
        },
        timestamp: new Date().toISOString()
      });
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        corsOrigin: process.env.CORS_ORIGIN ? 'configured' : 'default',
        hasSessionSecret: !!process.env.SESSION_SECRET,
        hasJwtSecret: !!process.env.JWT_SECRET
      });
    });

    // Simple AI chat endpoint
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, agentType = 'general' } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Mock AI response for now
        const mockResponse = this.generateMockResponse(message, agentType);
        
        res.json({
          id: uuidv4(),
          message: mockResponse,
          agentType,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        logger.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Agent types endpoint
    this.app.get('/api/agents', (req, res) => {
      res.json([
        { id: 'terraform', name: 'Terraform Expert', description: 'Infrastructure as Code specialist' },
        { id: 'kubernetes', name: 'Kubernetes Expert', description: 'Container orchestration specialist' },
        { id: 'aws', name: 'AWS Expert', description: 'Cloud services specialist' },
        { id: 'monitoring', name: 'Monitoring Expert', description: 'Observability specialist' },
        { id: 'incident', name: 'Incident Response', description: 'Emergency response specialist' },
        { id: 'general', name: 'DevOps General', description: 'General DevOps assistant' }
      ]);
    });

    // Catch all with better debugging
    this.app.use('*', (req, res) => {
      logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
      res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl,
        availableRoutes: [
          'GET /',
          'GET /health', 
          'GET /api/agents',
          'POST /api/chat'
        ]
      });
    });
  }

  private setupWebSocket() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('join-workspace', (workspaceId) => {
        socket.join(workspaceId);
        logger.info(`Client ${socket.id} joined workspace: ${workspaceId}`);
      });

      socket.on('send-message', async (data) => {
        try {
          const { message, agentType, workspaceId } = data;
          
          const response = this.generateMockResponse(message, agentType);
          
          // Simulate streaming response
          const words = response.split(' ');
          for (let i = 0; i < words.length; i++) {
            setTimeout(() => {
              socket.emit('message-chunk', {
                chunk: words[i] + ' ',
                isComplete: i === words.length - 1,
                timestamp: new Date().toISOString()
              });
            }, i * 100);
          }
          
        } catch (error) {
          logger.error('WebSocket message error:', error);
          socket.emit('error', { message: 'Failed to process message' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private generateMockResponse(message: string, agentType: string): string {
    const responses = {
      terraform: `As a Terraform expert, I can help you with infrastructure as code. For your query about "${message}", I recommend creating a terraform configuration that defines your infrastructure declaratively.`,
      kubernetes: `As a Kubernetes specialist, I can assist with container orchestration. Regarding "${message}", consider using deployment manifests and services to manage your containerized applications.`,
      aws: `As an AWS expert, I can guide you through cloud services. For "${message}", I suggest leveraging AWS services like EC2, S3, and Lambda for scalable solutions.`,
      monitoring: `As a monitoring specialist, I can help set up observability. For "${message}", implement proper logging, metrics, and alerting using tools like Prometheus and Grafana.`,
      incident: `As an incident response expert, I can guide you through emergency procedures. For "${message}", follow the incident response playbook and ensure proper communication channels.`,
      general: `As a DevOps assistant, I can help with various tasks. Regarding "${message}", I recommend following DevOps best practices including automation, monitoring, and continuous improvement.`
    };

    return responses[agentType as keyof typeof responses] || responses.general;
  }

  public start(): void {
    const port = process.env.PORT || 5000;
    
    this.server.listen(port, () => {
      logger.info(`🚀 Careerate Server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
      logger.info(`📍 Available routes:`);
      logger.info(`  GET  /           - API info`);
      logger.info(`  GET  /health     - Health check`);
      logger.info(`  GET  /api/agents - List agents`);
      logger.info(`  POST /api/chat   - Chat with AI`);
      logger.info(`✅ Server ready to handle requests`);
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