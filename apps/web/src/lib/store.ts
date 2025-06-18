import { create } from 'zustand';
import { Agent, AgentStatus } from '@careerate/types';
import { AIMessage, HumanMessage } from "@langchain/core/messages";

// A simplified, explicit message structure for the UI
export interface UIMessage {
    role: 'human' | 'ai' | 'tool' | 'system';
    content: string;
    id?: string;
    name?: string;
}

interface AppState {
    messages: UIMessage[];
    agents: Agent[];
    authToken: string | null;
    setAgents: (agents: Agent[]) => void;
    addMessage: (message: UIMessage) => void;
    setMessages: (messages: UIMessage[]) => void;
    setAgentStatus: (agentId: string, status: AgentStatus) => void;
    setAuthToken: (token: string | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
    messages: [],
    agents: [],
    authToken: null,
    setAgents: (agents) => set({ agents }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    setMessages: (messages) => set({ messages }),
    setAuthToken: (token) => set({ authToken: token }),
    setAgentStatus: (agentId, status) => {
        set((state) => {
            const agents = state.agents.map(a => 
                a.id === agentId ? { ...a, status } : a
            );
            return { agents };
        });
    }
})); 