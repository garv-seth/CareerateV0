import { BaseMessage, HumanMessage, AIMessage, ToolMessage } from '@langchain/core/messages';
import { IAgent } from '../agents/BaseAgent';
import { TerraAgent } from '../agents/TerraAgent';
import { KubeAgent } from '../agents/KubeAgent';
import { MetricAgent } from '../agents/MetricAgent';
import { GuardAgent } from '../agents/GuardAgent';
import { RapidAgent } from '../agents/RapidAgent';
import { ITool } from '../tools/BaseTool';
import { ShellTool } from '../tools/ShellTool';
import { FileSystemTool } from '../tools/FileSystemTool';

type AgentName = 'Terra' | 'Kube' | 'Metric' | 'Guard' | 'Rapid' | 'Auto';

interface OrchestratorRequest {
  messages: { role: 'user' | 'assistant'; content: string }[];
  requestedAgent: AgentName;
  context?: any;
}

export class MultiAgentOrchestrator {
  private agents: Map<string, IAgent> = new Map();
  private tools: Map<string, ITool> = new Map();
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
    const shellTool = new ShellTool();
    const fsTool = new FileSystemTool();
    
    this.tools.set(shellTool.name, shellTool);
    this.tools.set(fsTool.name, fsTool);

    console.log(`✅ Registered tools: ${Array.from(this.tools.keys()).join(', ')}`);
  }

  public getAvailableAgents() {
    return Array.from(this.agents.values()).map(agent => agent.personality);
  }

  public getAvailableTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  public async *invoke(request: OrchestratorRequest): AsyncGenerator<{ type: string, data: any }, void, unknown> {
    if (!this.isInitialized) {
      throw new Error("Orchestrator not initialized.");
    }

    const { messages, context } = request;
    const conversation: BaseMessage[] = this.formatMessages(messages);
    
    // The main agent is always Rapid, the coordinator
    const coordinator = this.agents.get('Rapid')!;
    yield { type: 'agent_selected', data: coordinator.personality };

    // The main loop for the collaborative process
    for (let i = 0; i < 5; i++) {
      const stream = coordinator.invoke(conversation, this.getAvailableTools());
      let fullResponse = '';
      let toolCalls: any[] = [];
      
      for await (const event of stream) {
        if (event.type === 'chunk') {
          fullResponse += event.data;
        } else if (event.type === 'tool_call') {
          toolCalls.push(event.data);
        }
        yield event;
      }
      conversation.push(new AIMessage(fullResponse));

      // If there are no tool calls, the conversation is over
      if (toolCalls.length === 0) break;
      
      // Process tool calls, which may include delegating to other agents
      for (const toolCall of toolCalls) {
        let result;
        if (this.agents.has(toolCall.name)) {
          // This is a delegation to another agent
          const subAgent = this.agents.get(toolCall.name)!;
          yield { type: 'agent_delegation', data: { to: subAgent.personality, task: toolCall.args } };
          result = await this.runSubAgent(subAgent, toolCall.args);
        } else if (this.tools.has(toolCall.name)) {
          // This is a call to a standard tool
          const tool = this.tools.get(toolCall.name)!;
          result = await tool.execute(toolCall.args);
        } else {
          result = { error: `Unknown tool or agent: ${toolCall.name}` };
        }
        
        conversation.push(new ToolMessage(JSON.stringify(result), toolCall.id));
        yield { type: 'tool_result', data: { tool_call_id: toolCall.id, name: toolCall.name, result } };
      }
    }
    yield { type: 'complete', data: null };
  }
  
  // Helper to run a sub-agent and get its final response
  private async runSubAgent(agent: IAgent, task: any): Promise<any> {
    const subConversation = [new HumanMessage(JSON.stringify(task))];
    const stream = agent.invoke(subConversation, this.getAvailableTools());
    let finalResponse = '';
    for await (const event of stream) {
      if (event.type === 'chunk') {
        finalResponse += event.data;
      }
    }
    return { response: finalResponse };
  }

  private formatMessages(messages: { role: 'user' | 'assistant'; content: string }[]): BaseMessage[] {
    return messages.map(m => {
      if (m.role === 'user') return new HumanMessage(m.content);
      return new AIMessage(m.content);
    });
  }
} 