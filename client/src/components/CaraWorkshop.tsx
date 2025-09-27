import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import Editor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Play, Save, Download, Upload, Bot, MessageSquare, Terminal, FileText,
  GitBranch, Settings, Zap, Brain, Code, Database, Server, Sparkles,
  Maximize2, Minimize2, X, ArrowLeft, Cloud, Shield, Activity,
  Users, Cpu, Layers, Network, Workflow, ChevronDown, ChevronRight
} from 'lucide-react';

// A2A Protocol Agent Types with proper hierarchy
interface CaraAgent {
  id: string;
  name: string;
  role: 'orchestrator' | 'specialist';
  type: 'cara' | 'codesmith' | 'debugger' | 'architect' | 'deployer' | 'guardian';
  status: 'idle' | 'thinking' | 'working' | 'completed' | 'error';
  description: string;
  capabilities: string[];
  avatar: string;
  level: number; // Hierarchy level (1 = Cara, 2 = specialists)
  parent?: string; // Parent agent ID
  children?: string[]; // Child agent IDs
}

interface A2AMessage {
  id: string;
  jsonrpc: '2.0';
  method: string;
  params: any;
  timestamp: Date;
  from: string;
  to: string;
  status: 'pending' | 'completed' | 'error';
}

interface WorkshopPanel {
  id: string;
  title: string;
  type: 'editor' | 'chat' | 'terminal' | 'agents' | 'files' | 'preview';
  position: { x: number; y: number };
  size: { width: number; height: number };
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
}

// Modern Agent Hierarchy with Cara as Orchestrator
const caraAgents: CaraAgent[] = [
  {
    id: 'cara',
    name: 'Cara',
    role: 'orchestrator',
    type: 'cara',
    status: 'idle',
    description: 'Your AI orchestrator who coordinates all development tasks',
    capabilities: ['Task Planning', 'Agent Coordination', 'Project Management', 'Resource Allocation'],
    avatar: '🧠',
    level: 1,
    children: ['codesmith', 'architect', 'guardian', 'deployer']
  },
  {
    id: 'codesmith',
    name: 'CodeSmith',
    role: 'specialist',
    type: 'codesmith',
    status: 'idle',
    description: 'Expert coder who writes, refactors, and optimizes code',
    capabilities: ['Code Generation', 'Refactoring', 'Performance Optimization', 'Best Practices'],
    avatar: '⚒️',
    level: 2,
    parent: 'cara'
  },
  {
    id: 'architect',
    name: 'Architect',
    role: 'specialist',
    type: 'architect',
    status: 'idle',
    description: 'System architect who designs scalable solutions',
    capabilities: ['System Design', 'Architecture Planning', 'Scalability', 'Integration'],
    avatar: '🏗️',
    level: 2,
    parent: 'cara'
  },
  {
    id: 'guardian',
    name: 'Guardian',
    role: 'specialist',
    type: 'guardian',
    status: 'idle',
    description: 'Security and quality guardian ensuring robust code',
    capabilities: ['Security Audit', 'Code Review', 'Testing', 'Quality Assurance'],
    avatar: '🛡️',
    level: 2,
    parent: 'cara'
  },
  {
    id: 'deployer',
    name: 'Deployer',
    role: 'specialist',
    type: 'deployer',
    status: 'idle',
    description: 'DevOps specialist handling deployments and infrastructure',
    capabilities: ['CI/CD', 'Cloud Deployment', 'Infrastructure', 'Monitoring'],
    avatar: '🚀',
    level: 2,
    parent: 'cara'
  }
];

