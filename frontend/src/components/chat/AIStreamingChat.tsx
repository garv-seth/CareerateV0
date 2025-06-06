import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Loader2, 
  Bot, 
  User, 
  Share2, 
  Settings, 
  Code, 
  Cloud, 
  Monitor,
  AlertTriangle,
  Copy,
  Check,
  Users
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentUsed?: string;
  isStreaming?: boolean;
}

interface ChatContext {
  sessionId: string;
  userId: string;
  teamId?: string;
  currentTool?: string;
  cloudProvider?: 'aws' | 'azure' | 'gcp';
  repository?: string;
  browserContext?: any;
}

interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline';
  currentSession?: string;
}

const agentIcons = {
  terraform: Cloud,
  kubernetes: Code,
  aws: Cloud,
  monitoring: Monitor,
  incident: AlertTriangle,
  general: Bot,
};

const agentColors = {
  terraform: 'text-purple-500',
  kubernetes: 'text-blue-500',
  aws: 'text-orange-500',
  monitoring: 'text-green-500',
  incident: 'text-red-500',
  general: 'text-gray-500',
};

export const AIStreamingChat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('auto');
  const [context, setContext] = useState<Partial<ChatContext>>({});
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [showTeamPanel, setShowTeamPanel] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const streamingMessageRef = useRef<string>('');

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to AI Chat Service');
      setIsConnected(true);
      
      // Join chat session
      const sessionId = uuidv4();
      setCurrentSessionId(sessionId);
      
      newSocket.emit('join-chat', {
        sessionId,
        userId: 'user-123', // Would come from auth context
        teamId: 'team-456', // Would come from team context
        currentTool: context.currentTool,
        cloudProvider: context.cloudProvider,
        repository: context.repository,
        browserContext: context.browserContext,
      });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from AI Chat Service');
      setIsConnected(false);
    });

    newSocket.on('chat-joined', (data) => {
      console.log('✅ Chat session joined:', data.sessionId);
      addSystemMessage('Connected to Careerate AI. How can I help you with your DevOps tasks today?');
    });

    newSocket.on('message-chunk', (data) => {
      const { chunk } = data;
      streamingMessageRef.current += chunk;
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { ...lastMessage, content: streamingMessageRef.current }
          ];
        }
        return prev;
      });
    });

    newSocket.on('message-complete', (data) => {
      setIsStreaming(false);
      streamingMessageRef.current = '';
      
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage && lastMessage.isStreaming) {
          return [
            ...prev.slice(0, -1),
            { 
              ...lastMessage, 
              isStreaming: false,
              agentUsed: data.agentUsed 
            }
          ];
        }
        return prev;
      });
    });

    newSocket.on('team-message-chunk', (data) => {
      // Handle team member messages
      console.log('Team member message:', data);
    });

    newSocket.on('team-chat-started', (data) => {
      console.log('Team member started chat:', data);
      // Update team member status
    });

    newSocket.on('context-shared', (data) => {
      addSystemMessage(`Context shared by team member: ${data.data.description}`);
    });

    newSocket.on('chat-error', (data) => {
      console.error('Chat error:', data.error);
      addSystemMessage(`Error: ${data.error}`, 'error');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [context]);

  const addSystemMessage = (content: string, type: 'info' | 'error' = 'info') => {
    const message: Message = {
      id: uuidv4(),
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, message]);
  };

  const sendMessage = useCallback(() => {
    if (!inputMessage.trim() || !socket || !currentSessionId) return;

    // Add user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Create streaming assistant message
    const assistantMessage: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Send message to backend
    socket.emit('send-message', {
      sessionId: currentSessionId,
      message: inputMessage.trim(),
      streaming: true,
      selectedAgent: selectedAgent !== 'auto' ? selectedAgent : undefined,
    });

    setInputMessage('');
    setIsStreaming(true);
    streamingMessageRef.current = '';
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [inputMessage, socket, currentSessionId, selectedAgent]);

  const copyToClipboard = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareContext = (message: Message) => {
    if (!socket || !currentSessionId) return;
    
    socket.emit('share-context', {
      fromSessionId: currentSessionId,
      toSessionId: 'broadcast', // Broadcast to team
      contextData: {
        messageId: message.id,
        content: message.content,
        agentUsed: message.agentUsed,
        description: 'Shared helpful AI response',
      },
    });
    
    addSystemMessage('Context shared with team members');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const AgentIcon = message.agentUsed ? agentIcons[message.agentUsed as keyof typeof agentIcons] : Bot;
    const agentColor = message.agentUsed ? agentColors[message.agentUsed as keyof typeof agentColors] : 'text-gray-500';

    return (
      <motion.div
        key={message.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            isUser ? 'bg-blue-500 ml-3' : isSystem ? 'bg-yellow-500' : 'bg-gray-600'
          }`}>
            {isUser ? (
              <User size={16} className="text-white" />
            ) : isSystem ? (
              <Settings size={16} className="text-white" />
            ) : (
              <AgentIcon size={16} className={`text-white ${agentColor}`} />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-lg px-4 py-2 relative group ${
            isUser 
              ? 'bg-blue-500 text-white' 
              : isSystem 
                ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                : 'bg-gray-100 text-gray-900'
          }`}>
            {/* Agent indicator */}
            {message.agentUsed && !isUser && (
              <div className={`text-xs font-medium mb-1 ${agentColor}`}>
                {message.agentUsed.charAt(0).toUpperCase() + message.agentUsed.slice(1)} Agent
              </div>
            )}

            {/* Message content */}
            <div className="whitespace-pre-wrap break-words">
              {message.content}
              {message.isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-current ml-1"
                />
              )}
            </div>

            {/* Action buttons */}
            {!isUser && !isSystem && !message.isStreaming && (
              <div className="absolute -right-12 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                <button
                  onClick={() => copyToClipboard(message.content, message.id)}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                  title="Copy message"
                >
                  {copiedMessageId === message.id ? (
                    <Check size={12} className="text-green-600" />
                  ) : (
                    <Copy size={12} className="text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => shareContext(message)}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 transition-colors"
                  title="Share with team"
                >
                  <Share2 size={12} className="text-gray-600" />
                </button>
              </div>
            )}

            {/* Timestamp */}
            <div className={`text-xs mt-1 ${
              isUser ? 'text-blue-200' : isSystem ? 'text-yellow-600' : 'text-gray-500'
            }`}>
              {new Date(message.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex h-full bg-white rounded-lg shadow-lg">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4 bg-gray-50 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <h3 className="text-lg font-semibold text-gray-900">Careerate AI Assistant</h3>
              {isStreaming && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Loader2 size={16} className="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Agent Selector */}
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
              >
                <option value="auto">Auto-select Agent</option>
                <option value="terraform">Terraform</option>
                <option value="kubernetes">Kubernetes</option>
                <option value="aws">AWS</option>
                <option value="monitoring">Monitoring</option>
                <option value="incident">Incident Response</option>
                <option value="general">General DevOps</option>
              </select>

              {/* Team Panel Toggle */}
              <button
                onClick={() => setShowTeamPanel(!showTeamPanel)}
                className="p-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                title="Team Collaboration"
              >
                <Users size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map(renderMessage)}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
          <div className="flex space-x-3">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about DevOps, infrastructure, or troubleshooting..."
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={!isConnected || isStreaming}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || !isConnected || isStreaming}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isStreaming ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          
          {/* Context Indicators */}
          {(context.currentTool || context.cloudProvider || context.repository) && (
            <div className="flex items-center space-x-2 mt-2 text-sm text-gray-600">
              <span>Context:</span>
              {context.currentTool && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {context.currentTool}
                </span>
              )}
              {context.cloudProvider && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                  {context.cloudProvider.toUpperCase()}
                </span>
              )}
              {context.repository && (
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                  {context.repository}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Team Collaboration Panel */}
      <AnimatePresence>
        {showTeamPanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-gray-200 bg-gray-50 overflow-hidden"
          >
            <div className="p-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Team Collaboration</h4>
              
              {/* Team Members */}
              <div className="space-y-3">
                <h5 className="text-sm font-medium text-gray-700">Team Members</h5>
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-gray-500">No team members online</p>
                ) : (
                  teamMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                      <span className="text-sm text-gray-900">{member.name}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Quick Actions</h5>
                <button className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                  Share Current Context
                </button>
                <button className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                  View Team Insights
                </button>
                <button className="w-full text-left p-2 text-sm bg-white border border-gray-200 rounded hover:bg-gray-50 transition-colors">
                  Start Pair Session
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIStreamingChat; 