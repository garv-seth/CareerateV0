import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import AIChatService from '../services/ai-chat-service.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
let io = null;
let aiChatService = null;

// Initialize Socket.IO and AI Chat Service
export function initializeChatServices(socketIO, chatService) {
  io = socketIO;
  aiChatService = chatService;

  // Setup Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    socket.on('join-chat', async (data) => {
      const { userId, teamId, sessionId } = data;
      
      // Join room for real-time collaboration
      if (teamId) {
        socket.join(`team-${teamId}`);
      }
      socket.join(`session-${sessionId}`);

      // Start chat session
      const context = {
        sessionId: sessionId || uuidv4(),
        userId,
        teamId,
        currentTool: data.currentTool,
        cloudProvider: data.cloudProvider,
        repository: data.repository,
        browserContext: data.browserContext,
        extensionData: data.extensionData,
      };

      await aiChatService.startChat(context);
      
      socket.emit('chat-joined', { sessionId: context.sessionId });
    });

    socket.on('send-message', async (data) => {
      const { sessionId, message, streaming = true } = data;
      
      try {
        if (streaming) {
          // Stream response
          const responseStream = await aiChatService.sendMessage(sessionId, message, true);
          
          for await (const chunk of responseStream) {
            socket.emit('message-chunk', { sessionId, chunk });
            
            // Broadcast to team members
            const session = aiChatService.activeChats.get(sessionId);
            if (session?.teamId) {
              socket.to(`team-${session.teamId}`).emit('team-message-chunk', {
                sessionId,
                userId: session.userId,
                chunk
              });
            }
          }
          
          socket.emit('message-complete', { sessionId });
        } else {
          // Non-streaming response
          const response = await aiChatService.sendMessage(sessionId, message, false);
          socket.emit('message-response', { sessionId, response });
        }
      } catch (error) {
        console.error('Chat error:', error);
        socket.emit('chat-error', { sessionId, error: error.message });
      }
    });

    socket.on('share-context', async (data) => {
      const { fromSessionId, toSessionId, contextData } = data;
      await aiChatService.shareContext(fromSessionId, toSessionId, contextData);
    });

    socket.on('get-team-insights', async (data) => {
      const { teamId } = data;
      const insights = await aiChatService.getTeamInsights(teamId);
      socket.emit('team-insights', { teamId, insights });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${socket.id}`);
    });
  });

  // Listen to AI Chat Service events for real-time collaboration
  aiChatService.on('chatStarted', (data) => {
    if (data.teamId) {
      io.to(`team-${data.teamId}`).emit('team-chat-started', data);
    }
  });

  aiChatService.on('messageChunk', (data) => {
    io.to(`session-${data.sessionId}`).emit('message-chunk', data);
  });

  aiChatService.on('messageComplete', (data) => {
    io.to(`session-${data.sessionId}`).emit('message-complete', data);
  });

  aiChatService.on('contextShared', (data) => {
    io.to(`team-${data.teamId}`).emit('context-shared', data);
  });
}

// REST endpoints for chat functionality
router.post('/start', async (req, res) => {
  try {
    const { userId, teamId, currentTool, cloudProvider, repository, browserContext } = req.body;
    
    const sessionId = uuidv4();
    const context = {
      sessionId,
      userId,
      teamId,
      currentTool,
      cloudProvider,
      repository,
      browserContext,
    };

    await aiChatService.startChat(context);
    
    res.json({ 
      success: true, 
      sessionId,
      message: 'Chat session started successfully'
    });
  } catch (error) {
    console.error('Start chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/message', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    
    const response = await aiChatService.sendMessage(sessionId, message, false);
    
    res.json({ 
      success: true, 
      response,
      sessionId 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/insights/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const insights = await aiChatService.getTeamInsights(teamId);
    
    res.json({ 
      success: true, 
      insights 
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/context/share', async (req, res) => {
  try {
    const { fromSessionId, toSessionId, contextData } = req.body;
    
    await aiChatService.shareContext(fromSessionId, toSessionId, contextData);
    
    res.json({ 
      success: true, 
      message: 'Context shared successfully' 
    });
  } catch (error) {
    console.error('Share context error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 