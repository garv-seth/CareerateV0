'use client';

import React from 'react';
import { Agent } from "@careerate/types";
import { useStore, UIMessage } from "@/lib/store";
import { AgentAvatar } from "./agent-avatar";

interface MessageBubbleProps {
    message: UIMessage;
}

const getSenderName = (message: UIMessage, agents: Agent[]): string => {
    if (message.role === 'human') return 'You';
    if (message.role === 'ai') {
        // Here we could map message.name to an agent, but for now we'll default
        return message.name || 'AIntern';
    }
    if (message.role === 'tool') return 'Tool Output';
    return 'System';
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
    const { agents } = useStore();
    const isUser = message.role === 'human';
    const senderName = getSenderName(message, agents);
    
    // Do not render tool or system messages
    if (message.role === 'tool' || message.role === 'system') {
        return null;
    }

    return (
        <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && <AgentAvatar agentId="cloud" size="sm" />}
            <div className={`px-4 py-2.5 rounded-2xl max-w-lg ${
                isUser 
                ? 'bg-primary-main text-white rounded-br-none' 
                : 'bg-glass-white backdrop-blur-sm border border-glass-border text-neutral-light rounded-bl-none'
            }`}>
                <p className="text-sm font-medium mb-1">{senderName}</p>
                <p className="text-sm whitespace-pre-wrap">{message.content.toString()}</p>
            </div>
        </div>
    );
}; 