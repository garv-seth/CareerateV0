'use client';

import { agents as staticAgents } from "@careerate/agents";
import { Agent, AgentStatus } from "@careerate/types";
import React, { useEffect } from "react";
import { AgentCard } from "./agent-card";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { useStore, Message } from "@/lib/store";

export const ChatPanel = () => {
    const { messages, agents, addMessage, setAgents, setAgentStatus, streamAgentResponse, updateAgentResponse, finalizeAgentResponse } = useStore();

    // Initialize agents in the store on component mount
    useEffect(() => {
        const agentsWithStatus = staticAgents.map((a: Agent) => ({...a, status: AgentStatus.IDLE}));
        setAgents(agentsWithStatus);
    }, [setAgents]);

    const handleSendMessage = async (content: string) => {
        // 1. Add user message to the store
        const userMessage = { id: Date.now().toString(), sender: 'user', content };
        addMessage(userMessage);

        // 2. Open EventSource connection to the backend
        const url = `http://localhost:3001/api/v1/orchestrate?user_query=${encodeURIComponent(content)}`;
        const eventSource = new EventSource(url);
        
        let currentAgentId: string | null = null;
        let activeAgentMessages = new Set<string>();

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.assign_agents && data.assign_agents.assigned_agents) {
                    data.assign_agents.assigned_agents.forEach((agentId: string) => {
                        setAgentStatus(agentId, AgentStatus.THINKING);
                    });
                }
                
                if (data.run_agents && data.run_agents.responses) {
                    const response = data.run_agents.responses[data.run_agents.responses.length - 1]; 
                    if (response && response.agentId) {
                        currentAgentId = response.agentId;
                        if (currentAgentId && !activeAgentMessages.has(currentAgentId)) {
                            streamAgentResponse(currentAgentId);
                            setAgentStatus(currentAgentId, AgentStatus.ACTIVE);
                            activeAgentMessages.add(currentAgentId);
                        }
                        if (currentAgentId) {
                            updateAgentResponse(currentAgentId, response.content);
                        }
                    }
                } 
                
                else if (data.synthesize_response && data.synthesize_response.final_solution) {
                    activeAgentMessages.forEach(agentId => {
                        finalizeAgentResponse(agentId);
                        setAgentStatus(agentId, AgentStatus.IDLE);
                    });
                    
                    addMessage({ id: Date.now().toString(), sender: 'aintern', content: data.synthesize_response.final_solution });
                    
                    eventSource.close();
                }
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
            // Optionally show an error message in the UI
        };
    };

    return (
        <div className="w-2/5 h-full flex flex-col bg-glass-dark/50 backdrop-blur-xl 
                      border-r border-glass-border">
          
          {/* Agent Roster */}
          <div className="p-4 border-b border-glass-border">
            <h3 className="text-sm font-medium text-neutral-light mb-3">Your AI Team</h3>
            <div className="grid grid-cols-2 gap-2">
              {agents.map((agent: Agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          </div>
    
          {/* Conversation History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
            {messages.map((message: Message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
    
          {/* Input Area */}
          <div className="p-4 border-t border-glass-border">
            <ChatInput onSend={handleSendMessage} />
          </div>
        </div>
      );
} 