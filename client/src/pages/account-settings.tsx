import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  ArrowLeft,
  User,
  Shield,
  Key,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Secret {
  id: string;
  name: string;
  description: string;
  type: 'api-key' | 'oauth-token' | 'certificate' | 'database-url' | 'webhook-secret';
  environment: 'development' | 'staging' | 'production' | 'all';
  lastUsed?: string;
  expiresAt?: string;
  isActive: boolean;
}

const mockSecrets: Secret[] = [
  {
    id: '1',
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for AI code generation',
    type: 'api-key',
    environment: 'all',
    lastUsed: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    name: 'DATABASE_URL',
    description: 'PostgreSQL database connection string',
    type: 'database-url',
    environment: 'production',
    isActive: true
  },
  {
    id: '3',
    name: 'STRIPE_SECRET_KEY',
    description: 'Stripe payment processing secret key',
    type: 'api-key',
    environment: 'production',
    expiresAt: '2024-12-31',
    isActive: true
  }
];

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [secrets, setSecrets] = useState<Secret[]>(mockSecrets);
  const [showCreateSecret, setShowCreateSecret] = useState(false);
  const [editingSecret, setEditingSecret] = useState<Secret | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Set<string>>(new Set());
  const [newSecret, setNewSecret] = useState({
    name: '',
    description: '',
    value: '',
    type: 'api-key' as const,
    environment: 'all' as const
  });
  const { toast } = useToast();

  const toggleSecretVisibility = (secretId: string) => {
    const newVisible = new Set(visibleSecrets);
    if (newVisible.has(secretId)) {
      newVisible.delete(secretId);
    } else {
      newVisible.add(secretId);
    }
    setVisibleSecrets(newVisible);
  };

  const handleCreateSecret = () => {
    if (!newSecret.name || !newSecret.value) {
      toast({
        title: 'Missing required fields',
        description: 'Please provide both name and value for the secret',
        variant: 'destructive'
      });
      return;
    }

    const secret: Secret = {
      id: Math.random().toString(36).substr(2, 9),
      name: newSecret.name,
      description: newSecret.description,
      type: newSecret.type,
      environment: newSecret.environment,
      isActive: true
    };

    setSecrets([...secrets, secret]);
    setNewSecret({ name: '', description: '', value: '', type: 'api-key', environment: 'all' });
    setShowCreateSecret(false);

    toast({
      title: 'Secret created',
      description: `${newSecret.name} has been securely stored`
    });
  };

  const handleDeleteSecret = (secretId: string) => {
    setSecrets(secrets.filter(s => s.id !== secretId));
    toast({
      title: 'Secret deleted',
      description: 'The secret has been permanently removed'
    });
  };

  const getSecretTypeColor = (type: string) => {
    switch (type) {
      case 'api-key':
        return 'bg-blue-100 text-blue-800';
      case 'oauth-token':
        return 'bg-green-100 text-green-800';
      case 'certificate':
        return 'bg-purple-100 text-purple-800';
      case 'database-url':
        return 'bg-orange-100 text-orange-800';
      case 'webhook-secret':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production':
        return 'bg-red-100 text-red-800';
      case 'staging':
        return 'bg-yellow-100 text-yellow-800';
      case 'development':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Account Settings</h1>
                <p className="text-sm text-gray-600">Manage your profile and security settings</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="secrets" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span>Secrets</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Garv" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Seth" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="garv@careerate.com" />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input id="company" defaultValue="Careerate" />
                </div>
                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Secrets Tab */}
          <TabsContent value="secrets" className="space-y-6 mt-8">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Environment Secrets</CardTitle>
                    <CardDescription>
                      Securely store API keys, tokens, and other sensitive data
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateSecret(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Secret
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All secrets are encrypted using AES-256 encryption and stored in Azure Key Vault.
                    Secret values are never displayed in full and are only accessible to your applications.
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  {secrets.map((secret) => (
                    <div
                      key={secret.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-medium text-gray-900">{secret.name}</h4>
                          <Badge className={getSecretTypeColor(secret.type)} variant="outline">
                            {secret.type.replace('-', ' ')}
                          </Badge>
                          <Badge className={getEnvironmentColor(secret.environment)} variant="outline">
                            {secret.environment}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{secret.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          {secret.lastUsed && <span>Last used: {secret.lastUsed}</span>}
                          {secret.expiresAt && <span>Expires: {secret.expiresAt}</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="font-mono text-sm text-gray-600">
                          {visibleSecrets.has(secret.id)
                            ? '••••••••••••••••'
                            : '••••••••'
                          }
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleSecretVisibility(secret.id)}
                        >
                          {visibleSecrets.has(secret.id) ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingSecret(secret)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSecret(secret.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {secrets.length === 0 && (
                    <div className="text-center py-8">
                      <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No secrets yet</h3>
                      <p className="text-gray-600 mb-4">
                        Store your API keys and other sensitive data securely
                      </p>
                      <Button onClick={() => setShowCreateSecret(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first secret
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-8">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your authentication and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">API Access Tokens</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate tokens for programmatic access to your account
                  </p>
                  <Button variant="outline">Generate Token</Button>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Session Management</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    View and manage your active sessions
                  </p>
                  <Button variant="outline">View Sessions</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <span>Danger Zone</span>
                </CardTitle>
                <CardDescription>
                  Irreversible actions that affect your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Delete Account</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Secret Dialog */}
      <Dialog open={showCreateSecret} onOpenChange={setShowCreateSecret}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Secret</DialogTitle>
            <DialogDescription>
              Add a new environment secret to securely store sensitive data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="secretName">Secret Name</Label>
              <Input
                id="secretName"
                value={newSecret.name}
                onChange={(e) => setNewSecret({...newSecret, name: e.target.value})}
                placeholder="e.g., OPENAI_API_KEY"
              />
            </div>

            <div>
              <Label htmlFor="secretDescription">Description</Label>
              <Textarea
                id="secretDescription"
                value={newSecret.description}
                onChange={(e) => setNewSecret({...newSecret, description: e.target.value})}
                placeholder="Describe what this secret is used for"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="secretValue">Secret Value</Label>
              <Input
                id="secretValue"
                type="password"
                value={newSecret.value}
                onChange={(e) => setNewSecret({...newSecret, value: e.target.value})}
                placeholder="Enter the secret value"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secretType">Type</Label>
                <select
                  id="secretType"
                  value={newSecret.type}
                  onChange={(e) => setNewSecret({...newSecret, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="api-key">API Key</option>
                  <option value="oauth-token">OAuth Token</option>
                  <option value="certificate">Certificate</option>
                  <option value="database-url">Database URL</option>
                  <option value="webhook-secret">Webhook Secret</option>
                </select>
              </div>

              <div>
                <Label htmlFor="secretEnvironment">Environment</Label>
                <select
                  id="secretEnvironment"
                  value={newSecret.environment}
                  onChange={(e) => setNewSecret({...newSecret, environment: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Environments</option>
                  <option value="development">Development</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSecret(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSecret}>
              Create Secret
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}