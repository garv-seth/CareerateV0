import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, Trash2, Code, ArrowLeft, Activity, Shield, Zap, Settings } from "lucide-react";
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
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" data-testid="dialog-create-project">
                <DialogHeader>
                  <DialogTitle>Create New Project</DialogTitle>
                  <DialogDescription>
                    Start building your next application with AI assistance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name *</Label>
                    <Input
                      id="project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Awesome App"
                      data-testid="input-project-name"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description (Optional)</Label>
                    <Textarea
                      id="project-description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="Describe what your app does..."
                      data-testid="textarea-project-description"
                      className="w-full min-h-[80px]"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="framework">Framework *</Label>
                    <Select value={framework} onValueChange={setFramework}>
                      <SelectTrigger data-testid="select-framework" className="w-full">
                        <SelectValue placeholder="Choose a framework" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="react">⚛️ React</SelectItem>
                        <SelectItem value="vue">💚 Vue.js</SelectItem>
                        <SelectItem value="angular">🅰️ Angular</SelectItem>
                        <SelectItem value="next">▲ Next.js</SelectItem>
                        <SelectItem value="react-native">📱 React Native</SelectItem>
                        <SelectItem value="node">🟢 Node.js</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={createProjectMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
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
