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

  const terminalRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Mock file tree
  const [fileTree, setFileTree] = useState<FileNode[]>([
    {
      name: "src",
      type: "folder",
      path: "src",
      children: [
        {
          name: "App.tsx",
          type: "file",
          path: "src/App.tsx",
          content: `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Vibe Coding</h1>
        <p>Start building your amazing application!</p>
      </header>
    </div>
  );
}

export default App;`
        },
        {
          name: "index.tsx",
          type: "file",
          path: "src/index.tsx",
          content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`
        }
      ]
    },
    {
      name: "package.json",
      type: "file",
      path: "package.json",
      content: `{
  "name": "vibe-coding-project",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}`
    },
    {
      name: "README.md",
      type: "file",
      path: "README.md",
      content: `# Vibe Coding Project

This project was bootstrapped with Vibe Coding AI assistant.

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.

### \`npm run build\`

Builds the app for production.
`
    }
  ]);

  // Mock initial chat message
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
    // Auto-save after 2 seconds of inactivity
    // In a real implementation, this would save to the backend
  };

  const handleSaveFile = () => {
    if (selectedFile) {
      // Update file content in tree
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
      toast({
        title: "File saved",
        description: `${selectedFile} has been saved successfully.`
      });
    }
  };

  // Terminal operations
  const handleRunCommand = async (command: string) => {
    setTerminalOutput(prev => [...prev, `$ ${command}`]);
    setIsRunning(true);

    // Simulate command execution
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock command responses
    const mockResponses: Record<string, string[]> = {
      "npm start": [
        "Starting development server...",
        "webpack compiled successfully",
        "Local:   http://localhost:3000",
        "Network: http://192.168.1.100:3000"
      ],
      "npm install": [
        "Installing dependencies...",
        "added 1500 packages in 45s"
      ],
      "git status": [
        "On branch main",
        "Changes not staged for commit:",
        "  modified:   src/App.tsx",
        "  modified:   src/index.tsx"
      ],
      "npm run build": [
        "Building for production...",
        "Build completed successfully",
        "Output written to build/"
      ]
    };

    const response = mockResponses[command] || ["Command executed"];
    response.forEach((line, index) => {
      setTimeout(() => {
        setTerminalOutput(prev => [...prev, line]);
      }, (index + 1) * 200);
    });

    if (command === "npm start") {
      setTimeout(() => {
        setPreviewUrl("http://localhost:3000");
      }, 2000);
    }

    setIsRunning(false);
    setCurrentCommand("");
  };

  // AI Chat operations
  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage("");
    setIsAiTyping(true);

    // Simulate AI response
    await new Promise(resolve => setTimeout(resolve, 1500));

    const aiResponse: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: getAiResponse(currentMessage),
      timestamp: new Date(),
      actions: getAiActions(currentMessage)
    };

    setChatMessages(prev => [...prev, aiResponse]);
    setIsAiTyping(false);
  };

  const getAiResponse = (message: string): string => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("create") && lowerMessage.includes("component")) {
      return "I'll help you create a new React component! Let me generate the boilerplate code for you.";
    }
    if (lowerMessage.includes("api") || lowerMessage.includes("fetch")) {
      return "I can help you set up API calls and data fetching. Would you like me to create a service file and add fetch logic?";
    }
    if (lowerMessage.includes("style") || lowerMessage.includes("css")) {
      return "I can help you add styling! Should I create CSS modules, styled-components, or regular CSS?";
    }
    if (lowerMessage.includes("test")) {
      return "I'll help you write tests for your components. Let me create some Jest test files.";
    }

    return "I understand you want to work on your project. I can help you create files, write code, run commands, or explain concepts. What specific task would you like assistance with?";
  };

  const getAiActions = (message: string): ChatMessage['actions'] => {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes("create") && lowerMessage.includes("component")) {
      return [
        {
          type: "create_file",
          description: "Create new React component",
          data: { filename: "NewComponent.tsx", template: "react-component" }
        }
      ];
    }

    return [];
  };

  const handleApplyAction = (action: NonNullable<ChatMessage['actions']>[0]) => {
    if (action.type === "create_file") {
      const newFile: FileNode = {
        name: action.data.filename,
        type: "file",
        path: `src/${action.data.filename}`,
        content: generateFileTemplate(action.data.template)
      };

      setFileTree(prev => {
        const srcFolder = prev.find(node => node.name === "src");
        if (srcFolder && srcFolder.children) {
          srcFolder.children.push(newFile);
        }
        return [...prev];
      });

      toast({
        title: "File created",
        description: `${action.data.filename} has been created successfully.`
      });
    }
  };

  const generateFileTemplate = (template: string): string => {
    if (template === "react-component") {
      return `import React from 'react';

interface Props {
  // Add your props here
}

const NewComponent: React.FC<Props> = (props) => {
  return (
    <div>
      <h2>New Component</h2>
      <p>Start building your component here!</p>
    </div>
  );
};

export default NewComponent;`;
    }
    return "";
  };

  // Git operations
  const handleCommit = () => {
    const commitMessage = prompt("Enter commit message:");
    if (commitMessage) {
      toast({
        title: "Committed",
        description: `Changes committed with message: "${commitMessage}"`
      });
      setGitStatus(prev => ({
        ...prev,
        modified: [],
        staged: []
      }));
    }
  };

  const handleCreatePR = () => {
    toast({
      title: "Pull Request Created",
      description: "PR #123 created successfully. View it in your repository."
    });
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
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleSaveFile} disabled={!selectedFile}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => handleRunCommand("npm start")}
            disabled={isRunning}
          >
            {isRunning ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-1" />
            )}
            Run
          </Button>
          <Button variant="outline" size="sm" onClick={handleCommit}>
            <GitCommit className="h-4 w-4 mr-1" />
            Commit
          </Button>
          <Button variant="outline" size="sm" onClick={handleCreatePR}>
            Create PR
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