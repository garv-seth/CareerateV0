export enum AgentSpecialty {
  TERRAFORM = 'terraform',
  KUBERNETES = 'kubernetes', 
  AWS = 'aws',
  INCIDENT = 'incident'
}

export enum AgentStatus {
  IDLE = 'idle',
  THINKING = 'thinking',
  ACTIVE = 'active',
  OFFLINE = 'offline'
}

export type Capability = string;

export interface AgentPersonality {
  description: string;
  communicationStyle: 'formal' | 'casual' | 'technical' | 'supportive';
  expertise_level: 'junior' | 'mid' | 'senior';
  quirks: string[];
}

export interface Agent {
  id: string;
  name: string;
  specialty: AgentSpecialty;
  personality: AgentPersonality;
  capabilities: Capability[];
  status: AgentStatus;
  currentTask?: Task;
  collaborators: string[];
}

export interface Task {
  id: string;
  description: string;
  steps: TaskStep[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface TaskStep {
  id: string;
  agentId: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  timestamp: number;
}

export interface AgentResponse {
  agentId: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface CollaborationStep {
  fromAgentId: string;
  toAgentId: string;
  action: string;
  timestamp: number;
}

export interface PageContext {
  url: string;
  title: string;
  errorMessages: string[];
  codeSnippets: string[];
  toolType: string;
  timestamp: number;
}

export interface UserMessage {
  id: string;
  teamId: string;
  userId: string;
  content: string;
  timestamp: number;
}

export interface AgentAction {
  teamId: string;
  agentId: string;
  type: string;
  payload: any;
}

export interface AgentActivity {
  id: string;
  agentId: string;
  action: string;
  details?: string;
  timestamp: number;
} 