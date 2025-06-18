'use client';

import { Agent, AgentStatus } from "@careerate/types";
import { GlassCard } from "@careerate/ui";
import { motion } from "framer-motion";

const statusIndicator = {
    [AgentStatus.ACTIVE]: "bg-accent-success",
    [AgentStatus.THINKING]: "bg-accent-warning",
    [AgentStatus.IDLE]: "bg-neutral-light",
    [AgentStatus.OFFLINE]: "bg-neutral-main",
}

export const AgentCard = ({ agent }: { agent: Agent }) => {
    return (
        <GlassCard variant="interactive" className="p-3">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <div className={`w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-xs`}>
                        {agent.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-glass-dark ${statusIndicator[agent.status]}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{agent.name}</p>
                    <p className="text-xs text-neutral-light truncate">{agent.specialty}</p>
                </div>
            </div>
        </GlassCard>
    )
} 