import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, Play, Code, Settings, User, Search, FileCode, Globe, Database, 
  Smartphone, Bot, Send, Sparkles, Zap, GitBranch, Cloud, Shield,
  Activity, BarChart3, Terminal, MessageSquare, Rocket, Star,
  ChevronRight, Clock, TrendingUp, Users, Brain, Cpu, Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const appTemplates = [
  {
    id: 'react-app',
    name: 'React App',
    description: 'Modern web application with React and TypeScript',
    icon: Globe,
    framework: 'react',
    tags: ['Web', 'Frontend']
  },
  {
    id: 'node-api',
    name: 'Node.js API',
    description: 'RESTful API with Express and TypeScript',
    icon: Database,
    framework: 'node',
    tags: ['Backend', 'API']
  },
  {
    id: 'full-stack',
    name: 'Full Stack App',
    description: 'Complete web application with React + Node.js',
    icon: FileCode,
    framework: 'fullstack',
    tags: ['Full Stack', 'Web']
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    description: 'React Native mobile application',
    icon: Smartphone,
    framework: 'react-native',
    tags: ['Mobile', 'Cross-platform']
  }
];

export default function Dashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [framework, setFramework] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [agentPrompt, setAgentPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("agent");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const promptRef = useRef<HTMLTextAreaElement>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (projectData: { name: string; description: string; framework: string }) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      if (!response.ok) {
        throw new Error(`Failed to create project: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      setProjectName("");
      setProjectDescription("");
      setFramework("");
      toast({
        title: "Project created!",
        description: `${data.name} is ready to code`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const filteredProjects = projects.filter((project: any) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = (template: any) => {
    setFramework(template.framework);
    setProjectName('');
    setProjectDescription('');
    setIsCreateDialogOpen(true);
  };

  const handleAgentPrompt = async () => {
    if (!agentPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      // Create project from agent prompt
      const projectData = {
        name: extractProjectName(agentPrompt) || "AI Generated Project",
        description: agentPrompt,
        framework: detectFramework(agentPrompt)
      };
      
      const project = await createProjectMutation.mutateAsync(projectData);
      
      // Navigate to coding environment
      window.location.href = `/projects/${project.id}/coding`;
      
    } catch (error) {
      toast({
        title: "Generation failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const extractProjectName = (prompt: string): string => {
    const matches = prompt.match(/(?:build|create|make)\s+(?:a|an)?\s*([^.!?]+)/i);
    return matches ? matches[1].trim() : "";
  };

  const detectFramework = (prompt: string): string => {
    const lower = prompt.toLowerCase();
    if (lower.includes('react') || lower.includes('frontend')) return 'react';
    if (lower.includes('api') || lower.includes('backend')) return 'node';
    if (lower.includes('mobile')) return 'react-native';
    if (lower.includes('full stack') || lower.includes('fullstack')) return 'fullstack';
    return 'react';
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #581c87 50%, #0f172a 100%)",
      }}
    >
      {/* Modern Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">Careerate</span>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  Live
                </Badge>
              </div>

              <nav className="hidden md:flex space-x-6">
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Code className="h-4 w-4 mr-2" />
                  Vibe Coding
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Cloud className="h-4 w-4 mr-2" />
                  Vibe Hosting
                </Button>
                <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10">
                  <Shield className="h-4 w-4 mr-2" />
                  Integrations
                </Button>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="h-4 w-4" />
              </Button>
              <Link href="/account">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border-white/10">
            <TabsTrigger value="agent" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Brain className="h-4 w-4 mr-2" />
              AI Agent
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <GitBranch className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
          </TabsList>

          {/* AI Agent Tab - Main Interface */}
          <TabsContent value="agent" className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-4">
                What will you build today?
              </h1>
              <p className="text-xl text-white/70 max-w-2xl mx-auto">
                Describe your idea in natural language and our AI agents will handle everything from code to deployment.
              </p>
            </div>

            {/* Main Agent Prompt Interface */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-md">
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div className="relative">
                    <Textarea
                      ref={promptRef}
                      placeholder="Build me a Netflix clone with user authentication, video streaming, and recommendations..."
                      value={agentPrompt}
                      onChange={(e) => setAgentPrompt(e.target.value)}
                      className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/50 text-lg resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleAgentPrompt();
                        }
                      }}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center space-x-2">
                      <Badge variant="secondary" className="bg-white/10 text-white/70">
                        ⌘ + Enter to submit
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        <Cpu className="h-3 w-3 mr-1" />
                        GPT-5 Ready
                      </Badge>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        <Cloud className="h-3 w-3 mr-1" />
                        Multi-Cloud
                      </Badge>
                      <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                        <Shield className="h-3 w-3 mr-1" />
                        DevSecOps
                      </Badge>
                    </div>

                    <Button 
                      onClick={handleAgentPrompt}
                      disabled={!agentPrompt.trim() || isGenerating}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Start Building
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {appTemplates.map((template) => (
                <Card 
                  key={template.id}
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group"
                  onClick={() => handleCreateProject(template)}
                >
                  <CardContent className="p-4 text-center">
                    <template.icon className="h-8 w-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-white text-sm">{template.name}</h3>
                    <p className="text-xs text-white/60 mt-1">{template.tags.join(', ')}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Activity */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white/80 text-sm">AI generated React dashboard component</span>
                    <span className="text-white/50 text-xs ml-auto">2 min ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-white/80 text-sm">Deployed to Azure Container Apps</span>
                    <span className="text-white/50 text-xs ml-auto">1 hour ago</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-white/5">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-white/80 text-sm">Connected GitHub repository</span>
                    <span className="text-white/50 text-xs ml-auto">3 hours ago</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Your Projects</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64 bg-white/5 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-white/5 border-white/10 animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-white/10 rounded mb-2"></div>
                      <div className="h-3 bg-white/10 rounded mb-4"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-16 bg-white/10 rounded"></div>
                        <div className="h-6 w-16 bg-white/10 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((project: any) => (
                  <Card key={project.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 group">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-white mb-1">{project.name}</h3>
                          <p className="text-sm text-white/60">{project.description}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Link href={`/projects/${project.id}/coding`}>
                            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" title="Vibe Coding">
                              <Code className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}/hosting`}>
                            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" title="Vibe Hosting">
                              <Rocket className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/projects/${project.id}/migration`}>
                            <Button size="sm" variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10" title="Enterprise Migration">
                              <Bot className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {project.metadata?.framework && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                              {project.metadata.framework}
                            </Badge>
                          )}
                          <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                            {project.metadata?.status || 'draft'}
                          </Badge>
                        </div>
                        <span className="text-xs text-white/50">
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-12 w-12 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">No projects yet</h3>
                <p className="text-white/60 mb-8 max-w-md mx-auto">
                  {searchQuery ? "No projects match your search" : "Start building with AI assistance. Describe your idea and we'll handle the rest."}
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setActiveTab("agent")}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 px-8"
                    size="lg"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    Start Building with AI
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center text-sm">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">{projects.length}</div>
                  <p className="text-white/60 text-sm">Active projects</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center text-sm">
                    <Cloud className="h-4 w-4 mr-2" />
                    Deployments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">0</div>
                  <p className="text-white/60 text-sm">Live deployments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center text-sm">
                    <Activity className="h-4 w-4 mr-2" />
                    Uptime
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">99.9%</div>
                  <p className="text-white/60 text-sm">Last 30 days</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-orange-500/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-white flex items-center text-sm">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">180ms</div>
                  <p className="text-white/60 text-sm">Avg response time</p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card className="bg-black/40 border-white/20 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col border-white/20 text-white hover:bg-white/10"
                    onClick={() => setActiveTab("agent")}
                  >
                    <Brain className="h-6 w-6 mb-2" />
                    AI Build
                  </Button>
                  <Link href="/integrations">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col border-white/20 text-white hover:bg-white/10 w-full"
                    >
                      <Shield className="h-6 w-6 mb-2" />
                      Integrations
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col border-white/20 text-white hover:bg-white/10"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="h-6 w-6 mb-2" />
                    New Project
                  </Button>
                  <Link href="/account">
                    <Button 
                      variant="outline" 
                      className="h-20 flex-col border-white/20 text-white hover:bg-white/10 w-full"
                    >
                      <User className="h-6 w-6 mb-2" />
                      Profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Project Dialog - Modern Theme */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-slate-900 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-purple-400" />
              Create New Project
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Give your project a name and our AI agents will help you build it from the ground up.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white font-medium">Project Name</Label>
              <Input
                id="name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="My Netflix Clone"
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-white font-medium">Description (Optional)</Label>
              <Textarea
                id="description"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="A video streaming platform with user authentication, content management, and personalized recommendations..."
                rows={3}
                className="bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="framework" className="text-white font-medium">Framework</Label>
              <Select value={framework} onValueChange={setFramework}>
                <SelectTrigger className="bg-white/5 border-white/20 text-white">
                  <SelectValue placeholder="Choose a framework" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  <SelectItem value="react" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 mr-2" />
                      React - Modern Web App
                    </div>
                  </SelectItem>
                  <SelectItem value="node" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Server className="h-4 w-4 mr-2" />
                      Node.js - Backend API
                    </div>
                  </SelectItem>
                  <SelectItem value="fullstack" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Code className="h-4 w-4 mr-2" />
                      Full Stack - Complete App
                    </div>
                  </SelectItem>
                  <SelectItem value="react-native" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      React Native - Mobile App
                    </div>
                  </SelectItem>
                  <SelectItem value="nextjs" className="text-white hover:bg-white/10">
                    <div className="flex items-center">
                      <Rocket className="h-4 w-4 mr-2" />
                      Next.js - Production Ready
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={() => createProjectMutation.mutate({
                name: projectName,
                description: projectDescription,
                framework
              })}
              disabled={!projectName || !framework || createProjectMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}