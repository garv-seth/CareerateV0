import { StateGraph, START, END } from '@langchain/langgraph';
import { OpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { TerraformAgentV2 } from '../agents/terraform-agent-v2.js';
import { KubernetesAgent } from '../agents/kubernetes-agent.js';
import { MonitoringAgent } from '../agents/monitoring-agent.js';
import { IncidentAgent } from '../agents/incident-agent.js';
import { AWSAgent } from '../agents/aws-agent.js';

interface AgentState {
  messages: Array<HumanMessage | AIMessage | SystemMessage>;
  currentAgent: string;
  context: Record<string, any>;
  userId: string;
  sessionId: string;
  completed: boolean;
  metadata: Record<string, any>;
}

interface StreamResponseParams {
  message: string;
  agentType: string;
  context: Record<string, any>;
  userId: string;
}

export class AgentOrchestrator {
  private graph: StateGraph<AgentState> | null = null;
  private agents: Map<string, any> = new Map();
  private performanceMetrics: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    try {
      console.log('🤖 Initializing Agent Orchestrator...');

      // Initialize specialized agents
      await this.initializeAgents();

      // Create the agent orchestration graph
      await this.createOrchestrationGraph();

      console.log('✅ Agent Orchestrator initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Agent Orchestrator:', error);
      throw error;
    }
  }

  private async initializeAgents(): Promise<void> {
    try {
      // Initialize Terraform Agent
      const terraformAgent = new TerraformAgentV2();
      await terraformAgent.initialize();
      this.agents.set('terraform', terraformAgent);

      // Initialize Kubernetes Agent
      const k8sAgent = new KubernetesAgent();
      await k8sAgent.initialize();
      this.agents.set('kubernetes', k8sAgent);

      // Initialize Monitoring Agent
      const monitoringAgent = new MonitoringAgent();
      await monitoringAgent.initialize();
      this.agents.set('monitoring', monitoringAgent);

      // Initialize Incident Response Agent
      const incidentAgent = new IncidentAgent();
      await incidentAgent.initialize();
      this.agents.set('incident', incidentAgent);

      // Initialize AWS Agent
      const awsAgent = new AWSAgent();
      await awsAgent.initialize();
      this.agents.set('aws', awsAgent);

      console.log('✅ All specialized agents initialized');
    } catch (error) {
      console.error('❌ Failed to initialize agents:', error);
      throw error;
    }
  }

  private async createOrchestrationGraph(): Promise<void> {
    try {
      // Create the state graph for agent orchestration
      this.graph = new StateGraph<AgentState>({
        channels: {
          messages: [],
          currentAgent: '',
          context: {},
          userId: '',
          sessionId: '',
          completed: false,
          metadata: {}
        }
      });

      // Add agent nodes
      this.graph.addNode('supervisor', this.supervisorNode.bind(this));
      this.graph.addNode('terraform', this.terraformNode.bind(this));
      this.graph.addNode('kubernetes', this.kubernetesNode.bind(this));
      this.graph.addNode('monitoring', this.monitoringNode.bind(this));
      this.graph.addNode('incident', this.incidentNode.bind(this));
      this.graph.addNode('aws', this.awsNode.bind(this));
      this.graph.addNode('completion', this.completionNode.bind(this));

      // Add edges for agent routing
      this.graph.addEdge(START, 'supervisor');
      this.graph.addConditionalEdges(
        'supervisor',
        this.routeAgent.bind(this),
        {
          terraform: 'terraform',
          kubernetes: 'kubernetes',
          monitoring: 'monitoring',
          incident: 'incident',
          aws: 'aws',
          complete: 'completion',
          continue: 'supervisor'
        }
      );

      // Add edges back to supervisor for multi-turn conversations
      this.graph.addEdge('terraform', 'supervisor');
      this.graph.addEdge('kubernetes', 'supervisor');
      this.graph.addEdge('monitoring', 'supervisor');
      this.graph.addEdge('incident', 'supervisor');
      this.graph.addEdge('aws', 'supervisor');
      this.graph.addEdge('completion', END);

      console.log('✅ Agent orchestration graph created');
    } catch (error) {
      console.error('❌ Failed to create orchestration graph:', error);
      throw error;
    }
  }

  async streamResponse(params: StreamResponseParams): AsyncGenerator<any, void, unknown> {
    try {
      const { message, agentType, context, userId } = params;
      const sessionId = `session_${Date.now()}_${userId}`;

      const initialState: AgentState = {
        messages: [new HumanMessage({ content: message })],
        currentAgent: agentType || 'supervisor',
        context,
        userId,
        sessionId,
        completed: false,
        metadata: {
          startTime: Date.now(),
          requestedAgent: agentType
        }
      };

      if (!this.graph) {
        throw new Error('Agent orchestration graph not initialized');
      }

      const workflow = this.graph.compile();
      const stream = workflow.stream(initialState);

      for await (const output of stream) {
        // Yield each step of the agent execution
        yield {
          type: 'agent_step',
          data: output,
          timestamp: Date.now()
        };

        // Update performance metrics
        this.updateMetrics(output);
      }

      yield {
        type: 'completion',
        data: { completed: true },
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('❌ Stream response error:', error);
      yield {
        type: 'error',
        data: { error: error.message },
        timestamp: Date.now()
      };
    }
  }

  private async supervisorNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o'
      });

      const systemPrompt = `You are the Supervisor Agent for Careerate, an AI platform for DevOps and SRE engineers.

Your job is to:
1. Analyze the user's request and determine which specialized agent should handle it
2. Coordinate between multiple agents when needed
3. Provide final responses to the user

Available specialized agents:
- terraform: Infrastructure as Code, Terraform configurations, state management
- kubernetes: Container orchestration, K8s manifests, debugging
- monitoring: Alerting, metrics, observability, Prometheus, Grafana
- incident: Incident response, troubleshooting, postmortems
- aws: AWS services, cost optimization, security

Current context: ${JSON.stringify(state.context, null, 2)}
User request: ${state.messages[state.messages.length - 1].content}

Respond with your analysis and next steps.`;

      const response = await openai.invoke([
        new SystemMessage({ content: systemPrompt }),
        ...state.messages
      ]);

      return {
        messages: [...state.messages, response],
        metadata: {
          ...state.metadata,
          supervisorAnalysis: response.content,
          lastProcessed: Date.now()
        }
      };
    } catch (error) {
      console.error('❌ Supervisor node error:', error);
      throw error;
    }
  }

  private async terraformNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const terraformAgent = this.agents.get('terraform');
      if (!terraformAgent) {
        throw new Error('Terraform agent not available');
      }

      const result = await terraformAgent.processRequest({
        message: state.messages[state.messages.length - 1].content,
        context: state.context,
        userId: state.userId
      });

      return {
        messages: [...state.messages, new AIMessage({ content: result.response })],
        context: { ...state.context, terraformResult: result },
        currentAgent: 'terraform'
      };
    } catch (error) {
      console.error('❌ Terraform node error:', error);
      throw error;
    }
  }

  private async kubernetesNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const k8sAgent = this.agents.get('kubernetes');
      if (!k8sAgent) {
        throw new Error('Kubernetes agent not available');
      }

      const result = await k8sAgent.processRequest({
        message: state.messages[state.messages.length - 1].content,
        context: state.context,
        userId: state.userId
      });

      return {
        messages: [...state.messages, new AIMessage({ content: result.response })],
        context: { ...state.context, kubernetesResult: result },
        currentAgent: 'kubernetes'
      };
    } catch (error) {
      console.error('❌ Kubernetes node error:', error);
      throw error;
    }
  }

  private async monitoringNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const monitoringAgent = this.agents.get('monitoring');
      if (!monitoringAgent) {
        throw new Error('Monitoring agent not available');
      }

      const result = await monitoringAgent.processRequest({
        message: state.messages[state.messages.length - 1].content,
        context: state.context,
        userId: state.userId
      });

      return {
        messages: [...state.messages, new AIMessage({ content: result.response })],
        context: { ...state.context, monitoringResult: result },
        currentAgent: 'monitoring'
      };
    } catch (error) {
      console.error('❌ Monitoring node error:', error);
      throw error;
    }
  }

  private async incidentNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const incidentAgent = this.agents.get('incident');
      if (!incidentAgent) {
        throw new Error('Incident agent not available');
      }

      const result = await incidentAgent.processRequest({
        message: state.messages[state.messages.length - 1].content,
        context: state.context,
        userId: state.userId
      });

      return {
        messages: [...state.messages, new AIMessage({ content: result.response })],
        context: { ...state.context, incidentResult: result },
        currentAgent: 'incident'
      };
    } catch (error) {
      console.error('❌ Incident node error:', error);
      throw error;
    }
  }

  private async awsNode(state: AgentState): Promise<Partial<AgentState>> {
    try {
      const awsAgent = this.agents.get('aws');
      if (!awsAgent) {
        throw new Error('AWS agent not available');
      }

      const result = await awsAgent.processRequest({
        message: state.messages[state.messages.length - 1].content,
        context: state.context,
        userId: state.userId
      });

      return {
        messages: [...state.messages, new AIMessage({ content: result.response })],
        context: { ...state.context, awsResult: result },
        currentAgent: 'aws'
      };
    } catch (error) {
      console.error('❌ AWS node error:', error);
      throw error;
    }
  }

  private async completionNode(state: AgentState): Promise<Partial<AgentState>> {
    return {
      completed: true,
      metadata: {
        ...state.metadata,
        completionTime: Date.now(),
        totalDuration: Date.now() - state.metadata.startTime
      }
    };
  }

  private routeAgent(state: AgentState): string {
    try {
      const lastMessage = state.messages[state.messages.length - 1];
      
      if (state.completed) {
        return 'complete';
      }

      // If a specific agent was requested, use it
      if (state.metadata?.requestedAgent && state.currentAgent === 'supervisor') {
        return state.metadata.requestedAgent;
      }

      // Analyze the message content to determine routing
      const content = lastMessage.content.toLowerCase();

      if (content.includes('terraform') || content.includes('infrastructure as code') || content.includes('iac')) {
        return 'terraform';
      }
      
      if (content.includes('kubernetes') || content.includes('k8s') || content.includes('container')) {
        return 'kubernetes';
      }
      
      if (content.includes('monitoring') || content.includes('alert') || content.includes('prometheus')) {
        return 'monitoring';
      }
      
      if (content.includes('incident') || content.includes('outage') || content.includes('troubleshoot')) {
        return 'incident';
      }
      
      if (content.includes('aws') || content.includes('amazon') || content.includes('ec2')) {
        return 'aws';
      }

      // Check if we need to continue the conversation
      if (state.messages.length > 1 && !state.completed) {
        return 'continue';
      }

      return 'complete';
    } catch (error) {
      console.error('❌ Route agent error:', error);
      return 'complete';
    }
  }

  private updateMetrics(output: any): void {
    try {
      const agentName = output.currentAgent || 'unknown';
      const existing = this.performanceMetrics.get(agentName) || {
        totalRequests: 0,
        totalResponseTime: 0,
        errors: 0,
        lastUsed: Date.now()
      };

      existing.totalRequests += 1;
      existing.lastUsed = Date.now();

      this.performanceMetrics.set(agentName, existing);
    } catch (error) {
      console.error('❌ Failed to update metrics:', error);
    }
  }

  async updatePerformanceMetrics(): Promise<void> {
    try {
      console.log('📊 Updating agent performance metrics...');
      
      // Log current metrics
      for (const [agentName, metrics] of this.performanceMetrics.entries()) {
        console.log(`Agent ${agentName}:`, metrics);
      }

      // Here you could save metrics to database or send to analytics service
    } catch (error) {
      console.error('❌ Failed to update performance metrics:', error);
    }
  }

  getMetrics(): Map<string, any> {
    return new Map(this.performanceMetrics);
  }

  getAvailableAgents(): string[] {
    return Array.from(this.agents.keys());
  }
}