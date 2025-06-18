'use client';

import { Agent, agents } from "@careerate/agents";
import { motion } from "framer-motion";
import React from "react";

interface Message {
    id: string;
    sender: 'user' | string; // 'user' or agent id
    content: string;
}

const getAgentById = (id: string): Agent | undefined => agents.find((a: Agent) => a.id === id);

export const MessageBubble = ({ message }: { message: Message }) => {
    const isUser = message.sender === 'user';
    const agent = !isUser ? getAgentById(message.sender) : undefined;

    const bubbleStyles = isUser
        ? "bg-primary-main self-end"
        : "bg-neutral-main self-start";

    const avatar = agent ? (
        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {agent.name.substring(0, 2).toUpperCase()}
        </div>
    ) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-start gap-3 max-w-xl ${isUser ? 'self-end' : 'self-start'}`}
        >
            {!isUser && avatar}
            <div className={`rounded-xl px-4 py-2 text-white ${bubbleStyles}`}>
                <p className="text-sm">{message.content}</p>
            </div>
        </motion.div>
    );
}; 