import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, Trash2, Code, ArrowLeft, Activity, Shield, Zap, Settings, Cloud, BarChart3, Target, Cpu, GitBranch, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [framework, setFramework] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
        title: "Success", 
        description: `Project "${data.name}" created successfully`,
      });
    },
    onError: (error: Error) => {
      console.error("Project creation error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: string) => {
      await apiRequest("DELETE", `/api/projects/${projectId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed": return "bg-accent";
      case "building": return "bg-yellow-500";
      case "error": return "bg-destructive";
      default: return "bg-muted";
    }
  };

  const getFrameworkIcon = (framework: string) => {
    switch (framework) {
      case "react": return "⚛️";
      case "vue": return "💚";
      case "angular": return "🅰️";
      case "react-native": return "📱";
      case "node": return "🟢";
      case "next": return "▲";
      default: return "⚡";
    }
  };

  const handleCreateProject = () => {
    if (!projectName.trim() || !framework) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createProjectMutation.mutate({
      name: projectName,
      description: projectDescription,
      framework,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
                <ArrowLeft className="h-4 w-4" />
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Code className="text-primary-foreground text-sm" />
                </div>
                <span className="font-bold text-xl">Careerate</span>
              </Link>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-primary text-primary-foreground hover:bg-gray-800"
                  data-testid="button-create-project"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl" data-testid="dialog-create-project">
                <DialogHeader className="space-y-3 pb-4">
                  <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">Create New Project</DialogTitle>
                  <DialogDescription className="text-gray-600 dark:text-gray-300 text-base">
                    Start building your next application with AI assistance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-3">
                    <Label htmlFor="project-name" className="text-sm font-semibold text-gray-900 dark:text-white">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Awesome App"
                      data-testid="input-project-name"
                      className="w-full h-11 text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="project-description" className="text-sm font-semibold text-gray-900 dark:text-white">Description (Optional)</Label>
                    <Textarea
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe what your app does..."
                      data-testid="textarea-project-description"
                      className="w-full min-h-[100px] text-base bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="framework" className="text-sm font-semibold text-gray-900 dark:text-white">Framework *</Label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger data-testid="select-framework" className="w-full h-11 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400">
                        <SelectValue placeholder="Choose a framework" className="text-gray-500 dark:text-gray-400" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectItem value="react" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">⚛️ React</SelectItem>
                        <SelectItem value="vue" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">💚 Vue.js</SelectItem>
                        <SelectItem value="angular" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">🅰️ Angular</SelectItem>
                        <SelectItem value="next" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">▲ Next.js</SelectItem>
                        <SelectItem value="react-native" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">📱 React Native</SelectItem>
                        <SelectItem value="node" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">🟢 Node.js</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="space-x-3 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                    className="px-6 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    data-testid="button-confirm-create"
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createProjectMutation.isPending ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      "Create Project"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Migration Tools Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Vibe Hosting - Cloud Migration</h2>
              <p className="text-muted-foreground">
                AI-powered migration tools for modernizing your infrastructure and applications
              </p>
            </div>
            <Link href="/migration">
              <Button variant="outline" data-testid="button-view-all-migration">
                View Migration Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/migration/analysis'}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Legacy Analysis</CardTitle>
                    <CardDescription>AI-powered system assessment</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload and analyze your existing infrastructure for migration readiness
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">AI Assessment Ready</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/migration/planning'}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Migration Planning</CardTitle>
                    <CardDescription>Interactive timeline management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Create detailed migration plans with resource allocation and risk management
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Project Management</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/migration/modernization'}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Modernization</CardTitle>
                    <CardDescription>Automated code transformation</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  AI-powered workflows for framework upgrades and architectural modernization
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Code Generation</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/migration/execution'}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Execution Monitor</CardTitle>
                    <CardDescription>Real-time migration tracking</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Monitor migration progress with live metrics and automated rollback capabilities
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">Real-time Monitoring</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/migration/recommendations'}>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Recommendations</CardTitle>
                    <CardDescription>Optimization insights</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get AI-powered recommendations for architecture, performance, and cost optimization
                </p>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-xs text-muted-foreground">AI Insights</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => window.location.href = '/migration'}>
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">Explore All Migration Tools</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Access the complete migration dashboard with advanced features
                </p>
                <Button variant="outline" size="sm">
                  <GitBranch className="mr-2 h-4 w-4" />
                  Open Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="dashboard-title">
            Your Projects
          </h1>
          <p className="text-muted-foreground" data-testid="dashboard-subtitle">
            {projects.length} {projects.length === 1 ? 'project' : 'projects'} total
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="text-center py-12" data-testid="empty-state">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Code className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first project to start building with AI assistance.
              </p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-first-project">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Project
                  </Button>
                </DialogTrigger>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: any, index: number) => (
              <Card 
                key={project.id} 
                className="hover:shadow-lg transition-all duration-300"
                data-testid={`project-card-${index}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center text-lg">
                      {getFrameworkIcon(project.framework)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 ${getStatusColor(project.status)} rounded-full`}></div>
                      <span className="text-xs text-muted-foreground capitalize" data-testid={`project-status-${index}`}>
                        {project.status}
                      </span>
                    </div>
                  </div>
                  <CardTitle className="text-lg" data-testid={`project-name-${index}`}>
                    {project.name}
                  </CardTitle>
                  <CardDescription data-testid={`project-description-${index}`}>
                    {project.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-muted-foreground">
                      <Eye className="inline mr-1 h-3 w-3" />
                      {Math.floor(Math.random() * 2000)} views
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {project.framework}
                    </span>
                  </div>
                  
                  {project.deploymentUrl && (
                    <div className="mb-4">
                      <a 
                        href={project.deploymentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent hover:underline"
                        data-testid={`project-url-${index}`}
                      >
                        {project.deploymentUrl}
                      </a>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <Link href={`/editor/${project.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          data-testid={`button-open-project-${index}`}
                        >
                          <Code className="mr-2 h-3 w-3" />
                          Code Editor
                        </Button>
                      </Link>
                      <Link href={`/devops/${project.id}`} className="flex-1">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                          data-testid={`button-devops-project-${index}`}
                        >
                          <Activity className="mr-2 h-3 w-3" />
                          AI DevOps
                        </Button>
                      </Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="SRE Agent Active"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Security Agent Active"></div>
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Performance Agent Active"></div>
                        <div className="w-2 h-2 bg-purple-500 rounded-full" title="Deployment Agent Active"></div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteProjectMutation.mutate(project.id)}
                        disabled={deleteProjectMutation.isPending}
                        className="text-destructive hover:text-destructive-foreground hover:bg-destructive h-6 w-6 p-0"
                        data-testid={`button-delete-project-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
