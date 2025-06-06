import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText, generateText } from 'ai';
import TerraformAgentV2 from '../agents/terraform-agent-v2.js';
import { MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { EventEmitter } from 'events';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  agentUsed?: string;
  metadata?: any;
}

interface ChatContext {
  sessionId: string;
  userId: string;
  teamId?: string;
  currentTool?: string;
  cloudProvider?: 'aws' | 'azure' | 'gcp';
  repository?: string;
  browserContext?: any;
  extensionData?: any;
}

interface AgentCapability {
  name: string;
  description: string;
  keywords: string[];
  priority: number;
  mcpServer?: string;
}

class AIChatService extends EventEmitter {
  private openai: OpenAI;
  private anthropic: Anthropic;
  private agents: Map<string, any> = new Map();
  private mcpClients: Map<string, MCPClient> = new Map();
  private activeChats: Map<string, ChatContext> = new Map();
  private agentCapabilities: AgentCapability[] = [];

  constructor() {
    super();
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    this.initializeAgents();
    this.initializeMCPClients();
    this.setupAgentCapabilities();
  }

  private async initializeAgents() {
    // Initialize specialized agents
    this.agents.set('terraform', new TerraformAgentV2(process.env.OPENAI_API_KEY!));
    this.agents.set('kubernetes', new KubernetesAgent());
    this.agents.set('aws', new AWSAgent());
    this.agents.set('monitoring', new MonitoringAgent());
    this.agents.set('incident', new IncidentResponseAgent());
    this.agents.set('general', new GeneralDevOpsAgent());
  }

  private async initializeMCPClients() {
    const mcpServers = [
      { name: 'terraform', command: 'node', args: ['backend/mcp_servers/terraform-mcp-server.js'] },
      { name: 'kubernetes', command: 'node', args: ['backend/mcp_servers/kubernetes-mcp-server.js'] },
      { name: 'aws', command: 'node', args: ['backend/mcp_servers/aws-mcp-server.js'] },
      { name: 'github', command: 'node', args: ['backend/mcp_servers/github-mcp-server.js'] },
      { name: 'monitoring', command: 'node', args: ['backend/mcp_servers/monitoring-mcp-server.js'] },
    ];

    for (const server of mcpServers) {
      try {
        const transport = new StdioClientTransport({
          command: server.command,
          args: server.args,
        });

        const client = new MCPClient(
          { name: `careerate-${server.name}`, version: "1.0.0" },
          { capabilities: { tools: {} } }
        );

        await client.connect(transport);
        this.mcpClients.set(server.name, client);
        console.log(`✅ Connected to ${server.name} MCP server`);
      } catch (error) {
        console.error(`❌ Failed to connect to ${server.name} MCP server:`, error);
      }
    }
  }

  private setupAgentCapabilities() {
    this.agentCapabilities = [
      {
        name: 'terraform',
        description: 'Infrastructure as Code with Terraform',
        keywords: ['terraform', 'infrastructure', 'tf', 'hcl', 'plan', 'apply', 'aws_instance', 'resource'],
        priority: 1,
        mcpServer: 'terraform'
      },
      {
        name: 'kubernetes',
        description: 'Container orchestration with Kubernetes',
        keywords: ['kubernetes', 'k8s', 'kubectl', 'pod', 'deployment', 'service', 'ingress', 'namespace'],
        priority: 1,
        mcpServer: 'kubernetes'
      },
      {
        name: 'aws',
        description: 'Amazon Web Services cloud platform',
        keywords: ['aws', 'ec2', 's3', 'lambda', 'cloudformation', 'iam', 'vpc', 'rds'],
        priority: 2,
        mcpServer: 'aws'
      },
      {
        name: 'monitoring',
        description: 'Monitoring and observability tools',
        keywords: ['prometheus', 'grafana', 'alerting', 'metrics', 'logs', 'monitoring', 'observability'],
        priority: 2,
        mcpServer: 'monitoring'
      },
      {
        name: 'incident',
        description: 'Incident response and troubleshooting',
        keywords: ['incident', 'outage', 'troubleshoot', 'debug', 'error', 'failure', 'postmortem'],
        priority: 1
      },
      {
        name: 'general',
        description: 'General DevOps and SRE assistance',
        keywords: ['help', 'explain', 'how', 'what', 'why', 'best practice'],
        priority: 3
      }
    ];
  }

