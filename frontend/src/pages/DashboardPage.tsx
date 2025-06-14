import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgents } from '../lib/api';
import ChatWindow from '../components/chat/ChatWindow';

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

  const agentIcons = {
    'Terraform Agent': '🏗️',
    'Kubernetes Agent': '☸️',
    'AWS Agent': '☁️',
    'Monitoring Agent': '📊',
    'Incident Agent': '🚨',
    'Security Agent': '🔒',
    'General Agent': '🤖'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            AI DevOps Command Center
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Your intelligent infrastructure management platform
          </p>
          <p className="text-gray-400">
            Specialized AI agents for Terraform, Kubernetes, AWS, monitoring, and incident response
          </p>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Total Queries</p>
                <p className="text-3xl font-bold text-blue-400">{analytics.totalQueries}</p>
              </div>
              <div className="text-3xl">🤖</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Hours Saved</p>
                <p className="text-3xl font-bold text-green-400">{analytics.timesSaved}</p>
              </div>
              <div className="text-3xl">⏱️</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Active Agents</p>
                <p className="text-3xl font-bold text-purple-400">{analytics.activeAgents}</p>
              </div>
              <div className="text-3xl">🎯</div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm">Team Members</p>
                <p className="text-3xl font-bold text-yellow-400">{analytics.teamMembers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/10 backdrop-blur border border-white/20 rounded-lg p-1">
            {['agents', 'activity', 'analytics', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-white/20 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {activeTab === 'agents' && (
          <div className="space-y-8">
            {isLoading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Loading AI agents...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-8 text-center">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-red-300">Failed to load AI agents. Please check your connection.</p>
              </div>
            )}

            {agents && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    className={`cursor-pointer transition-all duration-300 rounded-lg p-6 ${
                      selectedAgent?.id === agent.id 
                        ? 'bg-blue-500/30 border-2 border-blue-400 shadow-lg shadow-blue-400/20' 
                        : 'bg-white/10 backdrop-blur border border-white/20 hover:bg-white/15 hover:scale-105'
                    }`}
                    onClick={() => setSelectedAgent(agent)}
                  >
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="text-3xl">
                        {agentIcons[agent.name as keyof typeof agentIcons] || '🤖'}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{agent.name}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-400"></div>
                          <span className="text-xs text-gray-300">Online</span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">
                      {agent.description || `Specialized ${agent.name.toLowerCase()} for DevOps automation`}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {agent.capabilities.slice(0, 3).map((capability, idx) => (
                        <span key={idx} className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                          {capability}
                        </span>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <span className="bg-gray-500/20 text-gray-300 px-2 py-1 rounded text-xs">
                          +{agent.capabilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedAgent && (
              <div className="bg-black/40 backdrop-blur border border-white/20 rounded-lg p-8">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="text-4xl">
                    {agentIcons[selectedAgent.name as keyof typeof agentIcons] || '🤖'}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Chat with {selectedAgent.name}</h2>
                    <p className="text-gray-300">
                      Expert assistance with {selectedAgent.capabilities.join(', ').toLowerCase()}
                    </p>
                  </div>
                </div>
                <ChatWindow agentName={selectedAgent.name} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
            <p className="text-gray-300 mb-6">Latest AI agent interactions and system events</p>
            
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 rounded-lg bg-white/5">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.status === 'success' ? 'bg-green-400' :
                    activity.status === 'in-progress' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-gray-300 text-sm">{activity.agent} • {activity.time}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'success' ? 'bg-green-500/20 text-green-300' :
                    activity.status === 'in-progress' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-blue-500/20 text-blue-300'
                  }`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-4">Usage Trends</h3>
              <div className="h-64 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-600 rounded">
                📈 Analytics charts and usage trends will be displayed here
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-8">
              <h3 className="text-xl font-bold text-white mb-4">Agent Performance</h3>
              <div className="h-64 flex items-center justify-center text-gray-300 border-2 border-dashed border-gray-600 rounded">
                📊 Performance metrics and agent statistics will be shown here
              </div>
            </div>
          </div>
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