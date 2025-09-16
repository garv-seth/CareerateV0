import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Target, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  TrendingUp,
  Database,
  Cloud,
  ArrowRight,
  Plus,
  FileText,
  GitBranch,
  Cpu,
  Server,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MigrationProject {
  id: string;
  name: string;
  status: 'assessment' | 'planning' | 'executing' | 'completed' | 'failed';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  riskLevel: 'low' | 'medium' | 'high';
  estimatedCompletion: string;
  assignedTo?: string;
  createdAt: string;
}

interface MigrationStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalCostSavings: number;
  averageProgress: number;
  criticalIssues: number;
}

export default function MigrationDashboard() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // Fetch migration projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/migration-projects"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/migration-projects");
      if (!response.ok) throw new Error("Failed to fetch migration projects");
      return response.json();
    }
  });

  // Fetch migration statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/migration-stats"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/migration-stats");
      if (!response.ok) throw new Error("Failed to fetch migration stats");
      return response.json();
    }
  });

  // Mock data for demonstration
  const mockProjects: MigrationProject[] = [
    {
      id: "1",
      name: "Legacy ERP System Migration",
      status: "executing",
      progress: 65,
      priority: "high",
      riskLevel: "medium",
      estimatedCompletion: "2025-10-15",
      assignedTo: "DevOps Team",
      createdAt: "2025-09-01"
    },
    {
      id: "2", 
      name: "Monolith to Microservices",
      status: "planning",
      progress: 25,
      priority: "critical",
      riskLevel: "high",
      estimatedCompletion: "2025-11-30",
      assignedTo: "Architecture Team",
      createdAt: "2025-09-10"
    },
    {
      id: "3",
      name: "Database Modernization",
      status: "assessment",
      progress: 10,
      priority: "medium",
      riskLevel: "low",
      estimatedCompletion: "2025-12-20",
      createdAt: "2025-09-15"
    }
  ];

  const mockStats: MigrationStats = {
    totalProjects: 12,
    activeProjects: 8,
    completedProjects: 4,
    totalCostSavings: 450000,
    averageProgress: 45,
    criticalIssues: 3
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "executing": return "bg-blue-100 text-blue-800 border-blue-200";  
      case "planning": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "assessment": return "bg-purple-100 text-purple-800 border-purple-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "text-red-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-green-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
                Dashboard
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-2xl font-bold">Vibe Hosting - Cloud Migration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setLocation("/migration/new-assessment")}
                data-testid="button-new-assessment"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-projects">
                {mockStats.totalProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Migrations</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-migrations">
                {mockStats.activeProjects}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(mockStats.averageProgress)}% average progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-cost-savings">
                ${mockStats.totalCostSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Annual projected savings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-critical-issues">
                {mockStats.criticalIssues}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => setLocation("/migration/analysis")}
                data-testid="card-legacy-analysis">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Legacy System Analysis</CardTitle>
                    <CardDescription>
                      AI-powered assessment and recommendations
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Upload and analyze existing infrastructure, detect technologies, assess migration complexity
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">AI Assessment</Badge>
                <Badge variant="secondary">Cost Analysis</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation("/migration/planning")}
                data-testid="card-migration-planning">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Migration Planning</CardTitle>
                    <CardDescription>
                      Interactive planning and timeline management
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create migration timelines, assign resources, manage dependencies and risks
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Timeline</Badge>
                <Badge variant="secondary">Resources</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation("/migration/modernization")}
                data-testid="card-modernization">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Automated Modernization</CardTitle>
                    <CardDescription>
                      AI-powered code and infrastructure updates
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Framework upgrades, containerization, microservices decomposition
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Code Gen</Badge>
                <Badge variant="secondary">Containers</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation("/migration/execution")}
                data-testid="card-execution">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Execution Dashboard</CardTitle>
                    <CardDescription>
                      Real-time tracking and monitoring
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Track progress, monitor performance, handle rollbacks and recovery
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Real-time</Badge>
                <Badge variant="secondary">Rollbacks</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation("/migration/recommendations")}
                data-testid="card-recommendations">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI Recommendations</CardTitle>
                    <CardDescription>
                      Optimization and improvement engine
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Architecture optimization, cost reduction, performance improvements
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">AI Powered</Badge>
                <Badge variant="secondary">Optimization</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setLocation("/migration/reports")}
                data-testid="card-reports">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Reports & Analytics</CardTitle>
                    <CardDescription>
                      Migration insights and metrics
                    </CardDescription>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Comprehensive reporting, ROI analysis, performance metrics
              </p>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary">Analytics</Badge>
                <Badge variant="secondary">ROI</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Active Migration Projects</CardTitle>
            <CardDescription>
              Track the progress of ongoing cloud migration initiatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockProjects.map((project) => (
                <div key={project.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-lg font-semibold" data-testid={`text-project-name-${project.id}`}>
                          {project.name}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority} priority
                          </Badge>
                          <span className={`text-sm ${getRiskColor(project.riskLevel)}`}>
                            {project.riskLevel} risk
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation(`/migration/project/${project.id}`)}
                      data-testid={`button-view-project-${project.id}`}
                    >
                      View Details
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} className="h-2" />
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Expected completion: {new Date(project.estimatedCompletion).toLocaleDateString()}</span>
                      {project.assignedTo && (
                        <span>Assigned to: {project.assignedTo}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {mockProjects.length === 0 && (
                <div className="text-center py-8">
                  <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No migration projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by analyzing your legacy systems to identify migration opportunities.
                  </p>
                  <Button onClick={() => setLocation("/migration/analysis")}>
                    Start Legacy Analysis
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}