  async startChat(context: ChatContext): Promise<string> {
    this.activeChats.set(context.sessionId, context);
    
    // Emit chat started event for real-time collaboration
    this.emit('chatStarted', { sessionId: context.sessionId, userId: context.userId, teamId: context.teamId });
    
    return context.sessionId;
  }

  async sendMessage(sessionId: string, message: string, streaming: boolean = true): Promise<AsyncIterable<string> | string> {
    const context = this.activeChats.get(sessionId);
    if (!context) {
      throw new Error('Chat session not found');
    }

    // Analyze message and select best agent
    const selectedAgent = await this.selectBestAgent(message, context);
    
    // Prepare enhanced context
    const enhancedContext = await this.prepareEnhancedContext(context, message);
    
    if (streaming) {
      return this.streamResponse(selectedAgent, message, enhancedContext, sessionId);
    } else {
      return this.generateResponse(selectedAgent, message, enhancedContext, sessionId);
    }
  }

  private async selectBestAgent(message: string, context: ChatContext): Promise<string> {
    const messageLower = message.toLowerCase();
    
    // Score each agent based on message content
    const scores = this.agentCapabilities.map(agent => {
      let score = 0;
      
      // Keyword matching
      for (const keyword of agent.keywords) {
        if (messageLower.includes(keyword)) {
          score += 10;
        }
      }
      
      // Context-based scoring
      if (context.currentTool) {
        if (agent.name === context.currentTool || agent.keywords.includes(context.currentTool)) {
          score += 20;
        }
      }
      
      // Priority adjustment
      score = score / agent.priority;
      
      return { agent: agent.name, score };
    });
    
    // Sort by score and return best match
    scores.sort((a, b) => b.score - a.score);
    
    const selectedAgent = scores[0].score > 0 ? scores[0].agent : 'general';
    
    console.log(`🤖 Selected agent: ${selectedAgent} (score: ${scores[0].score})`);
    return selectedAgent;
  }

  private async prepareEnhancedContext(context: ChatContext, message: string): Promise<any> {
    const enhancedContext = {
      ...context,
      timestamp: Date.now(),
      message,
    };

    // Add browser context if available
    if (context.extensionData) {
      enhancedContext.browserContext = {
        url: context.extensionData.url,
        title: context.extensionData.title,
        selectedText: context.extensionData.selectedText,
        errorMessages: context.extensionData.errorMessages,
        codeSnippets: context.extensionData.codeSnippets,
      };
    }

    // Add repository context if available
    if (context.repository) {
      const githubClient = this.mcpClients.get('github');
      if (githubClient) {
        try {
          const repoInfo = await githubClient.callTool({
            name: 'github_analyze_repository',
            arguments: { repository: context.repository }
          });
          enhancedContext.repositoryContext = repoInfo;
        } catch (error) {
          console.error('Failed to get repository context:', error);
        }
      }
    }

    return enhancedContext;
  }

  private async *streamResponse(agentName: string, message: string, context: any, sessionId: string): AsyncIterable<string> {
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      yield* this.streamFallbackResponse(message, context);
      return;
    }

