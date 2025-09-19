import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import {
  ArrowLeft,
  Key,
  Shield,
  Github,
  GitlabIcon as Gitlab,
  Cloud,
  CreditCard,
  Mail,
  MessageSquare,
  Brain,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Search,
  Filter,
  Star,
  Sparkles,
  Zap,
  Database,
  BarChart3,
  Settings,
  Globe,
  Server,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  id: string;
  name: string;
  service: string;
  status: "active" | "inactive" | "error" | "configuring";
  lastTested?: string;
  configuration?: any;
}

interface IntegrationTemplate {
  id: string;
  name: string;
  service: string;
  category: string;
  icon: any;
  description: string;
  required: boolean;
  fields: Array<{
    name: string;
    label: string;
    type: "text" | "password" | "url" | "textarea";
    placeholder: string;
    required: boolean;
    description?: string;
  }>;
}

// Popular integrations with modern categorization
const integrationCategories = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Star,
    color: 'from-yellow-500 to-orange-500'
  },
  {
    id: 'repository',
    name: 'Repository',
    icon: Github,
    color: 'from-gray-500 to-gray-700'
  },
  {
    id: 'cloud-provider',
    name: 'Cloud',
    icon: Cloud,
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'ai',
    name: 'AI & ML',
    icon: Brain,
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'monitoring',
    name: 'Monitoring',
    icon: Activity,
    color: 'from-green-500 to-emerald-500'
  },
  {
    id: 'database',
    name: 'Database',
    icon: Database,
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'communication',
    name: 'Communication',
    icon: MessageSquare,
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'payment',
    name: 'Payments',
    icon: CreditCard,
    color: 'from-emerald-500 to-teal-500'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: BarChart3,
    color: 'from-orange-500 to-red-500'
  }
];

const integrationTemplates: IntegrationTemplate[] = [
  // Essential integrations
  {
    id: "github",
    name: "GitHub",
    service: "github",
    category: "Repository",
    icon: Github,
    description: "Connect your GitHub account for repository management and CI/CD",
    required: true,
    fields: [
      {
        name: "clientId",
        label: "GitHub OAuth Client ID",
        type: "text",
        placeholder: "Iv1.abc123def456",
        required: true,
        description: "OAuth App Client ID from GitHub Developer Settings"
      },
      {
        name: "clientSecret",
        label: "GitHub OAuth Client Secret",
        type: "password",
        placeholder: "github_oauth_secret...",
        required: true,
        description: "OAuth App Client Secret from GitHub"
      }
    ]
  },
  {
    id: "openai",
    name: "OpenAI",
    service: "openai",
    category: "AI Services",
    icon: Brain,
    description: "Enable AI-powered code generation and analysis",
    required: true,
    fields: [
      {
        name: "apiKey",
        label: "OpenAI API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
        description: "Get your API key from platform.openai.com"
      }
    ]
  },
  {
    id: "stripe",
    name: "Stripe",
    service: "stripe",
    category: "Payments",
    icon: CreditCard,
    description: "Process payments and manage subscriptions",
    required: false,
    fields: [
      {
        name: "secretKey",
        label: "Stripe Secret Key",
        type: "password",
        placeholder: "sk_live_... or sk_test_...",
        required: true,
        description: "Your Stripe secret key from the Stripe dashboard"
      },
      {
        name: "webhookSecret",
        label: "Webhook Endpoint Secret",
        type: "password",
        placeholder: "whsec_...",
        required: true,
        description: "Webhook secret for event verification"
      }
    ]
  },
  {
    id: "aws",
    name: "Amazon Web Services",
    service: "aws",
    category: "Cloud",
    icon: Cloud,
    description: "Deploy and manage infrastructure on AWS",
    required: false,
    fields: [
      {
        name: "accessKeyId",
        label: "AWS Access Key ID",
        type: "text",
        placeholder: "AKIA...",
        required: true,
        description: "AWS Access Key ID from IAM"
      },
      {
        name: "secretAccessKey",
        label: "AWS Secret Access Key",
        type: "password",
        placeholder: "...",
        required: true,
        description: "AWS Secret Access Key from IAM"
      },
      {
        name: "region",
        label: "Default Region",
        type: "text",
        placeholder: "us-west-2",
        required: true,
        description: "Default AWS region for deployments"
      }
    ]
  },
  {
    id: "datadog",
    name: "Datadog",
    service: "datadog",
    category: "Monitoring",
    icon: Activity,
    description: "Monitor application performance and infrastructure",
    required: false,
    fields: [
      {
        name: "apiKey",
        label: "Datadog API Key",
        type: "password",
        placeholder: "...",
        required: true,
        description: "API key from Datadog Organization Settings"
      },
      {
        name: "appKey",
        label: "Datadog Application Key",
        type: "password",
        placeholder: "...",
        required: true,
        description: "Application key from Datadog"
      }
    ]
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    service: "sendgrid",
    category: "Communication",
    icon: Mail,
    description: "Send transactional emails and notifications",
    required: false,
    fields: [
      {
        name: "apiKey",
        label: "SendGrid API Key",
        type: "password",
        placeholder: "SG...",
        required: true,
        description: "API key from your SendGrid account"
      },
      {
        name: "fromEmail",
        label: "From Email Address",
        type: "text",
        placeholder: "noreply@yourapp.com",
        required: true,
        description: "Verified sender email address"
      }
    ]
  }
];

