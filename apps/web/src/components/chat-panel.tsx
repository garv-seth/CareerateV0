'use client';

import React from 'react';
import { agents as staticAgents } from "@careerate/agents";
import { Agent, AgentStatus } from "@careerate/types";
import { useEffect } from "react";
import { AgentCard } from "./agent-card";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { useStore, UIMessage } from "@/lib/store";
import { HumanMessage } from "@langchain/core/messages";

export const ChatPanel = () => {
    const { messages, agents, addMessage, setMessages, setAgents } = useStore();

    // Initialize agents in the store on component mount
    useEffect(() => {
        const agentsWithStatus = staticAgents.map((a: Agent) => ({...a, status: AgentStatus.IDLE}));
        setAgents(agentsWithStatus);
    }, [setAgents]);

    const handleSendMessage = async (content: string) => {
        // 1. Add user message to the store locally for immediate feedback
        const userMessage: UIMessage = { role: 'human', content };
        const currentMessages = [...messages, userMessage];
        setMessages(currentMessages); // Optimistically update UI

        // 2. Open EventSource connection to the backend
        const url = `http://localhost:3001/api/v1/orchestrate?messages=${encodeURIComponent(JSON.stringify(currentMessages))}`;
        const eventSource = new EventSource(url);
        
        eventSource.onmessage = (event) => {
            try {
                const newMessages = JSON.parse(event.data);
                // The API now returns an array of message-like objects
                // We need to ensure they fit our UIMessage interface
                const uiMessages: UIMessage[] = newMessages.map((msg: any) => ({
                    role: msg.role || (msg.tool_calls ? 'ai' : 'human'), // Best guess
                    content: msg.content || (msg.tool_calls ? JSON.stringify(msg.tool_calls) : ''),
                    name: msg.name,
                    id: msg.id,
                }));
                setMessages(uiMessages); // Replace the entire message state
            } catch (error) {
                console.error("Failed to parse SSE event data:", error);
            }
        };

        eventSource.onerror = (err) => {
            console.error("EventSource failed:", err);
            eventSource.close();
            const errorMessage: UIMessage = { role: 'system', content: 'An error occurred with the AI service.' };
            setMessages([...currentMessages, errorMessage]);
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
            {messages.map((message, index) => (
              <MessageBubble key={index} message={message} />
            ))}
          </div>
    
          {/* Input Area */}
          <div className="p-4 border-t border-glass-border">
            <ChatInput onSend={handleSendMessage} />
          </div>
        </div>
      );
} 