import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  Cloud, 
  Github, 
  Gitlab, 
  Shield, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Plus,
  Settings,
  Eye,
  EyeOff,
  Activity,
  BarChart3,
  Clock,
  Key,
  Webhook,
  Database,
  ExternalLink,
  RefreshCw,
  Copy,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  type: 'cloud-provider' | 'repository' | 'api' | 'communication';
  service: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'pending';
  lastConnected?: string;
  configuration?: Record<string, any>;
  healthCheck?: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    responseTime: number;
    lastChecked: string;
  };
  usage?: {
    requests: number;
    errors: number;
    uptime: number;
  };
  createdAt: string;
}

interface HealthOverview {
  totalIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  unhealthyIntegrations: number;
  lastChecked: string;
  integrationsByType: Record<string, { total: number; healthy: number }>;
}

interface AvailableConnector {
  service: string;
  info: {
    name: string;
    description: string;
    version: string;
    documentation: string;
    supportedFeatures: string[];
  };
}

const statusIcons = {
  active: <CheckCircle2 className="h-4 w-4 text-green-600" />,
  inactive: <XCircle className="h-4 w-4 text-gray-400" />,
  error: <AlertCircle className="h-4 w-4 text-red-600" />,
  pending: <Clock className="h-4 w-4 text-yellow-600" />
};

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200", 
  error: "bg-red-100 text-red-800 border-red-200",
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200"
};

const healthColors = {
  healthy: "text-green-600",
  degraded: "text-yellow-600",
  unhealthy: "text-red-600"
};

const serviceIcons = {
  github: <Github className="h-5 w-5" />,
  gitlab: <Gitlab className="h-5 w-5" />,
  aws: <Cloud className="h-5 w-5" />,
  azure: <Cloud className="h-5 w-5" />,
  gcp: <Cloud className="h-5 w-5" />,
  stripe: <Zap className="h-5 w-5" />,
  twilio: <Zap className="h-5 w-5" />,
  sendgrid: <Zap className="h-5 w-5" />,
  slack: <Zap className="h-5 w-5" />
};

