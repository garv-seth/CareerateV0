import OpenAI from 'openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';

interface AgentMessage {
  message: string;
  agentType?: string;
  context?: any;
  userId: string;
  sessionId?: string;
}

interface StreamChunk {
  type: 'message' | 'error' | 'complete';
  content: string;
  timestamp: Date;
  agentUsed?: string;
}

const AGENT_PROMPTS = {
  terraform: `You are a Terraform expert. Help with Infrastructure as Code, Terraform configurations, state management, providers, and best practices. Always provide practical, working code examples.`,
  
  kubernetes: `You are a Kubernetes expert. Help with container orchestration, deployments, services, ingress, troubleshooting, and cluster management. Provide clear kubectl commands and YAML configurations.`,
  
  aws: `You are an AWS cloud expert. Help with AWS services, architecture, cost optimization, security best practices, and troubleshooting. Provide specific AWS CLI commands and configuration examples.`,
  
  monitoring: `You are a DevOps monitoring expert. Help with observability, alerting, metrics, logging, APM tools, and incident detection. Focus on practical monitoring solutions.`,
  
  incident: `You are an incident response expert. Help with troubleshooting, root cause analysis, emergency procedures, and system recovery. Provide step-by-step diagnostic approaches.`,
  
  general: `You are a DevOps and SRE expert. Help with general infrastructure, CI/CD, automation, best practices, and troubleshooting. Provide practical solutions and examples.`
};

export class SimpleAgentOrchestrator {
  private openai: OpenAI | null = null;
  private anthropic: ChatAnthropic | null = null;
  private openaiChat: ChatOpenAI | null = null;

  async initialize() {
    try {
      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        this.openaiChat = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: 'gpt-4-turbo-preview',
          streaming: true,
        });
        
