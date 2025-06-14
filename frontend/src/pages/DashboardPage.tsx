import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { getAgents } from '../lib/api';
import ChatWindow from '../components/chat/ChatWindow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Activity, 
  Bot, 
  Cloud, 
  Server, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Users,
  Settings,
  Terminal,
  FileText,
  GitBranch
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  description?: string;
  status?: 'online' | 'busy' | 'offline';
  expertise?: string[];
}

const DashboardPage = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('agents');
  
  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  // Mock data for analytics and team features
  const analytics = {
    totalQueries: 1247,
    timesSaved: 127,
    activeAgents: 6,
    teamMembers: 12
  };

  const recentActivity = [
    { action: 'Terraform deployment', agent: 'Terraform Agent', time: '2 minutes ago', status: 'success' },
    { action: 'K8s troubleshooting', agent: 'Kubernetes Agent', time: '5 minutes ago', status: 'in-progress' },
    { action: 'AWS cost analysis', agent: 'AWS Agent', time: '10 minutes ago', status: 'completed' },
    { action: 'Security audit', agent: 'Security Agent', time: '15 minutes ago', status: 'completed' }
  ];

  const agentIcons = {
    'Terraform Agent': <FileText className="w-6 h-6" />,
    'Kubernetes Agent': <Server className="w-6 h-6" />,
    'AWS Agent': <Cloud className="w-6 h-6" />,
    'Monitoring Agent': <Activity className="w-6 h-6" />,
    'Incident Agent': <AlertTriangle className="w-6 h-6" />,
    'Security Agent': <Shield className="w-6 h-6" />
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            AI DevOps Command Center
          </h1>
          <p className="text-gray-300">
            Your intelligent infrastructure management platform
          </p>
        </motion.div>

        {/* Analytics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Queries</p>
                  <p className="text-2xl font-bold text-white">{analytics.totalQueries}</p>
                </div>
                <Bot className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Hours Saved</p>
                  <p className="text-2xl font-bold text-white">{analytics.timesSaved}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Active Agents</p>
                  <p className="text-2xl font-bold text-white">{analytics.activeAgents}</p>
                </div>
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Team Members</p>
                  <p className="text-2xl font-bold text-white">{analytics.teamMembers}</p>
                </div>
                <Users className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur border-white/20">
            <TabsTrigger value="agents" className="text-white">AI Agents</TabsTrigger>
            <TabsTrigger value="activity" className="text-white">Recent Activity</TabsTrigger>
            <TabsTrigger value="analytics" className="text-white">Analytics</TabsTrigger>
            <TabsTrigger value="settings" className="text-white">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="space-y-6">
            {isLoading && (
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardContent className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                  <p className="text-white">Loading AI agents...</p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Card className="bg-red-500/20 backdrop-blur border-red-500/30">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-300">Failed to load AI agents. Please check your connection.</p>
                </CardContent>
              </Card>
            )}

            {agents && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {agents.map((agent, index) => (
                  <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`cursor-pointer transition-all duration-300 ${
                        selectedAgent?.id === agent.id 
                          ? 'bg-blue-500/30 border-blue-400 ring-2 ring-blue-400' 
                          : 'bg-white/10 backdrop-blur border-white/20 hover:bg-white/15'
                      }`}
                      onClick={() => setSelectedAgent(agent)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {agentIcons[agent.name as keyof typeof agentIcons] || <Bot className="w-6 h-6" />}
                            <div>
                              <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                              <div className="flex items-center space-x-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${getStatusColor('online')}`}></div>
                                <span className="text-xs text-gray-300">Online</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-300 text-sm mb-3">
                          {agent.description || `Specialized ${agent.name.toLowerCase()} for DevOps tasks`}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((capability, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {capability}
                            </Badge>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{agent.capabilities.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="bg-black/40 backdrop-blur border-white/20">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl flex items-center space-x-3">
                      {agentIcons[selectedAgent.name as keyof typeof agentIcons] || <Bot className="w-8 h-8" />}
                      <span>Chat with {selectedAgent.name}</span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Get expert assistance with {selectedAgent.capabilities.join(', ').toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ChatWindow agentName={selectedAgent.name} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-300">
                  Latest AI agent interactions and system events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-4 p-4 rounded-lg bg-white/5"
                  >
                    <div className={`w-3 h-3 rounded-full ${
                      activity.status === 'success' ? 'bg-green-400' :
                      activity.status === 'in-progress' ? 'bg-yellow-400' :
                      'bg-blue-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{activity.action}</p>
                      <p className="text-gray-300 text-sm">{activity.agent} • {activity.time}</p>
                    </div>
                    <Badge variant={
                      activity.status === 'success' ? 'default' :
                      activity.status === 'in-progress' ? 'secondary' :
                      'outline'
                    }>
                      {activity.status}
                    </Badge>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Usage Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-300">
                    Analytics charts will be implemented here
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Agent Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-300">
                    Performance metrics will be displayed here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Platform Settings</CardTitle>
                <CardDescription className="text-gray-300">
                  Configure your AI DevOps platform preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Real-time Notifications</p>
                    <p className="text-gray-300 text-sm">Get notified of agent activities</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Team Collaboration</p>
                    <p className="text-gray-300 text-sm">Manage team access and permissions</p>
                  </div>
                  <Button variant="outline" size="sm">Manage</Button>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                  <div>
                    <p className="text-white font-medium">Privacy Settings</p>
                    <p className="text-gray-300 text-sm">Control data sharing and privacy</p>
                  </div>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardPage;