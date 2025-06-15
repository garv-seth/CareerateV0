import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { StateGraph, Annotation } from '@langchain/langgraph';
import winston from 'winston';
import { AzureSecretsManager } from '../services/AzureSecretsManager';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

// Advanced state management for multi-agent orchestration
const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  requestedAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "Auto",
  }),
  context: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  selectedAgent: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  agentResponses: Annotation<Record<string, any>>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  currentStep: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "analyze",
  }),
  capabilities: Annotation<string[]>({
    reducer: (x, y) => [...new Set([...x, ...y])],
    default: () => [],
  }),
  metadata: Annotation<any>({
    reducer: (x, y) => ({ ...x, ...y }),
    default: () => ({}),
  })
});

interface AgentDefinition {
  name: string;
  description: string;
  capabilities: string[];
  systemPrompt: string;
  tools: string[];
  priority: number;
  model: 'gpt-4' | 'claude-3-sonnet' | 'gpt-3.5-turbo';
}

export class AdvancedMultiAgentOrchestrator {
  private graph: StateGraph<typeof AgentState.State>;
  private openaiModel: ChatOpenAI | null = null;
  private anthropicModel: ChatAnthropic | null = null;
  private secretsManager: AzureSecretsManager;
  private agents: Map<string, AgentDefinition> = new Map();
  private isInitialized = false;

