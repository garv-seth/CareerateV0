import { useState } from "react";
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
  RefreshCw
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

const integrationTemplates: IntegrationTemplate[] = [
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
        name: "personalAccessToken",
        label: "GitHub Personal Access Token",
        type: "password",
        placeholder: "ghp_xxxxxxxxxxxxxxxxxxxx",
        required: true,
        description: "Personal Access Token from GitHub Settings > Developer Settings > Personal Access Tokens > Tokens (classic)"
      },
      {
        name: "clientId",
        label: "GitHub OAuth Client ID (Optional)",
        type: "text",
        placeholder: "Iv1.abc123def456",
        required: false,
        description: "OAuth App Client ID from GitHub Developer Settings (for OAuth flow)"
      },
      {
        name: "clientSecret",
        label: "GitHub OAuth Client Secret (Optional)",
        type: "password",
        placeholder: "github_oauth_secret...",
        required: false,
        description: "OAuth App Client Secret from GitHub (for OAuth flow)"
      }
    ]
  },
  {
    id: "gitlab",
    name: "GitLab",
    service: "gitlab",
    category: "Repository",
    icon: Gitlab,
    description: "Connect GitLab for alternative repository hosting",
    required: false,
    fields: [
      {
        name: "clientId",
        label: "GitLab Application ID",
        type: "text",
        placeholder: "abc123def456...",
        required: true
      },
      {
        name: "clientSecret",
        label: "GitLab Secret",
        type: "password",
        placeholder: "gla_...",
        required: true
      },
      {
        name: "baseUrl",
        label: "GitLab Instance URL",
        type: "url",
        placeholder: "https://gitlab.com",
        required: false,
        description: "Leave empty for GitLab.com, or enter your self-hosted URL"
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
    required: false,
    fields: [
      {
        name: "apiKey",
        label: "OpenAI API Key",
        type: "password",
        placeholder: "sk-...",
        required: true,
        description: "Get your API key from OpenAI platform.openai.com"
      },
      {
        name: "organization",
        label: "Organization ID",
        type: "text",
        placeholder: "org-...",
        required: false,
        description: "Optional: Your OpenAI organization ID"
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
  },
  {
    id: "twilio",
    name: "Twilio",
    service: "twilio",
    category: "Communication",
    icon: MessageSquare,
    description: "Send SMS notifications and voice calls",
    required: false,
    fields: [
      {
        name: "accountSid",
        label: "Account SID",
        type: "text",
        placeholder: "AC...",
        required: true,
        description: "Your Twilio Account SID"
      },
      {
        name: "authToken",
        label: "Auth Token",
        type: "password",
        placeholder: "...",
        required: true,
        description: "Your Twilio Auth Token"
      },
      {
        name: "phoneNumber",
        label: "Twilio Phone Number",
        type: "text",
        placeholder: "+1234567890",
        required: true,
        description: "Your Twilio phone number for sending SMS"
      }
    ]
  }
];

export default function IntegrationsSetup() {
  const [match, params] = useRoute("/integrations/setup");
  const { toast } = useToast();

  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState(false);

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
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <IconComponent className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>{template.name} Integration</CardTitle>
              <CardDescription>{template.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {existingIntegration && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                This integration is already configured and active. Updating will replace the existing configuration.
              </AlertDescription>
            </Alert>
          )}

          {template.fields.map(field => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name}>{field.label}</Label>
              <div className="relative">
                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type === "password" && !showPassword[field.name] ? "password" : "text"}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                  />
                )}
                {field.type === "password" && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
                <p className="text-xs text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}

          <div className="flex space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testingConnection || testConnectionMutation.isPending}
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
            >
              {saveIntegrationMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Key className="h-4 w-4 mr-2" />
              )}
              Save to KeyVault
            </Button>
            <Button variant="ghost" onClick={() => setSelectedIntegration(null)}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="flex items-center space-x-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-2xl font-bold">Integrations Setup</h1>
              <Badge variant="secondary">
                <Shield className="h-3 w-3 mr-1" />
                Azure KeyVault Secured
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Configure your integrations securely. All credentials are encrypted and stored in Azure KeyVault.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Integration Selection */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Available Integrations</h2>

            {integrationTemplates.map(template => {
              const IconComponent = template.icon;
              const existingIntegration = getIntegrationStatus(template.service);

              return (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedIntegration === template.service ? "ring-2 ring-blue-500" : ""
                  }`}
                  onClick={() => setSelectedIntegration(template.service)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {template.required && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                        {existingIntegration ? (
                          <Badge
                            variant={existingIntegration.status === "active" ? "default" : "destructive"}
                            className="text-xs"
                          >
                            {existingIntegration.status === "active" ? (
                              <>
                                <Check className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <X className="h-3 w-3 mr-1" />
                                {existingIntegration.status}
                              </>
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Not Configured</Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Integration Configuration */}
          <div>
            {selectedIntegration ? (
              renderIntegrationForm()
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Select an Integration</h3>
                  <p className="text-muted-foreground">
                    Choose an integration from the list to configure its settings and credentials.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <Alert className="mt-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Security:</strong> All credentials are encrypted using Azure KeyVault industry-standard encryption.
            Your sensitive data is never stored in plain text and follows enterprise security best practices.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}