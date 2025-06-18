import { create } from 'zustand';
import { Agent, AgentActivity, AgentStatus } from '@careerate/types';

export interface Message {
    id: string;
    sender: 'user' | string; // user or agent id
    content: string;
    isTyping?: boolean;
}

interface AppState {
    messages: Message[];
    agents: Agent[];
    setAgents: (agents: Agent[]) => void;
    addMessage: (message: Message) => void;
    streamAgentResponse: (agentId: string) => void;
    updateAgentResponse: (agentId: string, chunk: string) => void;
    finalizeAgentResponse: (agentId: string) => void;
    setAgentStatus: (agentId: string, status: AgentStatus) => void;
    // ... other state and actions
}

export const useStore = create<AppState>((set, get) => ({
    messages: [],
    agents: [],
    setAgents: (agents) => set({ agents }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

    streamAgentResponse: (agentId) => {
        const newMessage: Message = { id: Date.now().toString(), sender: agentId, content: "", isTyping: true };
        set((state) => ({ messages: [...state.messages, newMessage] }));
    },

    updateAgentResponse: (agentId, chunk) => {
        set((state) => {
            const messages = [...state.messages];
            const agentMessageIndex = messages.findLastIndex(m => m.sender === agentId && m.isTyping);
            if (agentMessageIndex !== -1) {
                messages[agentMessageIndex].content += chunk;
            }
            return { messages };
        });
    },

    finalizeAgentResponse: (agentId) => {
        set((state) => {
            const messages = [...state.messages];
            const agentMessageIndex = messages.findLastIndex(m => m.sender === agentId);
            if (agentMessageIndex !== -1) {
                messages[agentMessageIndex].isTyping = false;
            }
            return { messages };
        });
    },

    setAgentStatus: (agentId, status) => {
        set((state) => {
            const agents = state.agents.map(a => 
                a.id === agentId ? { ...a, status } : a
            );
            return { agents };
        });
    }
})); 