'use client';

import { Agent } from "@careerate/types";
import { agents } from "@careerate/agents";

export const AgentStatusBar = () => {
  return (
    <div className="flex items-center space-x-2 bg-glass-white rounded-full px-3 py-1.5 
                  border border-glass-border backdrop-blur-sm">
      {agents.map((agent: Agent) => (
        <div key={agent.id} className="relative group">
          <div className={`w-3 h-3 rounded-full animate-pulse transition-all duration-300
            ${agent.status === 'active' ? 'bg-accent-success shadow-lg shadow-accent-success/50' : 
              agent.status === 'thinking' ? 'bg-accent-warning shadow-lg shadow-accent-warning/50' :
              'bg-neutral-light'}`}>
          </div>
          
          <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                        opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-glass-dark backdrop-blur-xl rounded-lg px-2 py-1 text-xs text-white 
                          border border-glass-border shadow-xl whitespace-nowrap">
              {agent.name}: {agent.status}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}; 