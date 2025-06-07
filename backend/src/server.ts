import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Routes
import authRoutes from './routes/auth.js';

import mcpRoutes from './routes/mcp.js';
import workspaceRoutes from './routes/workspace.js';
import analyticsRoutes from './routes/analytics.js';

// Services
import { EnhancedAgentOrchestrator } from './services/EnhancedAgentOrchestrator.js';

// Middleware
import { authenticateUser } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

class CareerateServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private agentOrchestrator?: EnhancedAgentOrchestrator;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true
      }
    });

    this.initializeServices();
  }

  private async initializeServices() {
    try {
      console.log('🚀 Starting Careerate Server...');

      // Initialize Database connections
      await this.initializeDatabases();

      // Initialize Enhanced AI Agent Orchestrator with task execution capabilities
      this.agentOrchestrator = new EnhancedAgentOrchestrator();
      await this.agentOrchestrator.initialize();

      // Store services in app locals for routes to access
      this.app.locals.agentOrchestrator = this.agentOrchestrator;

      // Setup middleware and routes
      this.setupMiddleware();
      this.setupRoutes();
      this.setupWebSocketHandlers();

      // Error handling
      this.app.use(errorHandler);

      console.log('✅ All services initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private async initializeDatabases() {
    try {
      // MongoDB for user data and sessions
      const mongoUri = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/careerate';
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      // Don't exit on database failure in development
      console.warn('⚠️  Continuing without database...');
    }
  }

  private setupMiddleware() {
    // Security
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ["http://localhost:3000"],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(limiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session management
    this.app.use(session({
      secret: process.env.SESSION_SECRET || 'careerate-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));

    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });
  }

  private setupRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes);
    // Agent routes temporarily removed for build compatibility
    this.app.use('/api/mcp', authenticateUser, mcpRoutes);
    this.app.use('/api/workspace', authenticateUser, workspaceRoutes);
    this.app.use('/api/analytics', authenticateUser, analyticsRoutes);

    // Agent streaming endpoint
    this.app.post('/api/agents/stream', async (req, res) => {
      try {
        const { message, agentType, context } = req.body;
        const userId = 'user-123'; // Mock user ID for now

        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
        });

        if (this.agentOrchestrator) {
          const stream = this.agentOrchestrator.streamResponse({
            message,
            agentType,
            userId,
            sessionId: 'stream-session',
            context
          });

          for await (const update of stream) {
            res.write(`data: ${JSON.stringify(update)}\n\n`);
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
      } catch (error) {
        console.error('Streaming error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl 
      });
    });
  }

  private setupWebSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.id}`);

      // Join chat session
      socket.on('join-chat', async (data) => {
        const { sessionId, userId } = data;
        await socket.join(sessionId);
        
        socket.emit('chat-joined', { sessionId });
        console.log(`👤 User ${userId} joined chat session ${sessionId}`);
      });

      // Handle AI chat messages
      socket.on('send-message', async (data) => {
        try {
          const { sessionId, message, selectedAgent } = data;
          
          if (!this.agentOrchestrator) {
            socket.emit('chat-error', { error: 'AI service not available' });
            return;
          }

          const stream = this.agentOrchestrator.streamResponse({
            message,
            agentType: selectedAgent,
            userId: socket.id,
            sessionId
          });

          for await (const chunk of stream) {
            // Handle different chunk types
            if (chunk.type === 'message') {
              socket.emit('message-chunk', { chunk: chunk.content });
            } else if (chunk.type === 'thinking') {
              socket.emit('thinking', { content: chunk.content });
            } else if (chunk.type === 'planning') {
              socket.emit('planning', { content: chunk.content });
            } else if (chunk.type === 'complete') {
              socket.emit('message-complete', { agentUsed: chunk.agentUsed });
            } else if (chunk.type === 'error') {
              socket.emit('chat-error', { error: chunk.content });
            }
          }

        } catch (error) {
          console.error('Socket message error:', error);
          socket.emit('chat-error', { error: 'Failed to process message' });
        }
      });

      // Handle workspace joining
      socket.on('join-workspace', async (workspaceId: string) => {
        try {
          await socket.join(workspaceId);
          console.log(`👥 User joined workspace: ${workspaceId}`);
        } catch (error) {
          console.error('Failed to join workspace:', error);
        }
      });

      // Handle context sharing
      socket.on('share-context', async (data: any) => {
        try {
          socket.broadcast.emit('context-shared', data);
          console.log('📤 Context shared to team');
        } catch (error) {
          console.error('Failed to share context:', error);
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 User disconnected: ${socket.id}`);
      });
    });
  }

  public async start() {
    const port = process.env.PORT || 5000;
    
    this.server.listen(port, () => {
      console.log(`
🚀 Careerate Server Started Successfully!
┌─────────────────────────────────────┐
│  Environment: ${process.env.NODE_ENV || 'development'}
│  Port: ${port}
│  Agent Orchestration: ✅ Active
│  Real-time Chat: ✅ Ready
│  WebSocket: ✅ Connected
│  MongoDB: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '⚠️  Disconnected'}
└─────────────────────────────────────┘

🤖 AI Configuration:
${process.env.OPENAI_API_KEY ? '✅ OpenAI API Key configured' : '⚠️  OpenAI API Key missing'}
${process.env.ANTHROPIC_API_KEY ? '✅ Anthropic API Key configured' : '⚠️  Anthropic API Key missing'}

${!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY ? 
  '💡 Set OPENAI_API_KEY or ANTHROPIC_API_KEY for real AI responses' : ''}
      `);
    });

    // Graceful shutdown
    process.on('SIGTERM', this.shutdown.bind(this));
    process.on('SIGINT', this.shutdown.bind(this));
  }

  private async shutdown() {
    console.log('🛑 Shutting down Careerate Server...');
    
    this.server.close(() => {
      console.log('📡 HTTP server closed');
    });

    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
    
    console.log('✅ Careerate Server shut down gracefully');
    process.exit(0);
  }
}

// Start the server
const server = new CareerateServer();
server.start().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

export default CareerateServer; 