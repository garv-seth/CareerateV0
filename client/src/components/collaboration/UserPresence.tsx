import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, Circle, Eye, Edit3, MousePointer } from "lucide-react";
import { CollaborationUser } from "@/hooks/useCollaboration";

interface UserPresenceProps {
  participants: CollaborationUser[];
  currentUserId: string;
  className?: string;
}

export default function UserPresence({ participants, currentUserId, className = "" }: UserPresenceProps) {
  const otherUsers = participants.filter(user => user.userId !== currentUserId);
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'editing':
        return <Edit3 className="h-3 w-3" />;
      case 'online':
        return <Eye className="h-3 w-3" />;
      case 'away':
        return <Circle className="h-3 w-3" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'editing':
        return 'text-green-500';
      case 'online':
        return 'text-blue-500';
      case 'away':
        return 'text-yellow-500';
      case 'idle':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getDisplayName = (user: CollaborationUser) => {
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

  const getInitials = (user: CollaborationUser) => {
    const name = getDisplayName(user);
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (otherUsers.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        <Users className="h-4 w-4" />
        <span data-testid="collaboration-participant-count">
          {otherUsers.length} collaborator{otherUsers.length !== 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="flex items-center -space-x-2">
        <TooltipProvider>
          {otherUsers.slice(0, 5).map((user) => (
            <Tooltip key={user.connectionId}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar 
                    className="h-8 w-8 border-2 border-background hover:scale-110 transition-transform cursor-pointer"
                    style={{ borderColor: user.userColor }}
                    data-testid={`user-avatar-${user.userId}`}
                  >
                    <AvatarImage 
                      src={user.userInfo.profileImageUrl} 
                      alt={getDisplayName(user)}
                    />
                    <AvatarFallback 
                      className="text-xs font-semibold text-white"
                      style={{ backgroundColor: user.userColor }}
                    >
                      {getInitials(user)}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status indicator */}
                  <div 
                    className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background flex items-center justify-center ${getStatusColor(user.status)}`}
                    style={{ backgroundColor: 'currentColor' }}
                  >
                    <div className="h-1.5 w-1.5 bg-background rounded-full" />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: user.userColor }}
                    />
                    <span className="font-semibold">{getDisplayName(user)}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <div className={getStatusColor(user.status)}>
                      {getStatusIcon(user.status)}
                    </div>
                    <span className="capitalize">{user.status}</span>
                  </div>
                  
                  {user.currentFile && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <MousePointer className="h-3 w-3" />
                      <span>Editing: {user.currentFile}</span>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Last active: {new Date(user.lastActivity).toLocaleTimeString()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          
          {otherUsers.length > 5 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-semibold text-muted-foreground hover:scale-110 transition-transform cursor-pointer">
                  +{otherUsers.length - 5}
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="space-y-1">
                  {otherUsers.slice(5).map((user) => (
                    <div key={user.connectionId} className="flex items-center space-x-2">
                      <div 
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: user.userColor }}
                      />
                      <span className="text-sm">{getDisplayName(user)}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      
      {/* Connection status indicator */}
      <div className="flex items-center space-x-1">
        <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
        <span className="text-xs text-muted-foreground">Live</span>
      </div>
    </div>
  );
}