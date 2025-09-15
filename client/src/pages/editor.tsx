import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Code, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import CodeEditor from "@/components/code-editor";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Editor() {
  const [, params] = useRoute("/editor/:projectId");
  const projectId = params?.projectId;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["/api/projects", projectId],
    enabled: !!projectId,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("POST", "/api/generate-code", {
        projectId,
        prompt,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Success",
        description: "Code generated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to generate code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: async (updates: any) => {
      const response = await apiRequest("PATCH", `/api/projects/${projectId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", projectId] });
      toast({
        title: "Success",
        description: "Project updated successfully",
      });
    },
  });

  const handleFilesChange = (files: Record<string, string>) => {
    updateProjectMutation.mutate({ files });
  };

  const handleGenerateCode = (prompt: string) => {
    generateCodeMutation.mutate(prompt);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "deployed": return "bg-accent text-accent-foreground";
      case "building": return "bg-yellow-500 text-white";
      case "error": return "bg-destructive text-destructive-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "building": return <Loader2 className="h-3 w-3 animate-spin" />;
      case "error": return <AlertCircle className="h-3 w-3" />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Project Not Found</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600 mb-4">
              The project you're looking for doesn't exist or you don't have access to it.
            </p>
            <Link href="/dashboard">
              <Button className="w-full">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
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
              <Link href="/dashboard" className="flex items-center space-x-2" data-testid="link-dashboard">
                <ArrowLeft className="h-4 w-4" />
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Code className="text-primary-foreground text-sm" />
                </div>
                <span className="font-bold text-xl">Careerate</span>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div>
                <h1 className="font-semibold text-lg" data-testid="project-name">
                  {project.name}
                </h1>
                <p className="text-sm text-muted-foreground" data-testid="project-framework">
                  {project.framework}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge 
                className={`${getStatusColor(project.status)} flex items-center space-x-1`}
                data-testid="project-status-badge"
              >
                {getStatusIcon(project.status)}
                <span className="capitalize">{project.status}</span>
              </Badge>
              
              {project.deploymentUrl && (
                <Button 
                  variant="outline" 
                  size="sm"
                  asChild
                  data-testid="button-view-live"
                >
                  <a href={project.deploymentUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Live
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Project Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Name</h4>
                  <p className="text-sm" data-testid="project-detail-name">{project.name}</p>
                </div>
                
                {project.description && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm" data-testid="project-detail-description">{project.description}</p>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Framework</h4>
                  <p className="text-sm capitalize" data-testid="project-detail-framework">{project.framework}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-1">Status</h4>
                  <Badge 
                    className={getStatusColor(project.status)}
                    data-testid="project-detail-status"
                  >
                    {project.status}
                  </Badge>
                </div>
                
                {project.deploymentUrl && (
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Deployment</h4>
                    <a 
                      href={project.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-accent hover:underline break-all"
                      data-testid="project-detail-url"
                    >
                      {project.deploymentUrl}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {project.status === "building" && (
              <Alert data-testid="building-alert">
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Your project is being built and deployed. This usually takes a few minutes.
                </AlertDescription>
              </Alert>
            )}

            {project.status === "error" && (
              <Alert variant="destructive" data-testid="error-alert">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  There was an error building your project. Try generating new code or check your configuration.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Code Editor */}
          <div className="lg:col-span-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Code Editor</CardTitle>
                <CardDescription>
                  Edit your code or use AI to generate new features
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)] p-0">
                <CodeEditor
                  files={project.files || {}}
                  onFilesChange={handleFilesChange}
                  onGenerateCode={handleGenerateCode}
                  isGenerating={generateCodeMutation.isPending}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
