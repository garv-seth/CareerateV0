import { Server as SocketIOServer, Socket } from 'socket.io';

interface AgentMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  metadata: {
    agentType?: string;
    userId: string;
    timestamp: number;
    context?: Record<string, any>;
  };
}

interface WorkspaceState {
  id: string;
  participants: Set<string>;
  sharedContext: Record<string, any>;
  messageHistory: AgentMessage[];
  lastActivity: number;
}

interface UserSession {
  userId: string;
  socketId: string;
  workspaces: Set<string>;
  isActive: boolean;
  lastSeen: number;
}

export class RealTimeCollaboration {
  private io: SocketIOServer;
  private workspaces: Map<string, WorkspaceState> = new Map();
  private userSessions: Map<string, UserSession> = new Map();
  private activeCollaborations: Map<string, any> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  async initialize(): Promise<void> {
    try {
      console.log('🤝 Initializing Real-time Collaboration...');

      // Set up periodic cleanup
      setInterval(() => {
        this.cleanupInactiveWorkspaces();
      }, 5 * 60 * 1000); // Every 5 minutes

      console.log('✅ Real-time Collaboration initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Real-time Collaboration:', error);
      throw error;
    }
  }

  async handleUserJoin(socket: Socket, workspaceId: string): Promise<void> {
    try {
      const userId = (socket as any).user.id;
      
      // Create or get workspace
      let workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        workspace = {
          id: workspaceId,
          participants: new Set(),
          sharedContext: {},
          messageHistory: [],
          lastActivity: Date.now()
        };
        this.workspaces.set(workspaceId, workspace);
      }

      // Add user to workspace
      workspace.participants.add(userId);
      workspace.lastActivity = Date.now();

      // Update user session
      const userSession: UserSession = {
        userId,
        socketId: socket.id,
        workspaces: new Set([workspaceId]),
        isActive: true,
        lastSeen: Date.now()
      };
      this.userSessions.set(userId, userSession);

      // Join socket room
      await socket.join(workspaceId);

      // Notify other participants
      socket.to(workspaceId).emit('user-joined', {
        userId,
        timestamp: Date.now(),
        participantCount: workspace.participants.size
      });

      // Send workspace state to joining user
      socket.emit('workspace-state', {
        workspaceId,
        participants: Array.from(workspace.participants),
        sharedContext: workspace.sharedContext,
        recentMessages: workspace.messageHistory.slice(-50) // Last 50 messages
      });

      console.log(`👤 User ${userId} joined workspace ${workspaceId}`);
    } catch (error) {
      console.error('❌ Error handling user join:', error);
      socket.emit('error', { message: 'Failed to join workspace' });
    }
  }

  async handleUserLeave(socket: Socket): Promise<void> {
    try {
      const userId = (socket as any).user?.id;
      if (!userId) return;

      const userSession = this.userSessions.get(userId);
      if (!userSession) return;

      // Remove user from all workspaces
      for (const workspaceId of userSession.workspaces) {
        const workspace = this.workspaces.get(workspaceId);
        if (workspace) {
          workspace.participants.delete(userId);
          workspace.lastActivity = Date.now();

          // Notify other participants
          socket.to(workspaceId).emit('user-left', {
            userId,
            timestamp: Date.now(),
            participantCount: workspace.participants.size
          });

          // Remove empty workspaces
          if (workspace.participants.size === 0) {
            this.workspaces.delete(workspaceId);
          }
        }
      }

      // Remove user session
      this.userSessions.delete(userId);

      console.log(`👤 User ${userId} left all workspaces`);
    } catch (error) {
      console.error('❌ Error handling user leave:', error);
    }
  }

  async handleAgentMessage(socket: Socket, message: AgentMessage): Promise<void> {
    try {
      const userId = (socket as any).user.id;
      const workspaceId = Array.from(socket.rooms).find(room => room !== socket.id);

      if (!workspaceId) {
        socket.emit('error', { message: 'No active workspace found' });
        return;
      }

      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        socket.emit('error', { message: 'Workspace not found' });
        return;
      }

      // Validate message
      if (!message.content || !message.type) {
        socket.emit('error', { message: 'Invalid message format' });
        return;
      }

      // Enrich message with metadata
      const enrichedMessage: AgentMessage = {
        ...message,
        id: message.id || this.generateMessageId(),
        metadata: {
          ...message.metadata,
          userId,
          timestamp: Date.now()
        }
      };

      // Add to workspace history
      workspace.messageHistory.push(enrichedMessage);
      workspace.lastActivity = Date.now();

      // Limit message history to last 1000 messages
      if (workspace.messageHistory.length > 1000) {
        workspace.messageHistory = workspace.messageHistory.slice(-1000);
      }

      // Update shared context if provided
      if (message.metadata.context) {
        workspace.sharedContext = {
          ...workspace.sharedContext,
          ...message.metadata.context
        };
      }

      // Broadcast message to all participants in the workspace
      this.io.to(workspaceId).emit('agent-message', enrichedMessage);

      // Handle special message types
      await this.handleSpecialMessageTypes(enrichedMessage, workspaceId);

      console.log(`💬 Agent message processed in workspace ${workspaceId}`);
    } catch (error) {
      console.error('❌ Error handling agent message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  }

  async handleContextShare(socket: Socket, data: { context: Record<string, any>; targetUsers?: string[] }): Promise<void> {
    try {
      const userId = (socket as any).user.id;
      const workspaceId = Array.from(socket.rooms).find(room => room !== socket.id);

      if (!workspaceId) {
        socket.emit('error', { message: 'No active workspace found' });
        return;
      }

      const workspace = this.workspaces.get(workspaceId);
      if (!workspace) {
        socket.emit('error', { message: 'Workspace not found' });
        return;
      }

      // Update shared context
      workspace.sharedContext = {
        ...workspace.sharedContext,
        ...data.context
      };
      workspace.lastActivity = Date.now();

      // Create context share event
      const contextEvent = {
        type: 'context-shared',
        userId,
        context: data.context,
        timestamp: Date.now(),
        targetUsers: data.targetUsers
      };

      // Broadcast to specific users or entire workspace
      if (data.targetUsers && data.targetUsers.length > 0) {
        // Send to specific users only
        for (const targetUserId of data.targetUsers) {
          const targetSession = this.userSessions.get(targetUserId);
          if (targetSession && targetSession.workspaces.has(workspaceId)) {
            this.io.to(targetSession.socketId).emit('context-shared', contextEvent);
          }
        }
      } else {
        // Broadcast to entire workspace
        socket.to(workspaceId).emit('context-shared', contextEvent);
      }

      console.log(`🔄 Context shared in workspace ${workspaceId} by user ${userId}`);
    } catch (error) {
      console.error('❌ Error handling context share:', error);
      socket.emit('error', { message: 'Failed to share context' });
    }
  }

  private async handleSpecialMessageTypes(message: AgentMessage, workspaceId: string): Promise<void> {
    try {
      switch (message.type) {
        case 'agent':
          // Handle agent-specific processing
          await this.processAgentMessage(message, workspaceId);
          break;
        case 'system':
          // Handle system notifications
          await this.processSystemMessage(message, workspaceId);
          break;
        default:
          // Regular user message, no special processing needed
          break;
      }
    } catch (error) {
      console.error('❌ Error handling special message type:', error);
    }
  }

  private async processAgentMessage(message: AgentMessage, workspaceId: string): Promise<void> {
    try {
      // Track agent interactions for analytics
      const agentType = message.metadata.agentType || 'unknown';
      
      // Update collaboration metrics
      const collaboration = this.activeCollaborations.get(workspaceId) || {
        startTime: Date.now(),
        messageCount: 0,
        agentInteractions: new Map(),
        participants: new Set()
      };

      collaboration.messageCount += 1;
      collaboration.agentInteractions.set(agentType, 
        (collaboration.agentInteractions.get(agentType) || 0) + 1
      );

      this.activeCollaborations.set(workspaceId, collaboration);

      // Emit agent activity event
      this.io.to(workspaceId).emit('agent-activity', {
        agentType,
        timestamp: Date.now(),
        messageCount: collaboration.messageCount
      });
    } catch (error) {
      console.error('❌ Error processing agent message:', error);
    }
  }

  private async processSystemMessage(message: AgentMessage, workspaceId: string): Promise<void> {
    try {
      // Handle system notifications (workspace events, status updates, etc.)
      this.io.to(workspaceId).emit('system-notification', {
        content: message.content,
        timestamp: message.metadata.timestamp,
        priority: message.metadata.context?.priority || 'info'
      });
    } catch (error) {
      console.error('❌ Error processing system message:', error);
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupInactiveWorkspaces(): void {
    try {
      const cutoffTime = Date.now() - (30 * 60 * 1000); // 30 minutes
      let cleanedCount = 0;

      for (const [workspaceId, workspace] of this.workspaces.entries()) {
        if (workspace.lastActivity < cutoffTime && workspace.participants.size === 0) {
          this.workspaces.delete(workspaceId);
          this.activeCollaborations.delete(workspaceId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} inactive workspaces`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up workspaces:', error);
    }
  }

  // Public methods for external use

  async broadcastToWorkspace(workspaceId: string, event: string, data: any): Promise<void> {
    try {
      this.io.to(workspaceId).emit(event, data);
    } catch (error) {
      console.error(`❌ Error broadcasting to workspace ${workspaceId}:`, error);
    }
  }

  async notifyUser(userId: string, event: string, data: any): Promise<void> {
    try {
      const userSession = this.userSessions.get(userId);
      if (userSession && userSession.isActive) {
        this.io.to(userSession.socketId).emit(event, data);
      }
    } catch (error) {
      console.error(`❌ Error notifying user ${userId}:`, error);
    }
  }

  getWorkspaceParticipants(workspaceId: string): string[] {
    const workspace = this.workspaces.get(workspaceId);
    return workspace ? Array.from(workspace.participants) : [];
  }

  getActiveWorkspaces(): string[] {
    return Array.from(this.workspaces.keys());
  }

  getCollaborationMetrics(workspaceId: string): any {
    return this.activeCollaborations.get(workspaceId) || null;
  }

  getGlobalMetrics(): {
    activeWorkspaces: number;
    activeUsers: number;
    totalMessages: number;
    averageParticipantsPerWorkspace: number;
  } {
    const activeUsers = Array.from(this.userSessions.values()).filter(session => session.isActive).length;
    const totalMessages = Array.from(this.workspaces.values())
      .reduce((sum, workspace) => sum + workspace.messageHistory.length, 0);
    
    const avgParticipants = this.workspaces.size > 0 
      ? Array.from(this.workspaces.values()).reduce((sum, workspace) => sum + workspace.participants.size, 0) / this.workspaces.size
      : 0;

    return {
      activeWorkspaces: this.workspaces.size,
      activeUsers,
      totalMessages,
      averageParticipantsPerWorkspace: Math.round(avgParticipants * 100) / 100
    };
  }
}