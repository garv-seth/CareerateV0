import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from '../storage';
import { 
  insertCollaborationSessionSchema,
  insertUserPresenceSchema,
  insertCursorPositionSchema,
  insertEditOperationSchema,
  insertFileLockSchema,
  insertCollaborationMessageSchema
} from '@shared/schema';
import { log } from '../vite';

// WebSocket message types for real-time collaboration
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId: string;
  sessionId: string;
}

export interface CollaborationRoom {
  id: string;
  projectId: string;
  sessionId: string;
  participants: Map<string, WebSocket>;
  userPresence: Map<string, UserPresenceState>;
  activeCursors: Map<string, CursorState>;
  fileLocks: Map<string, FileLockState>;
  operationQueue: EditOperationState[];
  lastActivity: Date;
}

export interface UserPresenceState {
  userId: string;
  connectionId: string;
  status: 'online' | 'away' | 'editing' | 'idle';
  currentFile?: string;
  userInfo: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profileImageUrl?: string;
  };
  lastActivity: Date;
}

export interface CursorState {
  userId: string;
  fileName: string;
  line: number;
  column: number;
  selectionStart?: { line: number; column: number };
  selectionEnd?: { line: number; column: number };
  cursorColor: string;
  isVisible: boolean;
}

export interface EditOperationState {
  id: string;
  userId: string;
  fileName: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content?: string;
  length?: number;
  vectorClock: Record<string, number>;
  timestamp: Date;
}

export interface FileLockState {
  fileName: string;
  lockedBy: string;
  lockType: 'exclusive' | 'shared';
  lockedAt: Date;
  expiresAt?: Date;
}

export class CollaborationServer {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, CollaborationRoom> = new Map();
  private userConnections: Map<string, { ws: WebSocket; userId: string; projectId: string }> = new Map();
  
  // User colors for cursors - we'll cycle through these
  private readonly userColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  private userColorMap: Map<string, string> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/collaboration'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    
    // Clean up inactive rooms every 5 minutes
    setInterval(() => {
      this.cleanupInactiveRooms();
    }, 5 * 60 * 1000);

