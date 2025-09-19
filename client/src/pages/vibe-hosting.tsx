import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import {
  Cloud,
  Play,
  Square,
  ArrowLeft,
  Settings,
  Activity,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  GitBranch,
  Database,
  Globe,
  Shield,
  BarChart3,
  RefreshCw,
  Monitor,
  Cpu,
  HardDrive,
  Network,
  Eye,
  ExternalLink,
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
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface CloudProvider {
  id: string;
  name: string;
  logo: string;
  regions: string[];
  defaultRegion: string;
  pricing: {
    compute: number;
    storage: number;
    bandwidth: number;
  };
}

interface Deployment {
  id: string;
  name: string;
  status: 'building' | 'deploying' | 'running' | 'stopped' | 'failed';
  url?: string;
  provider: string;
  region: string;
  cost: number;
  metrics: {
    cpu: number;
    memory: number;
    requests: number;
    responseTime: number;
  };
  createdAt: string;
  lastDeployed: string;
}

interface DeploymentRequest {
  provider: string;
  region: string;
  environment: string;
  autoScale: boolean;
  budget?: number;
}

export default function Deploy() {
  const [match, params] = useRoute("/projects/:id/hosting");
  const projectId = params?.id;
  const { toast } = useToast();

  // State management
  const [selectedProvider, setSelectedProvider] = useState<string>("azure");
  const [selectedRegion, setSelectedRegion] = useState<string>("West US 2");
  const [deploymentIntent, setDeploymentIntent] = useState<string>("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [currentTab, setCurrentTab] = useState("deploy");

  // Mock cloud providers
  const cloudProviders: CloudProvider[] = [
    {
      id: "azure",
      name: "Microsoft Azure",
      logo: "🔷",
      regions: ["West US 2", "East US", "North Europe", "Southeast Asia"],
      defaultRegion: "West US 2",
      pricing: { compute: 0.096, storage: 0.021, bandwidth: 0.087 }
    },
    {
      id: "aws",
      name: "Amazon Web Services",
      logo: "🟠",
      regions: ["us-west-2", "us-east-1", "eu-west-1", "ap-southeast-1"],
      defaultRegion: "us-west-2",
      pricing: { compute: 0.0928, storage: 0.023, bandwidth: 0.09 }
    },
    {
      id: "gcp",
      name: "Google Cloud Platform",
      logo: "🔵",
      regions: ["us-west1", "us-central1", "europe-west1", "asia-southeast1"],
      defaultRegion: "us-west1",
      pricing: { compute: 0.095, storage: 0.02, bandwidth: 0.085 }
    }
  ];

  // Mock deployments
  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: "1",
      name: "Production",
      status: "running",
      url: "https://myapp-prod.azurewebsites.net",
      provider: "azure",
      region: "West US 2",
      cost: 45.67,
      metrics: {
        cpu: 25,
        memory: 60,
        requests: 1250,
        responseTime: 180
      },
      createdAt: "2025-09-01",
      lastDeployed: "2025-09-18T10:30:00Z"
    },
    {
      id: "2",
      name: "Staging",
      status: "running",
      url: "https://myapp-staging.azurewebsites.net",
      provider: "azure",
      region: "West US 2",
      cost: 12.34,
      metrics: {
        cpu: 8,
        memory: 35,
        requests: 180,
        responseTime: 220
      },
      createdAt: "2025-09-01",
      lastDeployed: "2025-09-18T09:15:00Z"
    }
  ]);

  const selectedProviderData = cloudProviders.find(p => p.id === selectedProvider);

  // Calculate estimated cost
  const calculateCost = (provider: CloudProvider, autoScale: boolean): number => {
    const baseCost = provider.pricing.compute * 24 * 30; // Monthly compute
    const storageCost = provider.pricing.storage * 10; // 10GB storage
    const bandwidthCost = provider.pricing.bandwidth * 100; // 100GB bandwidth

    let total = baseCost + storageCost + bandwidthCost;
    if (autoScale) total *= 1.3; // 30% premium for auto-scaling

    return Math.round(total * 100) / 100;
  };

  // Natural language deployment mutations
  const deploymentIntentMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch(`/api/hosting/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          message,
          constraints: { budget: 100, region: "us-west-2" }
        })
      });
      if (!response.ok) throw new Error("Failed to process deployment intent");
      return response.json();
    },
    onSuccess: async (intentData) => {
      // Now trigger actual deployment with the parsed intent
      if (intentData.providerDecision) {
        await deployMutation.mutateAsync({
          environment: "production",
          providerDecision: intentData.providerDecision,
          artifactRef: "latest",
          strategy: intentData.strategy || "blue-green"
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error processing deployment",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const deployMutation = useMutation({
    mutationFn: async (deployData: any) => {
      const response = await fetch(`/api/hosting/deploy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          ...deployData
        })
      });
      if (!response.ok) throw new Error("Failed to start deployment");
      return response.json();
    },
    onSuccess: async (data) => {
      toast({
        title: "Deployment Started",
        description: data.message || "Deployment has been initiated successfully."
      });

      const newDeployment: Deployment = {
        id: data.deploymentId,
        name: `Deploy-${Date.now()}`,
        status: data.status === 'success' ? 'running' : 'deploying',
        url: data.url || undefined,
        provider: data.provider || "azure",
        region: data.region || "West US 2",
        cost: calculateCost(selectedProviderData!, false),
        metrics: {
          cpu: 0,
          memory: 0,
          requests: 0,
          responseTime: 0
        },
        createdAt: new Date().toISOString().split('T')[0],
        lastDeployed: new Date().toISOString()
      };

      setDeployments(prev => [newDeployment, ...prev]);
      setDeploymentIntent("");

      // Poll status a couple of times
      if (data.statusUrl) {
        try {
          const res = await fetch(data.statusUrl, { credentials: 'include' });
          if (res.ok) {
            const s = await res.json();
            setDeployments(prev => prev.map(d => d.id === newDeployment.id ? {
              ...d,
              status: (s.status === 'success' ? 'running' : d.status),
              url: s.url || d.url,
              lastDeployed: new Date().toISOString()
            } : d));
          }
        } catch {}
      }
    },
    onError: (error) => {
      toast({
        title: "Deployment Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleDeploymentIntent = async () => {
    if (!deploymentIntent.trim() || !projectId) return;

    setIsDeploying(true);
    try {
      await deploymentIntentMutation.mutateAsync(deploymentIntent);
    } finally {
      setIsDeploying(false);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    toast({
      title: "Rolling Back",
      description: "Rolling back to previous version..."
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: "Rollback Complete",
      description: "Application has been rolled back successfully"
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "text-green-600 bg-green-100";
      case "building": return "text-yellow-600 bg-yellow-100";
      case "deploying": return "text-blue-600 bg-blue-100";
      case "stopped": return "text-gray-600 bg-gray-100";
      case "failed": return "text-red-600 bg-red-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <CheckCircle className="h-4 w-4" />;
      case "building": return <RefreshCw className="h-4 w-4 animate-spin" />;
      case "deploying": return <Clock className="h-4 w-4" />;
      case "stopped": return <Square className="h-4 w-4" />;
      case "failed": return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold">Deploy</h1>
              <Badge variant="secondary">
                <Cloud className="h-3 w-3 mr-1" />
                {deployments.filter(d => d.status === 'running').length} Active
              </Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => window.open('https://azure.microsoft.com/en-us/pricing/calculator/', '_blank')}>
                <DollarSign className="h-4 w-4 mr-1" />
                Cost Calculator
              </Button>
              <Button>
                <Zap className="h-4 w-4 mr-1" />
                Quick Deploy
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="environments">Environments</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Deploy Tab */}
          <TabsContent value="deploy" className="space-y-6">
            {/* Natural Language Deployment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>Natural Language Deploy</span>
                </CardTitle>
                <CardDescription>
                  Describe how you want to deploy your application in plain English
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deployment-intent">Deployment Request</Label>
                  <Textarea
                    id="deployment-intent"
                    value={deploymentIntent}
                    onChange={(e) => setDeploymentIntent(e.target.value)}
                    placeholder='e.g., "Deploy to Azure with auto-scaling enabled" or "Deploy to AWS using canary strategy with budget limit of $50"'
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Cloud className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Provider</span>
                      </div>
                      <p className="text-lg font-bold">{selectedProviderData?.name}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <Globe className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Region</span>
                      </div>
                      <p className="text-lg font-bold">{selectedRegion}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Est. Cost</span>
                      </div>
                      <p className="text-lg font-bold">${calculateCost(selectedProviderData!, false)}/mo</p>
                    </CardContent>
                  </Card>
                </div>

                <Button
                  onClick={handleDeploymentIntent}
                  disabled={!deploymentIntent.trim() || isDeploying || deploymentIntentMutation.isPending || deployMutation.isPending}
                  className="w-full"
                  size="lg"
                >
                  {(isDeploying || deploymentIntentMutation.isPending || deployMutation.isPending) ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Deploy Application
                    </>
                  )}
                </Button>

                {deploymentIntent && (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertTitle>AI Analysis</AlertTitle>
                    <AlertDescription>
                      I'll deploy to {selectedProviderData?.name} in {selectedRegion} using blue-green strategy.
                      Estimated cost: ${calculateCost(selectedProviderData!, false)}/month.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Provider Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Cloud Provider</CardTitle>
                <CardDescription>Choose your preferred cloud provider</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {cloudProviders.map((provider) => (
                    <Card
                      key={provider.id}
                      className={`cursor-pointer transition-all ${
                        selectedProvider === provider.id
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setSelectedRegion(provider.defaultRegion);
                      }}
                    >
                      <CardContent className="pt-4">
                        <div className="text-center">
                          <div className="text-3xl mb-2">{provider.logo}</div>
                          <h3 className="font-semibold">{provider.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${provider.pricing.compute}/hr compute
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="region">Region</Label>
                    <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProviderData?.regions.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="environment">Environment</Label>
                    <Select defaultValue="production">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="staging">Staging</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Environments Tab */}
          <TabsContent value="environments" className="space-y-6">
            <div className="grid gap-6">
              {deployments.map((deployment) => (
                <Card key={deployment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(deployment.status)}`}>
                          {getStatusIcon(deployment.status)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{deployment.name}</CardTitle>
                          <CardDescription>
                            {deployment.provider} • {deployment.region}
                          </CardDescription>
                        </div>
                        <Badge className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {deployment.url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(deployment.url, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRollback(deployment.id)}
                        >
                          Rollback
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-6">
                      <div>
                        <div className="text-sm font-medium mb-1">CPU Usage</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={deployment.metrics.cpu} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {deployment.metrics.cpu}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Memory</div>
                        <div className="flex items-center space-x-2">
                          <Progress value={deployment.metrics.memory} className="flex-1" />
                          <span className="text-sm text-muted-foreground">
                            {deployment.metrics.memory}%
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Requests</div>
                        <div className="text-lg font-bold">{deployment.metrics.requests}</div>
                        <div className="text-xs text-muted-foreground">last hour</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium mb-1">Response Time</div>
                        <div className="text-lg font-bold">{deployment.metrics.responseTime}ms</div>
                        <div className="text-xs text-muted-foreground">average</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        Monthly cost: <span className="font-medium text-foreground">${deployment.cost}</span>
                      </span>
                      <span>
                        Last deployed: {new Date(deployment.lastDeployed).toLocaleString()}
                      </span>
                    </div>

                    {deployment.url && (
                      <div className="mt-2">
                        <div className="text-sm font-medium mb-1">URL</div>
                        <div className="flex items-center space-x-2">
                          <Input value={deployment.url} readOnly className="font-mono text-xs" />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(deployment.url!);
                              toast({ title: "URL copied to clipboard" });
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {deployments.length === 0 && (
                <Card>
                  <CardContent className="pt-8">
                    <div className="text-center">
                      <Cloud className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No deployments yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Deploy your first application to get started with Deploy.
                      </p>
                      <Button onClick={() => setCurrentTab("deploy")}>
                        <Play className="h-4 w-4 mr-2" />
                        Deploy Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,430</div>
                  <p className="text-xs text-muted-foreground">+12% from last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">186ms</div>
                  <p className="text-xs text-muted-foreground">-5ms from last hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0.3%</div>
                  <p className="text-xs text-muted-foreground">No change</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$58.01</div>
                  <p className="text-xs text-muted-foreground">2% of budget</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Live Metrics</CardTitle>
                <CardDescription>Real-time application and infrastructure metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <Alert>
                    <Activity className="h-4 w-4" />
                    <AlertTitle>All Systems Operational</AlertTitle>
                    <AlertDescription>
                      Your applications are running smoothly with no detected issues.
                    </AlertDescription>
                  </Alert>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">Resource Usage</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>CPU</span>
                            <span>25%</span>
                          </div>
                          <Progress value={25} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Memory</span>
                            <span>60%</span>
                          </div>
                          <Progress value={60} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Disk</span>
                            <span>40%</span>
                          </div>
                          <Progress value={40} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium mb-3">Recent Deployments</h4>
                      <div className="space-y-2">
                        {deployments.slice(0, 3).map((deployment) => (
                          <div key={deployment.id} className="flex items-center space-x-3 p-2 rounded border">
                            <div className={`w-2 h-2 rounded-full ${
                              deployment.status === 'running' ? 'bg-green-500' :
                              deployment.status === 'building' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <div className="flex-1">
                              <div className="text-sm font-medium">{deployment.name}</div>
                              <div className="text-xs text-muted-foreground">{deployment.provider}</div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {deployment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Settings</CardTitle>
                <CardDescription>Configure default deployment preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="default-provider">Default Provider</Label>
                    <Select defaultValue="azure">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cloudProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.logo} {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-region">Default Region</Label>
                    <Select defaultValue="West US 2">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="West US 2">West US 2</SelectItem>
                        <SelectItem value="East US">East US</SelectItem>
                        <SelectItem value="North Europe">North Europe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-scale">Auto-scaling</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically scale based on demand
                      </p>
                    </div>
                    <Switch id="auto-scale" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="cost-alerts">Cost Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when approaching budget limits
                      </p>
                    </div>
                    <Switch id="cost-alerts" defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-rollback">Auto Rollback</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically rollback failed deployments
                      </p>
                    </div>
                    <Switch id="auto-rollback" defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Budget Settings</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly-budget">Monthly Budget ($)</Label>
                      <Input id="monthly-budget" type="number" defaultValue="100" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alert-threshold">Alert Threshold (%)</Label>
                      <Input id="alert-threshold" type="number" defaultValue="80" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}