  constructor(secretsManager: AzureSecretsManager) {
    this.secretsManager = secretsManager;
    this.initializeAgents();
    this.graph = this.buildOrchestrationGraph();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize AI models with secrets from Azure Key Vault
      const openaiKey = await this.secretsManager.getSecret('OPENAI_API_KEY');
      const anthropicKey = await this.secretsManager.getSecret('ANTHROPIC_API_KEY');

      if (openaiKey) {
        this.openaiModel = new ChatOpenAI({
          openAIApiKey: openaiKey,
          modelName: 'gpt-4-turbo-preview',
          temperature: 0.1,
          streaming: true,
        });
        logger.info('OpenAI model initialized successfully');
      }

      if (anthropicKey) {
        this.anthropicModel = new ChatAnthropic({
          anthropicApiKey: anthropicKey,
          modelName: 'claude-3-sonnet-20240229',
          temperature: 0.1,
          streaming: true,
        });
        logger.info('Anthropic model initialized successfully');
      }

      this.isInitialized = true;
      logger.info('Advanced Multi-Agent Orchestrator initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Advanced Multi-Agent Orchestrator:', error);
      throw error;
    }
  }

  private initializeAgents(): void {
    const agents: AgentDefinition[] = [
      {
        name: 'Terraform Agent',
        description: 'Infrastructure as Code specialist with advanced Terraform automation, state management, and multi-cloud optimization capabilities',
        capabilities: ['terraform', 'infrastructure', 'iac', 'state-management', 'multi-cloud', 'cost-estimation'],
        systemPrompt: `You are an expert Terraform Infrastructure as Code specialist with deep knowledge of:
- Advanced Terraform configuration and best practices
- Multi-cloud deployments (AWS, Azure, GCP)
- State management and remote backends
- Module development and registry management
- Cost optimization and resource planning
- Security scanning and compliance
- CI/CD integration and automated deployments

Provide comprehensive, production-ready solutions with proper error handling, security considerations, and cost optimization.`,
        tools: ['terraform-validate', 'terraform-plan', 'cost-calculator', 'security-scanner'],
        priority: 10,
        model: 'gpt-4'
      },
      {
        name: 'Kubernetes Agent',
        description: 'Container orchestration expert with advanced Kubernetes management, auto-scaling, and cluster optimization',
        capabilities: ['kubernetes', 'containers', 'orchestration', 'scaling', 'monitoring', 'security'],
        systemPrompt: `You are a Kubernetes expert specializing in:
- Advanced cluster architecture and management
- Container orchestration and deployment strategies
- Auto-scaling (HPA, VPA, Cluster Autoscaler)
- Service mesh implementation (Istio, Linkerd)
- Monitoring and observability (Prometheus, Grafana)
- Security policies and RBAC
- CI/CD integration with GitOps
- Multi-cluster and hybrid cloud deployments

Provide enterprise-grade solutions with focus on reliability, scalability, and security.`,
        tools: ['kubectl', 'helm', 'kustomize', 'security-scanner'],
        priority: 9,
        model: 'gpt-4'
      },
      {
        name: 'AWS Agent',
        description: 'Cloud platform specialist with comprehensive AWS services expertise, cost optimization, and architecture design',
        capabilities: ['aws', 'cloud', 'architecture', 'cost-optimization', 'security', 'monitoring'],
        systemPrompt: `You are an AWS solutions architect with expertise in:
- Comprehensive AWS services and best practices
- Well-Architected Framework implementation
- Cost optimization and FinOps strategies
- Security and compliance (IAM, GuardDuty, Config)
- Monitoring and observability (CloudWatch, X-Ray)
- Serverless architectures and microservices
- Database optimization and data architecture
- Disaster recovery and business continuity

Provide scalable, secure, and cost-effective AWS solutions following best practices.`,
        tools: ['aws-cli', 'cost-explorer', 'config-rules', 'security-hub'],
        priority: 8,
        model: 'gpt-4'
      },
      {
        name: 'Monitoring Agent',
        description: 'Advanced monitoring and observability expert with AI-powered anomaly detection and predictive analytics',
        capabilities: ['monitoring', 'observability', 'alerting', 'metrics', 'logging', 'tracing', 'anomaly-detection'],
        systemPrompt: `You are a monitoring and observability expert specializing in:
- Comprehensive monitoring strategies (metrics, logs, traces)
- Advanced alerting and incident management
- AI-powered anomaly detection and predictive analytics
- Performance optimization and capacity planning
- SLI/SLO definition and implementation
- Multi-cloud and hybrid monitoring solutions
- Cost optimization for monitoring infrastructure
- Automated remediation and self-healing systems

Provide intelligent monitoring solutions that prevent issues before they impact users.`,
        tools: ['prometheus', 'grafana', 'elk-stack', 'jaeger', 'anomaly-detector'],
        priority: 7,
        model: 'claude-3-sonnet'
      },
      {
        name: 'Incident Agent',
        description: 'Intelligent incident management specialist with automated response, root cause analysis, and post-mortem automation',
        capabilities: ['incident-response', 'troubleshooting', 'root-cause-analysis', 'automation', 'communication'],
        systemPrompt: `You are an incident response expert specializing in:
- Rapid incident assessment and triage
- Automated root cause analysis and investigation
- Intelligent remediation strategies and runbooks
- Communication management and stakeholder updates
- Post-incident analysis and improvement recommendations
- Chaos engineering and resilience testing
- Integration with monitoring and alerting systems
- Knowledge management and learning from incidents

Provide fast, accurate incident resolution with comprehensive analysis and prevention strategies.`,
        tools: ['log-analyzer', 'trace-analyzer', 'runbook-executor', 'communication-bot'],
        priority: 9,
        model: 'gpt-4'
      },
      {
        name: 'Security Agent',
        description: 'Comprehensive DevSecOps specialist with continuous security, compliance automation, and threat detection',
        capabilities: ['security', 'compliance', 'vulnerability-scanning', 'threat-detection', 'policy-enforcement'],
        systemPrompt: `You are a DevSecOps security expert specializing in:
- Comprehensive security assessments and vulnerability management
- Automated compliance monitoring and reporting
- Threat detection and incident response
- Security policy development and enforcement
- Container and cloud security best practices
- Identity and access management (IAM/RBAC)
- Security scanning integration in CI/CD pipelines
- Regulatory compliance (SOC2, ISO 27001, GDPR)

Provide robust security solutions that integrate seamlessly with development workflows.`,
        tools: ['vulnerability-scanner', 'compliance-checker', 'policy-engine', 'threat-detector'],
        priority: 8,
        model: 'claude-3-sonnet'
      },
      {
        name: 'General Agent',
        description: 'DevOps generalist with comprehensive knowledge, best practices guidance, and cross-domain expertise',
        capabilities: ['devops', 'best-practices', 'automation', 'ci-cd', 'documentation', 'troubleshooting'],
        systemPrompt: `You are a senior DevOps engineer with comprehensive knowledge across:
- DevOps best practices and methodologies
- CI/CD pipeline design and optimization
- Infrastructure automation and configuration management
- Cross-platform and cross-cloud solutions
- Documentation and knowledge management
- Team collaboration and process improvement
- Technology evaluation and architecture decisions
- Troubleshooting and problem-solving

Provide well-rounded DevOps guidance with focus on efficiency, reliability, and team productivity.`,
        tools: ['generic-automation', 'documentation-generator', 'best-practices-checker'],
        priority: 5,
        model: 'gpt-3.5-turbo'
      }
    ];

    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });

    logger.info(`Initialized ${agents.length} specialized AI agents`);
  }

  private buildOrchestrationGraph(): StateGraph<typeof AgentState.State> {
    const graph = new StateGraph(AgentState)
      .addNode("analyze", this.analyzeRequest.bind(this))
      .addNode("route", this.routeToAgent.bind(this))
      .addNode("execute", this.executeAgent.bind(this))
      .addNode("synthesize", this.synthesizeResponse.bind(this))
      .addEdge("__start__", "analyze")
      .addEdge("analyze", "route")
      .addEdge("route", "execute")
      .addEdge("execute", "synthesize")
      .addEdge("synthesize", "__end__");

    return graph.compile();
  }

  private async analyzeRequest(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    const lastMessage = state.messages[state.messages.length - 1];
    const content = lastMessage.content as string;

    // Advanced intent detection and capability mapping
    const capabilities = this.detectCapabilities(content);
    const urgency = this.detectUrgency(content);
    const complexity = this.detectComplexity(content);

    logger.info(`Request analyzed - Capabilities: ${capabilities.join(', ')}, Urgency: ${urgency}, Complexity: ${complexity}`);

    return {
      capabilities,
      metadata: {
        urgency,
        complexity,
        analysisTimestamp: new Date().toISOString()
      },
      currentStep: "route"
    };
  }

  private async routeToAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    let selectedAgent = state.requestedAgent;

    if (selectedAgent === "Auto") {
      selectedAgent = this.selectOptimalAgent(state.capabilities, state.metadata);
    }

    // Validate agent exists
    if (!this.agents.has(selectedAgent)) {
      selectedAgent = "General Agent";
    }

    logger.info(`Routing request to: ${selectedAgent}`);

    return {
      selectedAgent,
      currentStep: "execute"
    };
  }

  private async executeAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    const agent = this.agents.get(state.selectedAgent);
    if (!agent) {
      throw new Error(`Agent ${state.selectedAgent} not found`);
    }

    const model = this.getModelForAgent(agent);
    if (!model) {
      throw new Error(`No available model for agent ${state.selectedAgent}`);
    }

    // Prepare enhanced context for the agent
    const enhancedMessages = [
      new SystemMessage(agent.systemPrompt),
      ...state.messages
    ];

    try {
      const response = await model.invoke(enhancedMessages);
      
      return {
        agentResponses: {
          [state.selectedAgent]: {
            response: response.content,
            timestamp: new Date().toISOString(),
            capabilities: agent.capabilities,
            model: agent.model
          }
        },
        currentStep: "synthesize"
      };
    } catch (error) {
      logger.error(`Agent execution failed for ${state.selectedAgent}:`, error);
      throw error;
    }
  }

  private async synthesizeResponse(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    const agentResponse = state.agentResponses[state.selectedAgent];
    
    if (!agentResponse) {
      throw new Error('No agent response to synthesize');
    }

    // Add metadata and formatting to the response
    const synthesizedMessage = new AIMessage({
      content: agentResponse.response,
      additional_kwargs: {
        agent: state.selectedAgent,
        capabilities: agentResponse.capabilities,
        timestamp: agentResponse.timestamp,
        model: agentResponse.model
      }
    });

    return {
      messages: [synthesizedMessage]
    };
  }

  private detectCapabilities(content: string): string[] {
    const capabilityKeywords = {
      'terraform': ['terraform', 'infrastructure', 'iac', 'provisioning', 'state'],
      'kubernetes': ['kubernetes', 'k8s', 'pods', 'containers', 'deployment', 'service'],
      'aws': ['aws', 'ec2', 's3', 'lambda', 'cloudformation', 'cloudwatch'],
      'monitoring': ['monitoring', 'metrics', 'alerts', 'prometheus', 'grafana', 'observability'],
      'security': ['security', 'vulnerability', 'compliance', 'scan', 'audit', 'rbac'],
      'incident-response': ['incident', 'outage', 'downtime', 'troubleshoot', 'debug', 'emergency'],
      'cost-optimization': ['cost', 'optimize', 'budget', 'savings', 'efficiency'],
      'automation': ['automate', 'ci/cd', 'pipeline', 'deploy', 'build']
    };

    const detected: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [capability, keywords] of Object.entries(capabilityKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        detected.push(capability);
      }
    }

    return detected.length > 0 ? detected : ['general'];
  }

  private detectUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgencyKeywords = {
      critical: ['emergency', 'critical', 'urgent', 'outage', 'down', 'broken', 'failure'],
      high: ['important', 'asap', 'quickly', 'soon', 'issue', 'problem'],
      medium: ['need', 'help', 'question', 'how to'],
      low: ['learn', 'understand', 'example', 'documentation']
    };

    const lowerContent = content.toLowerCase();

    for (const [level, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return level as 'low' | 'medium' | 'high' | 'critical';
      }
    }

    return 'medium';
  }

  private detectComplexity(content: string): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    const complexityIndicators = {
      enterprise: ['enterprise', 'scale', 'multi-cloud', 'production', 'compliance'],
      complex: ['architecture', 'design', 'integration', 'multiple', 'advanced'],
      moderate: ['configure', 'setup', 'implement', 'deploy'],
      simple: ['how', 'what', 'explain', 'example', 'simple']
    };

    const lowerContent = content.toLowerCase();
    const wordCount = content.split(' ').length;

    // Word count factor
    if (wordCount > 100) return 'complex';
    if (wordCount > 50) return 'moderate';

    // Keyword analysis
    for (const [level, keywords] of Object.entries(complexityIndicators)) {
      if (keywords.some(keyword => lowerContent.includes(keyword))) {
        return level as 'simple' | 'moderate' | 'complex' | 'enterprise';
      }
    }

    return 'moderate';
  }

  private selectOptimalAgent(capabilities: string[], metadata: any): string {
    const agentScores = new Map<string, number>();

    // Score agents based on capability match
    for (const [agentName, agent] of this.agents) {
      let score = 0;

      // Capability matching
      const matchedCapabilities = capabilities.filter(cap => 
        agent.capabilities.some(agentCap => 
          agentCap.includes(cap) || cap.includes(agentCap)
        )
      );
      
      score += matchedCapabilities.length * 10;

      // Priority bonus
      score += agent.priority;

      // Urgency factor
      if (metadata.urgency === 'critical' && agentName.includes('Incident')) {
        score += 20;
      }

      // Complexity factor
      if (metadata.complexity === 'enterprise' && agent.model === 'gpt-4') {
        score += 10;
      }

      agentScores.set(agentName, score);
    }

    // Return highest scoring agent
    const selectedAgent = Array.from(agentScores.entries())
      .sort(([,a], [,b]) => b - a)[0][0];

    return selectedAgent || 'General Agent';
  }

  private getModelForAgent(agent: AgentDefinition): ChatOpenAI | ChatAnthropic | null {
    switch (agent.model) {
      case 'gpt-4':
      case 'gpt-3.5-turbo':
        return this.openaiModel;
      case 'claude-3-sonnet':
        return this.anthropicModel;
      default:
        return this.openaiModel || this.anthropicModel;
    }
  }

  public async *invoke(input: {
    messages: BaseMessage[];
    requestedAgent?: string;
    context?: any;
  }): AsyncGenerator<any, void, unknown> {
    if (!this.isInitialized) {
      yield {
        type: 'error',
        data: { message: 'Orchestrator not initialized' }
      };
      return;
    }

    try {
      yield {
        type: 'status',
        data: { message: 'Analyzing request and routing to optimal agent...' }
      };

      const initialState = {
        messages: input.messages,
        requestedAgent: input.requestedAgent || "Auto",
        context: input.context || {},
        selectedAgent: "",
        agentResponses: {},
        currentStep: "analyze",
        capabilities: [],
        metadata: {}
      };

      const result = await this.graph.invoke(initialState);

      const finalMessage = result.messages[result.messages.length - 1];
      
      yield {
        type: 'agent_selected',
        data: { 
          agent: result.selectedAgent,
          capabilities: result.capabilities,
          metadata: result.metadata
        }
      };

      yield {
        type: 'response',
        data: {
          content: finalMessage.content,
          agent: result.selectedAgent,
          metadata: finalMessage.additional_kwargs
        }
      };

      yield {
        type: 'complete',
        data: { message: 'Request processed successfully' }
      };

    } catch (error) {
      logger.error('Orchestration error:', error);
      yield {
        type: 'error',
        data: { 
          message: 'Failed to process request',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  public getAvailableAgents(): Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    status: 'online' | 'offline';
  }> {
    return Array.from(this.agents.entries()).map(([name, agent]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      status: this.isInitialized ? 'online' : 'offline'
    }));
  }

  public getOrchestrationStats(): {
    totalAgents: number;
    modelsAvailable: string[];
    isInitialized: boolean;
    capabilityCoverage: string[];
  } {
    const allCapabilities = Array.from(this.agents.values())
      .flatMap(agent => agent.capabilities)
      .filter((cap, index, array) => array.indexOf(cap) === index);

    return {
      totalAgents: this.agents.size,
      modelsAvailable: [
        ...(this.openaiModel ? ['OpenAI GPT-4'] : []),
        ...(this.anthropicModel ? ['Anthropic Claude-3'] : [])
      ],
      isInitialized: this.isInitialized,
      capabilityCoverage: allCapabilities
    };
  }
}