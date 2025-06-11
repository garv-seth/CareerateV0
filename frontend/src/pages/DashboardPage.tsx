import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAgents } from '../lib/api';
import ChatWindow from '../components/chat/ChatWindow';

// Define types for clarity
interface Agent {
  id: string;
  name: string;
  capabilities: string[];
}

const DashboardPage = () => {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { data: agents, isLoading, error } = useQuery<Agent[]>({
    queryKey: ['agents'],
    queryFn: getAgents,
  });

  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">AI Agent Dashboard</h1>

      {isLoading && <p className="text-center">Loading agents...</p>}
      {error && <p className="text-center text-red-500">Error: Could not load AI agents from the server.</p>}
      
      {agents && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`p-6 rounded-lg shadow-lg text-center cursor-pointer transition-all duration-300 ${
                selectedAgent?.id === agent.id 
                  ? 'bg-white/20 scale-105' 
                  : 'bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/15'
              }`}
              onClick={() => setSelectedAgent(agent)}
            >
              <h2 className="text-2xl font-bold mb-2">{agent.name}</h2>
              <p className="text-sm text-gray-400">{agent.capabilities.join(', ')}</p>
            </div>
          ))}
        </div>
      )}

      {selectedAgent && (
        <div className="mt-12 p-8 rounded-lg bg-black/20 backdrop-blur-lg border border-white/10">
          <h2 className="text-3xl font-bold mb-4 text-center">Chat with {selectedAgent.name}</h2>
          <ChatWindow agentName={selectedAgent.name} />
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 