import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// New Orchestrator
import { MultiAgentOrchestrator } from './orchestration/MultiAgentOrchestrator';

// Import services and routes
import { AzureSecretsManager } from './services/AzureSecretsManager';
import { AzureB2CAuth } from './services/AzureB2CAuth';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import mcpRoutes from './routes/mcp';
import analyticsRoutes from './routes/analytics';

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
  private secretsManager: AzureSecretsManager;
  private authService: AzureB2CAuth | null = null;
  private agentOrchestrator: MultiAgentOrchestrator;
  private isInitialized = false;
  private frontendBuildPath: string;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "*",
        credentials: true
      }
    });

    // Initialize services
    this.secretsManager = new AzureSecretsManager();
    this.agentOrchestrator = new MultiAgentOrchestrator();

    this.frontendBuildPath = path.resolve(__dirname, '..', 'public');

    this.initialize();
  }

  private async initialize() {
    try {
      logger.info('🚀 Starting Careerate Server initialization...');
      
      // Initialize secrets manager with graceful fallback
      try {
        await this.secretsManager.initialize();
        logger.info('✅ Secrets manager initialized');
      } catch (error) {
        logger.warn('⚠️  Secrets manager initialization failed, using env vars:', error);
      }

      // Initialize auth service with graceful fallback
      try {
        this.authService = new AzureB2CAuth(this.secretsManager);
        await this.authService.initialize();
        logger.info('✅ Auth service initialized');
      } catch (error) {
        logger.warn('⚠️  Auth service initialization failed, continuing without auth:', error);
        this.authService = null;
      }

      // Initialize agent orchestrator
      try {
        await this.agentOrchestrator.initialize();
        logger.info('✅ Agent orchestrator initialized');
      } catch (error) {
        logger.warn('⚠️  Agent orchestrator initialization failed, using mock responses:', error);
      }

      this.setupMiddleware();
      this.setupRoutes();
      this.setupWebSocket();
      this.isInitialized = true;
      
      logger.info('🎉 Careerate Server initialization complete');
    } catch (error) {
      logger.error('❌ Server initialization failed:', error);
      // Continue startup even if some services fail
      this.setupMiddleware();
      this.setupBasicRoutes();
      this.isInitialized = true;
    }
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: false, // Disable for development
      crossOriginEmbedderPolicy: false
    }));
    
    this.app.set('trust proxy', 1); // Trust the first proxy

    // CORS - More permissive for development
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000", "https://careerate-app.azurewebsites.net"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
    }));

    // Rate limiting - More lenient
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Increased from 100
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Serve static files from the frontend build directory
    this.app.use(express.static(this.frontendBuildPath));
    
    logger.info('✅ Middleware configured');
  }

  private setupRoutes() {
    try {
      // Setup API routes with error boundaries
      this.setupApiRoutes();
      this.setupCoreRoutes();
      this.setupFallbackRoutes();
      
      logger.info('✅ Routes configured');
    } catch (error) {
      logger.error('❌ Route setup failed:', error);
      this.setupBasicRoutes();
    }
  }

  private setupApiRoutes() {
    // Auth routes
    if (this.authService) {
      this.app.use('/api/auth', authRoutes);
    } else {
      this.app.use('/api/auth', (req, res) => {
        res.status(503).json({ error: 'Auth service not available' });
      });
    }

    // Workspace routes
    this.app.use('/api/workspace', workspaceRoutes);

    // MCP routes
    this.app.use('/api/mcp', mcpRoutes);

    // Analytics routes
    this.app.use('/api/analytics', analyticsRoutes);
  }

  private setupFallbackRoutes() {
    // API-only backend - no static file serving
    this.app.use((req, res) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'This is an API-only backend. Frontend runs on port 3000.' });
      } else {
        res.status(404).json({ error: 'API endpoint not found' });
      }
    });
  }

  private setupCoreRoutes() {
    // API info route - for checking if API is running
    this.app.get('/api', (req, res) => {
      res.json({
        message: '🚀 Careerate AI DevOps Platform',
        version: '1.0.0',
        status: 'operational',
        features: {
          aiAgents: true,
          streaming: true,
          authentication: !!this.authService,
          secretsManager: true
        },
        endpoints: {
          health: 'GET /health',
          api: 'GET /api',
          chat: 'POST /api/chat',
          agents: 'GET /api/agents',
          auth: '/api/auth/*',
          workspace: '/api/workspace/*',
          mcp: '/api/mcp/*'
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

    // Enhanced health check
    this.app.get('/health', (req, res) => {
      const environment = process.env.NODE_ENV || 'development';
      const hasOpenAI = !!process.env.OPENAI_API_KEY;
      const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment,
        services: {
          secretsManager: 'operational',
          authService: this.authService ? 'operational' : 'degraded',
          agentOrchestrator: 'operational',
          aiProviders: {
            openai: hasOpenAI ? 'available' : 'not_configured',
            anthropic: hasAnthropic ? 'available' : 'not_configured'
          }
        },
        configuration: {
          corsOrigin: process.env.CORS_ORIGIN ? 'configured' : 'default',
          hasSessionSecret: !!process.env.SESSION_SECRET,
          hasJwtSecret: !!process.env.JWT_SECRET,
          nodeEnv: environment,
          port: process.env.PORT || 'default'
        }
      });
    });

    // Real AI chat endpoint with streaming
    this.app.post('/api/chat', async (req: Request, res: Response): Promise<void> => {
      try {
        const { messages, agent, context } = req.body;
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
           res.status(400).json({ error: 'Messages array is required' });
           return;
        }

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const responseGenerator = this.agentOrchestrator.invoke({
          messages,
          requestedAgent: agent || 'Auto',
          context,
        });

        for await (const event of responseGenerator) {
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        }
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
      try {
        const agents = this.agentOrchestrator.getAvailableAgents();
        res.json(agents);
      } catch (error) {
        logger.error('Agents endpoint error:', error);
        res.status(500).json({ error: 'Failed to get agents' });
      }
    });
  }

  private setupBasicRoutes() {
    // Minimal routes for emergency mode
    this.app.get('/api', (req, res) => {
      res.json({
        message: '🚨 Careerate Emergency Mode',
        status: 'limited',
        timestamp: new Date().toISOString()
      });
    });

    this.app.get('/health', (req, res) => {
      res.json({
        status: 'emergency',
        timestamp: new Date().toISOString()
      });
    });
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
          const { messages, agent, context, roomId } = data;
          
          // Use the new orchestrator's invoke method
          const responseGenerator = this.agentOrchestrator.invoke({
            messages,
            requestedAgent: agent || 'Auto',
            context
          });

          for await (const event of responseGenerator) {
            if (roomId) {
              this.io.to(roomId).emit('chat-event', event);
            } else {
              socket.emit('chat-event', event);
            }
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
    const port = process.env.PORT || 8080;
    
    this.server.listen(port, () => {
      logger.info(`🚀 Careerate Server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 CORS Origin: ${process.env.CORS_ORIGIN || 'default'}`);
      logger.info('📍 Available routes:');
      logger.info('  GET  /           - API info');
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