    try {
      // Use specialized agent with streaming
      if (agent.streamProcess) {
        for await (const chunk of agent.streamProcess(message, context)) {
          yield chunk;
          
          // Emit for real-time collaboration
          this.emit('messageChunk', { sessionId, chunk, agentUsed: agentName });
        }
      } else {
        // Fallback to non-streaming agent
        const response = await agent.process(message, context);
        
        // Simulate streaming for non-streaming agents
        const words = response.split(' ');
        for (const word of words) {
          yield word + ' ';
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate typing
        }
      }
    } catch (error) {
      console.error(`Agent ${agentName} error:`, error);
      yield* this.streamFallbackResponse(message, context);
    }
  }

  private async *streamFallbackResponse(message: string, context: any): AsyncIterable<string> {
    const systemPrompt = `You are Careerate, an AI assistant specialized in DevOps and SRE.
    
    Context: ${JSON.stringify(context)}
    
    Provide helpful, accurate assistance for DevOps, infrastructure, and SRE tasks.
    Focus on practical solutions and best practices.`;

    try {
      const stream = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        stream: true,
        temperature: 0.1,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('Fallback response error:', error);
      yield 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  private async generateResponse(agentName: string, message: string, context: any, sessionId: string): Promise<string> {
    const agent = this.agents.get(agentName);
    
    if (!agent) {
      return this.generateFallbackResponse(message, context);
    }

    try {
      const response = await agent.process(message, context);
      
      // Emit for real-time collaboration
      this.emit('messageComplete', { sessionId, response, agentUsed: agentName });
      
      return response;
    } catch (error) {
      console.error(`Agent ${agentName} error:`, error);
      return this.generateFallbackResponse(message, context);
    }
  }

  private async generateFallbackResponse(message: string, context: any): Promise<string> {
    const systemPrompt = `You are Careerate, an AI assistant specialized in DevOps and SRE.
    
    Context: ${JSON.stringify(context)}
    
    Provide helpful, accurate assistance for DevOps, infrastructure, and SRE tasks.
    Focus on practical solutions and best practices.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.1,
      });

      return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';
    } catch (error) {
      console.error('Fallback response error:', error);
      return 'I apologize, but I encountered an error processing your request. Please try again.';
    }
  }

  async getTeamInsights(teamId: string): Promise<any> {
    // Analyze team chat patterns and provide insights
    const teamChats = Array.from(this.activeChats.values()).filter(chat => chat.teamId === teamId);
    
    return {
      activeSessions: teamChats.length,
      commonTools: this.analyzeCommonTools(teamChats),
      skillGaps: await this.identifySkillGaps(teamId),
      productivity: await this.calculateProductivity(teamId),
    };
  }

  async shareContext(fromSessionId: string, toSessionId: string, contextData: any): Promise<void> {
    const fromContext = this.activeChats.get(fromSessionId);
    const toContext = this.activeChats.get(toSessionId);
    
    if (fromContext && toContext && fromContext.teamId === toContext.teamId) {
      // Share context between team members
      this.emit('contextShared', {
        from: fromSessionId,
        to: toSessionId,
        data: contextData,
        teamId: fromContext.teamId
      });
    }
  }

  private analyzeCommonTools(chats: ChatContext[]): string[] {
    const toolCounts = new Map<string, number>();
    
    chats.forEach(chat => {
      if (chat.currentTool) {
        toolCounts.set(chat.currentTool, (toolCounts.get(chat.currentTool) || 0) + 1);
      }
    });
    
    return Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tool]) => tool);
  }

  private async identifySkillGaps(teamId: string): Promise<string[]> {
    // This would analyze chat patterns to identify areas where team needs help
    return ['Kubernetes networking', 'Terraform modules', 'AWS security'];
  }

  private async calculateProductivity(teamId: string): Promise<any> {
    return {
      questionsAnswered: 42,
      timesSaved: '3.5 hours',
      successRate: 0.87
    };
  }
}

// Agent implementations
class KubernetesAgent {
  async process(message: string, context: any): Promise<string> {
    // Implementation would use Kubernetes MCP server
    return `Kubernetes assistance for: ${message}`;
  }
}

class AWSAgent {
  async process(message: string, context: any): Promise<string> {
    return `AWS assistance for: ${message}`;
  }
}

class MonitoringAgent {
  async process(message: string, context: any): Promise<string> {
    return `Monitoring assistance for: ${message}`;
  }
}

class IncidentResponseAgent {
  async process(message: string, context: any): Promise<string> {
    return `Incident response guidance for: ${message}`;
  }
}

class GeneralDevOpsAgent {
  async process(message: string, context: any): Promise<string> {
    return `General DevOps assistance for: ${message}`;
  }
}

export default AIChatService; 