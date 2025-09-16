import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useParams } from "wouter";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Play,
  Pause,
  Square,
  RotateCcw,
  Shield,
  Database,
  Server,
  Cloud,
  Cpu,
  MemoryStick,
  HardDrive,
  Network,
  Eye,
  Download,
  RefreshCw,
  Zap,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MigrationExecution {
  id: string;
  name: string;
  status: 'preparing' | 'running' | 'paused' | 'completed' | 'failed' | 'rolling_back';
  progress: number;
  startedAt: string;
  estimatedCompletion?: string;
  actualCompletion?: string;
  phases: ExecutionPhase[];
  metrics: ExecutionMetrics;
  logs: ExecutionLog[];
  issues: ExecutionIssue[];
  rollbackPlan?: RollbackPlan;
}

interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  steps: ExecutionStep[];
  dependencies: string[];
  rollbackSteps?: string[];
}

interface ExecutionStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'warning';
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  output?: string;
  error?: string;
  metadata?: any;
}

interface ExecutionMetrics {
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkThroughput: number;
    responseTime: number;
    throughput: number;
  };
  availability: {
    uptime: number;
    errorRate: number;
    successRate: number;
  };
  migration: {
    dataTransferred: number;
    recordsMigrated: number;
    totalRecords: number;
    migrationSpeed: number;
  };
}

interface ExecutionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  component: string;
  message: string;
  metadata?: any;
}

interface ExecutionIssue {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'performance' | 'security' | 'data' | 'connectivity' | 'configuration';
  title: string;
  description: string;
  component: string;
  impact: string;
  resolution?: string;
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  createdAt: string;
  resolvedAt?: string;
}

interface RollbackPlan {
  id: string;
  name: string;
  description: string;
  estimatedTime: number; // minutes
  steps: RollbackStep[];
  risks: string[];
  dataBackups: string[];
  verificationSteps: string[];
}

interface RollbackStep {
  id: string;
  name: string;
  description: string;
  order: number;
  estimatedTime: number; // minutes
  command?: string;
  verificationCommand?: string;
}