const defaultPanels: WorkshopPanel[] = [
  {
    id: 'editor',
    title: 'Code Editor',
    type: 'editor',
    position: { x: 320, y: 80 },
    size: { width: 800, height: 600 },
    isMinimized: false,
    isMaximized: false,
    zIndex: 1
  },
  {
    id: 'cara-chat',
    title: 'Cara\'s Command Center',
    type: 'chat',
    position: { x: 50, y: 80 },
    size: { width: 350, height: 400 },
    isMinimized: false,
    isMaximized: false,
    zIndex: 2
  },
  {
    id: 'agents',
    title: 'Agent Swarm',
    type: 'agents',
    position: { x: 50, y: 500 },
    size: { width: 350, height: 300 },
    isMinimized: false,
    isMaximized: false,
    zIndex: 1
  },
  {
    id: 'terminal',
    title: 'Terminal',
    type: 'terminal',
    position: { x: 1150, y: 400 },
    size: { width: 400, height: 300 },
    isMinimized: false,
    isMaximized: false,
    zIndex: 1
  }
];

export default function CaraWorkshop({ projectId }: { projectId: string }) {
  const [panels, setPanels] = useState<WorkshopPanel[]>(defaultPanels);
  const [agents, setAgents] = useState<CaraAgent[]>(caraAgents);
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [maxZIndex, setMaxZIndex] = useState(10);
  const [selectedAgent, setSelectedAgent] = useState<string>('cara');
  const [isAgentPanelExpanded, setIsAgentPanelExpanded] = useState(true);
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // A2A Protocol Message Handler
  const sendA2AMessage = useCallback(async (method: string, params: any, targetAgent: string) => {
    const message: A2AMessage = {
      id: `msg_${Date.now()}`,
      jsonrpc: '2.0',
      method,
      params: { ...params, targetAgent },
      timestamp: new Date(),
      from: 'user',
      to: targetAgent,
      status: 'pending'
    };

    setMessages(prev => [...prev, message]);

    // Update agent status to thinking
    setAgents(prev => prev.map(agent =>
      agent.id === targetAgent
        ? { ...agent, status: 'thinking' }
        : agent
    ));

    try {
      // Real A2A Protocol API call
      const response = await fetch('/api/agents/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // Update message status and agent status
      setMessages(prev => prev.map(msg =>
        msg.id === message.id
          ? { ...msg, status: 'completed' }
          : msg
      ));

      setAgents(prev => prev.map(agent =>
        agent.id === targetAgent
          ? { ...agent, status: 'completed' }
          : agent
      ));

      return result.result;
    } catch (error) {
      console.error('A2A Message Error:', error);

      // Update status to error
      setMessages(prev => prev.map(msg =>
        msg.id === message.id
          ? { ...msg, status: 'error' }
          : msg
      ));

      setAgents(prev => prev.map(agent =>
        agent.id === targetAgent
          ? { ...agent, status: 'error' }
          : agent
      ));

      throw error;
    }
  }, []);

  // Handle Cara's orchestration
  const handleCaraTask = async (prompt: string) => {
    try {
      // Clear the prompt input
      setCurrentPrompt('');

      // Add user message to chat
      const userMessage = {
        id: `user_${Date.now()}`,
        role: 'user' as const,
        content: prompt,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, userMessage]);

      // Cara analyzes the task and delegates to appropriate specialists
      const caraResponse = await sendA2AMessage('task.analyze', { prompt }, 'cara');

      // Add Cara's response to chat
      const caraMessage = {
        id: `cara_${Date.now()}`,
        role: 'assistant' as const,
        content: caraResponse.message,
        timestamp: new Date(),
        agentId: 'cara'
      };
      setChatMessages(prev => [...prev, caraMessage]);

      // Based on the analysis, execute the plan
      if (caraResponse.analysis) {
        const { taskType, assignedAgents, subtasks } = caraResponse.analysis;

        // Execute subtasks with assigned agents
        for (const subtask of subtasks || []) {
          try {
            const agentResponse = await sendA2AMessage(
              getMethodForAgent(subtask.agent),
              { prompt: subtask.task, context: prompt },
              subtask.agent
            );

            // Add agent response to chat
            const agentMessage = {
              id: `${subtask.agent}_${Date.now()}`,
              role: 'assistant' as const,
              content: agentResponse.message,
              timestamp: new Date(),
              agentId: subtask.agent
            };
            setChatMessages(prev => [...prev, agentMessage]);

          } catch (error) {
            console.error(`Error with agent ${subtask.agent}:`, error);
          }
        }
      }

    } catch (error) {
      console.error('Error in handleCaraTask:', error);

      // Add error message to chat
      const errorMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date(),
        agentId: 'cara'
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  // Map agent to appropriate method
  const getMethodForAgent = (agentId: string): string => {
    switch (agentId) {
      case 'codesmith': return 'code.generate';
      case 'architect': return 'system.design';
      case 'guardian': return 'security.audit';
      case 'deployer': return 'deploy.setup';
      default: return 'task.analyze';
    }
  };

  const analyzeTaskType = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('code') || lower.includes('function') || lower.includes('component')) return 'code';
    if (lower.includes('architecture') || lower.includes('design') || lower.includes('system')) return 'architecture';
    if (lower.includes('security') || lower.includes('audit') || lower.includes('vulnerability')) return 'security';
    if (lower.includes('deploy') || lower.includes('hosting') || lower.includes('ci/cd')) return 'deploy';
    return 'multi';
  };

  const bringToFront = (panelId: string) => {
    const newZIndex = maxZIndex + 1;
    setMaxZIndex(newZIndex);
    setPanels(prev => prev.map(panel =>
      panel.id === panelId
        ? { ...panel, zIndex: newZIndex }
        : panel
    ));
  };

  const toggleMinimize = (panelId: string) => {
    setPanels(prev => prev.map(panel =>
      panel.id === panelId
        ? { ...panel, isMinimized: !panel.isMinimized }
        : panel
    ));
  };

  const closePanel = (panelId: string) => {
    setPanels(prev => prev.filter(panel => panel.id !== panelId));
  };

  const renderPanelContent = (panel: WorkshopPanel) => {
    switch (panel.type) {
      case 'editor':
        return (
          <div className="h-full flex flex-col">
            <Tabs defaultValue="App.tsx" className="h-full">
              <TabsList className="w-full justify-start bg-background/50">
                <TabsTrigger value="App.tsx">App.tsx</TabsTrigger>
                <TabsTrigger value="index.tsx">index.tsx</TabsTrigger>
                <TabsTrigger value="package.json">package.json</TabsTrigger>
              </TabsList>
              <TabsContent value="App.tsx" className="h-full mt-2">
                <Editor
                  height="100%"
                  defaultLanguage="typescript"
                  defaultValue="import React from 'react';\n\nexport default function App() {\n  return (\n    <div>Hello Vibe Coding</div>\n  );\n}"
                  theme="vs-dark"
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    automaticLayout: true
                  }}
                />
              </TabsContent>
            </Tabs>
          </div>
        );

      case 'chat':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback>🧠</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-foreground">Cara</p>
                <p className="text-xs text-foreground/60">AI Orchestrator</p>
              </div>
              <Badge className="ml-auto bg-green-500/20 text-green-400">Active</Badge>
            </div>

            <ScrollArea className="flex-1 mb-4">
              <div className="space-y-3">
                {chatMessages.length === 0 ? (
                  <div className="bg-primary/10 rounded-lg p-3">
                    <p className="text-sm text-foreground">
                      Hello! I'm Cara, your AI orchestrator. I coordinate a team of specialist agents to help you build amazing software. What would you like to create today?
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-blue-500/10 ml-4'
                          : 'bg-primary/10 mr-4'
                      }`}
                    >
                      {msg.role === 'assistant' && msg.agentId && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-primary">
                            {agents.find(a => a.id === msg.agentId)?.name || 'Agent'}
                          </span>
                          <span className="text-xs text-foreground/60">
                            {msg.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <div className="space-y-2">
              <Textarea
                placeholder="Describe what you want to build..."
                value={currentPrompt}
                onChange={(e) => setCurrentPrompt(e.target.value)}
                className="min-h-[80px] resize-none"
              />
              <Button
                onClick={() => handleCaraTask(currentPrompt)}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                disabled={!currentPrompt.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Let Cara Handle It
              </Button>
            </div>
          </div>
        );

      case 'agents':
        return (
          <div className="h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Agent Swarm</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAgentPanelExpanded(!isAgentPanelExpanded)}
              >
                {isAgentPanelExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>

            {isAgentPanelExpanded && (
              <ScrollArea className="h-[calc(100%-3rem)]">
                <div className="space-y-3">
                  {agents.map((agent) => (
                    <Card
                      key={agent.id}
                      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                        agent.id === selectedAgent ? 'ring-2 ring-primary' : ''
                      } ${agent.level === 1 ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10' : 'bg-card/50'}`}
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{agent.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-sm text-foreground">{agent.name}</p>
                              {agent.role === 'orchestrator' && (
                                <Badge className="bg-amber-500/20 text-amber-400 text-xs">Orchestrator</Badge>
                              )}
                            </div>
                            <p className="text-xs text-foreground/60 mt-1">{agent.description}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            agent.status === 'idle' ? 'bg-gray-400' :
                            agent.status === 'thinking' ? 'bg-yellow-400 animate-pulse' :
                            agent.status === 'working' ? 'bg-blue-400 animate-pulse' :
                            agent.status === 'completed' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        );

      case 'terminal':
        return (
          <div className="h-full bg-black/90 text-green-400 p-4 font-mono text-sm">
            <div className="mb-2">Welcome to Cara's Workshop Terminal</div>
            <div className="mb-2">$ npm run dev</div>
            <div className="text-green-300">✓ Development server running on http://localhost:3000</div>
            <div className="mt-4">
              <span className="text-amber-400">cara@workshop:~/project$</span>
              <span className="animate-pulse ml-1">_</span>
            </div>
          </div>
        );

      default:
        return <div className="h-full flex items-center justify-center text-foreground/60">Panel content</div>;
    }
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-background/95">
      {/* Header */}
      <div className="h-16 bg-background/80 backdrop-blur-sm border-b border-border flex items-center px-6 relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🧠</div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Cara's Workshop
              </h1>
              <p className="text-xs text-foreground/60">AI-Powered Development Environment</p>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge className="bg-green-500/20 text-green-400">
            <Activity className="h-3 w-3 mr-1" />
            Live
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400">
            <Users className="h-3 w-3 mr-1" />
            {agents.filter(a => a.status !== 'idle').length} Agents Active
          </Badge>
        </div>
      </div>

      {/* Draggable Panels */}
      <div className="h-[calc(100vh-4rem)] relative">
        {panels.map((panel) => (
          <Rnd
            key={panel.id}
            size={panel.isMinimized ? { width: 300, height: 40 } : panel.size}
            position={panel.position}
            onDragStop={(e, d) => {
              setPanels(prev => prev.map(p =>
                p.id === panel.id
                  ? { ...p, position: { x: d.x, y: d.y } }
                  : p
              ));
            }}
            onResizeStop={(e, direction, ref, delta, position) => {
              setPanels(prev => prev.map(p =>
                p.id === panel.id
                  ? {
                      ...p,
                      size: { width: ref.offsetWidth, height: ref.offsetHeight },
                      position
                    }
                  : p
              ));
            }}
            style={{ zIndex: panel.zIndex }}
            onMouseDown={() => bringToFront(panel.id)}
            className="glass-pane rounded-xl overflow-hidden"
            dragHandleClassName="panel-header"
            enableResizing={!panel.isMinimized}
          >
            <Card className="h-full bg-transparent border-none shadow-none">
              <CardHeader className="panel-header cursor-move p-3 bg-background/60 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-foreground">{panel.title}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => toggleMinimize(panel.id)}
                    >
                      {panel.isMinimized ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => closePanel(panel.id)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {!panel.isMinimized && (
                <CardContent className="p-4 h-[calc(100%-4rem)]">
                  {renderPanelContent(panel)}
                </CardContent>
              )}
            </Card>
          </Rnd>
        ))}
      </div>
    </div>
  );
}