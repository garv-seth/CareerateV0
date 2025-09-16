import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, Save, Copy, Wand2, Users, Wifi, WifiOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCollaboration, CollaborationUser } from "@/hooks/useCollaboration";
import UserPresence from "@/components/collaboration/UserPresence";
import LiveCursors from "@/components/collaboration/LiveCursors";
import CollaborationChat from "@/components/collaboration/CollaborationChat";
import { useQuery } from "@tanstack/react-query";

interface CodeEditorProps {
  files: Record<string, string>;
  onFilesChange: (files: Record<string, string>) => void;
  onGenerateCode?: (prompt: string) => void;
  isGenerating?: boolean;
  projectId?: string;
  enableCollaboration?: boolean;
}

export default function CodeEditor({ 
  files, 
  onFilesChange, 
  onGenerateCode, 
  isGenerating = false, 
  projectId,
  enableCollaboration = false 
}: CodeEditorProps) {
  const [activeFile, setActiveFile] = useState<string>("");
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // Get current user info
  const { data: currentUser } = useQuery({
    queryKey: ['/api/user'],
  });

  // Collaboration integration
  const collaboration = useCollaboration({
    projectId: projectId || '',
    userId: currentUser?.id || '',
    onCodeChange: useCallback((fileName: string, content: string) => {
      // Handle incoming real-time code changes
      onFilesChange({
        ...files,
        [fileName]: content
      });
    }, [files, onFilesChange]),
    onCursorUpdate: useCallback((cursors) => {
      // Cursor updates are handled by LiveCursors component
    }, []),
    onUserPresenceUpdate: useCallback((users) => {
      // User presence updates are handled by UserPresence component
    }, []),
    onMessage: useCallback((message) => {
      // Show toast for important messages
      if (message.messageType === 'system') {
        toast({
          title: "Collaboration",
          description: message.content,
        });
      }
    }, [toast])
  });

  const isCollaborationEnabled = enableCollaboration && projectId && currentUser?.id;
  const hasCollaborators = collaboration.participants.length > 0;

  const fileEntries = Object.entries(files);

  useEffect(() => {
    if (fileEntries.length > 0 && !activeFile) {
      setActiveFile(fileEntries[0][0]);
    }
  }, [files, activeFile]);

  // Enhanced file content change handler with collaboration
  const handleFileContentChange = useCallback((filename: string, content: string) => {
    // Update local state immediately for responsive UI
    onFilesChange({
      ...files,
      [filename]: content
    });

    // Send real-time updates to collaborators if collaboration is enabled
    if (isCollaborationEnabled && collaboration.isConnected) {
      // Calculate the operation type and position (simplified)
      const oldContent = files[filename] || '';
      const newContent = content;
      
      if (oldContent !== newContent) {
        // For now, send a simple file change event
        // In production, you'd calculate precise edit operations for better performance
        collaboration.sendMessage('file_change', {
          fileName: filename,
          content: newContent
        });

        // Update presence to show user is actively editing
        collaboration.updatePresence('editing', filename);
      }
    }
  }, [files, onFilesChange, isCollaborationEnabled, collaboration]);

  // Handle cursor position changes for real-time cursor tracking
  const handleCursorPositionChange = useCallback((filename: string, textarea: HTMLTextAreaElement) => {
    if (!isCollaborationEnabled || !collaboration.isConnected) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const value = textarea.value;
    
    // Calculate line and column from character position
    const lines = value.substring(0, selectionStart).split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;

    // Calculate selection positions if there's a selection
    let selectionStartPos, selectionEndPos;
    if (selectionStart !== selectionEnd) {
      const startLines = value.substring(0, selectionStart).split('\n');
      const endLines = value.substring(0, selectionEnd).split('\n');
      
      selectionStartPos = {
        line: startLines.length - 1,
        column: startLines[startLines.length - 1].length
      };
      
      selectionEndPos = {
        line: endLines.length - 1,
        column: endLines[endLines.length - 1].length
      };
    }

    // Send cursor update to other collaborators
    collaboration.updateCursor(filename, line, column, selectionStartPos, selectionEndPos);
  }, [isCollaborationEnabled, collaboration]);

  // Helper function to get user display name for live cursors
  const getUserDisplayName = useCallback((userId: string) => {
    const user = collaboration.participants.find(p => p.userId === userId);
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
  }, [collaboration.participants]);

  const handleCopyCode = () => {
    if (activeFile && files[activeFile]) {
      navigator.clipboard.writeText(files[activeFile]);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    }
  };

  const handleGenerateCode = () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt for code generation",
        variant: "destructive",
      });
      return;
    }

    onGenerateCode?.(prompt);
    setPrompt("");
  };

  const getLanguageFromFilename = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'tsx': 
      case 'jsx': return 'javascript';
      case 'ts': 
      case 'js': return 'javascript';
      case 'css': return 'css';
      case 'html': return 'html';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'text';
    }
  };

  if (fileEntries.length === 0) {
    return (
      <div className="h-full bg-background flex items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Code Editor</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-2">Edit your code or use AI to generate new features</p>
          </div>

          {/* No Files State */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-8 mb-8 shadow-sm">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No files yet</h3>
              <p className="text-gray-600 dark:text-gray-400">Generate some code to get started</p>
            </div>
          </div>
          
          {/* AI Generation Section */}
          {onGenerateCode && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-blue-200 dark:border-blue-700 p-8 shadow-sm">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Wand2 className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Code Generation</h3>
                <p className="text-gray-600 dark:text-gray-400">Describe your app in natural language and watch AI build it</p>
              </div>
              
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., A todo app with user authentication and real-time sync..."
                    className="w-full h-16 text-lg px-6 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 transition-colors"
                    data-testid="input-code-prompt"
                  />
                </div>
                
                <div className="flex justify-center">
                  <Button 
                    onClick={handleGenerateCode}
                    disabled={isGenerating}
                    className="h-14 px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
                    data-testid="button-generate-code"
                  >
                    {isGenerating ? (
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        <span>Building your app...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Wand2 className="h-5 w-5" />
                        <span>Generate Code</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" data-testid="file-count-badge">
            {fileEntries.length} files
          </Badge>
          {activeFile && (
            <Badge variant="secondary" data-testid="active-file-badge">
              {getLanguageFromFilename(activeFile)}
            </Badge>
          )}
          
          {/* Collaboration Status */}
          {isCollaborationEnabled && (
            <div className="flex items-center space-x-2">
              <Badge 
                variant={collaboration.isConnected ? "default" : "secondary"}
                className="flex items-center space-x-1"
                data-testid="collaboration-status-badge"
              >
                {collaboration.isConnected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
                )}
                <span>
                  {collaboration.isConnected ? 'Live' : 'Offline'}
                </span>
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {/* User Presence */}
          {isCollaborationEnabled && hasCollaborators && (
            <UserPresence 
              participants={collaboration.participants}
              currentUserId={currentUser?.id || ''}
              data-testid="user-presence"
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Collaboration Chat */}
            {isCollaborationEnabled && collaboration.isConnected && (
              <CollaborationChat
                messages={collaboration.messages}
                participants={collaboration.participants}
                onSendMessage={collaboration.sendChatMessage}
                currentFileName={activeFile}
                data-testid="collaboration-chat"
              />
            )}
            
            <Button variant="outline" size="sm" onClick={handleCopyCode} data-testid="button-copy-code">
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" data-testid="button-save-code">
              <Save className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" data-testid="button-run-code">
              <Play className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Prompt Section */}
      {onGenerateCode && (
        <div className="p-4 border-b border-border bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
              <Wand2 className="h-4 w-4" />
              <span className="text-sm font-medium">AI Assistant</span>
            </div>
            <Input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI to modify, add features, or refactor your code..."
              className="flex-1 h-10 border-emerald-200 dark:border-emerald-700 focus:border-emerald-400 dark:focus:border-emerald-500 bg-white/80 dark:bg-gray-900/80"
              data-testid="input-code-improvement"
            />
            <Button 
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200"
              data-testid="button-improve-code"
            >
              {isGenerating ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                  <span className="text-sm">Thinking...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Wand2 className="h-3 w-3" />
                  <span className="text-sm">Enhance</span>
                </div>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* File Tabs and Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeFile} onValueChange={setActiveFile} className="flex-1 flex flex-col">
          <TabsList className="w-full justify-start rounded-none border-b h-auto p-0">
            {fileEntries.map(([filename]) => (
              <TabsTrigger 
                key={filename} 
                value={filename}
                className="rounded-none border-r data-[state=active]:bg-background"
                data-testid={`tab-${filename}`}
              >
                {filename}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {fileEntries.map(([filename, content]) => (
            <TabsContent key={filename} value={filename} className="flex-1 m-0 relative">
              {/* Live Cursors for Collaboration */}
              {isCollaborationEnabled && activeFile === filename && (
                <LiveCursors
                  cursors={collaboration.activeCursors}
                  currentFileName={filename}
                  textareaRef={textareaRef}
                  getUserDisplayName={getUserDisplayName}
                />
              )}
              
              <textarea
                ref={activeFile === filename ? textareaRef : undefined}
                value={content}
                onChange={(e) => handleFileContentChange(filename, e.target.value)}
                onSelect={(e) => {
                  if (activeFile === filename && textareaRef.current) {
                    handleCursorPositionChange(filename, textareaRef.current);
                  }
                }}
                onKeyUp={(e) => {
                  if (activeFile === filename && textareaRef.current) {
                    handleCursorPositionChange(filename, textareaRef.current);
                  }
                }}
                onMouseUp={(e) => {
                  if (activeFile === filename && textareaRef.current) {
                    handleCursorPositionChange(filename, textareaRef.current);
                  }
                }}
                onFocus={(e) => {
                  if (isCollaborationEnabled && collaboration.isConnected) {
                    collaboration.updatePresence('editing', filename);
                  }
                }}
                onBlur={(e) => {
                  if (isCollaborationEnabled && collaboration.isConnected) {
                    collaboration.updatePresence('online', filename);
                  }
                }}
                className="w-full h-full p-4 font-mono text-sm bg-background border-0 resize-none outline-none relative z-0"
                placeholder={`Enter ${getLanguageFromFilename(filename)} code here...`}
                data-testid={`editor-${filename}`}
                style={{
                  // Ensure proper layering for live cursors
                  position: 'relative',
                  zIndex: 1
                }}
              />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
