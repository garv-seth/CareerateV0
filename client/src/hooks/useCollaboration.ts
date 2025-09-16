import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface CollaborationUser {
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
  userColor: string;
  lastActivity: Date;
}

export interface CursorPosition {
  userId: string;
  fileName: string;
  line: number;
  column: number;
  selectionStart?: { line: number; column: number };
  selectionEnd?: { line: number; column: number };
  cursorColor: string;
  isVisible: boolean;
}

export interface EditOperation {
  id: string;
  userId: string;
  fileName: string;
  type: 'insert' | 'delete' | 'replace';
  position: { line: number; column: number };
  content?: string;
  length?: number;
  timestamp: Date;
}

export interface CollaborationMessage {
  id: string;
  userId: string;
  messageType: 'chat' | 'system' | 'code_comment';
  content: string;
  fileName?: string;
  lineNumber?: number;
  userInfo?: CollaborationUser['userInfo'];
  userColor?: string;
  timestamp: Date;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  userId?: string;
  sessionId?: string;
}

interface UseCollaborationOptions {
  projectId: string;
  userId: string;
  onCodeChange?: (fileName: string, content: string) => void;
  onCursorUpdate?: (cursors: CursorPosition[]) => void;
  onUserPresenceUpdate?: (users: CollaborationUser[]) => void;
  onMessage?: (message: CollaborationMessage) => void;
}

export function useCollaboration({
  projectId,
  userId,
  onCodeChange,
  onCursorUpdate,
  onUserPresenceUpdate,
  onMessage
}: UseCollaborationOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [participants, setParticipants] = useState<CollaborationUser[]>([]);
  const [activeCursors, setActiveCursors] = useState<CursorPosition[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [userColor, setUserColor] = useState<string>('#007acc');
  
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Query for collaboration session
  const { data: session } = useQuery({
    queryKey: ['/api/projects', projectId, 'collaboration', 'session'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaboration?projectId=${projectId}&userId=${userId}`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Collaboration WebSocket connected');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    ws.onclose = (event) => {
      console.log('Collaboration WebSocket disconnected:', event.code, event.reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      wsRef.current = null;

      // Attempt to reconnect unless it was intentional
      if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, delay);
      }
    };

    ws.onerror = (error) => {
      console.error('Collaboration WebSocket error:', error);
      setConnectionStatus('error');
    };
  }, [projectId, userId]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'User disconnected');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Send WebSocket message
  const sendMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message: WebSocketMessage = {
        type,
        payload,
        timestamp: Date.now()
      };
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'room_joined':
        const { userColor: assignedColor, participants: roomParticipants, activeCursors: roomCursors } = message.payload;
        setUserColor(assignedColor);
        setParticipants(roomParticipants);
        setActiveCursors(roomCursors);
        onUserPresenceUpdate?.(roomParticipants);
        onCursorUpdate?.(roomCursors);
        break;

      case 'user_joined':
        setParticipants(prev => {
          const updated = [...prev, message.payload.user];
          onUserPresenceUpdate?.(updated);
          return updated;
        });
        break;

      case 'user_left':
        setParticipants(prev => {
          const updated = prev.filter(p => p.userId !== message.payload.userId);
          onUserPresenceUpdate?.(updated);
          return updated;
        });
        setActiveCursors(prev => prev.filter(c => c.userId !== message.payload.userId));
        break;

      case 'cursor_update':
        setActiveCursors(prev => {
          const filtered = prev.filter(c => c.userId !== message.payload.userId);
          const updated = [...filtered, message.payload];
          onCursorUpdate?.(updated);
          return updated;
        });
        break;

      case 'edit_operation':
        // Apply edit operation to code
        const { fileName, type, position, content } = message.payload;
        onCodeChange?.(fileName, applyOperation(fileName, type, position, content));
        break;

      case 'file_change':
        // Full file content update
        onCodeChange?.(message.payload.fileName, message.payload.content);
        break;

      case 'presence_update':
        setParticipants(prev => {
          const updated = prev.map(p => 
            p.userId === message.payload.userId 
              ? { ...p, ...message.payload }
              : p
          );
          onUserPresenceUpdate?.(updated);
          return updated;
        });
        break;

      case 'chat_message':
        const chatMessage: CollaborationMessage = {
          id: message.payload.id,
          userId: message.payload.userId,
          messageType: message.payload.messageType,
          content: message.payload.content,
          fileName: message.payload.fileName,
          lineNumber: message.payload.lineNumber,
          userInfo: message.payload.userInfo,
          userColor: message.payload.userColor,
          timestamp: new Date(message.payload.createdAt)
        };
        setMessages(prev => [chatMessage, ...prev]);
        onMessage?.(chatMessage);
        break;

      case 'file_locked':
        // Handle file lock
        console.log('File locked:', message.payload);
        break;

      case 'file_unlocked':
        // Handle file unlock
        console.log('File unlocked:', message.payload);
        break;

      case 'error':
        console.error('Collaboration error:', message.payload.message);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [onCodeChange, onCursorUpdate, onUserPresenceUpdate, onMessage]);

  // Apply edit operation to content (simplified)
  const applyOperation = useCallback((fileName: string, type: string, position: any, content?: string) => {
    // This is a simplified implementation
    // In production, you'd want proper operational transformation
    return content || '';
  }, []);

  // Collaboration actions
  const updateCursor = useCallback((fileName: string, line: number, column: number, selectionStart?: any, selectionEnd?: any) => {
    sendMessage('cursor_update', {
      fileName,
      line,
      column,
      selectionStart,
      selectionEnd
    });
  }, [sendMessage]);

  const sendEditOperation = useCallback((fileName: string, operationType: string, position: any, content?: string, length?: number) => {
    sendMessage('edit_operation', {
      fileName,
      operationType,
      position,
      content,
      length,
      vectorClock: {} // Simplified, would need proper vector clock
    });
  }, [sendMessage]);

  const updatePresence = useCallback((status: string, currentFile?: string) => {
    sendMessage('presence_update', {
      status,
      currentFile
    });
  }, [sendMessage]);

  const sendChatMessage = useCallback((content: string, messageType = 'chat', fileName?: string, lineNumber?: number) => {
    sendMessage('chat_message', {
      content,
      messageType,
      fileName,
      lineNumber
    });
  }, [sendMessage]);

  const lockFile = useCallback((fileName: string, lockType = 'exclusive') => {
    sendMessage('file_lock', {
      fileName,
      lockType
    });
  }, [sendMessage]);

  const unlockFile = useCallback((fileName: string) => {
    sendMessage('file_unlock', {
      fileName
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Update presence when project changes
  useEffect(() => {
    if (isConnected) {
      updatePresence('online');
    }
  }, [isConnected, updatePresence]);

  return {
    // Connection state
    isConnected,
    connectionStatus,
    userColor,
    
    // Collaboration data
    participants,
    activeCursors,
    messages,
    session,
    
    // Actions
    connect,
    disconnect,
    updateCursor,
    sendEditOperation,
    updatePresence,
    sendChatMessage,
    lockFile,
    unlockFile,
    
    // Helpers
    sendMessage
  };
}