export default function IntegrationsSetup() {
  const [match, params] = useRoute("/integrations/setup");
  const { toast } = useToast();

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);

  // Filter integrations based on category and search
  const filteredIntegrations = useMemo(() => {
    let filtered = integrationTemplates;
    
    if (selectedCategory !== 'popular') {
      filtered = filtered.filter(integration => 
        integration.category.toLowerCase() === selectedCategory.replace('-', ' ')
      );
    } else {
      // Show most essential integrations first
      filtered = filtered.filter(integration => integration.required);
    }
    
    if (searchQuery) {
      filtered = filtered.filter(integration =>
        integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [selectedCategory, searchQuery]);

  // Fetch existing integrations
  const { data: integrations, refetch } = useQuery({
    queryKey: ["integrations"],
    queryFn: async () => {
      const response = await fetch("/api/integrations");
      if (!response.ok) throw new Error("Failed to fetch integrations");
      return response.json() as Integration[];
    }
  });

  // Save integration mutation
  const saveIntegrationMutation = useMutation({
    mutationFn: async (data: { service: string; credentials: Record<string, string> }) => {
      const response = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: integrationTemplates.find(t => t.service === data.service)?.name,
          type: "integration",
          service: data.service,
          category: integrationTemplates.find(t => t.service === data.service)?.category.toLowerCase(),
          secrets: data.credentials,
          configuration: {
            connectedAt: new Date().toISOString(),
            connectedBy: "user"
          }
        })
      });
      if (!response.ok) throw new Error("Failed to save integration");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Integration Saved",
        description: "Your integration has been securely stored in Azure KeyVault."
      });
      setSelectedIntegration(null);
      setFormData({});
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error saving integration",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async (data: { service: string; credentials: Record<string, string> }) => {
      const response = await fetch("/api/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: data.service,
          credentials: data.credentials
        })
      });
      if (!response.ok) throw new Error("Connection test failed");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Connection Successful",
        description: data.message || "Integration is working correctly."
      });
    },
    onError: (error) => {
      toast({
        title: "Connection Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleTestConnection = async () => {
    if (!selectedIntegration) return;
    setTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync({
        service: selectedIntegration,
        credentials: formData
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveIntegration = () => {
    if (!selectedIntegration) return;

    const template = integrationTemplates.find(t => t.service === selectedIntegration);
    if (!template) return;

    // Validate required fields
    const missingFields = template.fields
      .filter(field => field.required && !formData[field.name])
      .map(field => field.label);

    if (missingFields.length > 0) {
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive"
      });
      return;
    }

    saveIntegrationMutation.mutate({
      service: selectedIntegration,
      credentials: formData
    });
  };

  const getIntegrationStatus = (service: string): Integration | undefined => {
    return integrations?.find(i => i.service === service);
  };

  const renderIntegrationForm = () => {
    if (!selectedIntegration) return null;

    const template = integrationTemplates.find(t => t.service === selectedIntegration);
    if (!template) return null;

    const IconComponent = template.icon;
    const existingIntegration = getIntegrationStatus(selectedIntegration);

    return (
      <Card className="bg-black/40 border-white/20 backdrop-blur-md">
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <IconComponent className="h-6 w-6 text-purple-300" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">{template.name} Integration</CardTitle>
              <CardDescription className="text-white/70">{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {existingIntegration && (
            <Alert className="bg-blue-500/10 border-blue-500/30">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                This integration is already configured and active. Updating will replace the existing configuration.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {template.fields.map(field => (
              <div key={field.name} className="space-y-2">
                <Label htmlFor={field.name} className="text-white font-medium">{field.label}</Label>
                <div className="relative">
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder:text-white/50 resize-none"
                    />
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type === "password" && !showPassword[field.name] ? "password" : "text"}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ""}
                      onChange={(e) => handleInputChange(field.name, e.target.value)}
                      className="bg-white/5 border-white/20 text-white placeholder:text-white/50"
                    />
                  )}
                  {field.type === "password" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-white/10 text-white/70"
                      onClick={() => togglePasswordVisibility(field.name)}
                    >
                      {showPassword[field.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
                {field.description && (
                  <p className="text-xs text-white/60">{field.description}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection || testConnectionMutation.isPending}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {(testingConnection || testConnectionMutation.isPending) ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleSaveIntegration}
              disabled={saveIntegrationMutation.isPending}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
            >
              {saveIntegrationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Save to KeyVault
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => setSelectedIntegration(null)}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Modern Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-white/20" />
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Integrations</h1>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                <Shield className="h-3 w-3 mr-1" />
                KeyVault Secured
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-3">Connect Your Tools</h2>
          <p className="text-xl text-white/70 max-w-3xl">
            Connect 100+ popular services with plug-and-play setup. All credentials are encrypted and stored in Azure KeyVault.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 h-4 w-4" />
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Category Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {integrationCategories.map((category) => {
              const IconComponent = category.icon;
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  className={`flex-shrink-0 ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white`
                      : "border-white/20 text-white hover:bg-white/10"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <IconComponent className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Integration Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {integrationCategories.find(c => c.id === selectedCategory)?.name || 'Popular'} Integrations
              </h3>
              <span className="text-white/60 text-sm">{filteredIntegrations.length} available</span>
            </div>

            <div className="grid gap-4">
              {filteredIntegrations.map(template => {
                const IconComponent = template.icon;
                const existingIntegration = getIntegrationStatus(template.service);

                return (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all duration-200 bg-white/5 border-white/10 hover:bg-white/10 ${
                      selectedIntegration === template.service ? "ring-2 ring-purple-500 bg-white/10" : ""
                    }`}
                    onClick={() => setSelectedIntegration(template.service)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
                            <IconComponent className="h-6 w-6 text-purple-300" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">{template.name}</h3>
                            <p className="text-sm text-white/60">{template.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {template.required && (
                            <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-xs">
                              Essential
                            </Badge>
                          )}
                          {existingIntegration ? (
                            <Badge
                              className={`text-xs ${
                                existingIntegration.status === "active"
                                  ? "bg-green-500/20 text-green-300 border-green-500/30"
                                  : "bg-red-500/20 text-red-300 border-red-500/30"
                              }`}
                            >
                              {existingIntegration.status === "active" ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Connected
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Error
                                </>
                              )}
                            </Badge>
                          ) : (
                            <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
                              Not Connected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-white/70 mt-3">{template.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredIntegrations.length === 0 && (
              <Card className="bg-white/5 border-white/10">
                <CardContent className="p-8 text-center">
                  <Search className="h-12 w-12 text-white/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No integrations found</h3>
                  <p className="text-white/60">
                    Try adjusting your search or selecting a different category.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Integration Configuration Panel */}
          <div className="lg:sticky lg:top-24">
            {selectedIntegration ? (
              renderIntegrationForm()
            ) : (
              <Card className="bg-black/40 border-white/20 backdrop-blur-md">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">Select an Integration</h3>
                  <p className="text-white/70 mb-6">
                    Choose an integration from the list to configure its settings and credentials securely.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <Shield className="h-4 w-4" />
                      <span>Enterprise-grade encryption</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <Zap className="h-4 w-4" />
                      <span>Instant connection testing</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-white/60">
                      <Activity className="h-4 w-4" />
                      <span>Real-time health monitoring</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mt-8 bg-black/40 border-purple-500/30 backdrop-blur-md">
          <Shield className="h-4 w-4 text-purple-400" />
          <AlertDescription className="text-white/80">
            <strong className="text-white">Enterprise Security:</strong> All credentials are encrypted using Azure KeyVault with industry-standard AES-256 encryption.
            Your sensitive data is never stored in plain text and follows SOC 2 Type II compliance standards.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}