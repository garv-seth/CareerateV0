import { BaseMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import { IAgent, IAgentTool } from '../agents/BaseAgent';
import { TerraAgent } from '../agents/TerraAgent';
import { KubeAgent } from '../agents/KubeAgent';
import { MetricAgent } from '../agents/MetricAgent';
import { GuardAgent } from '../agents/GuardAgent';
import { RapidAgent } from '../agents/RapidAgent';

type AgentName = 'Terra' | 'Kube' | 'Metric' | 'Guard' | 'Rapid' | 'Auto';

interface OrchestratorRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  requestedAgent: AgentName;
  context?: any;
}

export class MultiAgentOrchestrator {
  private agents: Map<string, IAgent> = new Map();
  private tools: IAgentTool[] = [];
  private isInitialized = false;

  constructor() {
    // constructor is kept light
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('Initializing MultiAgentOrchestrator...');
    this.registerAgents();
    this.registerTools();
    this.isInitialized = true;
    console.log('✅ MultiAgentOrchestrator initialized');
  }

  private registerAgents() {
    try {
      this.agents.set('Terra', new TerraAgent());
      this.agents.set('Kube', new KubeAgent());
      this.agents.set('Metric', new MetricAgent());
      this.agents.set('Guard', new GuardAgent());
      this.agents.set('Rapid', new RapidAgent());
      console.log('✅ All agents registered');
    } catch(error) {
      console.error('❌ Failed to register agents:', error);
      // Depending on requirements, we might want to throw here
      // or continue with a degraded state.
    }
  }

  private registerTools() {
    // In the future, we will add real tools here for agents to use
    // Example: this.tools.push(new AWSCLI_Tool());
    console.log('✅ Tools registered (currently none)');
  }

  public getAvailableAgents() {
    return Array.from(this.agents.values()).map(agent => agent.personality);
  }

  public async *invoke(request: OrchestratorRequest): AsyncGenerator<{ type: string, data: any }, void, unknown> {
    if (!this.isInitialized) {
      throw new Error("Orchestrator not initialized. Please call initialize() first.");
    }
    
    const { messages, requestedAgent, context } = request;

    const agent = this.selectAgent(messages, requestedAgent);
    yield { type: 'agent_selected', data: agent.personality };

    const formattedMessages = this.formatMessages(messages);

    // Add context to the system prompt for the selected agent
    if (context) {
      // This is a simplistic way to add context. We will improve this.
      const contextMessage = new HumanMessage(`Here is some context for your task: ${JSON.stringify(context)}`);
      formattedMessages.push(contextMessage);
    }

    const stream = agent.invoke(formattedMessages, this.tools);

    for await (const result of stream) {
      yield result;
    }
  }

  private selectAgent(messages: { role: 'user' | 'assistant'; content: string }[], requestedAgent: AgentName): IAgent {
    if (requestedAgent !== 'Auto' && this.agents.has(requestedAgent)) {
      return this.agents.get(requestedAgent)!;
    }

    // Advanced agent selection logic will be implemented here.
    // For now, we'll use a simple keyword-based approach.
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content.toLowerCase() || '';

    if (lastUserMessage.includes('terraform') || lastUserMessage.includes('iac')) return this.agents.get('Terra')!;
    if (lastUserMessage.includes('kubernetes') || lastUserMessage.includes('docker') || lastUserMessage.includes('pod')) return this.agents.get('Kube')!;
    if (lastUserMessage.includes('monitoring') || lastUserMessage.includes('grafana') || lastUserMessage.includes('prometheus')) return this.agents.get('Metric')!;
    if (lastUserMessage.includes('security') || lastUserMessage.includes('vulnerability') || lastUserMessage.includes('cve')) return this.agents.get('Guard')!;
    if (lastUserMessage.includes('incident') || lastUserMessage.includes('outage') || lastUserMessage.includes('error')) return this.agents.get('Rapid')!;

    // Default to Rapid for triage if no specific agent is matched
    return this.agents.get('Rapid')!;
  }

  private formatMessages(messages: { role: 'user' | 'assistant'; content: string }[]): BaseMessage[] {
    return messages.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content);
      return new AIMessage(m.content);
    });
  }
} 