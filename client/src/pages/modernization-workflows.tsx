import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Zap, 
  Code, 
  Database, 
  Container, 
  Cloud,
  GitBranch,
  Cpu,
  Shield,
  TrendingUp,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  Settings,
  Plus,
  FileText,
  Server
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ModernizationWorkflow {
  id: string;
  name: string;
  type: 'framework' | 'architecture' | 'database' | 'security' | 'performance' | 'containerization';
  status: 'draft' | 'running' | 'completed' | 'failed' | 'paused';
  progress: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedEffort: number; // hours
  actualEffort?: number;
  sourceSystem: string;
  targetSystem: string;
  recommendations: ModernizationRecommendation[];
  tasks: ModernizationTask[];
  generatedCode?: string;
  deploymentConfig?: any;
  createdAt: string;
  completedAt?: string;
}

interface ModernizationRecommendation {
  id: string;
  category: 'framework' | 'language' | 'architecture' | 'security' | 'performance' | 'testing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  title: string;
  description: string;
  currentState: string;
  targetState: string;
  benefits: string[];
  risks: string[];
  migrationSteps: string[];
  codeExample?: {
    before: string;
    after: string;
    explanation: string;
  };
}

interface ModernizationTask {
  id: string;
  name: string;
  description: string;
  type: 'analysis' | 'code_generation' | 'testing' | 'deployment' | 'validation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: string;
  errors?: string[];
  startedAt?: string;
  completedAt?: string;
}