export default function IntegrationsPage() {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showNewIntegrationDialog, setShowNewIntegrationDialog] = useState(false);
  const [showSecretsDialog, setShowSecretsDialog] = useState(false);
  const [showHealthDialog, setShowHealthDialog] = useState(false);
  const [secrets, setSecrets] = useState<any[]>([]);
  const [showSecretValues, setShowSecretValues] = useState<Record<string, boolean>>({});
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch integrations
  const { data: integrations = [], isLoading: integrationsLoading, refetch: refetchIntegrations } = useQuery({
    queryKey: ['integrations', selectedType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.set('type', selectedType);
      
      const response = await fetch(`/api/integrations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch integrations');
      return response.json();
    }
  });

  // Fetch health overview
  const { data: healthOverview, isLoading: healthLoading } = useQuery({
    queryKey: ['integrations-health-overview'],
    queryFn: async () => {
      const response = await fetch('/api/integrations/health/overview');
      if (!response.ok) throw new Error('Failed to fetch health overview');
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch available connectors
  const { data: availableConnectors = [] } = useQuery({
    queryKey: ['available-connectors'],
    queryFn: async () => {
      const response = await fetch('/api/api-connectors/available');
      if (!response.ok) throw new Error('Failed to fetch available connectors');
      return response.json();
    }
  });

  // Test integration connection
  const testConnectionMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Connection test failed');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Test",
        description: data.success ? "Connection successful!" : `Connection failed: ${data.errorMessage}`,
        variant: data.success ? "default" : "destructive"
      });
      refetchIntegrations();
    }
  });

  // Delete integration
  const deleteIntegrationMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete integration');
    },
    onSuccess: () => {
      toast({
        title: "Integration Deleted",
        description: "Integration has been successfully removed"
      });
      refetchIntegrations();
      setSelectedIntegration(null);
    }
  });

  // Fetch integration secrets
  const fetchSecrets = async (integrationId: string) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/secrets`);
      if (!response.ok) throw new Error('Failed to fetch secrets');
      const data = await response.json();
      setSecrets(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch integration secrets",
        variant: "destructive"
      });
    }
  };

  // Filter integrations based on type and search
  const filteredIntegrations = integrations.filter((integration: Integration) => {
    const matchesType = selectedType === 'all' || integration.type === selectedType;
    const matchesSearch = searchQuery === '' || 
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.service.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  // Get health status distribution
  const getHealthStats = () => {
    if (!healthOverview) return null;
    
    const total = healthOverview.totalIntegrations;
    const healthy = healthOverview.healthyIntegrations;
    const degraded = healthOverview.degradedIntegrations;
    const unhealthy = healthOverview.unhealthyIntegrations;
    
    return {
      total,
      healthy: { count: healthy, percentage: total > 0 ? (healthy / total) * 100 : 0 },
      degraded: { count: degraded, percentage: total > 0 ? (degraded / total) * 100 : 0 },
      unhealthy: { count: unhealthy, percentage: total > 0 ? (unhealthy / total) * 100 : 0 }
    };
  };

  const healthStats = getHealthStats();

  if (integrationsLoading || healthLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-8" data-testid="integrations-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">
            Integrations Hub
          </h1>
          <p className="text-muted-foreground" data-testid="page-description">
            Manage all your external service connections and integrations
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => refetchIntegrations()}
            data-testid="button-refresh"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => setShowNewIntegrationDialog(true)}
            data-testid="button-new-integration"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Integration
          </Button>
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-pane rounded-2xl" data-testid="card-total-integrations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-integrations">
              {healthStats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card className="glass-pane rounded-2xl" data-testid="card-healthy-integrations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="text-healthy-count">
              {healthStats?.healthy.count || 0}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={healthStats?.healthy.percentage || 0} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {Math.round(healthStats?.healthy.percentage || 0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-pane rounded-2xl" data-testid="card-degraded-integrations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Degraded</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="text-degraded-count">
              {healthStats?.degraded.count || 0}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={healthStats?.degraded.percentage || 0} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {Math.round(healthStats?.degraded.percentage || 0)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-pane rounded-2xl" data-testid="card-unhealthy-integrations">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unhealthy</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="text-unhealthy-count">
              {healthStats?.unhealthy.count || 0}
            </div>
            <div className="flex items-center space-x-2">
              <Progress value={healthStats?.unhealthy.percentage || 0} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {Math.round(healthStats?.unhealthy.percentage || 0)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search"
            className="max-w-sm"
          />
        </div>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]" data-testid="select-type-filter">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" data-testid="option-all">All Types</SelectItem>
            <SelectItem value="cloud-provider" data-testid="option-cloud-provider">Cloud Providers</SelectItem>
            <SelectItem value="repository" data-testid="option-repository">Repositories</SelectItem>
            <SelectItem value="api" data-testid="option-api">API Services</SelectItem>
            <SelectItem value="communication" data-testid="option-communication">Communication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-testid="integrations-grid">
        {filteredIntegrations.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
            <Database className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Integrations Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No integrations match your search.' : 'Get started by adding your first integration.'}
            </p>
            <Button onClick={() => setShowNewIntegrationDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
        ) : (
          filteredIntegrations.map((integration: Integration) => (
            <Card
              key={integration.id}
              className="glass-pane rounded-2xl cursor-pointer hover:-translate-y-1 transition-all duration-200"
              onClick={() => setSelectedIntegration(integration)}
              data-testid={`card-integration-${integration.service}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {serviceIcons[integration.service as keyof typeof serviceIcons] || <Zap className="h-5 w-5" />}
                    </div>
                    <div>
                      <CardTitle className="text-base" data-testid={`text-integration-name-${integration.service}`}>
                        {integration.name}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {integration.type.replace('-', ' ')}
                      </CardDescription>
                    </div>
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={cn("capitalize", statusColors[integration.status])}
                    data-testid={`badge-status-${integration.service}`}
                  >
                    {statusIcons[integration.status]}
                    <span className="ml-1">{integration.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {integration.healthCheck && (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Activity className={cn("h-4 w-4", healthColors[integration.healthCheck.status])} />
                      <span className={cn("capitalize", healthColors[integration.healthCheck.status])}>
                        {integration.healthCheck.status}
                      </span>
                    </div>
                    <span className="text-muted-foreground">
                      {integration.healthCheck.responseTime}ms
                    </span>
                  </div>
                )}
                
                {integration.usage && (
                  <div className="mt-3 space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Uptime</span>
                      <span>{integration.usage.uptime.toFixed(1)}%</span>
                    </div>
                    <Progress value={integration.usage.uptime} className="h-1" />
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>Connected {integration.lastConnected ? new Date(integration.lastConnected).toLocaleDateString() : 'Never'}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Integration Details Dialog */}
      {selectedIntegration && (
        <Dialog open={!!selectedIntegration} onOpenChange={() => setSelectedIntegration(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-integration-details">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {serviceIcons[selectedIntegration.service as keyof typeof serviceIcons] || <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <span data-testid="text-selected-integration-name">{selectedIntegration.name}</span>
                  <Badge variant="secondary" className={cn("ml-2 capitalize", statusColors[selectedIntegration.status])}>
                    {selectedIntegration.status}
                  </Badge>
                </div>
              </DialogTitle>
              <DialogDescription>
                Manage {selectedIntegration.service} integration settings and configuration
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="secrets" data-testid="tab-secrets">Secrets</TabsTrigger>
                <TabsTrigger value="health" data-testid="tab-health">Health</TabsTrigger>
                <TabsTrigger value="settings" data-testid="tab-settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4">
                  <div>
                    <Label className="text-sm font-medium">Service</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedIntegration.service}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedIntegration.type.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedIntegration.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Connected</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedIntegration.lastConnected 
                        ? new Date(selectedIntegration.lastConnected).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button
                    onClick={() => testConnectionMutation.mutate(selectedIntegration.id)}
                    disabled={testConnectionMutation.isPending}
                    data-testid="button-test-connection"
                  >
                    {testConnectionMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Activity className="h-4 w-4 mr-2" />
                    )}
                    Test Connection
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowSecretsDialog(true);
                      fetchSecrets(selectedIntegration.id);
                    }}
                    data-testid="button-manage-secrets"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Manage Secrets
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => deleteIntegrationMutation.mutate(selectedIntegration.id)}
                    disabled={deleteIntegrationMutation.isPending}
                    data-testid="button-delete-integration"
                  >
                    {deleteIntegrationMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="secrets" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Integration Secrets</h4>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Secret
                    </Button>
                  </div>

                  {secrets.length === 0 ? (
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        No secrets configured for this integration. Add API keys, tokens, or other credentials.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {secrets.map((secret: any) => (
                        <div key={secret.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{secret.secretName}</p>
                            <p className="text-sm text-muted-foreground">{secret.secretType}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowSecretValues(prev => ({
                                ...prev,
                                [secret.id]: !prev[secret.id]
                              }))}
                            >
                              {showSecretValues[secret.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                {selectedIntegration.healthCheck ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="text-center">
                        <div className={cn("text-2xl font-bold", healthColors[selectedIntegration.healthCheck.status])}>
                          {selectedIntegration.healthCheck.status.toUpperCase()}
                        </div>
                        <p className="text-sm text-muted-foreground">Status</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selectedIntegration.healthCheck.responseTime}ms</div>
                        <p className="text-sm text-muted-foreground">Response Time</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {selectedIntegration.usage?.uptime.toFixed(1) || '0'}%
                        </div>
                        <p className="text-sm text-muted-foreground">Uptime</p>
                      </div>
                    </div>

                    <Separator />

                    {selectedIntegration.usage && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Usage Statistics</h4>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <Label>Total Requests</Label>
                            <p className="text-2xl font-bold">{selectedIntegration.usage.requests.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label>Error Rate</Label>
                            <p className="text-2xl font-bold text-red-600">
                              {selectedIntegration.usage.requests > 0 
                                ? ((selectedIntegration.usage.errors / selectedIntegration.usage.requests) * 100).toFixed(2)
                                : '0'}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Health monitoring is not configured for this integration.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Integration settings and configuration options would be displayed here.
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* New Integration Dialog */}
      <Dialog open={showNewIntegrationDialog} onOpenChange={setShowNewIntegrationDialog}>
        <DialogContent className="max-w-md" data-testid="dialog-new-integration">
          <DialogHeader>
            <DialogTitle>Add New Integration</DialogTitle>
            <DialogDescription>
              Choose from available connectors to add a new integration
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {availableConnectors.map((connector: AvailableConnector) => (
              <Card key={connector.service} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      {serviceIcons[connector.service as keyof typeof serviceIcons] || <Zap className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{connector.info.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {connector.info.description}
                      </CardDescription>
                    </div>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </AppShell>
  );
}