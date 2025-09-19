import React, { useState, useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Save,
  Download,
  Upload,
  Bot,
  MessageSquare,
  Terminal,
  FileText,
  GitBranch,
  Settings,
  Zap,
  Brain,
  Code,
  Database,
  Server
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface FileTab {
  id: string;
  name: string;
  content: string;
  language: string;
  path: string;
  modified: boolean;
}

interface AIAgent {
  id: string;
  name: string;
  type: 'code-generator' | 'debugger' | 'optimizer' | 'tester' | 'reviewer';
  status: 'idle' | 'working' | 'completed' | 'error';
  description: string;
  capabilities: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'agent';
  content: string;
  timestamp: Date;
  agentId?: string;
}

const aiAgents: AIAgent[] = [
  {
    id: 'code-gen',
    name: 'CodeGen AI',
    type: 'code-generator',
    status: 'idle',
    description: 'Generates code from natural language descriptions',
    capabilities: ['React/TypeScript', 'Node.js/Express', 'Python', 'SQL', 'API Design']
  },
  {
    id: 'debug-ai',
    name: 'Debug AI',
    type: 'debugger',
    status: 'idle',
    description: 'Identifies and fixes bugs in your code',
    capabilities: ['Error Analysis', 'Performance Issues', 'Memory Leaks', 'Logic Errors']
  },
  {
    id: 'optimize-ai',
    name: 'Optimizer',
    type: 'optimizer',
    status: 'idle',
    description: 'Optimizes code for performance and best practices',
    capabilities: ['Performance Tuning', 'Code Refactoring', 'Security Hardening', 'Best Practices']
  },
  {
    id: 'test-ai',
    name: 'TestGen AI',
    type: 'tester',
    status: 'idle',
    description: 'Generates comprehensive test suites',
    capabilities: ['Unit Tests', 'Integration Tests', 'E2E Tests', 'Load Testing']
  },
  {
    id: 'review-ai',
    name: 'Review AI',
    type: 'reviewer',
    status: 'idle',
    description: 'Provides code reviews and suggestions',
    capabilities: ['Code Quality', 'Security Review', 'Architecture Analysis', 'Documentation']
  }
];

export default function AICodeEditor({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<FileTab[]>([]);

  const [activeFileId, setActiveFileId] = useState('1');
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. I can help you write, debug, optimize, and test your code. What would you like to build today?',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [agents] = useState<AIAgent[]>(aiAgents);
  const [terminalOutput, setTerminalOutput] = useState<string[]>(['Welcome to AI Terminal']);
  const [terminalInput, setTerminalInput] = useState('');

  const editorRef = useRef<any>(null);
  const activeFile = files.find(f => f.id === activeFileId);

  useEffect(() => {
    const loadFiles = async () => {
      try {
        const res = await apiRequest('GET', `/api/coding/projects/${projectId}/files`);
        const data: Array<{ name: string; type: string; path: string; content: string }> = await res.json();
        const tabs: FileTab[] = data
          .filter((f) => f.type === 'file')
          .map((f, idx) => ({
            id: `${idx}`,
            name: f.name,
            content: f.content,
            language: f.name.endsWith('.ts') || f.name.endsWith('.tsx') ? 'typescript' : 'plaintext',
            path: f.path.startsWith('/') ? f.path : `/${f.path}`,
            modified: false,
          }));
        setFiles(tabs);
        if (tabs[0]) setActiveFileId(tabs[0].id);
      } catch (e) {
        setTerminalOutput((prev) => [...prev, `Failed to load files: ${(e as Error).message}`]);
      }
    };
    if (projectId) loadFiles();
  }, [projectId]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configure Monaco for AI assistance
    monaco.languages.registerCompletionItemProvider('typescript', {
      provideCompletionItems: (model: any, position: any) => {
        // AI-powered autocomplete suggestions
        return {
          suggestions: [
            {
              label: 'AI: Generate Component',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '// AI will generate a React component here',
              detail: 'Let AI generate a complete React component'
            },
            {
              label: 'AI: Add Error Handling',
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText: '// AI will add comprehensive error handling',
              detail: 'AI-powered error handling implementation'
            }
          ]
        };
      }
    });
  };

  const handleCodeChange = (value: string | undefined) => {
    if (value !== undefined && activeFile) {
      setFiles(files.map(file =>
        file.id === activeFileId
          ? { ...file, content: value, modified: true }
          : file
      ));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage,
      timestamp: new Date()
    };

    setAiMessages([...aiMessages, userMessage]);
    setNewMessage('');

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I understand you want to: "${newMessage}". Let me help you with that! I'll analyze your current code and provide the best solution.`,
        timestamp: new Date()
      };
      setAiMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const runCode = () => {
    setTerminalOutput(prev => [
      ...prev,
      `$ Running ${activeFile?.name}...`,
      'Compiling TypeScript...',
      'Build successful!',
      'Starting development server...',
      '✅ Application running on http://localhost:3000'
    ]);
  };

  const handleSave = async () => {
    try {
      const dirty = files.filter((f) => f.modified);
      for (const f of dirty) {
        await apiRequest('PUT', `/api/coding/projects/${projectId}/files`, {
          filePath: f.path.replace(/^\//, ''),
          content: f.content,
        });
      }
      setFiles(files.map((f) => ({ ...f, modified: false })));
      setTerminalOutput((prev) => [...prev, `Saved ${dirty.length} file(s)`]);
    } catch (e) {
      setTerminalOutput((prev) => [...prev, `Save failed: ${(e as Error).message}`]);
    }
  };

  const createNewFile = () => {
    const newId = (files.length + 1).toString();
    const newFile: FileTab = {
      id: newId,
      name: `untitled-${newId}.tsx`,
      content: '// New file created by AI Assistant\n\n',
      language: 'typescript',
      path: `/src/untitled-${newId}.tsx`,
      modified: true
    };
    setFiles([...files, newFile]);
    setActiveFileId(newId);
  };

  const triggerAIAgent = async (agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return;

    const agentMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'agent',
      content: `${agent.name} is analyzing your code...`,
      timestamp: new Date(),
      agentId
    };

    setAiMessages(prev => [...prev, agentMessage]);

    // Simulate agent work
    setTimeout(() => {
      const resultMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'agent',
        content: `${agent.name} completed analysis. Found 3 optimization opportunities and generated improvements.`,
        timestamp: new Date(),
        agentId
      };
      setAiMessages(prev => [...prev, resultMessage]);
    }, 2000);
  };

  const handleTerminalCommand = (command: string) => {
    setTerminalOutput(prev => [
      ...prev,
      `$ ${command}`,
      `Executing: ${command}...`,
      '✅ Command completed successfully'
    ]);
    setTerminalInput('');
  };

  const handleIntent = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await apiRequest('POST', '/api/coding/intent', {
        projectId,
        message: newMessage,
      });
      const data = await res.json();
      setAiMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: data.plan || 'Plan created.', timestamp: new Date() },
      ]);
      // Show safety checks
      if (Array.isArray(data.safetyChecks)) {
        data.safetyChecks.forEach((s: string) =>
          setTerminalOutput((prev) => [...prev, `Check: ${s}`])
        );
      }
      // Optionally apply immediately
      if (Array.isArray(data.actions) && data.actions.length) {
        const applyRes = await apiRequest('POST', '/api/coding/apply', {
          projectId,
          actions: data.actions,
          commitMessage: `Vibe Coding: ${newMessage}`,
        });
        const applied = await applyRes.json();
        setTerminalOutput((prev) => [
          ...prev,
          `Applied ${applied.appliedActions?.length || 0} change(s). PR: ${applied.prUrl || 'n/a'}`,
        ]);
        // Reload files
        const reload = await apiRequest('GET', `/api/coding/projects/${projectId}/files`);
        const list: Array<{ name: string; type: string; path: string; content: string }> = await reload.json();
        const tabs: FileTab[] = list
          .filter((f) => f.type === 'file')
          .map((f, idx) => ({
            id: `${idx}`,
            name: f.name,
            content: f.content,
            language: f.name.endsWith('.ts') || f.name.endsWith('.tsx') ? 'typescript' : 'plaintext',
            path: f.path.startsWith('/') ? f.path : `/${f.path}`,
            modified: false,
          }));
        setFiles(tabs);
        if (tabs[0]) setActiveFileId(tabs[0].id);
      }
      setNewMessage('');
    } catch (e) {
      setTerminalOutput((prev) => [...prev, `Intent failed: ${(e as Error).message}`]);
    }
  };

  const handleRun = async () => {
    try {
      const res = await apiRequest('POST', '/api/coding/run', { projectId });
      const data = await res.json();
      setTerminalOutput((prev) => [...prev, ...(data.logs || []), `Preview: ${data.previewUrl}`]);
    } catch (e) {
      setTerminalOutput((prev) => [...prev, `Run failed: ${(e as Error).message}`]);
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Sidebar - File Explorer & AI Agents */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold mb-4">AI Development Environment</h2>

          {/* File Explorer */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Files</h3>
              <Button size="sm" variant="ghost" onClick={createNewFile}>
                <FileText className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`p-2 rounded cursor-pointer text-sm flex items-center justify-between ${
                    activeFileId === file.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  <span>{file.name}</span>
                  {file.modified && <div className="w-2 h-2 bg-orange-400 rounded-full" />}
                </div>
              ))}
            </div>
          </div>

          {/* AI Agents */}
          <div>
            <h3 className="text-sm font-medium mb-2">AI Agents</h3>
            <div className="space-y-2">
              {agents.map(agent => (
                <Card key={agent.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4" />
                        <span className="text-sm font-medium">{agent.name}</span>
                      </div>
                      <Badge variant={agent.status === 'idle' ? 'outline' : 'default'}>
                        {agent.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">{agent.description}</p>
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => triggerAIAgent(agent.id)}
                    >
                      <Zap className="h-3 w-3 mr-1" />
                      Activate
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar - File Tabs & Actions */}
        <div className="bg-gray-800 border-b border-gray-700 p-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className={`px-3 py-1 rounded text-sm cursor-pointer flex items-center gap-2 ${
                    activeFileId === file.id ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFileId(file.id)}
                >
                  {file.name}
                  {file.modified && <div className="w-1 h-1 bg-orange-400 rounded-full" />}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" onClick={handleRun}>
                <Play className="h-4 w-4 mr-1" />
                Run
              </Button>
              <Button size="sm" variant="outline">
                <GitBranch className="h-4 w-4 mr-1" />
                Commit
              </Button>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1">
          <Editor
            height="100%"
            language={activeFile?.language || 'typescript'}
            value={activeFile?.content || ''}
            theme="vs-dark"
            onMount={handleEditorDidMount}
            onChange={handleCodeChange}
            options={{
              fontSize: 14,
              minimap: { enabled: true },
              wordWrap: 'on',
              automaticLayout: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              snippetSuggestions: 'inline'
            }}
          />
        </div>
      </div>

      {/* Right Sidebar - AI Chat & Terminal */}
      <div className="w-96 bg-gray-800 border-l border-gray-700 flex flex-col">
        <Tabs defaultValue="chat" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger value="chat">AI Assistant</TabsTrigger>
            <TabsTrigger value="terminal">Terminal</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {aiMessages.map(message => (
                  <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.role === 'agent'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-white'
                    }`}>
                      {message.role === 'agent' && (
                        <div className="flex items-center gap-2 mb-1">
                          <Bot className="h-3 w-3" />
                          <span className="text-xs font-medium">AI Agent</span>
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask AI to help with your code..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage}>
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="terminal" className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4 bg-black">
              <div className="font-mono text-sm">
                {terminalOutput.map((line, index) => (
                  <div key={index} className="text-green-400">
                    {line}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-gray-700 bg-black">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-green-400">$</span>
                <Input
                  placeholder="Enter command..."
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleTerminalCommand(terminalInput)}
                  className="flex-1 bg-transparent border-none text-white"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}