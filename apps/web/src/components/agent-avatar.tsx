'use client';

import React from 'react';
import { LogoIcon } from "./icons/logo-icon";

interface AgentAvatarProps {
    agentId: string;
    size?: 'sm' | 'md' | 'lg';
}

export const AgentAvatar = ({ agentId, size = 'md' }: AgentAvatarProps) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`
            ${sizeClasses[size]}
            rounded-full bg-gradient-primary flex items-center justify-center 
            shadow-lg flex-shrink-0
        `}>
            <LogoIcon className="w-2/3 h-2/3 text-white" />
        </div>
    );
}; 