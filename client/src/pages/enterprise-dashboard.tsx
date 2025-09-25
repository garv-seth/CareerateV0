import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ArrowLeft,
  Bot,
  Server,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  Database,
  CloudUpload,
  GitBranch,
  Monitor,
  Zap,
  Users,
  DollarSign,
  BarChart3,
  Brain,
  Lock,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface AIAgent {
  id: string;
  name: string;
  type: 'devops' | 'security' | 'performance' | 'migration';
  status: 'idle' | 'working' | 'completed' | 'error';
  project_id: string;
  project_name: string;
  last_action: string;
  uptime: number;
  success_rate: number;
}

interface DeploymentStatus {
  project_id: string;
  status: string;
  infrastructure: {
    provider: string;
    resources: string[];
    cost: number;
  };
  security: {
    score: number;
    vulnerabilities: number;
    lastScan: string;
  };
  performance: {
    uptime: number;
    responseTime: number;
    throughput: number;
  };
}

interface MigrationProject {
  id: string;
  name: string;
  phase: string;
  progress: number;
  status: 'planning' | 'in_progress' | 'completed' | 'on_hold';
  complexity_score: number;
  estimated_completion: string;
  cost_savings: number;
}

export default function EnterpriseDashboard() {
  const { toast } = useToast();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  // Fetch Cara Agents status
  const { data: agentsData, isLoading: agentsLoading } = useQuery({
    queryKey: ['ai-agents-status'],
    queryFn: async () => {
      const response = await fetch('/api/ai-agents/status', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    },
    refetchInterval: 5000 // Real-time updates
  });

  // Fetch migration projects
  const { data: migrationsData } = useQuery({
    queryKey: ['enterprise-migrations'],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/migrations', {
        credentials: 'include'
      });
      if (!response.ok) {
        // Return mock data if endpoint doesn't exist yet
        return {
          success: true,
          migrations: [
            {
              id: '1',
              name: 'Legacy Banking System Migration',
              phase: 'Infrastructure Setup',
              progress: 35,
              status: 'in_progress',
              complexity_score: 8,
              estimated_completion: '4 months',
              cost_savings: 250000
            },
            {
              id: '2',
              name: 'E-commerce Platform Modernization',
              phase: 'Application Migration',
              progress: 60,
              status: 'in_progress',
              complexity_score: 6,
              estimated_completion: '2 months',
              cost_savings: 150000
            }
          ]
        };
      }
      return response.json();
    }
  });

  // Deploy Cara Agent mutation
  const deployAgentMutation = useMutation({
    mutationFn: async ({ projectId, repositoryUrl, requirements }: {
      projectId: string;
      repositoryUrl: string;
      requirements: string;
    }) => {
      const response = await fetch('/api/ai-agents/devops/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ projectId, repositoryUrl, requirements })
      });
      if (!response.ok) throw new Error('Deployment failed');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Cara Agent Deployed",
        description: "DevOps automation agent is now managing your infrastructure"
      });
    }
  });

  const agents: AIAgent[] = agentsData?.agents || [];
  const migrations: MigrationProject[] = migrationsData?.migrations || [];

  const totalAgents = agents.length;
  const activeAgents = agents.filter(a => a.status === 'working').length;
  const averageUptime = agents.length > 0 ?
    agents.reduce((acc, agent) => acc + agent.uptime, 0) / agents.length : 0;
  const totalCostSavings = migrations.reduce((acc, m) => acc + m.cost_savings, 0);

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Enterprise AI Operations</h1>
            <p className="text-muted-foreground">
              AI-driven DevOps, Security, and Migration Management
            </p>
          </div>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Sparkles className="h-3 w-3 mr-1" />
          Enterprise Only
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Bot className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Cara Agents</p>
                <p className="text-2xl font-bold">{activeAgents}/{totalAgents}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-2xl font-bold">{averageUptime.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <CloudUpload className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Migrations</p>
                <p className="text-2xl font-bold">{migrations.filter(m => m.status === 'in_progress').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">${(totalCostSavings / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="agents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="agents">Cara Agents</TabsTrigger>
          <TabsTrigger value="migrations">Enterprise Migrations</TabsTrigger>
          <TabsTrigger value="security">Security & Compliance</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        {/* Cara Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Agents List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI DevOps Agents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-4">
                      {agents.map((agent) => (
                        <div
                          key={agent.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                            selectedAgent === agent.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-border hover:bg-muted/50'
                          }`}
                          onClick={() => setSelectedAgent(agent.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                agent.status === 'working' ? 'bg-green-50' :
                                agent.status === 'completed' ? 'bg-blue-50' :
                                agent.status === 'error' ? 'bg-red-50' : 'bg-gray-50'
                              }`}>
                                <Bot className={`h-4 w-4 ${
                                  agent.status === 'working' ? 'text-green-600' :
                                  agent.status === 'completed' ? 'text-blue-600' :
                                  agent.status === 'error' ? 'text-red-600' : 'text-gray-600'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold">{agent.project_name}</h4>
                                <p className="text-sm text-muted-foreground">{agent.name}</p>
                              </div>
                            </div>
                            <Badge variant={
                              agent.status === 'working' ? 'default' :
                              agent.status === 'completed' ? 'secondary' :
                              agent.status === 'error' ? 'destructive' : 'outline'
                            }>
                              {agent.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {agent.last_action}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Uptime: {agent.uptime}%</span>
                            <span>Success: {agent.success_rate}%</span>
                          </div>
                        </div>
                      ))}

                      {agents.length === 0 && (
                        <div className="text-center py-8">
                          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No AI agents deployed yet</p>
                          <Button
                            className="mt-4"
                            onClick={() => deployAgentMutation.mutate({
                              projectId: 'demo-project',
                              repositoryUrl: 'https://github.com/example/repo',
                              requirements: 'Deploy with full automation'
                            })}
                            disabled={deployAgentMutation.isPending}
                          >
                            {deployAgentMutation.isPending ? 'Deploying...' : 'Deploy Cara Agent'}
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Agent Details */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Real-time Operations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertDescription>
                        AI agents are actively monitoring and optimizing your infrastructure
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Infrastructure Health</span>
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          Optimal
                        </Badge>
                      </div>
                      <Progress value={95} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Security Score</span>
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          95/100
                        </Badge>
                      </div>
                      <Progress value={95} className="h-2" />

                      <div className="flex items-center justify-between">
                        <span className="text-sm">Cost Optimization</span>
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          87%
                        </Badge>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Recent Actions</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>Auto-scaled containers +2</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-blue-500" />
                          <span>Security scan completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span>Performance optimized</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Enterprise Migrations Tab */}
        <TabsContent value="migrations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {migrations.map((migration) => (
              <Card key={migration.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{migration.name}</CardTitle>
                    <Badge variant={
                      migration.status === 'in_progress' ? 'default' :
                      migration.status === 'completed' ? 'secondary' :
                      migration.status === 'on_hold' ? 'destructive' : 'outline'
                    }>
                      {migration.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Current Phase: {migration.phase}</span>
                        <span className="text-sm font-medium">{migration.progress}%</span>
                      </div>
                      <Progress value={migration.progress} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Complexity</p>
                        <p className="font-semibold">{migration.complexity_score}/10</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Timeline</p>
                        <p className="font-semibold">{migration.estimated_completion}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost Savings</p>
                        <p className="font-semibold text-green-600">
                          ${(migration.cost_savings / 1000).toFixed(0)}K
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-semibold">On Track</p>
                      </div>
                    </div>

                    <Button className="w-full" variant="outline">
                      View Migration Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security & Compliance Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Overall Security Score</span>
                    <Badge variant="outline" className="text-green-600 border-green-200">
                      95/100
                    </Badge>
                  </div>
                  <Progress value={95} className="h-2" />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Vulnerabilities</span>
                      <span className="text-green-600">0 Critical</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Compliance</span>
                      <span className="text-blue-600">SOC2, GDPR</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Last Scan</span>
                      <span>2 hours ago</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Compliance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">SOC 2 Type II</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">GDPR Compliance</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">ISO 27001</span>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">HIPAA</span>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">99.9%</p>
                    <p className="text-sm text-muted-foreground">Average Uptime</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">120ms</p>
                    <p className="text-sm text-muted-foreground">Response Time</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">1.5K</p>
                    <p className="text-sm text-muted-foreground">Requests/min</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">35%</p>
                    <p className="text-sm text-muted-foreground">Cost Reduction</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">$150/mo</p>
                    <p className="text-sm text-muted-foreground">Current Spend</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">$400K</p>
                    <p className="text-sm text-muted-foreground">Annual Savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Efficiency
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">80%</p>
                    <p className="text-sm text-muted-foreground">Automation Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">2.5hrs</p>
                    <p className="text-sm text-muted-foreground">Daily Time Saved</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">95%</p>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}