    log('Collaboration WebSocket server initialized on /ws/collaboration');
  }

  private handleConnection(ws: WebSocket, request: any): void {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const projectId = url.searchParams.get('projectId');
    const userId = url.searchParams.get('userId');
    const userAgent = request.headers['user-agent'];
    const ipAddress = request.headers['x-forwarded-for'] || request.socket.remoteAddress;

    if (!projectId || !userId) {
      ws.close(1008, 'Missing projectId or userId');
      return;
    }

    const connectionId = this.generateConnectionId();
    this.userConnections.set(connectionId, { ws, userId, projectId });

    // Assign a color to the user if they don't have one
    if (!this.userColorMap.has(userId)) {
      const colorIndex = this.userColorMap.size % this.userColors.length;
      this.userColorMap.set(userId, this.userColors[colorIndex]);
    }

    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        this.handleMessage(connectionId, message);
      } catch (error) {
        log(`Error parsing WebSocket message: ${error}`);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' },
          timestamp: Date.now()
        }));
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    ws.on('error', (error) => {
      log(`WebSocket error for connection ${connectionId}: ${error}`);
      this.handleDisconnection(connectionId);
    });

    // Join or create room for this project
    this.joinProjectRoom(connectionId, projectId, userId, userAgent, ipAddress);
  }

  private async joinProjectRoom(
    connectionId: string, 
    projectId: string, 
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      let room = this.rooms.get(projectId);
      
      if (!room) {
        // Create new collaboration session in database
        const sessionId = this.generateSessionId();
        
        await storage.createCollaborationSession({
          projectId,
          sessionId,
          isActive: true,
          maxParticipants: 10,
          lockingEnabled: false,
          conflictResolution: 'operational_transform',
          metadata: {}
        });

        room = {
          id: projectId,
          projectId,
          sessionId,
          participants: new Map(),
          userPresence: new Map(),
          activeCursors: new Map(),
          fileLocks: new Map(),
          operationQueue: [],
          lastActivity: new Date()
        };
        
        this.rooms.set(projectId, room);
      }

      const connection = this.userConnections.get(connectionId);
      if (!connection) return;

      // Add user to room
      room.participants.set(connectionId, connection.ws);
      room.lastActivity = new Date();

      // Get user info for presence
      const user = await storage.getUser(userId);
      
      // Create user presence record
      const userPresence: UserPresenceState = {
        userId,
        connectionId,
        status: 'online',
        userInfo: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          email: user?.email,
          profileImageUrl: user?.profileImageUrl
        },
        lastActivity: new Date()
      };
      
      room.userPresence.set(connectionId, userPresence);

      // Store presence in database
      await storage.createUserPresence({
        sessionId: room.sessionId,
        userId,
        connectionId,
        status: 'online',
        userAgent,
        ipAddress,
        metadata: {}
      });

      // Send welcome message with room state
      const welcomeMessage = {
        type: 'room_joined',
        payload: {
          roomId: projectId,
          sessionId: room.sessionId,
          userColor: this.userColorMap.get(userId),
          participants: Array.from(room.userPresence.values()).map(p => ({
            userId: p.userId,
            status: p.status,
            currentFile: p.currentFile,
            userInfo: p.userInfo,
            userColor: this.userColorMap.get(p.userId)
          })),
          activeCursors: Array.from(room.activeCursors.values()),
          fileLocks: Array.from(room.fileLocks.values())
        },
        timestamp: Date.now()
      };

      connection.ws.send(JSON.stringify(welcomeMessage));

      // Notify other participants about new user
      this.broadcastToRoom(projectId, {
        type: 'user_joined',
        payload: {
          user: {
            userId,
            status: 'online',
            userInfo: userPresence.userInfo,
            userColor: this.userColorMap.get(userId)
          }
        },
        timestamp: Date.now()
      }, [connectionId]);

      log(`User ${userId} joined collaboration room for project ${projectId}`);

    } catch (error) {
      log(`Error joining project room: ${error}`);
      const connection = this.userConnections.get(connectionId);
      if (connection) {
        connection.ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Failed to join collaboration room' },
          timestamp: Date.now()
        }));
      }
    }
  }

  private async handleMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.userConnections.get(connectionId);
    if (!connection) return;

    const { projectId, userId } = connection;
    const room = this.rooms.get(projectId);
    if (!room) return;

    // Update last activity
    room.lastActivity = new Date();
    const userPresence = room.userPresence.get(connectionId);
    if (userPresence) {
      userPresence.lastActivity = new Date();
    }

    try {
      switch (message.type) {
        case 'cursor_update':
          await this.handleCursorUpdate(room, connectionId, userId, message.payload);
          break;
        
        case 'edit_operation':
          await this.handleEditOperation(room, connectionId, userId, message.payload);
          break;
        
        case 'file_change':
          await this.handleFileChange(room, connectionId, userId, message.payload);
          break;
        
        case 'presence_update':
          await this.handlePresenceUpdate(room, connectionId, userId, message.payload);
          break;
        
        case 'file_lock':
          await this.handleFileLock(room, connectionId, userId, message.payload);
          break;
        
        case 'file_unlock':
          await this.handleFileUnlock(room, connectionId, userId, message.payload);
          break;
        
        case 'chat_message':
          await this.handleChatMessage(room, connectionId, userId, message.payload);
          break;
        
        default:
          log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      log(`Error handling message ${message.type}: ${error}`);
      connection.ws.send(JSON.stringify({
        type: 'error',
        payload: { message: `Failed to process ${message.type}` },
        timestamp: Date.now()
      }));
    }
  }

  private async handleCursorUpdate(
    room: CollaborationRoom, 
    connectionId: string, 
    userId: string, 
    payload: any
  ): Promise<void> {
    const { fileName, line, column, selectionStart, selectionEnd } = payload;
    
    const cursorState: CursorState = {
      userId,
      fileName,
      line,
      column,
      selectionStart,
      selectionEnd,
      cursorColor: this.userColorMap.get(userId) || '#007acc',
      isVisible: true
    };

    room.activeCursors.set(connectionId, cursorState);

    // Update user presence with current file
    const userPresence = room.userPresence.get(connectionId);
    if (userPresence) {
      userPresence.currentFile = fileName;
      userPresence.status = 'editing';
    }

    // Broadcast cursor update to other participants
    this.broadcastToRoom(room.projectId, {
      type: 'cursor_update',
      payload: cursorState,
      timestamp: Date.now()
    }, [connectionId]);

    // Store cursor position in database for persistence
    try {
      const presenceRecord = await storage.getUserPresenceByConnection(connectionId);
      if (presenceRecord) {
        await storage.updateCursorPosition(presenceRecord.id, {
          fileName,
          line,
          column,
          selectionStart,
          selectionEnd,
          cursorColor: cursorState.cursorColor,
          isVisible: true,
          metadata: {}
        });
      }
    } catch (error) {
      log(`Error storing cursor position: ${error}`);
    }
  }

  private async handleEditOperation(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { fileName, operationType, position, content, length, vectorClock } = payload;
    
    const operationId = this.generateOperationId();
    const operation: EditOperationState = {
      id: operationId,
      userId,
      fileName,
      type: operationType,
      position,
      content,
      length,
      vectorClock: vectorClock || {},
      timestamp: new Date()
    };

    // Add to operation queue for processing
    room.operationQueue.push(operation);

    // Store operation in database
    await storage.createEditOperation({
      sessionId: room.sessionId,
      userId,
      operationId,
      fileName,
      operationType,
      position,
      content,
      length: length || 0,
      vectorClock,
      dependsOn: [],
      isApplied: false,
      conflictResolved: false,
      metadata: {}
    });

    // Process operational transformation
    const transformedOperation = await this.transformOperation(room, operation);

    // Broadcast transformed operation to other participants
    this.broadcastToRoom(room.projectId, {
      type: 'edit_operation',
      payload: transformedOperation,
      timestamp: Date.now()
    }, [connectionId]);

    // Update user presence status
    const userPresence = room.userPresence.get(connectionId);
    if (userPresence) {
      userPresence.status = 'editing';
      userPresence.currentFile = fileName;
    }
  }

  private async handleFileChange(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { fileName, content } = payload;

    // Broadcast file content change to other participants
    this.broadcastToRoom(room.projectId, {
      type: 'file_change',
      payload: { fileName, content, changedBy: userId },
      timestamp: Date.now()
    }, [connectionId]);
  }

  private async handlePresenceUpdate(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { status, currentFile, viewportStart, viewportEnd } = payload;
    
    const userPresence = room.userPresence.get(connectionId);
    if (userPresence) {
      userPresence.status = status;
      userPresence.currentFile = currentFile;
      userPresence.lastActivity = new Date();
    }

    // Update presence in database
    await storage.updateUserPresence(connectionId, {
      status,
      currentFile,
      viewportStart,
      viewportEnd,
      metadata: {}
    });

    // Broadcast presence update
    this.broadcastToRoom(room.projectId, {
      type: 'presence_update',
      payload: {
        userId,
        status,
        currentFile,
        viewportStart,
        viewportEnd
      },
      timestamp: Date.now()
    }, [connectionId]);
  }

  private async handleFileLock(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { fileName, lockType = 'exclusive' } = payload;

    // Check if file is already locked
    const existingLock = Array.from(room.fileLocks.values())
      .find(lock => lock.fileName === fileName);

    if (existingLock) {
      // Send lock denied message
      const connection = this.userConnections.get(connectionId);
      if (connection) {
        connection.ws.send(JSON.stringify({
          type: 'file_lock_denied',
          payload: { 
            fileName, 
            lockedBy: existingLock.lockedBy,
            reason: 'File already locked'
          },
          timestamp: Date.now()
        }));
      }
      return;
    }

    const lockState: FileLockState = {
      fileName,
      lockedBy: userId,
      lockType,
      lockedAt: new Date()
    };

    room.fileLocks.set(fileName, lockState);

    // Store lock in database
    await storage.createFileLock({
      sessionId: room.sessionId,
      fileName,
      lockedBy: userId,
      lockType,
      autoRelease: true,
      metadata: {}
    });

    // Broadcast file lock to all participants
    this.broadcastToRoom(room.projectId, {
      type: 'file_locked',
      payload: lockState,
      timestamp: Date.now()
    });
  }

  private async handleFileUnlock(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { fileName } = payload;
    
    const lock = room.fileLocks.get(fileName);
    if (lock && lock.lockedBy === userId) {
      room.fileLocks.delete(fileName);

      // Remove lock from database
      await storage.removeFileLock(room.sessionId, fileName);

      // Broadcast file unlock
      this.broadcastToRoom(room.projectId, {
        type: 'file_unlocked',
        payload: { fileName, unlockedBy: userId },
        timestamp: Date.now()
      });
    }
  }

  private async handleChatMessage(
    room: CollaborationRoom,
    connectionId: string,
    userId: string,
    payload: any
  ): Promise<void> {
    const { content, messageType = 'chat', fileName, lineNumber, replyTo, mentions } = payload;

    // Store message in database
    const message = await storage.createCollaborationMessage({
      sessionId: room.sessionId,
      userId,
      messageType,
      content,
      fileName,
      lineNumber,
      replyTo,
      mentions: mentions || [],
      attachments: [],
      metadata: {}
    });

    // Get user info for the message
    const userPresence = room.userPresence.get(connectionId);
    
    // Broadcast message to all participants
    this.broadcastToRoom(room.projectId, {
      type: 'chat_message',
      payload: {
        ...message,
        userInfo: userPresence?.userInfo,
        userColor: this.userColorMap.get(userId)
      },
      timestamp: Date.now()
    });
  }

  private async transformOperation(
    room: CollaborationRoom, 
    operation: EditOperationState
  ): Promise<EditOperationState> {
    // Simple operational transformation - in production, use a more robust OT library
    // For now, we'll just apply operations in timestamp order
    
    // Sort operation queue by timestamp
    room.operationQueue.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    
    // Find conflicting operations on the same file
    const conflictingOps = room.operationQueue.filter(op => 
      op.fileName === operation.fileName && 
      op.id !== operation.id &&
      op.timestamp <= operation.timestamp
    );

    // Transform position based on previous operations
    let transformedPosition = { ...operation.position };
    
    for (const conflictOp of conflictingOps) {
      if (conflictOp.type === 'insert' && 
          conflictOp.position.line <= transformedPosition.line) {
        if (conflictOp.position.line === transformedPosition.line &&
            conflictOp.position.column <= transformedPosition.column) {
          transformedPosition.column += conflictOp.content?.length || 0;
        }
      } else if (conflictOp.type === 'delete' &&
                 conflictOp.position.line <= transformedPosition.line) {
        if (conflictOp.position.line === transformedPosition.line &&
            conflictOp.position.column <= transformedPosition.column) {
          transformedPosition.column -= conflictOp.length || 0;
          if (transformedPosition.column < 0) transformedPosition.column = 0;
        }
      }
    }

    return {
      ...operation,
      position: transformedPosition
    };
  }

  private handleDisconnection(connectionId: string): void {
    const connection = this.userConnections.get(connectionId);
    if (!connection) return;

    const { userId, projectId } = connection;
    const room = this.rooms.get(projectId);

    if (room) {
      // Remove user from room
      room.participants.delete(connectionId);
      room.userPresence.delete(connectionId);
      room.activeCursors.delete(connectionId);
      
      // Remove any file locks held by this user
      for (const [fileName, lock] of room.fileLocks.entries()) {
        if (lock.lockedBy === userId) {
          room.fileLocks.delete(fileName);
          this.broadcastToRoom(projectId, {
            type: 'file_unlocked',
            payload: { fileName, unlockedBy: userId },
            timestamp: Date.now()
          });
        }
      }

      // Broadcast user disconnection
      this.broadcastToRoom(projectId, {
        type: 'user_left',
        payload: { userId },
        timestamp: Date.now()
      });

      // Clean up empty room
      if (room.participants.size === 0) {
        this.rooms.delete(projectId);
        // Mark session as inactive in database
        storage.updateCollaborationSession(room.sessionId, { isActive: false })
          .catch(error => log(`Error updating session status: ${error}`));
      }
    }

    this.userConnections.delete(connectionId);
    log(`User ${userId} disconnected from project ${projectId}`);
  }

  private broadcastToRoom(projectId: string, message: any, excludeConnections: string[] = []): void {
    const room = this.rooms.get(projectId);
    if (!room) return;

    const messageStr = JSON.stringify(message);
    
    for (const [connectionId, ws] of room.participants.entries()) {
      if (!excludeConnections.includes(connectionId)) {
        try {
          ws.send(messageStr);
        } catch (error) {
          log(`Error sending message to connection ${connectionId}: ${error}`);
          // Remove dead connection
          room.participants.delete(connectionId);
          this.userConnections.delete(connectionId);
        }
      }
    }
  }

  private cleanupInactiveRooms(): void {
    const now = new Date();
    const maxInactiveTime = 30 * 60 * 1000; // 30 minutes

    for (const [projectId, room] of this.rooms.entries()) {
      if (now.getTime() - room.lastActivity.getTime() > maxInactiveTime) {
        log(`Cleaning up inactive room for project ${projectId}`);
        
        // Close all connections in the room
        for (const ws of room.participants.values()) {
          ws.close();
        }
        
        // Remove room
        this.rooms.delete(projectId);
        
        // Mark session as inactive
        storage.updateCollaborationSession(room.sessionId, { isActive: false })
          .catch(error => log(`Error updating session status: ${error}`));
      }
    }
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods for external use
  getRoomParticipants(projectId: string): UserPresenceState[] {
    const room = this.rooms.get(projectId);
    return room ? Array.from(room.userPresence.values()) : [];
  }

  getRoomCount(): number {
    return this.rooms.size;
  }

  getTotalConnections(): number {
    return this.userConnections.size;
  }
}

// Singleton instance
export const collaborationServer = new CollaborationServer();