export default function MigrationExecution() {
  const [location, setLocation] = useLocation();
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [rollbackDialogOpen, setRollbackDialogOpen] = useState(false);

  // Mock execution data
  const mockExecution: MigrationExecution = {
    id: "execution-1",
    name: "Legacy ERP Cloud Migration - Production Deployment",
    status: "running",
    progress: 45,
    startedAt: "2025-09-16T09:00:00Z",
    estimatedCompletion: "2025-09-16T15:00:00Z",
    phases: [
      {
        id: "phase-1",
        name: "Pre-Migration Validation",
        description: "Validate system readiness and backup data",
        status: "completed",
        progress: 100,
        startedAt: "2025-09-16T09:00:00Z",
        completedAt: "2025-09-16T09:30:00Z",
        steps: [
          {
            id: "step-1",
            name: "Database Backup",
            description: "Create complete database backup",
            status: "completed",
            startedAt: "2025-09-16T09:00:00Z",
            completedAt: "2025-09-16T09:15:00Z",
            duration: 15,
            output: "Backup completed: 100GB database backed up to S3"
          },
          {
            id: "step-2",
            name: "Health Check",
            description: "Verify all systems are healthy before migration",
            status: "completed",
            startedAt: "2025-09-16T09:15:00Z",
            completedAt: "2025-09-16T09:30:00Z",
            duration: 15,
            output: "All systems healthy. Ready for migration."
          }
        ],
        dependencies: [],
        rollbackSteps: ["Restore from backup", "Verify data integrity"]
      },
      {
        id: "phase-2",
        name: "Infrastructure Migration",
        description: "Migrate infrastructure components to cloud",
        status: "running",
        progress: 60,
        startedAt: "2025-09-16T09:30:00Z",
        steps: [
          {
            id: "step-3",
            name: "Application Server Migration",
            description: "Migrate application servers to Kubernetes",
            status: "running",
            startedAt: "2025-09-16T09:30:00Z",
            output: "Migrating 5 application servers... 3/5 completed"
          },
          {
            id: "step-4",
            name: "Database Migration",
            description: "Migrate database to managed cloud service",
            status: "pending",
            output: "Waiting for application servers to complete"
          }
        ],
        dependencies: ["phase-1"]
      },
      {
        id: "phase-3",
        name: "Data Migration",
        description: "Migrate application data with validation",
        status: "pending",
        progress: 0,
        steps: [
          {
            id: "step-5",
            name: "Data Transfer",
            description: "Transfer application data to new system",
            status: "pending"
          }
        ],
        dependencies: ["phase-2"]
      }
    ],
    metrics: {
      performance: {
        cpuUsage: 65,
        memoryUsage: 78,
        diskUsage: 45,
        networkThroughput: 125, // MB/s
        responseTime: 150, // ms
        throughput: 1200 // requests/min
      },
      availability: {
        uptime: 99.5,
        errorRate: 0.2,
        successRate: 99.8
      },
      migration: {
        dataTransferred: 45, // GB
        recordsMigrated: 2500000,
        totalRecords: 5000000,
        migrationSpeed: 15000 // records/second
      }
    },
    logs: [
      {
        id: "log-1",
        timestamp: "2025-09-16T10:45:00Z",
        level: "info",
        component: "Migration Controller",
        message: "Application server migration 60% complete"
      },
      {
        id: "log-2",
        timestamp: "2025-09-16T10:44:30Z",
        level: "warning",
        component: "Network Monitor",
        message: "Elevated network latency detected: 200ms avg"
      },
      {
        id: "log-3",
        timestamp: "2025-09-16T10:44:00Z",
        level: "info",
        component: "Data Validator",
        message: "Data integrity checks completed: 2.5M records validated"
      }
    ],
    issues: [
      {
        id: "issue-1",
        severity: "medium",
        type: "performance",
        title: "Elevated Network Latency",
        description: "Network latency between regions is higher than expected",
        component: "Network Layer",
        impact: "Migration speed reduced by ~15%",
        resolution: "Investigating network path optimization",
        status: "investigating",
        createdAt: "2025-09-16T10:30:00Z"
      },
      {
        id: "issue-2",
        severity: "low",
        type: "configuration",
        title: "Memory Usage Warning",
        description: "Memory usage approaching 80% on migration worker nodes",
        component: "Kubernetes Cluster",
        impact: "Potential slowdown in migration tasks",
        status: "open",
        createdAt: "2025-09-16T10:20:00Z"
      }
    ],
    rollbackPlan: {
      id: "rollback-1",
      name: "Emergency Rollback Plan",
      description: "Rollback migration and restore original system state",
      estimatedTime: 45,
      steps: [
        {
          id: "rb-1",
          name: "Stop Migration",
          description: "Halt all migration processes immediately",
          order: 1,
          estimatedTime: 2
        },
        {
          id: "rb-2",
          name: "Restore Database",
          description: "Restore database from backup created at start",
          order: 2,
          estimatedTime: 20
        },
        {
          id: "rb-3",
          name: "Restart Original Services",
          description: "Bring original services back online",
          order: 3,
          estimatedTime: 15
        },
        {
          id: "rb-4",
          name: "Verify System Health",
          description: "Comprehensive health check of restored system",
          order: 4,
          estimatedTime: 8
        }
      ],
      risks: [
        "Potential data loss for changes made during migration",
        "Service downtime during rollback process",
        "Need to re-run full migration process later"
      ],
      dataBackups: [
        "Complete database backup (100GB) - 09:00 UTC",
        "Configuration files backup - 09:00 UTC", 
        "Application state snapshot - 09:00 UTC"
      ],
      verificationSteps: [
        "Verify all critical services are responding",
        "Run data integrity checks",
        "Confirm all user accounts accessible",
        "Validate business-critical workflows"
      ]
    }
  };

  // Auto-refresh simulation
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // Simulate progress updates
      queryClient.invalidateQueries({ queryKey: ["/api/migration-execution", projectId] });
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, projectId, queryClient]);

  const pauseMigration = () => {
    toast({
      title: "Migration Paused",
      description: "Migration has been paused. You can resume it anytime."
    });
  };

  const resumeMigration = () => {
    toast({
      title: "Migration Resumed",
      description: "Migration has been resumed and is now running."
    });
  };

  const executeRollback = () => {
    toast({
      title: "Rollback Initiated",
      description: "Emergency rollback procedure has been started.",
      variant: "destructive"
    });
    setRollbackDialogOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'rolling_back': return 'bg-orange-100 text-orange-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-gray-600';
      default: return 'text-gray-600';
    }
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
              <div>
                <h1 className="text-2xl font-bold">Migration Execution</h1>
                <p className="text-sm text-muted-foreground">{mockExecution.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={autoRefresh ? "text-green-600" : ""}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                  Auto Refresh
                </Button>
                <Separator orientation="vertical" className="h-6" />
              </div>
              
              <Badge className={getStatusColor(mockExecution.status)} data-testid="text-execution-status">
                {mockExecution.status}
              </Badge>
              
              {mockExecution.status === 'running' ? (
                <Button 
                  variant="outline" 
                  onClick={pauseMigration}
                  data-testid="button-pause-migration"
                >
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </Button>
              ) : mockExecution.status === 'paused' ? (
                <Button onClick={resumeMigration} data-testid="button-resume-migration">
                  <Play className="mr-2 h-4 w-4" />
                  Resume
                </Button>
              ) : null}
              
              <Dialog open={rollbackDialogOpen} onOpenChange={setRollbackDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="destructive" 
                    disabled={mockExecution.status === 'completed'}
                    data-testid="button-emergency-rollback"
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Emergency Rollback
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <span>Confirm Emergency Rollback</span>
                    </DialogTitle>
                    <DialogDescription>
                      This will immediately stop the migration and restore the system to its previous state.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert className="border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-red-800">Warning: This action cannot be undone</AlertTitle>
                      <AlertDescription className="text-red-700">
                        Rolling back will restore the system to its state at migration start. 
                        Any progress made during this migration will be lost.
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Rollback Plan:</h4>
                      <div className="space-y-2">
                        {mockExecution.rollbackPlan?.steps.map((step) => (
                          <div key={step.id} className="flex items-start space-x-3 text-sm">
                            <div className="w-5 h-5 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs text-orange-600 font-medium">{step.order}</span>
                            </div>
                            <div>
                              <span className="font-medium">{step.name}</span>
                              <span className="text-muted-foreground"> (~{step.estimatedTime} min)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2">
                        Total estimated time: ~{mockExecution.rollbackPlan?.estimatedTime} minutes
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRollbackDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={executeRollback}>
                      Execute Rollback
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Execution Overview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Migration Progress</span>
                </CardTitle>
              </div>
              <div className="text-sm text-muted-foreground">
                Started: {new Date(mockExecution.startedAt).toLocaleString()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {mockExecution.progress}%
                </div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {mockExecution.phases.filter(p => p.status === 'completed').length}/{mockExecution.phases.length}
                </div>
                <div className="text-sm text-muted-foreground">Phases</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {mockExecution.issues.filter(i => i.status === 'open').length}
                </div>
                <div className="text-sm text-muted-foreground">Active Issues</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  3h 15m
                </div>
                <div className="text-sm text-muted-foreground">Running Time</div>
              </div>
            </div>

            <Progress value={mockExecution.progress} className="h-4 mb-4" />
            
            {mockExecution.estimatedCompletion && (
              <div className="text-center text-sm text-muted-foreground">
                Estimated completion: {new Date(mockExecution.estimatedCompletion).toLocaleString()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Execution Details Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Live Progress</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="logs">Live Logs</TabsTrigger>
            <TabsTrigger value="issues">Issues</TabsTrigger>
            <TabsTrigger value="rollback">Rollback Plan</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Phase Execution Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {mockExecution.phases.map((phase, index) => (
                    <div key={phase.id} className="relative">
                      {index !== mockExecution.phases.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border"></div>
                      )}
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                          phase.status === 'completed' ? 'bg-green-100' :
                          phase.status === 'running' ? 'bg-blue-100' :
                          phase.status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {phase.status === 'completed' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : phase.status === 'running' ? (
                            <Activity className="h-6 w-6 text-blue-600 animate-pulse" />
                          ) : phase.status === 'failed' ? (
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-gray-600" />
                          )}
                        </div>
                        
                        <div className="flex-1 pb-8">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-lg font-semibold">{phase.name}</h4>
                            <Badge className={getStatusColor(phase.status)}>
                              {phase.status}
                            </Badge>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{phase.description}</p>
                          
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span className="font-medium">{phase.progress}%</span>
                            </div>
                            <Progress value={phase.progress} className="h-2" />
                          </div>

                          <div className="space-y-3">
                            {phase.steps.map((step) => (
                              <div key={step.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    step.status === 'completed' ? 'bg-green-500' :
                                    step.status === 'running' ? 'bg-blue-500 animate-pulse' :
                                    step.status === 'failed' ? 'bg-red-500' :
                                    step.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-400'
                                  }`} />
                                  <div>
                                    <div className="font-medium">{step.name}</div>
                                    <div className="text-sm text-muted-foreground">{step.description}</div>
                                    {step.output && (
                                      <div className="text-xs text-blue-600 mt-1">{step.output}</div>
                                    )}
                                    {step.error && (
                                      <div className="text-xs text-red-600 mt-1">Error: {step.error}</div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Badge className={getStatusColor(step.status)}>
                                    {step.status}
                                  </Badge>
                                  {step.duration && (
                                    <Badge variant="outline">
                                      {step.duration}min
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Cpu className="h-5 w-5" />
                    <span>System Performance</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">CPU Usage</span>
                      <span className="font-medium">{mockExecution.metrics.performance.cpuUsage}%</span>
                    </div>
                    <Progress value={mockExecution.metrics.performance.cpuUsage} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Memory Usage</span>
                      <span className="font-medium">{mockExecution.metrics.performance.memoryUsage}%</span>
                    </div>
                    <Progress value={mockExecution.metrics.performance.memoryUsage} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Disk Usage</span>
                      <span className="font-medium">{mockExecution.metrics.performance.diskUsage}%</span>
                    </div>
                    <Progress value={mockExecution.metrics.performance.diskUsage} className="h-2" />
                  </div>

                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Network</div>
                      <div className="font-medium">{mockExecution.metrics.performance.networkThroughput} MB/s</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Response Time</div>
                      <div className="font-medium">{mockExecution.metrics.performance.responseTime}ms</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Database className="h-5 w-5" />
                    <span>Migration Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data Transferred</span>
                      <span className="font-medium">{mockExecution.metrics.migration.dataTransferred} GB</span>
                    </div>
                    <Progress value={(mockExecution.metrics.migration.dataTransferred / 100) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Records Migrated</span>
                      <span className="font-medium">
                        {mockExecution.metrics.migration.recordsMigrated.toLocaleString()} / {mockExecution.metrics.migration.totalRecords.toLocaleString()}
                      </span>
                    </div>
                    <Progress value={(mockExecution.metrics.migration.recordsMigrated / mockExecution.metrics.migration.totalRecords) * 100} className="h-2" />
                  </div>

                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Migration Speed</div>
                      <div className="font-medium">{mockExecution.metrics.migration.migrationSpeed.toLocaleString()} rec/sec</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Success Rate</div>
                      <div className="font-medium">{mockExecution.metrics.availability.successRate}%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>System Availability</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 border rounded-lg bg-green-50">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {mockExecution.metrics.availability.uptime}%
                    </div>
                    <div className="text-sm text-muted-foreground">Uptime</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-blue-50">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {mockExecution.metrics.availability.successRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                  
                  <div className="text-center p-4 border rounded-lg bg-orange-50">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {mockExecution.metrics.availability.errorRate}%
                    </div>
                    <div className="text-sm text-muted-foreground">Error Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Real-time Execution Logs</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-download-logs">
                      <Download className="mr-2 h-4 w-4" />
                      Download Logs
                    </Button>
                    <Button variant="outline" size="sm">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-sm">
                  {mockExecution.logs.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-2 rounded border">
                      <div className="text-xs text-muted-foreground flex-shrink-0 w-16">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                      <div className={`text-xs font-medium flex-shrink-0 w-16 ${getLogLevelColor(log.level)}`}>
                        {log.level.toUpperCase()}
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0 w-32">
                        {log.component}
                      </div>
                      <div className="text-xs flex-1">
                        {log.message}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="issues" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Active Issues & Alerts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockExecution.issues.map((issue) => (
                    <div key={issue.id} className={`p-4 rounded-lg border ${getSeverityColor(issue.severity)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start space-x-3">
                          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold">{issue.title}</h4>
                            <p className="text-sm mt-1">{issue.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(issue.status)}>
                            {issue.status}
                          </Badge>
                          <Badge variant="outline">
                            {issue.severity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                        <div>
                          <div className="font-medium">Component</div>
                          <div className="text-muted-foreground">{issue.component}</div>
                        </div>
                        <div>
                          <div className="font-medium">Impact</div>
                          <div className="text-muted-foreground">{issue.impact}</div>
                        </div>
                      </div>
                      
                      {issue.resolution && (
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <div className="text-sm">
                            <span className="font-medium">Resolution:</span> {issue.resolution}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground mt-2">
                        Created: {new Date(issue.createdAt).toLocaleString()}
                        {issue.resolvedAt && ` | Resolved: ${new Date(issue.resolvedAt).toLocaleString()}`}
                      </div>
                    </div>
                  ))}

                  {mockExecution.issues.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No Active Issues</h3>
                      <p className="text-muted-foreground">
                        Migration is running smoothly with no reported issues.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rollback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RotateCcw className="h-5 w-5" />
                  <span>Rollback Plan</span>
                </CardTitle>
                <CardDescription>
                  Emergency recovery plan to restore system to previous state
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mockExecution.rollbackPlan && (
                  <div className="space-y-6">
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Emergency Rollback Available</AlertTitle>
                      <AlertDescription>
                        Estimated rollback time: ~{mockExecution.rollbackPlan.estimatedTime} minutes
                      </AlertDescription>
                    </Alert>

                    <div>
                      <h4 className="text-lg font-semibold mb-3">Rollback Steps</h4>
                      <div className="space-y-3">
                        {mockExecution.rollbackPlan.steps.map((step) => (
                          <div key={step.id} className="flex items-start space-x-4 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-sm text-orange-600 font-medium">{step.order}</span>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium">{step.name}</h5>
                              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                              <div className="text-xs text-muted-foreground mt-2">
                                Estimated time: {step.estimatedTime} minutes
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Available Backups</h4>
                        <div className="space-y-2">
                          {mockExecution.rollbackPlan.dataBackups.map((backup, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span>{backup}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Rollback Risks</h4>
                        <div className="space-y-2">
                          {mockExecution.rollbackPlan.risks.map((risk, idx) => (
                            <div key={idx} className="flex items-start space-x-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                              <span>{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Post-Rollback Verification</h4>
                      <div className="space-y-2">
                        {mockExecution.rollbackPlan.verificationSteps.map((step, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}