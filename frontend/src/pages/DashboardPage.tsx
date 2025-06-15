import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Bot, Cloud, Code, Shield, Zap, BarChart3, 
  Server, GitBranch, Activity, Settings, 
  TrendingUp, Users, Clock, CheckCircle,
  AlertTriangle, DollarSign, Database, 
  Monitor, Globe, Terminal, Cpu
} from 'lucide-react';
import { getAgents } from '../lib/api';
import ChatWindow from '../components/chat/ChatWindow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  description?: string;
  status?: 'online' | 'busy' | 'offline';
}

const DashboardPage = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [activeTab, setActiveTab] = useState('agents');
  
  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  const analytics = {
    totalQueries: 1247,
    timesSaved: 127,
    activeAgents: 6,
    teamMembers: 12
  };

  const recentActivity = [
    { action: 'Terraform deployment created', agent: 'Terraform Agent', time: '2 minutes ago', status: 'success' },
    { action: 'Kubernetes pods analyzed', agent: 'Kubernetes Agent', time: '5 minutes ago', status: 'in-progress' },
    { action: 'AWS cost optimization', agent: 'AWS Agent', time: '10 minutes ago', status: 'completed' },
    { action: 'Security audit performed', agent: 'Security Agent', time: '15 minutes ago', status: 'completed' }
  ];

  const agentDetails = {
    'Terraform Agent': {
      icon: Code,
      color: 'from-blue-500 to-blue-600',
      capabilities: ['Infrastructure as Code', 'State Management', 'Multi-Cloud Deployment', 'Cost Estimation'],
      description: 'Advanced Terraform automation with intelligent state management and multi-cloud optimization'
    },
    'Kubernetes Agent': {
      icon: Server,
      color: 'from-purple-500 to-purple-600',
      capabilities: ['Container Orchestration', 'Auto-scaling', 'Health Monitoring', 'Security Scanning'],
      description: 'Kubernetes expert with automated deployment, scaling, and comprehensive cluster management'
    },
    'AWS Agent': {
      icon: Cloud,
      color: 'from-orange-500 to-orange-600',
      capabilities: ['Resource Management', 'Cost Optimization', 'Security Auditing', 'Performance Tuning'],
      description: 'AWS specialist with intelligent cost optimization and automated resource management'
    },
    'Monitoring Agent': {
      icon: Monitor,
      color: 'from-green-500 to-green-600',
      capabilities: ['Real-time Metrics', 'Alerting', 'Performance Analysis', 'Predictive Analytics'],
      description: 'Advanced monitoring with AI-powered anomaly detection and predictive analytics'
    },
    'Incident Agent': {
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      capabilities: ['Incident Response', 'Root Cause Analysis', 'Auto-remediation', 'Post-mortem Analysis'],
      description: 'Intelligent incident management with automated response and root cause analysis'
    },
    'Security Agent': {
      icon: Shield,
      color: 'from-indigo-500 to-indigo-600',
      capabilities: ['Vulnerability Scanning', 'Compliance Checking', 'Threat Detection', 'Policy Enforcement'],
      description: 'Comprehensive security automation with continuous compliance and threat detection'
    },
    'General Agent': {
      icon: Bot,
      color: 'from-gray-500 to-gray-600',
      capabilities: ['DevOps Best Practices', 'Documentation', 'Troubleshooting', 'Knowledge Base'],
      description: 'General DevOps expertise with comprehensive knowledge and best practice guidance'
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-950 dark:to-blue-950 transition-colors">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-6xl font-black mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
            Careerate AI Platform
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-4 font-medium">
            Next-Generation DevOps Intelligence
          </p>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto">
            Multi-cloud management, infrastructure automation, and intelligent monitoring with specialized AI agents
          </p>
        </motion.div>

        {/* Analytics Dashboard */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20 dark:border-blue-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">AI Queries Processed</p>
                  <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{analytics.totalQueries.toLocaleString()}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +12% this week
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-blue-500/20">
                  <Bot className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-200/20 dark:border-green-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Development Hours Saved</p>
                  <p className="text-3xl font-black text-green-600 dark:text-green-400">{analytics.timesSaved}</p>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                    <Clock className="w-3 h-3 mr-1" />
                    This month
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-500/20">
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/20 dark:border-purple-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Active AI Agents</p>
                  <p className="text-3xl font-black text-purple-600 dark:text-purple-400">{analytics.activeAgents}</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    All operational
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-500/20">
                  <Server className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200/20 dark:border-orange-800/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Cloud Cost Savings</p>
                  <p className="text-3xl font-black text-orange-600 dark:text-orange-400">$12.4K</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                    <DollarSign className="w-3 h-3 mr-1" />
                    Last 30 days
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <BarChart3 className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div 
          className="mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex space-x-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg border border-gray-200/50 dark:border-gray-700/50 rounded-2xl p-2 shadow-xl">
            {[
              { key: 'agents', label: 'AI Agents', icon: Bot },
              { key: 'activity', label: 'Activity', icon: Activity },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 },
              { key: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                      : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content Sections */}
        {activeTab === 'agents' && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {isLoading && (
              <motion.div 
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500/30 border-t-blue-500 mx-auto mb-6"></div>
                <p className="text-gray-600 dark:text-gray-300 text-lg">Initializing AI agents...</p>
              </motion.div>
            )}

            {error && (
              <motion.div 
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl p-8 text-center"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-700 dark:text-red-300 text-lg">Failed to load AI agents. Please check your connection.</p>
              </motion.div>
            )}

            {/* AI Agents Grid */}
            {(agents || !isLoading) && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {Object.entries(agentDetails).map(([agentName, details], index) => {
                  const Icon = details.icon;
                  const isSelected = selectedAgent?.name === agentName;
                  
                  return (
                    <motion.div
                      key={agentName}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
                      whileHover={{ y: -8, scale: 1.02 }}
                      onClick={() => setSelectedAgent({ 
                        id: agentName.toLowerCase().replace(' ', '-'), 
                        name: agentName, 
                        capabilities: details.capabilities,
                        description: details.description
                      })}
                    >
                      <Card className={`cursor-pointer transition-all duration-500 h-full ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 shadow-2xl shadow-blue-500/20 bg-blue-50/50 dark:bg-blue-900/20' 
                          : 'hover:shadow-2xl hover:shadow-gray-300/20 dark:hover:shadow-gray-700/20 bg-white/80 dark:bg-gray-800/80'
                      } backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50`}>
                        <CardHeader className="pb-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className={`p-4 rounded-2xl bg-gradient-to-r ${details.color} shadow-lg`}>
                              <Icon className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                              <Badge variant="secondary" className="text-xs font-medium">
                                Online
                              </Badge>
                            </div>
                          </div>
                          <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            {agentName}
                          </CardTitle>
                          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                            {details.description}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Core Capabilities</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {details.capabilities.map((capability, idx) => (
                                  <Badge 
                                    key={idx} 
                                    variant="outline" 
                                    className="text-xs justify-center py-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                                  >
                                    {capability}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            
                            <Button 
                              className={`w-full ${
                                isSelected 
                                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                              } text-white font-medium`}
                            >
                              {isSelected ? 'Chat Active' : 'Start Chat'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* AI Chat Interface */}
            {selectedAgent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-4 rounded-2xl bg-gradient-to-r ${agentDetails[selectedAgent.name as keyof typeof agentDetails]?.color || 'from-gray-500 to-gray-600'} shadow-lg`}>
                        {React.createElement(agentDetails[selectedAgent.name as keyof typeof agentDetails]?.icon || Bot, {
                          className: "w-8 h-8 text-white"
                        })}
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                          Chat with {selectedAgent.name}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-300">
                          {agentDetails[selectedAgent.name as keyof typeof agentDetails]?.description}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ChatWindow agentName={selectedAgent.name} />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Real-time Activity Feed */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <Activity className="w-6 h-6 text-blue-500" />
                    Real-time Activity
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">Live AI agent interactions and system events</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const statusConfig = {
                        'success': { color: 'bg-green-500', textColor: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-50 dark:bg-green-900/20' },
                        'in-progress': { color: 'bg-yellow-500', textColor: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20' },
                        'completed': { color: 'bg-blue-500', textColor: 'text-blue-700 dark:text-blue-300', bgColor: 'bg-blue-50 dark:bg-blue-900/20' }
                      };
                      
                      const config = statusConfig[activity.status as keyof typeof statusConfig] || statusConfig.completed;
                      
                      return (
                        <motion.div 
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className={`flex items-center space-x-4 p-4 rounded-xl ${config.bgColor} border border-gray-200/50 dark:border-gray-700/50`}
                        >
                          <div className={`w-3 h-3 rounded-full ${config.color} ${activity.status === 'in-progress' ? 'animate-pulse' : ''}`}></div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">{activity.action}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              {activity.agent} • {activity.time}
                            </p>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={`${config.textColor} border-current font-medium`}
                          >
                            {activity.status}
                          </Badge>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* System Health Overview */}
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <Monitor className="w-6 h-6 text-green-500" />
                    System Health
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">Infrastructure and agent status overview</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">Uptime</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">99.9%</p>
                          </div>
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Response Time</p>
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">127ms</p>
                          </div>
                          <Zap className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(agentDetails).slice(0, 4).map(([agentName, details]) => (
                        <div key={agentName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-r ${details.color}`}>
                              {React.createElement(details.icon, { className: "w-4 h-4 text-white" })}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{agentName}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-sm text-green-600 dark:text-green-400">Operational</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics Preview */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                  Performance Analytics
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">AI agent performance and usage insights</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl">
                    <Database className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">2.1TB</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Data Processed</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl">
                    <Cpu className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">847</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Tasks Automated</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl">
                    <Globe className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">12</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">Cloud Regions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20 dark:border-blue-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Infrastructure Efficiency</p>
                      <p className="text-3xl font-black text-blue-600 dark:text-blue-400">94.2%</p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        +8.3% vs competitors
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-500/20">
                      <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200/20 dark:border-purple-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">AI Accuracy Rate</p>
                      <p className="text-3xl font-black text-purple-600 dark:text-purple-400">98.7%</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Industry leading
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-500/20">
                      <Bot className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 border-green-200/20 dark:border-green-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">Cost Optimization</p>
                      <p className="text-3xl font-black text-green-600 dark:text-green-400">$47.2K</p>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Saved this quarter
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-500/20">
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border-orange-200/20 dark:border-orange-800/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">MTTR Reduction</p>
                      <p className="text-3xl font-black text-orange-600 dark:text-orange-400">73%</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        Faster incident resolution
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/20">
                      <Shield className="w-8 h-8 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Advanced Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <TrendingUp className="w-6 h-6 text-blue-500" />
                    Multi-Cloud Usage Trends
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">Resource utilization across AWS, Azure, and GCP</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Cloud className="w-8 h-8 text-blue-500" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">AWS</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Primary infrastructure</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">67%</p>
                        <p className="text-sm text-green-600 dark:text-green-400">+12% efficiency</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Server className="w-8 h-8 text-purple-500" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">Azure</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">AI/ML workloads</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">23%</p>
                        <p className="text-sm text-green-600 dark:text-green-400">+18% utilization</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <Database className="w-8 h-8 text-green-500" />
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">GCP</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Data analytics</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">10%</p>
                        <p className="text-sm text-green-600 dark:text-green-400">+25% performance</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                    <Bot className="w-6 h-6 text-purple-500" />
                    AI Agent Performance
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-300">Individual agent effectiveness and accuracy metrics</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(agentDetails).slice(0, 4).map(([agentName, details]) => (
                      <div key={agentName} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${details.color}`}>
                            {React.createElement(details.icon, { className: "w-4 h-4 text-white" })}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{agentName}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-600 dark:text-green-400">
                              {Math.floor(Math.random() * 10) + 90}%
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300">Success rate</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Competitive Advantage Metrics */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg border-gray-200/50 dark:border-gray-700/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-gray-900 dark:text-white">
                  <BarChart3 className="w-6 h-6 text-orange-500" />
                  Competitive Advantage Analysis
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300">How Careerate outperforms industry competitors</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <h4 className="font-bold text-blue-700 dark:text-blue-300 mb-2">vs Traditional DevOps</h4>
                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400 mb-1">10x</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">Faster deployment</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Minutes vs hours</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
                    <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-2">vs a37.ai</h4>
                    <p className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">3x</p>
                    <p className="text-sm text-purple-700 dark:text-purple-300">More AI agents</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">Specialized expertise</p>
                  </div>
                  
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
                    <h4 className="font-bold text-green-700 dark:text-green-300 mb-2">vs arvoai.ca</h4>
                    <p className="text-3xl font-black text-green-600 dark:text-green-400 mb-1">5x</p>
                    <p className="text-sm text-green-700 dark:text-green-300">Better cost optimization</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">AI-driven insights</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Platform Settings</h2>
            <p className="text-gray-300 mb-8">Configure your AI DevOps platform preferences</p>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-6 rounded-lg bg-white/5">
                <div>
                  <h4 className="text-white font-medium text-lg">Real-time Notifications</h4>
                  <p className="text-gray-300 text-sm">Get notified of agent activities and system events</p>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors">
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-lg bg-white/5">
                <div>
                  <h4 className="text-white font-medium text-lg">Team Collaboration</h4>
                  <p className="text-gray-300 text-sm">Manage team access, permissions, and workspace sharing</p>
                </div>
                <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md transition-colors">
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between p-6 rounded-lg bg-white/5">
                <div>
                  <h4 className="text-white font-medium text-lg">Privacy & Security</h4>
                  <p className="text-gray-300 text-sm">Control data sharing, privacy levels, and security settings</p>
                </div>
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors">
                  Configure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;