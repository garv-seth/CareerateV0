import express from 'express';
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

// Import actual services
import { AzureSecretsManager } from './services/AzureSecretsManager';
import { AzureB2CAuth } from './services/AzureB2CAuth';
import { SimpleAgentOrchestrator } from './services/SimpleAgentOrchestrator';

// Import routes
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import mcpRoutes from './routes/mcp';

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
  private authService: AzureB2CAuth;
  private agentOrchestrator: SimpleAgentOrchestrator;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        credentials: true
      }
    });

    // Initialize services
    this.secretsManager = new AzureSecretsManager();
    this.authService = new AzureB2CAuth(this.secretsManager);
    this.agentOrchestrator = new SimpleAgentOrchestrator();

    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize services with graceful fallbacks
      await this.secretsManager.initialize();
      console.log('✅ Secrets manager initialized');
    } catch (error) {
      console.warn('⚠️  Secrets manager initialization failed, using env vars:', error);
    }

    try {
      await this.authService.initialize();
      console.log('✅ Auth service initialized');
    } catch (error) {
      console.warn('⚠️  Auth service initialization failed:', error);
    }

    try {
      await this.agentOrchestrator.initialize();
      console.log('✅ Agent orchestrator initialized');
    } catch (error) {
      console.warn('⚠️  Agent orchestrator initialization failed:', error);
    }

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

    // Serve static files from public directory (frontend build)
    const publicPath = path.join(__dirname, '..', 'public');
    this.app.use(express.static(publicPath));
  }

  private setupRoutes() {
    // Use actual route handlers
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/workspace', workspaceRoutes);
    this.app.use('/api/mcp', mcpRoutes);

    // API info route - for checking if API is running
    this.app.get('/api', (req, res) => {
      res.json({
        message: '🚀 Careerate API is running!',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          chat: 'POST /api/chat',
          agents: 'GET /api/agents',
          auth: '/api/auth/*',
          workspace: '/api/workspace/*',
          mcp: '/api/mcp/*'
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

    // Real AI chat endpoint with streaming
    this.app.post('/api/chat', async (req, res) => {
      try {
        const { message, agentType = 'general', context, userId = 'anonymous' } = req.body;
        
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }

        // Set up SSE headers for streaming
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        });

        try {
          // Use real agent orchestrator
          const responseGenerator = this.agentOrchestrator.streamResponse({
            message,
            agentType,
            context,
            userId
          });

          let fullResponse = '';
          for await (const chunk of responseGenerator) {
            if (chunk.type === 'message') {
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({
                type: 'chunk',
                content: chunk.content,
                timestamp: chunk.timestamp
              })}\n\n`);
            } else if (chunk.type === 'complete') {
              res.write(`data: ${JSON.stringify({
                type: 'complete',
                fullResponse,
                agentUsed: chunk.agentUsed,
                timestamp: chunk.timestamp
              })}\n\n`);
              break;
            } else if (chunk.type === 'error') {
              res.write(`data: ${JSON.stringify({
                type: 'error',
                error: chunk.content
              })}\n\n`);
              break;
            }
          }
        } catch (streamError) {
          console.error('Streaming error:', streamError);
          res.write(`data: ${JSON.stringify({
            type: 'error',
            error: 'AI service temporarily unavailable'
          })}\n\n`);
        }

        res.end();
        
      } catch (error) {
        logger.error('Chat error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Agent types endpoint - now from real orchestrator
    this.app.get('/api/agents', async (req, res) => {
      try {
        const agents = await this.agentOrchestrator.getAvailableAgents();
        res.json(agents);
      } catch (error) {
        logger.error('Error fetching agents:', error);
        res.status(500).json({ error: 'Failed to fetch agents' });
      }
    });

    // Handle common bot requests
    this.app.get('/robots.txt', (req, res) => {
      res.type('text/plain');
      res.send('User-agent: *\nDisallow: /api/\nAllow: /');
    });

    this.app.get('/favicon.ico', (req, res) => {
      res.status(204).end();
    });

    // Catch all non-API routes and serve the frontend app (SPA routing)
    this.app.get('*', (req, res) => {
      // If it's an API route that wasn't found, return JSON error
      if (req.originalUrl.startsWith('/api/')) {
        logger.warn(`404 - API route not found: ${req.method} ${req.originalUrl}`);
        return res.status(404).json({ 
          error: 'API route not found',
          method: req.method,
          url: req.originalUrl,
          availableRoutes: [
            'GET /api',
            'GET /health', 
            'GET /api/agents',
            'POST /api/chat'
          ]
        });
      }

      // For all other routes, serve the frontend app
      const indexPath = path.join(__dirname, '..', 'public', 'index.html');
      res.sendFile(indexPath, (err) => {
        if (err) {
          logger.error('Error serving index.html:', err);
          res.status(500).json({ 
            error: 'Frontend not available',
            message: 'The frontend application could not be loaded'
          });
        }
      });
    });
  }

  // Fallback mock response generator for when AI services are unavailable
  private generateMockResponse(message: string, agentType: string): string {
    const responses = {
      terraform: `Here's how to help with Terraform for "${message}":

1. **Infrastructure Planning**: Define your resources in .tf files
2. **State Management**: Use remote state with S3/Azure Storage
3. **Modules**: Break down into reusable components

Example:
\`\`\`hcl
resource "aws_instance" "web" {
  ami           = "ami-0c02fb55956c7d316"
  instance_type = "t3.micro"
  
  tags = {
    Name = "WebServer"
  }
}
\`\`\`

Would you like me to help with a specific Terraform configuration?`,

      kubernetes: `For Kubernetes help with "${message}":

**Quick Diagnostics:**
\`\`\`bash
kubectl get pods --all-namespaces
kubectl describe pod <pod-name>
kubectl logs <pod-name> -f
\`\`\`

**Common Issues:**
- ImagePullBackOff → Check image name/registry access
- CrashLoopBackOff → Check application logs
- Pending → Check resource requests vs cluster capacity

What specific K8s issue are you troubleshooting?`,

      aws: `AWS guidance for "${message}":

**Best Practices:**
- Use IAM roles instead of access keys
- Enable CloudTrail for auditing
- Set up CloudWatch monitoring
- Use VPC for network isolation

**Common Commands:**
\`\`\`bash
aws sts get-caller-identity
aws ec2 describe-instances
aws s3 ls
\`\`\`

Which AWS service do you need help with?`,

      general: `DevOps assistance for "${message}":

**General Approach:**
1. Identify the problem scope
2. Check logs and monitoring
3. Verify configurations
4. Test in staging first
5. Document the solution

**Tools to Consider:**
- Monitoring: Prometheus, Grafana, DataDog
- CI/CD: GitHub Actions, Jenkins, GitLab CI
- Infrastructure: Terraform, Ansible, Pulumi

What specific challenge are you facing?`
    };

    return responses[agentType as keyof typeof responses] || responses.general;
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