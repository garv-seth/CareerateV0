import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { 
  Calendar, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Target,
  Zap,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  TrendingUp,
  GitBranch,
  Database,
  Server,
  Cloud,
  Shield,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MigrationPlan {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  startDate: string;
  endDate: string;
  progress: number;
  phases: MigrationPhase[];
  risks: RiskItem[];
  resources: ResourceAllocation[];
  dependencies: string[];
  budget: {
    total: number;
    allocated: number;
    spent: number;
  };
  createdAt: string;
}

interface MigrationPhase {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  progress: number;
  tasks: MigrationTask[];
  dependencies: string[];
  resources: string[];
  deliverables: string[];
}

interface MigrationTask {
  id: string;
  name: string;
  description: string;
  assignedTo: string;
  status: 'pending' | 'active' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedHours: number;
  actualHours?: number;
  dueDate: string;
  tags: string[];
}

interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  probability: 'low' | 'medium' | 'high';
  impact: string;
  mitigation: string;
  owner: string;
  status: 'open' | 'monitoring' | 'closed';
}

interface ResourceAllocation {
  id: string;
  name: string;
  role: string;
  allocation: number; // percentage
  startDate: string;
  endDate: string;
  skills: string[];
}

export default function MigrationPlanning() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Form state for creating new migration plan
  const [newPlanData, setNewPlanData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    startDate: '',
    endDate: '',
    budget: 0
  });

  // Mock migration plans data
  const mockMigrationPlans: MigrationPlan[] = [
    {
      id: "plan-1",
      name: "Legacy ERP Cloud Migration",
      description: "Migrate legacy ERP system to cloud-native architecture",
      status: "active",
      priority: "critical",
      startDate: "2025-10-01",
      endDate: "2026-03-15",
      progress: 35,
      phases: [
        {
          id: "phase-1",
          name: "Assessment & Planning",
          description: "Complete system analysis and migration strategy",
          startDate: "2025-10-01",
          endDate: "2025-10-31",
          status: "completed",
          progress: 100,
          tasks: [
            {
              id: "task-1",
              name: "Legacy system assessment",
              description: "Analyze current ERP architecture",
              assignedTo: "Architecture Team",
              status: "completed",
              priority: "high",
              estimatedHours: 80,
              actualHours: 75,
              dueDate: "2025-10-15",
              tags: ["assessment", "architecture"]
            }
          ],
          dependencies: [],
          resources: ["Solution Architect", "Migration Specialist"],
          deliverables: ["Assessment Report", "Migration Strategy Document"]
        },
        {
          id: "phase-2", 
          name: "Infrastructure Setup",
          description: "Provision cloud infrastructure and development environment",
          startDate: "2025-11-01",
          endDate: "2025-11-30",
          status: "active",
          progress: 60,
          tasks: [
            {
              id: "task-2",
              name: "Cloud infrastructure provisioning",
              description: "Set up AWS/Azure cloud infrastructure",
              assignedTo: "DevOps Team",
              status: "active",
              priority: "high",
              estimatedHours: 120,
              dueDate: "2025-11-15",
              tags: ["infrastructure", "cloud"]
            }
          ],
          dependencies: ["phase-1"],
          resources: ["DevOps Engineer", "Cloud Architect"],
          deliverables: ["Cloud Infrastructure", "CI/CD Pipeline"]
        }
      ],
      risks: [
        {
          id: "risk-1",
          title: "Data migration complexity",
          description: "Complex data transformation requirements may cause delays",
          severity: "high",
          probability: "medium", 
          impact: "Could delay project by 2-4 weeks",
          mitigation: "Implement phased data migration with validation checkpoints",
          owner: "Data Migration Team",
          status: "monitoring"
        }
      ],
      resources: [
        {
          id: "resource-1",
          name: "John Smith",
          role: "Solution Architect",
          allocation: 80,
          startDate: "2025-10-01",
          endDate: "2026-03-15",
          skills: ["Enterprise Architecture", "Cloud Migration", "ERP Systems"]
        }
      ],
      dependencies: ["Legacy System Assessment", "Stakeholder Approval"],
      budget: {
        total: 500000,
        allocated: 200000,
        spent: 75000
      },
      createdAt: "2025-09-15"
    }
  ];

  const activePlan = selectedPlan 
    ? mockMigrationPlans.find(p => p.id === selectedPlan)
    : mockMigrationPlans[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
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

  const getRiskColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleCreatePlan = () => {
    if (!newPlanData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Plan name is required",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Plan Created",
      description: `Migration plan "${newPlanData.name}" has been created successfully.`
    });

    setIsCreateDialogOpen(false);
    setNewPlanData({
      name: '',
      description: '',
      priority: 'medium',
      startDate: '',
      endDate: '',
      budget: 0
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
              <h1 className="text-2xl font-bold">Migration Planning</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPlan || ''} onValueChange={setSelectedPlan}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select migration plan..." />
                </SelectTrigger>
                <SelectContent>
                  {mockMigrationPlans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-plan">
                    <Plus className="mr-2 h-4 w-4" />
                    New Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create Migration Plan</DialogTitle>
                    <DialogDescription>
                      Define a new migration plan with timeline and resource allocation
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan-name">Plan Name *</Label>
                      <Input
                        id="plan-name"
                        value={newPlanData.name}
                        onChange={(e) => setNewPlanData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Legacy ERP Migration"
                        data-testid="input-plan-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plan-description">Description</Label>
                      <Textarea
                        id="plan-description"
                        value={newPlanData.description}
                        onChange={(e) => setNewPlanData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the migration scope and objectives..."
                        data-testid="textarea-plan-description"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="priority">Priority</Label>
                        <Select 
                          value={newPlanData.priority} 
                          onValueChange={(value) => setNewPlanData(prev => ({ ...prev, priority: value }))}
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
                      <div className="space-y-2">
                        <Label htmlFor="budget">Budget ($)</Label>
                        <Input
                          id="budget"
                          type="number"
                          value={newPlanData.budget || ''}
                          onChange={(e) => setNewPlanData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
                          placeholder="500000"
                          data-testid="input-budget"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={newPlanData.startDate}
                          onChange={(e) => setNewPlanData(prev => ({ ...prev, startDate: e.target.value }))}
                          data-testid="input-start-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={newPlanData.endDate}
                          onChange={(e) => setNewPlanData(prev => ({ ...prev, endDate: e.target.value }))}
                          data-testid="input-end-date"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreatePlan} data-testid="button-create-plan-submit">
                      Create Plan
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      {activePlan ? (
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Plan Overview */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{activePlan.name}</CardTitle>
                  <CardDescription className="mt-2">
                    {activePlan.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(activePlan.status)}>
                    {activePlan.status}
                  </Badge>
                  <Badge className={getPriorityColor(activePlan.priority)}>
                    {activePlan.priority}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-1">
                    {activePlan.progress}%
                  </div>
                  <div className="text-sm text-muted-foreground">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${(activePlan.budget.total - activePlan.budget.spent).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Remaining Budget</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-1">
                    {activePlan.phases.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Phases</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-1">
                    {activePlan.risks.filter(r => r.status === 'open').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Open Risks</div>
                </div>
              </div>

              <Progress value={activePlan.progress} className="h-3" />
              
              <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                <span>
                  Started: {new Date(activePlan.startDate).toLocaleDateString()}
                </span>
                <span>
                  Due: {new Date(activePlan.endDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Planning Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Timeline</TabsTrigger>
              <TabsTrigger value="phases">Phases & Tasks</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="risks">Risk Management</TabsTrigger>
              <TabsTrigger value="budget">Budget & Cost</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Migration Timeline</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activePlan.phases.map((phase, index) => (
                      <div key={phase.id} className="relative">
                        {index !== activePlan.phases.length - 1 && (
                          <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border"></div>
                        )}
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                            phase.status === 'completed' ? 'bg-green-100' :
                            phase.status === 'active' ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {phase.status === 'completed' ? (
                              <CheckCircle className="h-6 w-6 text-green-600" />
                            ) : phase.status === 'active' ? (
                              <Play className="h-6 w-6 text-blue-600" />
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                              <div>
                                <div className="text-sm font-medium">Start Date</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(phase.startDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">End Date</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(phase.endDate).toLocaleDateString()}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm font-medium">Progress</div>
                                <div className="flex items-center space-x-2">
                                  <Progress value={phase.progress} className="h-2 flex-1" />
                                  <span className="text-sm font-medium">{phase.progress}%</span>
                                </div>
                              </div>
                            </div>
                            {phase.deliverables.length > 0 && (
                              <div>
                                <div className="text-sm font-medium mb-1">Key Deliverables</div>
                                <div className="flex flex-wrap gap-1">
                                  {phase.deliverables.map((deliverable, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {deliverable}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="phases" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <GitBranch className="h-5 w-5" />
                    <span>Phases & Tasks</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activePlan.phases.map((phase) => (
                      <div key={phase.id} className="border rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-semibold">{phase.name}</h3>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(phase.status)}>
                              {phase.status}
                            </Badge>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground mb-4">{phase.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <div className="text-sm font-medium">Duration</div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm font-medium">Assigned Resources</div>
                            <div className="text-sm text-muted-foreground">
                              {phase.resources.join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold">Tasks</h4>
                          {phase.tasks.map((task) => (
                            <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                              <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${
                                  task.status === 'completed' ? 'bg-green-500' :
                                  task.status === 'active' ? 'bg-blue-500' :
                                  task.status === 'blocked' ? 'bg-red-500' : 'bg-gray-400'
                                }`} />
                                <div>
                                  <div className="font-medium">{task.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Assigned to: {task.assignedTo} | Due: {new Date(task.dueDate).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge className={getPriorityColor(task.priority)}>
                                  {task.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {task.estimatedHours}h
                                </Badge>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full" data-testid={`button-add-task-${phase.id}`}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Task
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Resource Allocation</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activePlan.resources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{resource.name}</div>
                            <div className="text-sm text-muted-foreground">{resource.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{resource.allocation}% Allocated</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(resource.startDate).toLocaleDateString()} - {new Date(resource.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" data-testid="button-add-resource">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Resource
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="risks" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Risk Management</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {activePlan.risks.map((risk) => (
                      <div key={risk.id} className={`p-4 rounded-lg border ${getRiskColor(risk.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold">{risk.title}</h4>
                          <div className="flex items-center space-x-2">
                            <Badge className={getStatusColor(risk.status)}>
                              {risk.status}
                            </Badge>
                            <Badge variant="outline">
                              {risk.severity}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{risk.description}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium">Impact</div>
                            <div className="text-muted-foreground">{risk.impact}</div>
                          </div>
                          <div>
                            <div className="font-medium">Mitigation</div>
                            <div className="text-muted-foreground">{risk.mitigation}</div>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-current/20">
                          <div className="text-sm">
                            <span className="font-medium">Owner:</span> {risk.owner} | 
                            <span className="font-medium"> Probability:</span> {risk.probability}
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" className="w-full" data-testid="button-add-risk">
                      <Plus className="mr-2 h-4 w-4" />
                      Add Risk
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="budget" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Budget & Cost Tracking</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-6 border rounded-lg bg-blue-50">
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        ${activePlan.budget.total.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Budget</div>
                    </div>
                    
                    <div className="text-center p-6 border rounded-lg bg-green-50">
                      <div className="text-3xl font-bold text-green-600 mb-2">
                        ${activePlan.budget.allocated.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Allocated</div>
                    </div>
                    
                    <div className="text-center p-6 border rounded-lg bg-orange-50">
                      <div className="text-3xl font-bold text-orange-600 mb-2">
                        ${activePlan.budget.spent.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Spent</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Budget Utilization</span>
                        <span>{Math.round((activePlan.budget.spent / activePlan.budget.total) * 100)}%</span>
                      </div>
                      <Progress value={(activePlan.budget.spent / activePlan.budget.total) * 100} className="h-3" />
                    </div>

                    <Alert>
                      <TrendingUp className="h-4 w-4" />
                      <AlertTitle>Budget Status</AlertTitle>
                      <AlertDescription>
                        Project is {((activePlan.budget.spent / activePlan.budget.total) * 100).toFixed(1)}% through budget 
                        with {activePlan.progress}% completion. 
                        {activePlan.budget.spent / activePlan.budget.total > activePlan.progress / 100 ? 
                          " Budget is being consumed faster than progress." :
                          " Budget consumption is on track with progress."
                        }
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">No Migration Plans</h2>
            <p className="text-muted-foreground mb-6">
              Create your first migration plan to start organizing your cloud migration project.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Create Migration Plan
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}