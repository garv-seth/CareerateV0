import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "wouter";
import { 
  Activity, 
  Shield, 
  Zap, 
  Rocket, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Server,
  Eye,
  Play,
  Pause,
  RotateCcw
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

interface Agent {
  id: string;
  name: string;
  type: "sre" | "security" | "performance" | "deployment";
  status: "active" | "inactive" | "error";
  lastHeartbeat: string;
  health?: {
    status: string;
    lastSeen: Date | null;
  };
}

interface Deployment {
  id: string;
  version: string;
  strategy: string;
  status: "pending" | "deploying" | "deployed" | "failed" | "rolled-back";
  environment: string;
  createdAt: string;
  deployedAt?: string;
}

interface Incident {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "open" | "investigating" | "resolved" | "closed";
  category: string;
  createdAt: string;
}

interface Metric {
  id: string;
  metricType: string;
  value: string;
  unit: string;
  timestamp: string;
}

export default function DevOpsDashboard() {
  const { projectId } = useParams<{ projectId: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading: loadingAgents } = useQuery({
    queryKey: [`/api/projects/${projectId}/agents`],
    enabled: !!projectId,
  });

  const { data: deployments = [], isLoading: loadingDeployments } = useQuery({
    queryKey: [`/api/projects/${projectId}/deployments`],
    enabled: !!projectId,
  });

  const { data: incidents = [], isLoading: loadingIncidents } = useQuery({
    queryKey: [`/api/projects/${projectId}/incidents`],
    enabled: !!projectId,
  });

  const { data: metrics = [], isLoading: loadingMetrics } = useQuery({
    queryKey: [`/api/projects/${projectId}/metrics`],
    enabled: !!projectId,
  });

  const { data: systemHealth } = useQuery({
    queryKey: ["/api/system/health"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const initializeAgentsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/projects/${projectId}/initialize-agents`, { method: 'POST' });
      if (!response.ok) throw new Error('Failed to initialize agents');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/agents`] });
      toast({ title: "Success", description: "AI agents initialized successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to initialize agents", variant: "destructive" });
    },
  });

  const triggerDeploymentMutation = useMutation({
    mutationFn: async (deploymentData: any) => {
      const response = await fetch(`/api/projects/${projectId}/deployments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(deploymentData)
      });
      if (!response.ok) throw new Error('Failed to trigger deployment');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/deployments`] });
      toast({ title: "Success", description: "Deployment triggered successfully" });
    },
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (incidentData: any) => {
      const response = await fetch(`/api/projects/${projectId}/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      if (!response.ok) throw new Error('Failed to create incident');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/incidents`] });
      toast({ title: "Success", description: "Incident created and assigned to SRE agent" });
    },
  });

  const getAgentIcon = (type: string) => {
    switch (type) {
      case "sre": return <Activity className="h-5 w-5" />;
      case "security": return <Shield className="h-5 w-5" />;
      case "performance": return <Zap className="h-5 w-5" />;
      case "deployment": return <Rocket className="h-5 w-5" />;
      default: return <Server className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": case "deployed": case "resolved": return "bg-green-500";
      case "pending": case "investigating": return "bg-yellow-500";
      case "error": case "failed": case "critical": return "bg-red-500";
      case "inactive": case "rolled-back": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "destructive";
      case "high": return "destructive";
      case "medium": return "secondary";
      case "low": return "outline";
      default: return "secondary";
    }
  };

  const formatMetricValue = (value: string, unit: string) => {
    const numValue = parseFloat(value);
    if (unit === "percent") return `${numValue.toFixed(1)}%`;
    if (unit === "milliseconds") return `${numValue.toFixed(0)}ms`;
    if (unit === "requests/sec") return `${numValue.toFixed(1)} req/s`;
    return `${numValue.toFixed(2)} ${unit}`;
  };

  const recentMetrics = metrics.slice(0, 6);
  const openIncidents = incidents.filter((inc: Incident) => inc.status === "open" || inc.status === "investigating");
  const recentDeployments = deployments.slice(0, 5);

  if (loadingAgents && loadingDeployments && loadingIncidents) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading AI DevOps Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="devops-title">AI DevOps Dashboard</h1>
            <p className="text-muted-foreground">Autonomous infrastructure management and SRE automation</p>
          </div>
          {agents.length === 0 && (
            <Button 
              onClick={() => initializeAgentsMutation.mutate()}
              disabled={initializeAgentsMutation.isPending}
              data-testid="button-initialize-agents"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Initialize AI Agents
            </Button>
          )}
        </div>

        {/* System Overview Cards */}
        <div className="grid md:grid-cols-4 gap-6">
          <Card data-testid="card-agents-status">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Agents</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  {agents.filter((a: Agent) => a.status === "active").length} Active
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  {agents.filter((a: Agent) => a.status === "error").length} Error
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-deployments-status">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Deployments</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{deployments.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  {deployments.filter((d: Deployment) => d.status === "deployed").length} Deployed
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                  {deployments.filter((d: Deployment) => d.status === "pending").length} Pending
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-incidents-status">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{openIncidents.length}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
                  {incidents.filter((i: Incident) => i.severity === "critical").length} Critical
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-1"></div>
                  {incidents.filter((i: Incident) => i.severity === "high").length} High
                </div>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-system-health">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">Healthy</div>
              <div className="text-xs text-muted-foreground">
                All systems operational
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="agents" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="agents" data-testid="tab-agents">AI Agents</TabsTrigger>
            <TabsTrigger value="deployments" data-testid="tab-deployments">Deployments</TabsTrigger>
            <TabsTrigger value="incidents" data-testid="tab-incidents">Incidents</TabsTrigger>
            <TabsTrigger value="metrics" data-testid="tab-metrics">Performance</TabsTrigger>
          </TabsList>

          {/* AI Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent: Agent) => (
                <Card key={agent.id} data-testid={`agent-card-${agent.type}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getAgentIcon(agent.type)}
                        <CardTitle className="text-lg capitalize">{agent.type} Agent</CardTitle>
                      </div>
                      <Badge 
                        variant={agent.status === "active" ? "default" : "destructive"}
                        data-testid={`agent-status-${agent.type}`}
                      >
                        {agent.status}
                      </Badge>
                    </div>
                    <CardDescription>{agent.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>Last Heartbeat</span>
                        <span className="text-muted-foreground">
                          {new Date(agent.lastHeartbeat).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Health Status</span>
                        <Badge variant={agent.health?.status === "healthy" ? "outline" : "destructive"}>
                          {agent.health?.status || "Unknown"}
                        </Badge>
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Monitor
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Play className="h-4 w-4 mr-1" />
                          Configure
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {agents.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No AI Agents Configured</h3>
                  <p className="text-muted-foreground mb-6">
                    Initialize AI agents to enable autonomous infrastructure management.
                  </p>
                  <Button 
                    onClick={() => initializeAgentsMutation.mutate()}
                    disabled={initializeAgentsMutation.isPending}
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    {initializeAgentsMutation.isPending ? "Initializing..." : "Initialize AI Agents"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Deployments Tab */}
          <TabsContent value="deployments" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Deployment Pipeline</h2>
              <Button 
                onClick={() => triggerDeploymentMutation.mutate({
                  version: `v${Date.now()}`,
                  strategy: "blue-green",
                  environment: "production"
                })}
                disabled={triggerDeploymentMutation.isPending}
                data-testid="button-trigger-deployment"
              >
                <Rocket className="mr-2 h-4 w-4" />
                Trigger Deployment
              </Button>
            </div>

            <div className="space-y-4">
              {recentDeployments.map((deployment: Deployment) => (
                <Card key={deployment.id} data-testid={`deployment-${deployment.status}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${getStatusColor(deployment.status)} rounded-full`}></div>
                        <div>
                          <CardTitle className="text-lg">{deployment.version}</CardTitle>
                          <CardDescription>
                            {deployment.strategy} • {deployment.environment}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {deployment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span>Created: {new Date(deployment.createdAt).toLocaleString()}</span>
                      {deployment.deployedAt && (
                        <span>Deployed: {new Date(deployment.deployedAt).toLocaleString()}</span>
                      )}
                    </div>
                    {deployment.status === "deployed" && (
                      <div className="mt-3">
                        <Button size="sm" variant="outline">
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Rollback
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Incidents Tab */}
          <TabsContent value="incidents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Incident Management</h2>
              <Button 
                onClick={() => createIncidentMutation.mutate({
                  title: "Test Incident - High Response Time",
                  description: "Application response time has increased significantly",
                  severity: "medium",
                  category: "performance"
                })}
                variant="outline"
                data-testid="button-create-test-incident"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Simulate Incident
              </Button>
            </div>

            <div className="space-y-4">
              {incidents.map((incident: Incident) => (
                <Card key={incident.id} data-testid={`incident-${incident.severity}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className={`h-5 w-5 ${
                          incident.severity === "critical" ? "text-red-600" : 
                          incident.severity === "high" ? "text-orange-500" : "text-yellow-500"
                        }`} />
                        <div>
                          <CardTitle className="text-lg">{incident.title}</CardTitle>
                          <CardDescription className="capitalize">
                            {incident.category} • {incident.status}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {incident.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(incident.createdAt).toLocaleString()}
                    </div>
                    {incident.status === "open" && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="flex items-center text-blue-700 dark:text-blue-300">
                          <Clock className="h-4 w-4 mr-2" />
                          SRE Agent is investigating this incident...
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <h2 className="text-2xl font-bold">Performance Monitoring</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentMetrics.map((metric: Metric) => (
                <Card key={metric.id} data-testid={`metric-${metric.metricType}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm capitalize">
                        {metric.metricType.replace("_", " ")}
                      </CardTitle>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold mb-2">
                      {formatMetricValue(metric.value, metric.unit)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(metric.timestamp).toLocaleString()}
                    </div>
                    {metric.unit === "percent" && (
                      <Progress 
                        value={Math.min(parseFloat(metric.value), 100)} 
                        className="mt-2"
                      />
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {metrics.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Metrics Available</h3>
                  <p className="text-muted-foreground">
                    Performance metrics will appear here once AI agents start monitoring your application.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}