export default function ModernizationWorkflows() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form state for creating new workflow
  const [newWorkflowData, setNewWorkflowData] = useState({
    name: '',
    type: 'framework',
    sourceSystem: '',
    targetSystem: '',
    priority: 'medium'
  });

  // Mock modernization workflows data
  const mockWorkflows: ModernizationWorkflow[] = [
    {
      id: "workflow-1",
      name: "Spring Boot 1.x to 3.x Migration",
      type: "framework",
      status: "running",
      progress: 75,
      priority: "high",
      estimatedEffort: 80,
      actualEffort: 60,
      sourceSystem: "Spring Boot 1.5.22",
      targetSystem: "Spring Boot 3.2",
      recommendations: [
        {
          id: "rec-1",
          category: "framework",
          priority: "high",
          complexity: "moderate",
          title: "Upgrade Spring Boot to 3.x",
          description: "Migrate from Spring Boot 1.x to 3.x for improved performance and security",
          currentState: "Spring Boot 1.5.22 with deprecated dependencies",
          targetState: "Spring Boot 3.2 with modern Java features",
          benefits: [
            "Better performance and memory usage",
            "Enhanced security features", 
            "Modern Java support (17+)",
            "Native compilation support"
          ],
          risks: [
            "Breaking API changes",
            "Configuration updates required",
            "Dependency compatibility issues"
          ],
          migrationSteps: [
            "Update Java version to 17 or later",
            "Update Spring Boot version in build file",
            "Migrate configuration properties",
            "Update deprecated API usage",
            "Update security configuration",
            "Run comprehensive tests"
          ],
          codeExample: {
            before: `@SpringBootApplication
@EnableWebSecurity
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`,
            after: `@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}`,
            explanation: "Modern Spring Boot 3.x uses simplified configuration and auto-configuration"
          }
        }
      ],
      tasks: [
        {
          id: "task-1",
          name: "Dependency Analysis",
          description: "Analyze current dependencies and identify compatibility issues",
          type: "analysis",
          status: "completed",
          output: "Found 12 dependencies requiring updates. 3 have breaking changes.",
          startedAt: "2025-09-15T10:00:00Z",
          completedAt: "2025-09-15T10:30:00Z"
        },
        {
          id: "task-2", 
          name: "Generate Migration Code",
          description: "Generate updated configuration and code for Spring Boot 3.x",
          type: "code_generation",
          status: "running",
          startedAt: "2025-09-15T10:30:00Z"
        },
        {
          id: "task-3",
          name: "Run Tests",
          description: "Execute comprehensive test suite with updated framework",
          type: "testing",
          status: "pending"
        }
      ],
      generatedCode: `// Generated Spring Boot 3.x Configuration
@Configuration
@EnableAutoConfiguration
public class ModernizedConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authz -> authz
                .requestMatchers("/public/**").permitAll()
                .anyRequest().authenticated()
            )
            .oauth2Login(withDefaults());
        return http.build();
    }
}`,
      createdAt: "2025-09-15"
    },
    {
      id: "workflow-2",
      name: "Monolith to Microservices",
      type: "architecture",
      status: "completed",
      progress: 100,
      priority: "critical",
      estimatedEffort: 160,
      actualEffort: 180,
      sourceSystem: "Monolithic Java Application",
      targetSystem: "Microservices with Spring Cloud",
      recommendations: [
        {
          id: "rec-2",
          category: "architecture",
          priority: "critical",
          complexity: "complex",
          title: "Decompose to Microservices",
          description: "Break monolithic application into microservices for better scalability",
          currentState: "Single deployable unit with all business logic",
          targetState: "Multiple independent services with clear boundaries",
          benefits: [
            "Independent scaling and deployment",
            "Technology diversity",
            "Fault isolation",
            "Team autonomy"
          ],
          risks: [
            "Increased complexity",
            "Network latency",
            "Data consistency challenges"
          ],
          migrationSteps: [
            "Identify service boundaries",
            "Extract shared libraries",
            "Implement API contracts",
            "Set up service discovery",
            "Implement distributed tracing"
          ]
        }
      ],
      tasks: [
        {
          id: "task-4",
          name: "Service Boundary Analysis",
          description: "Identify optimal microservice boundaries",
          type: "analysis",
          status: "completed",
          output: "Identified 5 core services: User, Order, Payment, Inventory, Notification",
          startedAt: "2025-09-01T09:00:00Z",
          completedAt: "2025-09-01T17:00:00Z"
        },
        {
          id: "task-5",
          name: "Generate Service Templates",
          description: "Create microservice templates with best practices",
          type: "code_generation",
          status: "completed",
          output: "Generated 5 service templates with Spring Cloud Gateway configuration",
          startedAt: "2025-09-02T09:00:00Z",
          completedAt: "2025-09-03T17:00:00Z"
        }
      ],
      createdAt: "2025-09-01",
      completedAt: "2025-09-14"
    }
  ];

  const activeWorkflow = selectedWorkflow 
    ? mockWorkflows.find(w => w.id === selectedWorkflow)
    : mockWorkflows[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'framework': return <Code className="h-5 w-5" />;
      case 'architecture': return <GitBranch className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      case 'performance': return <TrendingUp className="h-5 w-5" />;
      case 'containerization': return <Container className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const handleCreateWorkflow = () => {
    if (!newWorkflowData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Workflow name is required",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Workflow Created",
      description: `Modernization workflow "${newWorkflowData.name}" has been created successfully.`
    });

    setIsCreateDialogOpen(false);
    setNewWorkflowData({
      name: '',
      type: 'framework',
      sourceSystem: '',
      targetSystem: '',
      priority: 'medium'
    });
  };

  const executeWorkflow = (workflowId: string) => {
    toast({
      title: "Workflow Started",
      description: "AI-powered modernization workflow has been started."
    });
  };

  const pauseWorkflow = (workflowId: string) => {
    toast({
      title: "Workflow Paused",
      description: "The modernization workflow has been paused."
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setLocation("/migration")}
                className="p-2"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Automated Modernization</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedWorkflow || ''} onValueChange={setSelectedWorkflow}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select workflow..." />
                </SelectTrigger>
                <SelectContent>
                  {mockWorkflows.map(workflow => (
                    <SelectItem key={workflow.id} value={workflow.id}>
                      {workflow.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-workflow">
                    <Plus className="mr-2 h-4 w-4" />
                    New Workflow
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create Modernization Workflow</DialogTitle>
                    <DialogDescription>
                      Define an AI-powered workflow to modernize your system architecture
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="workflow-name">Workflow Name *</Label>
                      <Input
                        id="workflow-name"
                        value={newWorkflowData.name}
                        onChange={(e) => setNewWorkflowData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Spring Boot Migration"
                        data-testid="input-workflow-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="workflow-type">Modernization Type</Label>
                      <Select 
                        value={newWorkflowData.type} 
                        onValueChange={(value) => setNewWorkflowData(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="framework">Framework Upgrade</SelectItem>
                          <SelectItem value="architecture">Architecture Modernization</SelectItem>
                          <SelectItem value="database">Database Migration</SelectItem>
                          <SelectItem value="security">Security Enhancement</SelectItem>
                          <SelectItem value="performance">Performance Optimization</SelectItem>
                          <SelectItem value="containerization">Containerization</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="source-system">Source System</Label>
                        <Input
                          id="source-system"
                          value={newWorkflowData.sourceSystem}
                          onChange={(e) => setNewWorkflowData(prev => ({ ...prev, sourceSystem: e.target.value }))}
                          placeholder="e.g., Spring Boot 1.5"
                          data-testid="input-source-system"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-system">Target System</Label>
                        <Input
                          id="target-system"
                          value={newWorkflowData.targetSystem}
                          onChange={(e) => setNewWorkflowData(prev => ({ ...prev, targetSystem: e.target.value }))}
                          placeholder="e.g., Spring Boot 3.2"
                          data-testid="input-target-system"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={newWorkflowData.priority} 
                        onValueChange={(value) => setNewWorkflowData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateWorkflow} data-testid="button-create-workflow-submit">
                      Create Workflow
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {activeWorkflow ? (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Workflow Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    {getTypeIcon(activeWorkflow.type)}
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{activeWorkflow.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {activeWorkflow.sourceSystem} → {activeWorkflow.targetSystem}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Badge className={getStatusColor(activeWorkflow.status)}>
                    {activeWorkflow.status}
                  </Badge>
                  <Badge className={getPriorityColor(activeWorkflow.priority)}>
                    {activeWorkflow.priority}
                  </Badge>
                  {activeWorkflow.status === 'running' ? (
                    <Button 
                      variant="outline" 
                      onClick={() => pauseWorkflow(activeWorkflow.id)}
                      data-testid="button-pause-workflow"
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pause
                    </Button>
                  ) : activeWorkflow.status === 'draft' || activeWorkflow.status === 'paused' ? (
                    <Button 
                      onClick={() => executeWorkflow(activeWorkflow.id)}
                      data-testid="button-execute-workflow"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Execute
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {activeWorkflow.progress}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {activeWorkflow.actualEffort || 0}h
                  </div>
                  <div className="text-sm text-muted-foreground">Effort Spent</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {activeWorkflow.tasks.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tasks</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {activeWorkflow.recommendations.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Recommendations</div>
                </div>
              </div>

              <Progress value={activeWorkflow.progress} className="h-3 mb-4" />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  Created: {new Date(activeWorkflow.createdAt).toLocaleDateString()}
                </span>
                {activeWorkflow.completedAt && (
                  <span>
                    Completed: {new Date(activeWorkflow.completedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Details Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Tasks & Progress</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              <TabsTrigger value="code">Generated Code</TabsTrigger>
              <TabsTrigger value="deployment">Deployment</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5" />
                    <span>Modernization Tasks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activeWorkflow.tasks.map((task, index) => (
                      <div key={task.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              task.status === 'completed' ? 'bg-green-100' :
                              task.status === 'running' ? 'bg-blue-100' :
                              task.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              {task.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : task.status === 'running' ? (
                                <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                              ) : task.status === 'failed' ? (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                              ) : (
                                <Clock className="h-4 w-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{task.name}</h4>
                              <p className="text-sm text-muted-foreground">{task.description}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                        </div>

                        {task.output && (
                          <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                            <div className="text-sm font-medium mb-1">Output:</div>
                            <div className="text-sm text-muted-foreground">{task.output}</div>
                          </div>
                        )}

                        {task.errors && task.errors.length > 0 && (
                          <div className="mt-3 p-3 bg-red-50 rounded-lg">
                            <div className="text-sm font-medium mb-1 text-red-800">Errors:</div>
                            <div className="space-y-1">
                              {task.errors.map((error, idx) => (
                                <div key={idx} className="text-sm text-red-600">{error}</div>
                              ))}
                            </div>
                          </div>
                        )}

                        {task.startedAt && (
                          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                            <span>Started: {new Date(task.startedAt).toLocaleString()}</span>
                            {task.completedAt && (
                              <span>Completed: {new Date(task.completedAt).toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="h-5 w-5" />
                    <span>AI-Powered Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activeWorkflow.recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              {getTypeIcon(rec.category)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{rec.title}</h3>
                              <p className="text-muted-foreground mt-1">{rec.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline">
                              {rec.complexity}
                            </Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                          <div>
                            <h4 className="font-medium mb-2">Current State</h4>
                            <p className="text-sm text-muted-foreground">{rec.currentState}</p>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Target State</h4>
                            <p className="text-sm text-muted-foreground">{rec.targetState}</p>
                          </div>
                        </div>

                        <Tabs defaultValue="benefits" className="space-y-4">
                          <TabsList>
                            <TabsTrigger value="benefits">Benefits</TabsTrigger>
                            <TabsTrigger value="risks">Risks</TabsTrigger>
                            <TabsTrigger value="steps">Migration Steps</TabsTrigger>
                            {rec.codeExample && <TabsTrigger value="code">Code Example</TabsTrigger>}
                          </TabsList>

                          <TabsContent value="benefits">
                            <div className="space-y-2">
                              {rec.benefits.map((benefit, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{benefit}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="risks">
                            <div className="space-y-2">
                              {rec.risks.map((risk, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm">{risk}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          <TabsContent value="steps">
                            <div className="space-y-2">
                              {rec.migrationSteps.map((step, idx) => (
                                <div key={idx} className="flex items-start space-x-2">
                                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-xs text-blue-600 font-medium">{idx + 1}</span>
                                  </div>
                                  <span className="text-sm">{step}</span>
                                </div>
                              ))}
                            </div>
                          </TabsContent>

                          {rec.codeExample && (
                            <TabsContent value="code">
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium mb-2">Before:</h5>
                                  <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                                    <code>{rec.codeExample.before}</code>
                                  </pre>
                                </div>
                                <div>
                                  <h5 className="font-medium mb-2">After:</h5>
                                  <pre className="text-sm bg-green-50 p-3 rounded-lg overflow-x-auto">
                                    <code>{rec.codeExample.after}</code>
                                  </pre>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <strong>Explanation:</strong> {rec.codeExample.explanation}
                                </div>
                              </div>
                            </TabsContent>
                          )}
                        </Tabs>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="code" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Code className="h-5 w-5" />
                      <span>Generated Code</span>
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" data-testid="button-download-code">
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" data-testid="button-preview-code">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {activeWorkflow.generatedCode ? (
                    <div className="space-y-4">
                      <Alert>
                        <Code className="h-4 w-4" />
                        <AlertTitle>AI-Generated Modernization Code</AlertTitle>
                        <AlertDescription>
                          This code has been automatically generated based on your modernization requirements. 
                          Review carefully before applying to your system.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="bg-muted/50 rounded-lg p-4">
                        <pre className="text-sm overflow-x-auto">
                          <code>{activeWorkflow.generatedCode}</code>
                        </pre>
                      </div>
                      
                      <div className="flex justify-center space-x-4">
                        <Button variant="outline">
                          Apply to Development
                        </Button>
                        <Button variant="outline">
                          Create Pull Request
                        </Button>
                        <Button>
                          Deploy to Staging
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Code Generated Yet</h3>
                      <p className="text-muted-foreground">
                        Code will be generated as the workflow progresses through its tasks.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="deployment" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cloud className="h-5 w-5" />
                    <span>Deployment Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <Alert>
                      <Server className="h-4 w-4" />
                      <AlertTitle>Infrastructure as Code</AlertTitle>
                      <AlertDescription>
                        Deployment configurations are automatically generated based on your modernization choices.
                      </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Container Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                            <code>{`FROM openjdk:17-jdk-slim
COPY target/app.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","/app.jar"]`}</code>
                          </pre>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Kubernetes Deployment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <pre className="text-sm bg-muted p-3 rounded-lg overflow-x-auto">
                            <code>{`apiVersion: apps/v1
kind: Deployment
metadata:
  name: modernized-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: modernized-app`}</code>
                          </pre>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="flex justify-center space-x-4">
                      <Button variant="outline">
                        Generate Full Config
                      </Button>
                      <Button variant="outline">
                        Validate Configuration
                      </Button>
                      <Button>
                        Deploy to Cluster
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Modernization Workflows</h2>
            <p className="text-muted-foreground mb-6">
              Create your first AI-powered modernization workflow to automate system upgrades.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Workflow
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}