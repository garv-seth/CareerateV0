import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import {
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Play,
  Square,
  GitBranch,
  GitCommit,
  MessageCircle,
  Eye,
  Code,
  Terminal,
  Settings,
  Save,
  ArrowLeft,
  Zap,
  Download,
  Upload,
  Search,
  MoreHorizontal,
  Bot,
  Send,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileNode[];
  content?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Array<{
    type: 'create_file' | 'edit_file' | 'run_command';
    description: string;
    data: any;
  }>;
}

interface GitStatus {
  branch: string;
  modified: string[];
  untracked: string[];
  staged: string[];
}

export default function VibeCoding() {
  const [match, params] = useRoute("/projects/:id/coding");
  const projectId = params?.id;
  const { toast } = useToast();

  // State management
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    branch: "main",
    modified: [],
    untracked: [],
    staged: []
  });
  const [gitIntegration, setGitIntegration] = useState<any>(null);

  const terminalRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const [fileTree, setFileTree] = useState<FileNode[]>([]);

  // Fetch file tree on mount
  const { data: fileTreeData } = useQuery({
    queryKey: ["fileTree", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/coding/projects/${projectId}/files`);
      if (!response.ok) throw new Error("Failed to fetch file tree");
      return response.json();
    },
    enabled: !!projectId
  });

  useEffect(() => {
    if (fileTreeData) {
      setFileTree(fileTreeData);
    }
  }, [fileTreeData]);

  // Fetch git integration status
  const { data: gitIntegrationData } = useQuery({
    queryKey: ["gitIntegration", projectId],
    queryFn: async () => {
      const response = await fetch(`/api/integrations?type=repository`);
      if (!response.ok) return null;
      const integrations = await response.json();
      return integrations.find((i: any) => i.service === 'github');
    },
    enabled: !!projectId
  });

  useEffect(() => {
    if (gitIntegrationData) {
      setGitIntegration(gitIntegrationData);
    }
  }, [gitIntegrationData]);

  // Initialize chat with welcome message
  useEffect(() => {
    setChatMessages([
      {
        id: "1",
        role: "assistant",
        content: "👋 Welcome to Vibe Coding! I'm your AI coding assistant. I can help you create files, write code, run commands, and manage your project. What would you like to build today?",
        timestamp: new Date()
      }
    ]);
  }, []);

  // File operations
  const handleFileSelect = (filePath: string) => {
    const findFile = (nodes: FileNode[], path: string): FileNode | null => {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') {
          return node;
        }
        if (node.children) {
          const found = findFile(node.children, path);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(fileTree, filePath);
    if (file) {
      setSelectedFile(filePath);
      setFileContent(file.content || "");
    }
  };

  const handleFileContentChange = (content: string) => {
    setFileContent(content);
    // Mark file as modified for git status
    if (selectedFile && !gitStatus.modified.includes(selectedFile)) {
      setGitStatus(prev => ({
        ...prev,
        modified: [...prev.modified, selectedFile]
      }));
    }
  };

  const saveFileMutation = useMutation({
    mutationFn: async ({ filePath, content }: { filePath: string; content: string }) => {
      const response = await fetch(`/api/coding/projects/${projectId}/files`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filePath, content })
      });
      if (!response.ok) throw new Error("Failed to save file");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "File saved",
        description: `${selectedFile} has been saved successfully.`
      });
      // Update file content in local tree
      if (selectedFile) {
        const updateFileContent = (nodes: FileNode[], path: string, content: string): FileNode[] => {
          return nodes.map(node => {
            if (node.path === path && node.type === 'file') {
              return { ...node, content };
            }
            if (node.children) {
              return { ...node, children: updateFileContent(node.children, path, content) };
            }
            return node;
          });
        };
        setFileTree(prev => updateFileContent(prev, selectedFile, fileContent));
      }
    },
    onError: (error) => {
      toast({
        title: "Error saving file",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleSaveFile = () => {
    if (selectedFile && projectId) {
      saveFileMutation.mutate({ filePath: selectedFile, content: fileContent });
    }
  };

  // Terminal operations
  const runCommandMutation = useMutation({
    mutationFn: async (command: string) => {
      const response = await fetch(`/api/coding/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, command })
      });
      if (!response.ok) throw new Error("Failed to run command");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.logs) {
        data.logs.forEach((line: string, index: number) => {
          setTimeout(() => {
            setTerminalOutput(prev => [...prev, line]);
          }, (index + 1) * 200);
        });
      }
      if (data.previewUrl) {
        setTimeout(() => {
          setPreviewUrl(data.previewUrl);
        }, 1000);
      }
    },
    onError: (error) => {
      setTerminalOutput(prev => [...prev, `Error: ${(error as Error).message}`]);
    }
  });

  const handleRunCommand = async (command: string) => {
    if (!projectId) return;

    setTerminalOutput(prev => [...prev, `$ ${command}`]);
    setIsRunning(true);
    setCurrentCommand("");

    try {
      await runCommandMutation.mutateAsync(command);
    } finally {
      setIsRunning(false);
    }
  };

  // AI Chat operations
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/coding/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message,
          contextRefs: selectedFile ? [{ type: "file", path: selectedFile }] : []
        })
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: (data) => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I understand. Let me help you with that.",
        timestamp: new Date(),
        actions: data.actions?.map((action: any) => ({
          type: action.type,
          description: action.description,
          data: action
        })) || []
      };
      setChatMessages(prev => [...prev, aiResponse]);
    },
    onError: (error) => {
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I'm sorry, I encountered an error: ${(error as Error).message}. Please try again.`,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    }
  });

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || !projectId) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    setIsAiTyping(true);

    try {
      await sendMessageMutation.mutateAsync(messageToSend);
    } finally {
      setIsAiTyping(false);
    }
  };


  const applyActionMutation = useMutation({
    mutationFn: async (actions: any[]) => {
      const response = await fetch(`/api/coding/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          actions,
          commitMessage: "AI-generated changes from Vibe Coding"
        })
      });
      if (!response.ok) throw new Error("Failed to apply action");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Action Applied",
        description: data.message || "Changes have been applied successfully."
      });
      // Refresh file tree
      window.location.reload(); // Simple refresh for now
    },
    onError: (error) => {
      toast({
        title: "Error applying action",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleApplyAction = (action: NonNullable<ChatMessage['actions']>[0]) => {
    if (!projectId) return;
    applyActionMutation.mutate([action.data]);
  };


  // Git operations
  const commitMutation = useMutation({
    mutationFn: async (commitMessage: string) => {
      const response = await fetch(`/api/coding/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          actions: [],
          commitMessage,
          branch: gitStatus.branch
        })
      });
      if (!response.ok) throw new Error("Failed to commit changes");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Committed",
        description: data.message || "Changes committed successfully."
      });
      setGitStatus(prev => ({
        ...prev,
        modified: [],
        staged: []
      }));
    },
    onError: (error) => {
      toast({
        title: "Error committing changes",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleCommit = () => {
    const commitMessage = prompt("Enter commit message:");
    if (commitMessage && projectId) {
      commitMutation.mutate(commitMessage);
    }
  };

  const createPRMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/coding/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          actions: [],
          commitMessage: "Changes from Vibe Coding",
          createPullRequest: true,
          branch: `vibe-coding-${Date.now()}`
        })
      });
      if (!response.ok) throw new Error("Failed to create pull request");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Pull Request Created",
        description: data.prUrl ? `PR created: ${data.prUrl}` : "Pull request created successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating pull request",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const connectGitHubMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/integrations/github/oauth/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scopes: ['repo', 'user:email'],
          redirectUri: `${window.location.origin}/dashboard`
        })
      });
      if (!response.ok) throw new Error("Failed to initiate GitHub OAuth");
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to GitHub OAuth
      window.location.href = data.authUrl;
    },
    onError: (error) => {
      toast({
        title: "Error connecting GitHub",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleCreatePR = () => {
    if (!gitIntegration) {
      connectGitHubMutation.mutate();
      return;
    }

    if (gitStatus.modified.length === 0) {
      toast({
        title: "No Changes to Commit",
        description: "Please make some changes before creating a pull request.",
        variant: "destructive"
      });
      return;
    }

    createPRMutation.mutate();
  };

  // File tree rendering
  const renderFileTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center space-x-2 px-2 py-1 rounded cursor-pointer hover:bg-muted ${
            selectedFile === node.path ? 'bg-muted' : ''
          }`}
          onClick={() => node.type === 'file' && handleFileSelect(node.path)}
        >
          {node.type === 'folder' ? (
            <FolderOpen className="h-4 w-4 text-blue-500" />
          ) : (
            <FileText className="h-4 w-4 text-gray-500" />
          )}
          <span className="text-sm">{node.name}</span>
          {gitStatus.modified.includes(node.path) && (
            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          )}
          {gitStatus.untracked.includes(node.path) && (
            <div className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </div>
        {node.children && renderFileTree(node.children, level + 1)}
      </div>
    ));
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm flex items-center justify-between px-4 py-2 h-14">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          <Separator orientation="vertical" className="h-6" />
          <h1 className="font-semibold">Vibe Coding</h1>
          <Badge variant="secondary">
            <GitBranch className="h-3 w-3 mr-1" />
            {gitStatus.branch}
          </Badge>
          {gitIntegration ? (
            <Badge variant="outline" className="text-green-600 border-green-600">
              GitHub Connected
            </Badge>
          ) : (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Git Not Connected
            </Badge>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveFile}
            disabled={!selectedFile || saveFileMutation.isPending}
          >
            {saveFileMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saveFileMutation.isPending ? "Saving..." : "Save"}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRunCommand("npm start")}
            disabled={isRunning || runCommandMutation.isPending}
          >
            {(isRunning || runCommandMutation.isPending) ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            {(isRunning || runCommandMutation.isPending) ? "Running..." : "Run"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCommit}
            disabled={commitMutation.isPending || gitStatus.modified.length === 0}
          >
            {commitMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <GitCommit className="h-4 w-4 mr-1" />
            )}
            {commitMutation.isPending ? "Committing..." : "Commit"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreatePR}
            disabled={createPRMutation.isPending}
          >
            {createPRMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : gitIntegration ? (
              "Create PR"
            ) : (
              "Connect GitHub"
            )}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        <ResizablePanelGroup direction="horizontal">
          {/* File Explorer */}
          <ResizablePanel defaultSize={20} minSize={15}>
            <div className="h-full border-r border-border">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium">Explorer</h3>
                  <Button variant="ghost" size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <Input placeholder="Search files..." className="text-xs" />
              </div>
              <ScrollArea className="h-full">
                <div className="p-2">
                  {renderFileTree(fileTree)}
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>

          <ResizableHandle />

          {/* Editor and Terminal */}
          <ResizablePanel defaultSize={50}>
            <ResizablePanelGroup direction="vertical">
              {/* Code Editor */}
              <ResizablePanel defaultSize={70}>
                <div className="h-full flex flex-col">
                  {selectedFile ? (
                    <>
                      <div className="border-b border-border p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm font-medium">{selectedFile}</span>
                          {gitStatus.modified.includes(selectedFile) && (
                            <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                          )}
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Textarea
                          ref={editorRef}
                          value={fileContent}
                          onChange={(e) => handleFileContentChange(e.target.value)}
                          className="w-full h-full resize-none border-0 rounded-none font-mono text-sm"
                          placeholder="Start typing your code..."
                        />
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Code className="h-12 w-12 mx-auto mb-4" />
                        <p>Select a file to start editing</p>
                      </div>
                    </div>
                  )}
                </div>
              </ResizablePanel>

              <ResizableHandle />

              {/* Terminal */}
              <ResizablePanel defaultSize={30} minSize={20}>
                <div className="h-full flex flex-col bg-black text-green-400">
                  <div className="border-b border-gray-700 p-2 flex items-center justify-between bg-gray-800">
                    <div className="flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span className="text-sm font-medium">Terminal</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
                      <Square className="h-4 w-4" />
                    </Button>
                  </div>
                  <ScrollArea className="flex-1 p-2" ref={terminalRef}>
                    <div className="space-y-1">
                      {terminalOutput.map((line, index) => (
                        <div key={index} className="text-sm font-mono">
                          {line}
                        </div>
                      ))}
                      {isRunning && (
                        <div className="text-sm font-mono animate-pulse">
                          Running...
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-gray-700 p-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">$</span>
                      <Input
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleRunCommand(currentCommand);
                          }
                        }}
                        className="border-0 bg-transparent text-green-400 focus:ring-0 font-mono text-sm"
                        placeholder="Enter command..."
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>

          <ResizableHandle />

          {/* Sidebar with Preview and AI Chat */}
          <ResizablePanel defaultSize={30} minSize={25}>
            <Tabs defaultValue="preview" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="chat">AI Chat</TabsTrigger>
              </TabsList>

              {/* Preview Tab */}
              <TabsContent value="preview" className="flex-1 flex flex-col">
                <div className="border-b border-border p-2">
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm font-medium">Live Preview</span>
                    {previewUrl && (
                      <Badge variant="secondary" className="text-xs">
                        Running
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex-1 bg-white">
                  {previewUrl ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-full border-0"
                      title="Preview"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Eye className="h-12 w-12 mx-auto mb-4" />
                        <p>Run your app to see the preview</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => handleRunCommand("npm start")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Development Server
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* AI Chat Tab */}
              <TabsContent value="chat" className="flex-1 flex flex-col">
                <div className="border-b border-border p-2">
                  <div className="flex items-center space-x-2">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">AI Assistant</span>
                    <Badge variant="secondary" className="text-xs">
                      Online
                    </Badge>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleApplyAction(action)}
                                  className="w-full"
                                >
                                  <Zap className="h-3 w-3 mr-1" />
                                  {action.description}
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isAiTyping && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-100"></div>
                            <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-200"></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="border-t border-border p-3">
                  <div className="flex space-x-2">
                    <Input
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask AI to help with your code..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleSendMessage}
                      disabled={!currentMessage.trim() || isAiTyping}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}