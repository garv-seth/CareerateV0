import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Send, X, Code } from "lucide-react";
import { CollaborationMessage, CollaborationUser } from "@/hooks/useCollaboration";

interface CollaborationChatProps {
  messages: CollaborationMessage[];
  participants: CollaborationUser[];
  onSendMessage: (content: string, messageType?: string, fileName?: string, lineNumber?: number) => void;
  currentFileName?: string;
  className?: string;
}

export default function CollaborationChat({ 
  messages, 
  participants, 
  onSendMessage, 
  currentFileName,
  className = "" 
}: CollaborationChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState<'chat' | 'code_comment'>('chat');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getUserInfo = (userId: string) => {
    return participants.find(p => p.userId === userId);
  };

  const getDisplayName = (user: CollaborationUser | undefined) => {
    if (!user) return 'Unknown User';
    if (user.userInfo.firstName && user.userInfo.lastName) {
      return `${user.userInfo.firstName} ${user.userInfo.lastName}`;
    }
    if (user.userInfo.firstName) {
      return user.userInfo.firstName;
    }
    if (user.userInfo.email) {
      return user.userInfo.email.split('@')[0];
    }
    return 'Anonymous';
  };

  const getInitials = (user: CollaborationUser | undefined) => {
    if (!user) return '?';
    const name = getDisplayName(user);
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;

    onSendMessage(
      messageText.trim(),
      messageType,
      messageType === 'code_comment' ? currentFileName : undefined
    );
    setMessageText("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const unreadCount = messages.filter(msg => 
    msg.timestamp > new Date(Date.now() - 60000) // Messages from last minute
  ).length;

  return (
    <div className={`relative ${className}`}>
      {/* Chat Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        data-testid="button-toggle-chat"
      >
        <MessageCircle className="h-4 w-4" />
        {!isOpen && unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-semibold">Team Chat</span>
              <Badge variant="secondary">{participants.length}</Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Message Type Selector */}
          <div className="p-3 border-b border-border">
            <div className="flex space-x-1">
              <Button
                variant={messageType === 'chat' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('chat')}
                className="flex-1"
              >
                <MessageCircle className="h-3 w-3 mr-1" />
                Chat
              </Button>
              <Button
                variant={messageType === 'code_comment' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMessageType('code_comment')}
                className="flex-1"
                disabled={!currentFileName}
              >
                <Code className="h-3 w-3 mr-1" />
                Code
              </Button>
            </div>
            {messageType === 'code_comment' && currentFileName && (
              <p className="text-xs text-muted-foreground mt-1">
                Commenting on: {currentFileName}
              </p>
            )}
          </div>

          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="h-64 p-3">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs">Start a conversation with your team</p>
                </div>
              ) : (
                messages.map((message) => {
                  const user = getUserInfo(message.userId);
                  return (
                    <div key={message.id} className="flex space-x-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage 
                          src={user?.userInfo.profileImageUrl} 
                          alt={getDisplayName(user)}
                        />
                        <AvatarFallback 
                          className="text-xs"
                          style={{ backgroundColor: user?.userColor || '#007acc' }}
                        >
                          {getInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-foreground">
                            {getDisplayName(user)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {message.timestamp.toLocaleTimeString()}
                          </span>
                          {message.messageType !== 'chat' && (
                            <Badge variant="outline" className="text-xs py-0">
                              {message.messageType}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="text-sm text-foreground break-words">
                          {message.content}
                        </div>
                        
                        {message.fileName && (
                          <div className="text-xs text-muted-foreground mt-1">
                            📄 {message.fileName}
                            {message.lineNumber && ` (line ${message.lineNumber})`}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-3 border-t border-border">
            <div className="flex space-x-2">
              <Input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  messageType === 'chat' 
                    ? "Type a message..." 
                    : `Comment on ${currentFileName}...`
                }
                className="flex-1"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!messageText.trim()}
                size="sm"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}