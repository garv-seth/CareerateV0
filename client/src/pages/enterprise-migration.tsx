import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useRoute } from "wouter";
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
  Lock,
  ArrowLeft,
  Code,
  Upload,
  Calendar,
  Settings,
  Activity,
  Lightbulb,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  budget?: number;
  issues?: number;
  timeline?: any;
}

interface MigrationStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalCostSavings: number;
  averageProgress: number;
  criticalIssues: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  savings: number;
  category: 'performance' | 'cost' | 'security' | 'architecture';
  status: 'pending' | 'in-progress' | 'completed' | 'rejected';
}

export default function EnterpriseMigration() {
  const [location, setLocation] = useLocation();
  const [match, params] = useRoute("/projects/:id/migration");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const projectId = params?.id;

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
      createdAt: "2025-09-01",
      budget: 250000,
      issues: 3
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
      createdAt: "2025-09-10",
      budget: 450000,
      issues: 7
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

  const mockRecommendations: Recommendation[] = [
    {
      id: "1",
      title: "Implement HikariCP Connection Pooling",
      description: "Replace current database connection handling with HikariCP for better performance and resource management",
      impact: "high",
      effort: "medium",
      savings: 25000,
      category: "performance",
      status: "pending"
    },
    {
      id: "2",
      title: "Migrate to Azure Container Apps",
      description: "Containerize applications and migrate to Azure Container Apps for better scalability and cost optimization",
      impact: "high",
      effort: "high",
      savings: 75000,
      category: "cost",
      status: "pending"
    },
    {
      id: "3",
      title: "Implement Redis Caching Layer",
      description: "Add Redis caching to reduce database load and improve response times",
      impact: "medium",
      effort: "low",
      savings: 15000,
      category: "performance",
      status: "in-progress"
    }
  ];

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

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "text-green-600";
      case "medium": return "text-yellow-600";
      case "low": return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const handleApplyRecommendation = async (recommendationId: string) => {
    try {
      toast({
        title: "Applying Recommendation",
        description: "Creating pull request with recommended changes...",
      });

      // Mock API call to apply recommendation
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Pull request created successfully. Review the changes in your repository.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply recommendation",
        variant: "destructive",
      });
    }
  };

  const fetchRecommendations = async () => {
    if (!projectId) return;
    try {
      const res = await apiRequest('POST', '/api/recommendations/suggest', { projectId });
      const data = await res.json();
      const recs = (data.recommendations || []).map((r: any) => ({ id: r.id, title: r.description, description: r.description, category: 'Code', priority: 'medium', impact: 'medium', effort: 'low', status: 'pending' }));
      setRecommendations(recs);
    } catch (e) { /* ignore */ }
  };

  useEffect(() => { fetchRecommendations(); }, [projectId]);

  const applyRecommendation = async (rec: Recommendation) => {
    if (!projectId) return;
    try {
      const res = await apiRequest('POST', '/api/recommendations/apply', {
        projectId,
        repo: { owner: 'your-org-or-user', name: 'your-repo' },
        commitMessage: rec.title || 'Apply AI Recommendation'
      });
      const data = await res.json();
      // naive success toast substitute
      console.log('PR created:', data.prUrl);
    } catch (e) {
      console.error('Apply rec failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <span className="text-muted-foreground">/</span>
              <h1 className="text-2xl font-bold">Enterprise Migration</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Assessment
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Legacy Analysis</TabsTrigger>
            <TabsTrigger value="planning">Planning</TabsTrigger>
            <TabsTrigger value="modernization">Modernization</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
            <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.totalProjects}</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Migrations</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.activeProjects}</div>
                  <p className="text-xs text-muted-foreground">{mockStats.averageProgress}% avg progress</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${mockStats.totalCostSavings.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Annual projected savings</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Issues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mockStats.criticalIssues}</div>
                  <p className="text-xs text-muted-foreground">Critical issues</p>
                </CardContent>
              </Card>
            </div>

            {/* Active Projects */}
            <Card>
              <CardHeader>
                <CardTitle>Active Migration Projects</CardTitle>
                <CardDescription>Track progress and manage ongoing migrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockProjects.map((project) => (
                    <div key={project.id} className="border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold">{project.name}</h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                              <Badge className={getPriorityColor(project.priority)}>{project.priority} priority</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">View Details</Button>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span>Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />

                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <span>Budget: ${project.budget?.toLocaleString()}</span>
                          <span>Issues: {project.issues}</span>
                          <span>Due: {new Date(project.estimatedCompletion).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Legacy Analysis Tab */}
          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Legacy System Analysis</span>
                </CardTitle>
                <CardDescription>
                  Upload and analyze your existing infrastructure for migration readiness
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">System Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="system-name">System Name</Label>
                        <Input id="system-name" placeholder="Legacy ERP System" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="technology-stack">Technology Stack</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select primary technology" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="java">.NET Framework</SelectItem>
                            <SelectItem value="net">Java</SelectItem>
                            <SelectItem value="php">PHP</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="ruby">Ruby</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="database">Database</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select database" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mssql">SQL Server</SelectItem>
                            <SelectItem value="oracle">Oracle</SelectItem>
                            <SelectItem value="mysql">MySQL</SelectItem>
                            <SelectItem value="postgresql">PostgreSQL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upload Files</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-semibold mb-2">Upload system files</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Support for source code, configuration files, database schemas
                        </p>
                        <Button>
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Files
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline">Save Draft</Button>
                  <Button>Start Analysis</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planning Tab */}
          <TabsContent value="planning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Migration Planning</span>
                </CardTitle>
                <CardDescription>
                  Create detailed migration plans with timeline and resource allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Planning Phase</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">3 months</div>
                        <p className="text-xs text-muted-foreground">Estimated duration</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Resources</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">8 people</div>
                        <p className="text-xs text-muted-foreground">Team members</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Risk Level</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">Medium</div>
                        <p className="text-xs text-muted-foreground">Overall assessment</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { phase: "Assessment & Planning", duration: "4 weeks", status: "completed" },
                          { phase: "Infrastructure Setup", duration: "6 weeks", status: "in-progress" },
                          { phase: "Data Migration", duration: "8 weeks", status: "pending" },
                          { phase: "Application Migration", duration: "10 weeks", status: "pending" },
                          { phase: "Testing & Validation", duration: "4 weeks", status: "pending" },
                          { phase: "Go-Live", duration: "2 weeks", status: "pending" }
                        ].map((phase, index) => (
                          <div key={index} className="flex items-center space-x-4 p-4 border rounded">
                            <div className={`w-3 h-3 rounded-full ${
                              phase.status === "completed" ? "bg-green-500" :
                              phase.status === "in-progress" ? "bg-blue-500" : "bg-gray-300"
                            }`} />
                            <div className="flex-1">
                              <div className="font-medium">{phase.phase}</div>
                              <div className="text-sm text-muted-foreground">{phase.duration}</div>
                            </div>
                            <Badge className={getStatusColor(phase.status)}>
                              {phase.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Modernization Tab */}
          <TabsContent value="modernization" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Modernization</span>
                </CardTitle>
                <CardDescription>
                  Automated code transformation and architectural modernization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Generated Code</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">UserService.cs</span>
                            <Badge>Generated</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Modernized user service with dependency injection and async patterns
                          </p>
                        </div>
                        <div className="bg-muted p-4 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">docker-compose.yml</span>
                            <Badge>Generated</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Container orchestration for microservices architecture
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Modernization Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { task: "Framework Upgrade", status: "completed", progress: 100 },
                          { task: "Containerization", status: "in-progress", progress: 75 },
                          { task: "Microservices Split", status: "in-progress", progress: 40 },
                          { task: "API Gateway Setup", status: "pending", progress: 0 }
                        ].map((item, index) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{item.task}</span>
                              <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                            </div>
                            <Progress value={item.progress} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Execution Tab */}
          <TabsContent value="execution" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Cpu className="h-5 w-5" />
                  <span>Execution Monitor</span>
                </CardTitle>
                <CardDescription>
                  Real-time migration tracking with live metrics and automated rollback
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Deployment Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">Success</div>
                      <p className="text-xs text-muted-foreground">Last deployment</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Health Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">98%</div>
                      <p className="text-xs text-muted-foreground">System health</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Rollback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Quick Rollback
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Live Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <Activity className="h-4 w-4" />
                        <AlertTitle>Migration in Progress</AlertTitle>
                        <AlertDescription>
                          Currently migrating user data. ETA: 2 hours remaining.
                        </AlertDescription>
                      </Alert>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium mb-2">CPU Usage</div>
                          <Progress value={65} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">65%</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium mb-2">Memory Usage</div>
                          <Progress value={42} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">42%</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lightbulb className="h-5 w-5" />
                  <span>AI Recommendations</span>
                </CardTitle>
                <CardDescription>
                  AI-powered optimization insights with one-click application
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recommendations.map((rec) => (
                    <div key={rec.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{rec.title}</div>
                        <div className="text-sm text-muted-foreground">{rec.description}</div>
                      </div>
                      <Button size="sm" onClick={() => applyRecommendation(rec)}>Apply Fix (PR)</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}