        console.log('✅ OpenAI initialized');
      }

      // Initialize Anthropic if API key is available
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new ChatAnthropic({
          anthropicApiKey: process.env.ANTHROPIC_API_KEY,
          modelName: 'claude-3-sonnet-20240229',
          streaming: true,
        });
        
        console.log('✅ Anthropic initialized');
      }

      if (!this.openai && !this.anthropic) {
        console.warn('⚠️  No AI APIs configured - using mock responses');
      }

    } catch (error) {
      console.error('❌ Failed to initialize AI services:', error);
    }
  }

  async *streamResponse(params: AgentMessage): AsyncIterable<StreamChunk> {
    const { message, agentType = 'general', context, userId } = params;
    
    // Determine which agent to use based on message content and agentType
    const selectedAgent = this.selectAgent(message, agentType);
    const systemPrompt = AGENT_PROMPTS[selectedAgent];
    
    // Add context to the message if available
    let contextualMessage = message;
    if (context) {
      contextualMessage = this.addContextToMessage(message, context);
    }

    try {
      // Try OpenAI first, then Anthropic, then fallback to mock
      if (this.openai) {
        yield* this.streamOpenAI(contextualMessage, systemPrompt, selectedAgent);
      } else if (this.anthropic) {
        yield* this.streamAnthropic(contextualMessage, systemPrompt, selectedAgent);
      } else {
        yield* this.streamMock(contextualMessage, selectedAgent);
      }
    } catch (error) {
      console.error('AI streaming error:', error);
      yield* this.streamError(error as Error);
    }
  }

  private selectAgent(message: string, requestedAgent: string): keyof typeof AGENT_PROMPTS {
    // If specific agent requested, use it
    if (requestedAgent !== 'auto' && requestedAgent in AGENT_PROMPTS) {
      return requestedAgent as keyof typeof AGENT_PROMPTS;
    }

    // Auto-select based on message content
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('terraform') || lowerMessage.includes('tf') || lowerMessage.includes('infrastructure as code')) {
      return 'terraform';
    }
    if (lowerMessage.includes('kubernetes') || lowerMessage.includes('k8s') || lowerMessage.includes('kubectl') || lowerMessage.includes('pod')) {
      return 'kubernetes';
    }
    if (lowerMessage.includes('aws') || lowerMessage.includes('ec2') || lowerMessage.includes('s3') || lowerMessage.includes('lambda')) {
      return 'aws';
    }
    if (lowerMessage.includes('monitor') || lowerMessage.includes('alert') || lowerMessage.includes('metric') || lowerMessage.includes('log')) {
      return 'monitoring';
    }
    if (lowerMessage.includes('incident') || lowerMessage.includes('outage') || lowerMessage.includes('down') || lowerMessage.includes('emergency')) {
      return 'incident';
    }
    
    return 'general';
  }

  private addContextToMessage(message: string, context: any): string {
    let contextString = '';
    
    if (context.currentTool) {
      contextString += `\nCurrent tool: ${context.currentTool}`;
    }
    if (context.cloudProvider) {
      contextString += `\nCloud provider: ${context.cloudProvider}`;
    }
    if (context.repository) {
      contextString += `\nRepository: ${context.repository}`;
    }
    if (context.browserContext) {
      contextString += `\nBrowser context: ${JSON.stringify(context.browserContext)}`;
    }
    
    if (contextString) {
      return `${message}\n\nContext:${contextString}`;
    }
    
    return message;
  }

  private async *streamOpenAI(message: string, systemPrompt: string, agentUsed: string): AsyncIterable<StreamChunk> {
    try {
      const stream = await this.openai!.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield {
            type: 'message',
            content,
            timestamp: new Date(),
            agentUsed
          };
        }
      }

      yield {
        type: 'complete',
        content: '',
        timestamp: new Date(),
        agentUsed
      };

    } catch (error) {
      console.error('OpenAI streaming error:', error);
      yield* this.streamError(error as Error);
    }
  }

  private async *streamAnthropic(message: string, systemPrompt: string, agentUsed: string): AsyncIterable<StreamChunk> {
    try {
      const stream = await this.anthropic!.stream(`${systemPrompt}\n\n${message}`);

      for await (const chunk of stream) {
        const content = typeof chunk.content === 'string' ? chunk.content : '';
        if (content) {
          yield {
            type: 'message',
            content,
            timestamp: new Date(),
            agentUsed
          };
        }
      }

      yield {
        type: 'complete',
        content: '',
        timestamp: new Date(),
        agentUsed
      };

    } catch (error) {
      console.error('Anthropic streaming error:', error);
      yield* this.streamError(error as Error);
    }
  }

  private async *streamMock(message: string, agentUsed: string): AsyncIterable<StreamChunk> {
    // Mock streaming response for development/testing
    const mockResponse = `I'm the ${agentUsed} agent responding to: "${message}"\n\nThis is a mock response since no AI API keys are configured. To enable real AI responses:\n\n1. Set OPENAI_API_KEY in your environment\n2. Or set ANTHROPIC_API_KEY in your environment\n3. Restart the server\n\nI can help you with:\n- ${agentUsed} specific tasks\n- DevOps best practices\n- Infrastructure troubleshooting\n- Code examples and configurations`;
    
    const words = mockResponse.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing delay
      
      yield {
        type: 'message',
        content: words[i] + (i < words.length - 1 ? ' ' : ''),
        timestamp: new Date(),
        agentUsed
      };
    }

    yield {
      type: 'complete',
      content: '',
      timestamp: new Date(),
      agentUsed
    };
  }

  private async *streamError(error: Error): AsyncIterable<StreamChunk> {
    yield {
      type: 'error',
      content: `Error: ${error.message}`,
      timestamp: new Date()
    };
  }

  // Additional methods for compatibility with route handlers
  async getAvailableAgents() {
    return Object.keys(AGENT_PROMPTS).map(agent => ({
      id: agent,
      name: agent.charAt(0).toUpperCase() + agent.slice(1),
      description: AGENT_PROMPTS[agent as keyof typeof AGENT_PROMPTS].substring(0, 100) + '...',
      status: 'available'
    }));
  }

  async getAgentCapabilities(agentType: string) {
    return {
      agent: agentType,
      capabilities: [
        'Text generation',
        'Code assistance',
        'Troubleshooting',
        'Best practices guidance'
      ],
      modelProvider: this.openai ? 'OpenAI' : this.anthropic ? 'Anthropic' : 'Mock'
    };
  }

  async processMessage(params: AgentMessage) {
    // Non-streaming version for compatibility
    const chunks: string[] = [];
    
    for await (const chunk of this.streamResponse(params)) {
      if (chunk.type === 'message') {
        chunks.push(chunk.content);
      }
    }

    return {
      content: chunks.join(''),
      agentUsed: this.selectAgent(params.message, params.agentType || 'general'),
      timestamp: new Date()
    };
  }

  async getConversationHistory(_params: any) {
    // Mock implementation - in real app, fetch from database
    return [];
  }

  async clearConversationHistory(_params: any) {
    // Mock implementation - in real app, clear from database
    return { success: true };
  }

  async getAgentMetrics(_params: any) {
    // Mock implementation - in real app, fetch from analytics database
    return {
      totalRequests: 42,
      averageResponseTime: 1.2,
      successRate: 0.95
    };
  }

  async updateAgentPreferences(_params: any) {
    // Mock implementation - in real app, save to database
    return { success: true };
  }

  async updatePerformanceMetrics() {
    // Mock implementation - in real app, calculate and store metrics
    console.log('📊 Performance metrics updated');
  }
}