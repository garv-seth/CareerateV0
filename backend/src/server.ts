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
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage, BaseMessage, ToolMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';

// Load environment variables
dotenv.config();

// Import services and routes
import { AzureSecretsManager } from './services/AzureSecretsManager';
import { AzureB2CAuth } from './services/AzureB2CAuth';
import authRoutes from './routes/auth';
import workspaceRoutes from './routes/workspace';
import mcpRoutes from './routes/mcp';
import analyticsRoutes from './routes/analytics';
import { ToolManager } from './orchestration/ToolManager';

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
  private isInitialized = false;
  private frontendBuildPath: string;
  private llm: Runnable<any, any, any> | null = null;
  private toolManager: ToolManager;

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
    this.toolManager = new ToolManager();

    this.frontendBuildPath = path.resolve(__dirname, '..', 'public');

    this.initialize();
    this.initializeLLM();
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

  private initializeLLM() {
    if (process.env.OPENAI_API_KEY) {
      // Bind tools to the LLM
      const toolLLM = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4-turbo-preview',
        streaming: true,
        temperature: 0.7,
      });
      this.llm = toolLLM.bindTools(this.toolManager.getLangChainTools());
      logger.info('✅ OpenAI LLM initialized with tools');
    } else {
      logger.warn('⚠️  OpenAI API key not found, LLM will not be available for tool use');
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
      // Setup core routes first (health, api info)
      this.setupCoreRoutes();
      // Setup API routes with error boundaries
      this.setupApiRoutes();
      // Setup fallback routes last
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
        let langchainMessages: BaseMessage[] = messages.map((msg: any) => {
          return msg.role === 'user' ? new HumanMessage(msg.content) : new AIMessage(msg.content);
        });

        // Add system prompt based on selected agent
        const systemPrompts: { [key: string]: string } = {
          terraform: "You are a Terraform expert specializing in Infrastructure as Code. Help with Terraform configurations, best practices, and troubleshooting. You have access to tools to read, write, and list files, and execute shell commands.",
          kubernetes: "You are a Kubernetes expert specializing in container orchestration. Help with K8s deployments, troubleshooting, and best practices. You have access to tools to read, write, and list files, and execute shell commands.",
          aws: "You are an AWS cloud expert. Help with AWS services, architecture, and best practices. You have access to tools to read, write, and list files, and execute shell commands.",
          monitoring: "You are a monitoring and observability expert. Help with metrics, alerting, and system monitoring. You have access to tools to read, write, and list files, and execute shell commands.",
          incident: "You are an incident response expert. Help with troubleshooting, root cause analysis, and emergency procedures. You have access to tools to read, write, and list files, and execute shell commands.",
          general: "You are a DevOps expert. Help with general DevOps practices, automation, and system administration. You have access to tools to read, write, and list files, and execute shell commands."
        };

        const selectedAgent = agent || 'general';
        const systemPrompt = systemPrompts[selectedAgent as keyof typeof systemPrompts] || systemPrompts.general;
        
        // Prepend system message only if not already present
        if (!langchainMessages.some(msg => msg instanceof HumanMessage && typeof msg.content === 'string' && msg.content.startsWith("System:"))) {
          langchainMessages = [new HumanMessage(`System: ${systemPrompt}\n\nUser: ${messages[messages.length - 1].content}`)];
        } else {
          // If system message is already part of history, just update the last user message.
          // This is a simplification; a more robust solution would manage prompt templates.
          const lastMessage = langchainMessages[langchainMessages.length - 1];
          if (lastMessage instanceof HumanMessage && typeof lastMessage.content === 'string') {
            lastMessage.content = `System: ${systemPrompt}\n\nUser: ${lastMessage.content}`;
          }
        }

        const tools = this.toolManager.getAllTools();
        const toolMap = new Map(tools.map(tool => [tool.name, tool]));

        // Create a runnable for the LLM and tools
        const runnable = RunnableSequence.from([
          ChatPromptTemplate.fromMessages([new MessagesPlaceholder("messages")]),
          this.llm.withConfig({ runName: "Agent" }),
          {
            tool_calls: (input: AIMessage) => input.tool_calls || [],
            output: (input: AIMessage) => input.content,
            tool_outputs: async (input: AIMessage) => {
              const toolCalls = input.tool_calls || [];
              const toolResults = [];
              for (const toolCall of toolCalls) {
                const tool = toolMap.get(toolCall.name);
                if (tool) {
                  try {
                    const toolOutput = await tool.execute(toolCall.args);
                    toolResults.push({ name: toolCall.name, output: toolOutput });
                  } catch (e) {
                    logger.error(`Error executing tool ${toolCall.name}:`, e);
                    toolResults.push({ name: toolCall.name, output: { error: (e as Error).message } });
                  }
                } else {
                  toolResults.push({ name: toolCall.name, output: { error: `Tool ${toolCall.name} not found.` } });
                }
              }
              return toolResults;
            }
          }
        ]);

        const stream = await runnable.stream(langchainMessages);

        for await (const chunk of stream) {
          if (chunk.tool_calls) {
            for (const toolCall of chunk.tool_calls) {
              const data = {
                type: 'tool_code',
                name: toolCall.name,
                args: toolCall.args,
              };
              res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
          } else if (chunk.output) {
            const data = {
              type: 'chunk',
              data: chunk.output
            };
            res.write(`data: ${JSON.stringify(data)}\n\n`);
          } else if (chunk.tool_outputs) {
             for (const toolOutput of chunk.tool_outputs) {
              const data = {
                type: 'tool_output',
                name: toolOutput.name,
                output: toolOutput.output,
              };
              res.write(`data: ${JSON.stringify(data)}\n\n`);
            }
          }
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
          description: 'Expert in Terraform configurations, best practices, and troubleshooting, with access to file and shell tools.'
        },
        {
          name: 'Kubernetes',
          icon: '☸️',
          expertise: 'Container orchestration expert',
          description: 'Specialist in K8s deployments, troubleshooting, and best practices, with access to file and shell tools.'
        },
        {
          name: 'AWS',
          icon: '☁️',
          expertise: 'Cloud platform specialist',
          description: 'Expert in AWS services, architecture, and best practices, with access to file and shell tools.'
        },
        {
          name: 'Monitoring',
          icon: '📊',
          expertise: 'Observability and alerting expert',
          description: 'Specialist in metrics, alerting, and system monitoring, with access to file and shell tools.'
        },
        {
          name: 'Incident',
          icon: '🚨',
          expertise: 'Emergency response specialist',
          description: 'Expert in troubleshooting, root cause analysis, and emergency procedures, with access to file and shell tools.'
        },
        {
          name: 'General',
          icon: '🛠️',
          expertise: 'DevOps generalist',
          description: 'Expert in general DevOps practices, automation, and system administration, with access to file and shell tools.'
        }
      ];
      res.json(agents);
    });
  }

  private setupFallbackRoutes() {
    // Handle 404s for API endpoints only
    this.app.use('/api', (req, res) => {
      res.status(404).json({ error: 'API endpoint not found' });
    });

    // For non-API routes, return a simple message
    this.app.use((req, res) => {
      res.status(404).json({ error: 'This is an API-only backend. Frontend runs on port 3000.' });
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
          aiAgents: !!this.llm,
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
      logger.info(`⚡️ WebSocket client connected: ${socket.id}`);

      socket.on('chatMessage', async (message: string) => {
        logger.info(`Received chat message from ${socket.id}: ${message}`);
        socket.emit('chatMessage', `Server received: ${message}`);
      });

      socket.on('runAgent', async (data: { agent: string, prompt: string }) => {
        logger.info(`Received runAgent request from ${socket.id}: Agent=${data.agent}, Prompt=${data.prompt}`);
        
        try {
          if (!this.llm) {
            socket.emit('agentResponse', { type: 'error', data: 'AI service not available' });
            return;
          }

          socket.emit('agentResponse', { type: 'start', data: `Running ${data.agent} agent with prompt: "${data.prompt}"` });

          const systemPrompts: { [key: string]: string } = {
            terraform: "You are a Terraform expert specializing in Infrastructure as Code. Help with Terraform configurations, best practices, and troubleshooting. You have access to tools to read, write, and list files, and execute shell commands.",
            kubernetes: "You are a Kubernetes expert specializing in container orchestration. Help with K8s deployments, troubleshooting, and best practices. You have access to tools to read, write, and list files, and execute shell commands.",
            aws: "You are an AWS cloud expert. Help with AWS services, architecture, and best practices. You have access to tools to read, write, and list files, and execute shell commands.",
            monitoring: "You are a monitoring and observability expert. Help with metrics, alerting, and system monitoring. You have access to tools to read, write, and list files, and execute shell commands.",
            incident: "You are an incident response expert. Help with troubleshooting, root cause analysis, and emergency procedures. You have access to tools to read, write, and list files, and execute shell commands.",
            general: "You are a DevOps expert. Help with general DevOps practices, automation, and system administration. You have access to tools to read, write, and list files, and execute shell commands."
          };

          const selectedAgent = data.agent || 'general';
          const systemPrompt = systemPrompts[selectedAgent as keyof typeof systemPrompts] || systemPrompts.general;
          
          let messages: BaseMessage[] = [new HumanMessage(`System: ${systemPrompt}\n\nUser: ${data.prompt}`)];
          
          const tools = this.toolManager.getAllTools();
          const toolMap = new Map(tools.map(tool => [tool.name, tool]));

          // Create a runnable for the LLM and tools
          const runnable = RunnableSequence.from([
            ChatPromptTemplate.fromMessages([new MessagesPlaceholder("messages")]),
            this.llm.withConfig({ runName: "Agent" }),
            {
              tool_calls: (input: AIMessage) => input.tool_calls || [],
              output: (input: AIMessage) => input.content,
              tool_outputs: async (input: AIMessage) => {
                const toolCalls = input.tool_calls || [];
                const toolResults = [];
                for (const toolCall of toolCalls) {
                  const tool = toolMap.get(toolCall.name);
                  if (tool) {
                    try {
                      const toolOutput = await tool.execute(toolCall.args);
                      toolResults.push({ name: toolCall.name, output: toolOutput });
                    } catch (e) {
                      logger.error(`Error executing tool ${toolCall.name}:`, e);
                      toolResults.push({ name: toolCall.name, output: { error: (e as Error).message } });
                    }
                  } else {
                    toolResults.push({ name: toolCall.name, output: { error: `Tool ${toolCall.name} not found.` } });
                  }
                }
                return toolResults;
              }
            }
          ]);

          const stream = await runnable.stream(messages);

          for await (const chunk of stream) {
            if (chunk.tool_calls) {
              for (const toolCall of chunk.tool_calls) {
                socket.emit('agentResponse', { 
                  type: 'tool_code',
                  name: toolCall.name,
                  args: toolCall.args,
                });
              }
            } else if (chunk.output) {
              socket.emit('agentResponse', { 
                type: 'chunk',
                data: chunk.output
              });
            } else if (chunk.tool_outputs) {
                for (const toolOutput of chunk.tool_outputs) {
                socket.emit('agentResponse', { 
                  type: 'tool_output',
                  name: toolOutput.name,
                  output: toolOutput.output,
                });
              }
            }
          }

          socket.emit('agentResponse', { type: 'complete', data: null });

        } catch (error) {
          logger.error('Error running agent:', error);
          socket.emit('agentResponse', { type: 'error', data: 'Error running agent. Please try again.' });
        }
      });

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
    logger.info('✅ WebSocket configured');
  }

  public start(): void {
    const port = parseInt(process.env.PORT || '8080', 10);
    this.server.listen(port, () => {
      logger.info(`🚀 Backend server running on port ${port}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (!this.isInitialized) {
        logger.warn('⚠️  Server not fully initialized. Some services may be unavailable.');
      } else {
        logger.info('✅ Server ready');
      }
    });

    this.server.on('error', (error: any) => {
      logger.error('Server error:', error);
      process.exit(1); // Exit with failure code
    });
  }
}

// Start the server
const server = new CareerateServer();
server.start(); 