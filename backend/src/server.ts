import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from '../routes/auth.js';
import workspaceRoutes from '../routes/workspace.js';
import analyticsRoutes from '../routes/analytics.js';
import chatRoutes, { initializeChatServices } from '../routes/chat.js';

// Import services
import AIChatService from '../services/ai-chat-service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ["https://careerate.azurewebsites.net"] 
      : ["http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Initialize AI Chat Service
const aiChatService = new AIChatService();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://careerate.azurewebsites.net"] 
    : ["http://localhost:3000"],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      aiChat: aiChatService ? 'active' : 'inactive',
      socketIO: io ? 'active' : 'inactive',
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspace', workspaceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);

// Initialize chat services with Socket.IO
initializeChatServices(io, aiChatService);

// Chrome Extension API endpoints
app.post('/api/extension/context', async (req, res) => {
  try {
    const { context, userId, sessionId } = req.body;
    
    // Store context for AI processing
    await aiChatService.updateContext(sessionId, context);
    
    res.json({ 
      success: true, 
      message: 'Context received successfully' 
    });
  } catch (error) {
    console.error('Extension context error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/extension/explain-error', async (req, res) => {
  try {
    const { errorText, context } = req.body;
    
    // Create temporary session for error explanation
    const sessionId = `error-${Date.now()}`;
    const chatContext = {
      sessionId,
      userId: 'extension-user',
      currentTool: context?.currentTool,
      cloudProvider: context?.cloudProvider,
      repository: context?.repository,
      browserContext: context,
    };
    
    await aiChatService.startChat(chatContext);
    
    const explanation = await aiChatService.sendMessage(
      sessionId, 
      `Explain this error and provide solutions: ${errorText}`,
      false
    );
    
    res.json({ 
      success: true, 
      explanation 
    });
  } catch (error) {
    console.error('Error explanation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// VS Code Extension API endpoints
app.post('/api/vscode/assist', async (req, res) => {
  try {
    const { code, language, question, workspaceContext } = req.body;
    
    const sessionId = `vscode-${Date.now()}`;
    const chatContext = {
      sessionId,
      userId: 'vscode-user',
      currentTool: 'vscode',
      repository: workspaceContext?.repository,
      browserContext: {
        code,
        language,
        workspaceContext,
      },
    };
    
    await aiChatService.startChat(chatContext);
    
    const response = await aiChatService.sendMessage(
      sessionId,
      question || `Help me with this ${language} code: ${code}`,
      false
    );
    
    res.json({ 
      success: true, 
      response 
    });
  } catch (error) {
    console.error('VS Code assist error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Slack Bot webhook
app.post('/api/slack/events', async (req, res) => {
  try {
    const { event, challenge } = req.body;
    
    // Handle Slack challenge
    if (challenge) {
      return res.json({ challenge });
    }
    
    // Handle Slack messages
    if (event?.type === 'message' && event?.text && !event?.bot_id) {
      const sessionId = `slack-${event.user}-${Date.now()}`;
      const chatContext = {
        sessionId,
        userId: event.user,
        teamId: event.team,
        currentTool: 'slack',
      };
      
      await aiChatService.startChat(chatContext);
      
      const response = await aiChatService.sendMessage(
        sessionId,
        event.text,
        false
      );
      
      // Send response back to Slack (implement Slack API call here)
      console.log('Slack response:', response);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Slack webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Teams Bot webhook
app.post('/api/teams/webhook', async (req, res) => {
  try {
    const { type, text, from } = req.body;
    
    if (type === 'message' && text) {
      const sessionId = `teams-${from.id}-${Date.now()}`;
      const chatContext = {
        sessionId,
        userId: from.id,
        currentTool: 'teams',
      };
      
      await aiChatService.startChat(chatContext);
      
      const response = await aiChatService.sendMessage(
        sessionId,
        text,
        false
      );
      
      // Send response back to Teams (implement Teams API call here)
      console.log('Teams response:', response);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Teams webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analytics endpoints
app.get('/api/analytics/productivity/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const insights = await aiChatService.getTeamInsights(teamId);
    
    res.json({ 
      success: true, 
      insights 
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Serve static files
if (process.env.NODE_ENV === 'production') {
  // In production, serve frontend from public directory
  app.use(express.static(path.join(__dirname, '../../public')));
  
  // Catch-all handler for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/index.html'));
  });
} else {
  // In development, serve frontend from frontend/dist
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  
  socket.on('disconnect', (reason) => {
    console.log(`🔌 Client disconnected: ${socket.id}, reason: ${reason}`);
  });
  
  socket.on('error', (error) => {
    console.error(`🔌 Socket error for ${socket.id}:`, error);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('🛑 Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('🛑 Process terminated');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Careerate server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 AI Chat Service: ${aiChatService ? 'Active' : 'Inactive'}`);
  console.log(`🔌 Socket.IO: Active`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`💻 Frontend URL: http://localhost:3000`);
    console.log(`🔧 API URL: http://localhost:${PORT}/api`);
  }
});

export default app; 