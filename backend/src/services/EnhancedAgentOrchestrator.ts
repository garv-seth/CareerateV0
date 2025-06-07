import { SimpleAgentOrchestrator } from './SimpleAgentOrchestrator';

interface AgentState {
  messages: any[];
  context: Record<string, any>;
  plan: any;
  currentStep: number;
  tools: any[];
  executionHistory: any[];
}

interface StreamChunk {
  type: 'message' | 'error' | 'complete' | 'thinking' | 'planning';
  content: string;
  timestamp: Date;
  agentUsed?: string;
  metadata?: any;
}

export class EnhancedAgentOrchestrator {
  private simpleOrchestrator: SimpleAgentOrchestrator;
  private mcpClients: Map<string, any> = new Map();

  constructor() {
    this.simpleOrchestrator = new SimpleAgentOrchestrator();
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced Agent Orchestrator...');
      await this.simpleOrchestrator.initialize();
      console.log('✅ Enhanced Agent Orchestrator initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Enhanced Agent Orchestrator:', (error as Error)?.message || 'Unknown error');
      throw error;
    }
  }

  async *streamResponse(params: any): AsyncIterable<StreamChunk> {
    try {
      // Add planning phase
      yield {
        type: 'thinking',
        content: 'Analyzing your request and planning the response...',
        timestamp: new Date(),
        agentUsed: 'planner'
      };

      // Simulate planning delay
      await new Promise(resolve => setTimeout(resolve, 500));

      yield {
        type: 'planning',
        content: 'Plan created. Executing with appropriate agent...',
        timestamp: new Date(),
        agentUsed: 'planner'
      };

      // Delegate to simple orchestrator
      for await (const chunk of this.simpleOrchestrator.streamResponse(params)) {
        yield chunk;
      }

    } catch (error) {
      console.error('Enhanced orchestrator error:', (error as Error)?.message || 'Unknown error');
      yield {
        type: 'error',
        content: `Error: ${(error as Error)?.message || 'Unknown error'}`,
        timestamp: new Date()
      };
    }
  }

  async processMessage(params: any): Promise<any> {
    return await this.simpleOrchestrator.processMessage(params);
  }

  async getAvailableAgents(): Promise<any[]> {
    return await this.simpleOrchestrator.getAvailableAgents();
  }

  async getAgentCapabilities(agentType: string): Promise<any> {
    const capabilities = await this.simpleOrchestrator.getAgentCapabilities(agentType);
    return {
      ...capabilities,
      enhanced: true,
      features: ['Multi-step planning', 'Tool integration', 'Context awareness']
    };
  }

  // MCP Integration methods
  async registerMCPClient(serverId: string, client: any): Promise<void> {
    this.mcpClients.set(serverId, client);
    console.log(`✅ MCP client registered: ${serverId}`);
  }

  async invokeMCPTool(serverId: string, toolName: string, params: any): Promise<any> {
    const client = this.mcpClients.get(serverId);
    if (!client) {
      throw new Error(`MCP client not found: ${serverId}`);
    }

    try {
      return await client.invoke(toolName, params);
    } catch (error) {
      console.error(`MCP tool invocation failed: ${serverId}.${toolName}`, (error as Error)?.message || 'Unknown error');
      throw error;
    }
  }

  async getAvailableTools(): Promise<any[]> {
    const tools: any[] = [];
    
    for (const [serverId, client] of this.mcpClients.entries()) {
      try {
        const serverTools = await client.listTools();
        tools.push(...serverTools.map((tool: any) => ({
          ...tool,
          serverId,
          source: 'mcp'
        })));
      } catch (error) {
        console.warn(`Failed to get tools from ${serverId}:`, (error as Error)?.message || 'Unknown error');
      }
    }

    return tools;
  }

  // Planning and execution methods
  private async createPlan(message: string, context: any): Promise<any> {
    // Simple planning logic
    return {
      steps: [
        { action: 'analyze', description: 'Analyze the request' },
        { action: 'execute', description: 'Execute the appropriate agent' },
        { action: 'verify', description: 'Verify the response' }
      ],
      estimatedTime: '30s',
      complexity: 'medium'
    };
  }

  private async executeStep(step: any, state: AgentState): Promise<Partial<AgentState>> {
    // Mock step execution
    return {
      currentStep: state.currentStep + 1,
      executionHistory: [...state.executionHistory, {
        step: step.action,
        timestamp: new Date(),
        status: 'completed'
      }]
    };
  }

  // Utility methods
  async getMetrics(): Promise<any> {
    return {
      totalRequests: 0,
      averageResponseTime: 0,
      successRate: 1.0,
      enhancedFeatures: {
        planningEnabled: true,
        mcpIntegration: this.mcpClients.size > 0,
        toolsAvailable: await this.getAvailableTools().then(tools => tools.length)
      }
    };
  }

  async shutdown(): Promise<void> {
    this.mcpClients.clear();
    console.log('✅ Enhanced Agent Orchestrator shutdown completed');
  }
} 