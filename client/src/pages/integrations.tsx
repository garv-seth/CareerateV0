import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Plus,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  Shield,
  Cloud,
  Database,
  Activity,
  Server,
  GitBranch,
  Container,
  Monitor,
  Zap,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface DevOpsIntegration {
  id: string;
  name: string;
  description: string;
  category: 'container' | 'cloud' | 'monitoring' | 'database' | 'security' | 'deployment' | 'source-control';
  icon: React.ElementType;
  status: 'connected' | 'disconnected' | 'configuring' | 'error';
  provider: string;
  authType: 'oauth' | 'api-key' | 'service-account';
  setupUrl?: string;
  documentation?: string;
}

const devopsIntegrations: DevOpsIntegration[] = [
  // Container & Orchestration
  {
    id: 'docker',
    name: 'Docker',
    description: 'Container platform for building, sharing, and running applications',
    category: 'container',
    icon: Container,
    status: 'disconnected',
    provider: 'docker',
    authType: 'api-key'
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    description: 'Container orchestration platform for automated deployment and scaling',
    category: 'container',
    icon: Server,
    status: 'disconnected',
    provider: 'kubernetes',
    authType: 'service-account'
  },

  // Cloud Platforms
  {
    id: 'aws',
    name: 'Amazon Web Services',
    description: 'Cloud computing platform with comprehensive services',
    category: 'cloud',
    icon: Cloud,
    status: 'disconnected',
    provider: 'aws',
    authType: 'api-key'
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    description: 'Cloud computing service for building, testing, deploying applications',
    category: 'cloud',
    icon: Cloud,
    status: 'connected',
    provider: 'azure',
    authType: 'service-account'
  },
  {
    id: 'gcp',
    name: 'Google Cloud Platform',
    description: 'Suite of cloud computing services running on Google infrastructure',
    category: 'cloud',
    icon: Cloud,
    status: 'disconnected',
    provider: 'gcp',
    authType: 'service-account'
  },

  // Monitoring & Observability
  {
    id: 'datadog',
    name: 'Datadog',
    description: 'Monitoring and analytics platform for cloud-scale applications',
    category: 'monitoring',
    icon: Activity,
    status: 'disconnected',
    provider: 'datadog',
    authType: 'api-key'
  },
  {
    id: 'newrelic',
    name: 'New Relic',
    description: 'Full-stack observability platform for monitoring applications',
    category: 'monitoring',
    icon: Monitor,
    status: 'disconnected',
    provider: 'newrelic',
    authType: 'api-key'
  },
  {
    id: 'grafana',
    name: 'Grafana',
    description: 'Open source analytics and interactive visualization platform',
    category: 'monitoring',
    icon: Activity,
    status: 'disconnected',
    provider: 'grafana',
    authType: 'api-key'
  },

  // Databases
  {
    id: 'mongodb',
    name: 'MongoDB Atlas',
    description: 'Multi-cloud database service built for modern applications',
    category: 'database',
    icon: Database,
    status: 'disconnected',
    provider: 'mongodb',
    authType: 'api-key'
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    description: 'Cloud data platform for data warehousing and analytics',
    category: 'database',
    icon: Database,
    status: 'disconnected',
    provider: 'snowflake',
    authType: 'api-key'
  },

  // Security
  {
    id: 'vault',
    name: 'HashiCorp Vault',
    description: 'Secrets management and data protection platform',
    category: 'security',
    icon: Shield,
    status: 'disconnected',
    provider: 'vault',
    authType: 'api-key'
  },

  // Deployment & CI/CD
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Platform for frontend frameworks and static sites',
    category: 'deployment',
    icon: Zap,
    status: 'disconnected',
    provider: 'vercel',
    authType: 'oauth'
  },
  {
    id: 'netlify',
    name: 'Netlify',
    description: 'Platform for deploying and hosting modern web projects',
    category: 'deployment',
    icon: Globe,
    status: 'disconnected',
    provider: 'netlify',
    authType: 'oauth'
  }
];

const categoryNames = {
  container: 'Container & Orchestration',
  cloud: 'Cloud Platforms',
  monitoring: 'Monitoring & Observability',
  database: 'Databases',
  security: 'Security',
  deployment: 'Deployment',
  'source-control': 'Source Control'
};

export default function Integrations() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [configureIntegration, setConfigureIntegration] = useState<DevOpsIntegration | null>(null);
  const [credentials, setCredentials] = useState({ apiKey: '', endpoint: '' });
  const { toast } = useToast();

  const filteredIntegrations = devopsIntegrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(categoryNames) as Array<keyof typeof categoryNames>;
  const connectedCount = devopsIntegrations.filter(i => i.status === 'connected').length;

  const handleConfigure = (integration: DevOpsIntegration) => {
    setConfigureIntegration(integration);
    setCredentials({ apiKey: '', endpoint: '' });
  };

  const handleSaveConfiguration = () => {
    if (!configureIntegration) return;

    // Here you would save to your backend
    toast({
      title: `${configureIntegration.name} configured`,
      description: 'Integration has been successfully connected',
    });

    setConfigureIntegration(null);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'configuring':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'configuring':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DevOps Integrations</h1>
                <p className="text-sm text-gray-600">{connectedCount} connected</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search integrations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Filter */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Integrations
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap"
              >
                {categoryNames[category]}
              </Button>
            ))}
          </div>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => (
            <Card key={integration.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <integration.icon className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {categoryNames[integration.category]}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(integration.status)}
                  <Badge className={getStatusColor(integration.status)} variant="outline">
                    {integration.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {integration.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Auth: {integration.authType.replace('-', ' ')}
                  </div>
                  <Button
                    size="sm"
                    variant={integration.status === 'connected' ? 'outline' : 'default'}
                    onClick={() => handleConfigure(integration)}
                  >
                    {integration.status === 'connected' ? (
                      <>
                        <Settings className="h-3 w-3 mr-1" />
                        Configure
                      </>
                    ) : (
                      <>
                        <Plus className="h-3 w-3 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredIntegrations.length === 0 && (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No integrations found</h3>
            <p className="text-gray-600">
              Try adjusting your search or category filter
            </p>
          </div>
        )}
      </div>

      {/* Configuration Dialog */}
      <Dialog open={!!configureIntegration} onOpenChange={() => setConfigureIntegration(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {configureIntegration && (
                <>
                  <configureIntegration.icon className="h-5 w-5" />
                  <span>Configure {configureIntegration.name}</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect {configureIntegration?.name} to your deployment pipeline.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {configureIntegration?.authType === 'api-key' && (
              <div>
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={credentials.apiKey}
                  onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
                  placeholder="Enter your API key"
                />
              </div>
            )}

            {(configureIntegration?.authType === 'api-key' || configureIntegration?.authType === 'service-account') && (
              <div>
                <Label htmlFor="endpoint">Endpoint URL (optional)</Label>
                <Input
                  id="endpoint"
                  value={credentials.endpoint}
                  onChange={(e) => setCredentials({...credentials, endpoint: e.target.value})}
                  placeholder="https://api.example.com"
                />
              </div>
            )}

            {configureIntegration?.authType === 'oauth' && (
              <div className="text-center py-4">
                <Button className="w-full">
                  Connect with {configureIntegration.name}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  You'll be redirected to {configureIntegration.name} to authorize access
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigureIntegration(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveConfiguration}
              disabled={configureIntegration?.authType === 'api-key' && !credentials.apiKey}
            >
              Connect Integration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}