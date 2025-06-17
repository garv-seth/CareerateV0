import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { StateGraph, Annotation, START, END } from '@langchain/langgraph';
import winston from 'winston';
import { AzureSecretsManager } from '../services/AzureSecretsManager';
import { ToolManager } from './ToolManager';
import { Runnable, RunnableSequence } from '@langchain/core/runnables';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { v4 as uuidv4 } from 'uuid';

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
    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  }),
  requestedAgent: Annotation<string>({
    reducer: (x: string, y: string | undefined) => y ?? x,
    default: () => "Auto",
  }),
  context: Annotation<any>({
    reducer: (x: any, y: any) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  selectedAgent: Annotation<string>({
    reducer: (x: string, y: string | undefined) => y ?? x,
    default: () => "",
  }),
  agentResponses: Annotation<Record<string, any>>({
    reducer: (x: Record<string, any>, y: Record<string, any>) => ({ ...x, ...y }),
    default: () => ({}),
  }),
  currentStep: Annotation<string>({
    reducer: (x: string, y: string | undefined) => y ?? x,
    default: () => "analyze",
  }),
  capabilities: Annotation<string[]>({
    reducer: (x: string[], y: string[]) => [...new Set([...x, ...y])],
    default: () => [],
  }),
  metadata: Annotation<any>({
    reducer: (x: any, y: any) => ({ ...x, ...y }),
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
  private graph: any;
  private openaiModel: Runnable<any, any, any> | null = null;
  private anthropicModel: Runnable<any, any, any> | null = null;
  private secretsManager: AzureSecretsManager;
  private agents: Map<string, AgentDefinition> = new Map();
  private isInitialized = false;
  private toolManager: ToolManager;

  constructor(secretsManager: AzureSecretsManager, toolManager: ToolManager) {
    this.secretsManager = secretsManager;
    this.toolManager = toolManager;
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
        }).bindTools(this.toolManager.getLangChainTools());
        logger.info('OpenAI model initialized successfully with tools');
      }

      if (anthropicKey) {
        this.anthropicModel = new ChatAnthropic({
          anthropicApiKey: anthropicKey,
          modelName: 'claude-3-sonnet-20240229',
          temperature: 0.1,
          streaming: true,
        }).bindTools(this.toolManager.getLangChainTools());
        logger.info('Anthropic model initialized successfully with tools');
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

Provide comprehensive, production-ready solutions with proper error handling, security considerations, and cost optimization. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide enterprise-grade solutions with focus on reliability, scalability, and security. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide scalable, secure, and cost-effective AWS solutions following best practices. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide intelligent monitoring solutions that prevent issues before they impact users. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide fast, accurate incident resolution with comprehensive analysis and prevention strategies. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide robust security solutions that integrate seamlessly with development workflows. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
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

Provide well-rounded DevOps guidance with focus on efficiency, reliability, and team productivity. You have access to the following tools: ${this.toolManager.getAllTools().map(t => t.name).join(', ')}.`,
        tools: this.toolManager.getAllTools().map(t => t.name), // Dynamically assign all available tools
        priority: 5,
        model: 'gpt-3.5-turbo'
      }
    ];

    agents.forEach(agent => {
      this.agents.set(agent.name, agent);
    });

    logger.info(`Initialized ${agents.length} specialized AI agents`);
  }

  private buildOrchestrationGraph(): any {
    // LangGraph API expects the Annotation root directly, not wrapped in a channels object.
    const graphBuilder = new StateGraph(AgentState)
      .addNode("analyzeRequest", this.analyzeRequest.bind(this))
      .addNode("routeToAgent", this.routeToAgent.bind(this))
      .addNode("executeAgent", this.executeAgent.bind(this))
      .addNode("synthesizeResponse", this.synthesizeResponse.bind(this));

    // Wire up the control-flow using START / END virtual nodes
    graphBuilder.addEdge(START, "analyzeRequest");
    graphBuilder.addEdge("analyzeRequest", "routeToAgent");
    graphBuilder.addEdge("routeToAgent", "executeAgent");
    graphBuilder.addEdge("executeAgent", "synthesizeResponse");
    graphBuilder.addEdge("synthesizeResponse", END);

    // Compile once everything is in place
    return graphBuilder.compile();
  }

  private async analyzeRequest(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info("Orchestrator: Analyzing incoming request...");
    const lastMessage = state.messages[state.messages.length - 1];
    if (!(lastMessage instanceof HumanMessage)) {
      throw new Error("Last message is not a HumanMessage.");
    }

    const content = lastMessage.content;
    const capabilities = this.detectCapabilities(content as string);
    const urgency = this.detectUrgency(content as string);
    const complexity = this.detectComplexity(content as string);

    return {
      capabilities,
      metadata: { urgency, complexity },
      currentStep: "routeToAgent",
    };
  }

  private async routeToAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info("Orchestrator: Routing request to optimal agent...");
    const selectedAgent = this.selectOptimalAgent(state.capabilities, state.metadata);
    logger.info(`Orchestrator: Selected agent: ${selectedAgent}`);
    return { selectedAgent, currentStep: "executeAgent" };
  }

  private async executeAgent(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info(`Orchestrator: Executing agent: ${state.selectedAgent}`);
    const agentDefinition = this.agents.get(state.selectedAgent);
    if (!agentDefinition) {
      throw new Error(`Agent ${state.selectedAgent} not found.`);
    }

    const agentModel = this.getModelForAgent(agentDefinition);
    if (!agentModel) {
      throw new Error(`Model for agent ${agentDefinition.name} not initialized.`);
    }

    const messages = [
      new SystemMessage(agentDefinition.systemPrompt),
      ...state.messages,
    ];

    const toolMap = new Map(this.toolManager.getAllTools().map(tool => [tool.name, tool]));

    // Define a runnable for the agent that can use tools
    const agentRunnable: Runnable<any, any, any> = RunnableSequence.from([
      ChatPromptTemplate.fromMessages([new MessagesPlaceholder("messages")]),
      agentModel.withConfig({ runName: "Agent" }),
      {
        tool_calls: (input: AIMessage) => input.tool_calls || [],
        output: (input: AIMessage) => input.content,
        tool_outputs: async (input: AIMessage) => {
          const toolCalls = input.tool_calls || [];
          const toolResults = [];
          for (const toolCall of toolCalls) {
            const tool = toolMap.get(toolCall.name);
            if (tool) {
              try {
                const toolOutput = await tool.execute(toolCall.args);
                const toolMsg = new ToolMessage({
                  content: JSON.stringify(toolOutput),
                  name: toolCall.name,
                  tool_call_id: toolCall.id ?? uuidv4(),
                });
                messages.push(toolMsg);
                toolResults.push(toolMsg);
                // Re-invoke the agent with the tool output
                const toolOutputStream = await agentRunnable.stream({ messages });
                for await (const toolOutputChunk of toolOutputStream) {
                  if (toolOutputChunk.output) {
                    const content = typeof toolOutputChunk.output === 'string' ? toolOutputChunk.output : JSON.stringify(toolOutputChunk.output);
                    toolResults.push(new AIMessage(content as string));
                  } else if (toolOutputChunk.tool_calls) {
                    // Handle nested tool calls (unlikely but possible)
                     for (const nestedToolCall of toolOutputChunk.tool_calls) {
                        logger.warn(`Nested tool call detected: ${nestedToolCall.name}. Current implementation does not fully support multi-level tool calling within a single turn.`);
                        toolResults.push(new AIMessage(`Warning: Nested tool call detected (${nestedToolCall.name}). Please try to refine your request if the agent does not respond as expected.`));
                     }
                  }
                }

              } catch (e) {
                logger.error(`Error executing tool ${toolCall.name}:`, e);
                const errMsg = new ToolMessage({
                  content: JSON.stringify({ error: (e as Error).message }),
                  name: toolCall.name,
                  tool_call_id: toolCall.id ?? uuidv4(),
                });
                messages.push(errMsg);
                toolResults.push(errMsg);
              }
            } else {
              const notFoundMsg = new ToolMessage({
                content: JSON.stringify({ error: `Tool ${toolCall.name} not found.` }),
                name: toolCall.name,
                tool_call_id: toolCall.id ?? uuidv4(),
              });
              messages.push(notFoundMsg);
              toolResults.push(notFoundMsg);
            }
          }
          return toolResults;
        }
      }
    ]);

    let agentResponse: BaseMessage[] = [];
    try {
      const stream = await agentRunnable.stream({ messages });

      for await (const chunk of stream) {
        // Handle tool calls by executing them and appending ToolMessage
        if (chunk.tool_calls) {
          for (const toolCall of chunk.tool_calls) {
            const tool = toolMap.get(toolCall.name);
            if (tool) {
              try {
                const toolOutput = await tool.execute(toolCall.args);
                const toolMsg = new ToolMessage({
                  content: JSON.stringify(toolOutput),
                  name: toolCall.name,
                  tool_call_id: toolCall.id ?? uuidv4(),
                });
                messages.push(toolMsg);
                agentResponse.push(toolMsg);
                // Re-invoke the agent with the tool output
                const toolOutputStream = await agentRunnable.stream({ messages });
                for await (const toolOutputChunk of toolOutputStream) {
                  if (toolOutputChunk.output) {
                    const content = typeof toolOutputChunk.output === 'string' ? toolOutputChunk.output : JSON.stringify(toolOutputChunk.output);
                    agentResponse.push(new AIMessage(content as string));
                  } else if (toolOutputChunk.tool_calls) {
                    // Handle nested tool calls (unlikely but possible)
                     for (const nestedToolCall of toolOutputChunk.tool_calls) {
                        logger.warn(`Nested tool call detected: ${nestedToolCall.name}. Current implementation does not fully support multi-level tool calling within a single turn.`);
                        agentResponse.push(new AIMessage(`Warning: Nested tool call detected (${nestedToolCall.name}). Please try to refine your request if the agent does not respond as expected.`));
                     }
                  }
                }

              } catch (e) {
                logger.error(`Error executing tool ${toolCall.name}:`, e);
                const errMsg = new ToolMessage({
                  content: JSON.stringify({ error: (e as Error).message }),
                  name: toolCall.name,
                  tool_call_id: toolCall.id ?? uuidv4(),
                });
                messages.push(errMsg);
                agentResponse.push(errMsg);
              }
            } else {
              const notFoundMsg = new ToolMessage({
                content: JSON.stringify({ error: `Tool ${toolCall.name} not found.` }),
                name: toolCall.name,
                tool_call_id: toolCall.id ?? uuidv4(),
              });
              messages.push(notFoundMsg);
              agentResponse.push(notFoundMsg);
            }
          }
        } else if (chunk.output) {
          const content = typeof chunk.output === 'string' ? chunk.output : JSON.stringify(chunk.output);
          agentResponse.push(new AIMessage(content as string));
        }
      }
    } catch (error) {
      logger.error(`Error during agent execution for ${agentDefinition.name}:`, error);
      agentResponse.push(new AIMessage(`An error occurred while executing ${agentDefinition.name}: ${(error as Error).message}.`));
    }

    return {
      agentResponses: { [agentDefinition.name]: agentResponse },
      messages: state.messages.concat(agentResponse),
      currentStep: "synthesizeResponse",
    };
  }

  private async synthesizeResponse(state: typeof AgentState.State): Promise<Partial<typeof AgentState.State>> {
    logger.info("Orchestrator: Synthesizing final response...");
    // This is a placeholder. In a real scenario, a dedicated synthesis agent
    // or logic would combine agentResponses and context into a coherent reply.
    const finalResponse = Object.values(state.agentResponses).flat().map(msg => {
      if (msg instanceof AIMessage) return msg.content;
      if (msg instanceof ToolMessage) return `Tool ${msg.name} output: ${msg.content}`;
      return msg.toString();
    }).join('\n\n');
    
    logger.info(`Orchestrator: Final response synthesized.`);
    return { messages: state.messages.concat(new AIMessage(finalResponse)), currentStep: "end" };
  }

  private detectCapabilities(content: string): string[] {
    // Simple keyword-based capability detection for demonstration
    const capabilities = new Set<string>();
    if (content.toLowerCase().includes('terraform')) capabilities.add('terraform');
    if (content.toLowerCase().includes('kubernetes') || content.toLowerCase().includes('k8s')) capabilities.add('kubernetes');
    if (content.toLowerCase().includes('aws') || content.toLowerCase().includes('amazon web services')) capabilities.add('aws');
    if (content.toLowerCase().includes('monitor') || content.toLowerCase().includes('observability') || content.toLowerCase().includes('alert')) capabilities.add('monitoring');
    if (content.toLowerCase().includes('incident') || content.toLowerCase().includes('troubleshoot') || content.toLowerCase().includes('debug')) capabilities.add('incident-response');
    if (content.toLowerCase().includes('security') || content.toLowerCase().includes('compliance') || content.toLowerCase().includes('vulnerability')) capabilities.add('security');
    if (content.toLowerCase().includes('general devops') || content.toLowerCase().includes('automation') || content.toLowerCase().includes('ci/cd')) capabilities.add('devops');

    return Array.from(capabilities);
  }

  private detectUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
    if (content.toLowerCase().includes('critical') || content.toLowerCase().includes('urgent') || content.toLowerCase().includes('immediately')) return 'critical';
    if (content.toLowerCase().includes('high priority') || content.toLowerCase().includes('soon')) return 'high';
    if (content.toLowerCase().includes('medium priority')) return 'medium';
    return 'low';
  }

  private detectComplexity(content: string): 'simple' | 'moderate' | 'complex' | 'enterprise' {
    if (content.toLowerCase().includes('enterprise') || content.toLowerCase().includes('large scale') || content.toLowerCase().includes('complex architecture')) return 'enterprise';
    if (content.toLowerCase().includes('complex') || content.toLowerCase().includes('distributed')) return 'complex';
    if (content.toLowerCase().includes('moderate')) return 'moderate';
    return 'simple';
  }

  private selectOptimalAgent(capabilities: string[], metadata: any): string {
    let bestAgent: AgentDefinition | undefined;
    let maxScore = -1;

    this.agents.forEach(agent => {
      let score = 0;
      const matchedCapabilities = capabilities.filter(cap => agent.capabilities.includes(cap));
      score += matchedCapabilities.length * 5; // Reward matching capabilities

      // Prioritize agents with higher defined priority
      score += agent.priority;

      // Adjust score based on urgency and complexity from metadata
      if (metadata.urgency === 'critical') score += 10;
      else if (metadata.urgency === 'high') score += 5;

      if (metadata.complexity === 'enterprise') score += 10;
      else if (metadata.complexity === 'complex') score += 5;

      // If an agent specifically lists requested tools, increase score
      // (This requires a more sophisticated tool matching which we can add later)

      if (score > maxScore) {
        maxScore = score;
        bestAgent = agent;
      }
    });

    return bestAgent ? bestAgent.name : 'General Agent'; // Fallback to General Agent
  }

  private getModelForAgent(agent: AgentDefinition): Runnable<any, any, any> | null {
    if (agent.model === 'gpt-4' || agent.model === 'gpt-3.5-turbo') {
      return this.openaiModel;
    } else if (agent.model === 'claude-3-sonnet') {
      return this.anthropicModel;
    }
    return null;
  }

  public async *invoke(input: {
    messages: BaseMessage[];
    requestedAgent?: string;
    context?: any;
  }): AsyncGenerator<any, void, unknown> {
    if (!this.isInitialized) {
      logger.warn('Orchestrator not initialized. Attempting initialization...');
      await this.initialize();
      if (!this.isInitialized) {
        throw new Error('Orchestrator failed to initialize.');
      }
    }

    const state: typeof AgentState.State = {
      messages: input.messages,
      requestedAgent: input.requestedAgent ?? "Auto",
      context: input.context || {},
      selectedAgent: "", // Will be determined by routeToAgent
      agentResponses: {},
      currentStep: "analyze",
      capabilities: [],
      metadata: {},
    };

    let currentState = state;
    const graphExecutor = this.graph; // this.graph already holds the compiled graph

    for await (const chunk of await graphExecutor.stream(currentState)) {
      currentState = { ...currentState, ...chunk };
      logger.debug(`Current graph state: ${currentState.currentStep}`);

      // Yield response chunks as they are generated by the executeAgent step
      if (currentState.currentStep === "synthesizeResponse" && currentState.agentResponses) {
        for (const agentName in currentState.agentResponses) {
          const responses = currentState.agentResponses[agentName];
          for (const msg of responses) {
            if (msg instanceof AIMessage) {
              yield { type: 'chunk', data: msg.content };
            } else if (msg instanceof ToolMessage) {
               try {
                let toolOutputContent: string;
                if (typeof msg.content === 'string') {
                    toolOutputContent = msg.content;
                } else {
                    // If content is not a string, stringify it to make it a valid JSON string for parsing.
                    toolOutputContent = JSON.stringify(msg.content);
                }
                const toolOutput = JSON.parse(toolOutputContent);
                yield { type: 'tool_output', name: msg.name, output: toolOutput };
              } catch (e) {
                logger.error(`Failed to parse tool message content as JSON: ${msg.content}`, e);
                yield { type: 'tool_output', name: msg.name, output: { raw: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content), error: 'Failed to parse JSON output' } };
              }
            }
          }
        }
      }
    }

    // After the graph finishes, yield the final message if it exists
    const finalMessage = currentState.messages[currentState.messages.length - 1];
    if (finalMessage instanceof AIMessage) {
      const data = typeof finalMessage.content === 'string' ? finalMessage.content : JSON.stringify(finalMessage.content);
      yield { type: 'complete', data };
    } else {
      yield { type: 'complete', data: 'Orchestration complete, but no final AI message generated.' };
    }
  }

  public getAvailableAgents(): Array<{
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    status: 'online' | 'offline';
  }> {
    return Array.from(this.agents.values()).map(agent => ({
      id: agent.name.replace(/ /g, '-').toLowerCase(),
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      status: this.getModelForAgent(agent) ? 'online' : 'offline', // Check if model is initialized
    }));
  }

  public getOrchestrationStats(): {
    totalAgents: number;
    modelsAvailable: string[];
    isInitialized: boolean;
    capabilityCoverage: string[];
  } {
    const models: string[] = [];
    if (this.openaiModel) models.push('OpenAI');
    if (this.anthropicModel) models.push('Anthropic');

    return {
      totalAgents: this.agents.size,
      modelsAvailable: models,
      isInitialized: this.isInitialized,
      capabilityCoverage: Array.from(new Set(Array.from(this.agents.values()).flatMap(agent => agent.capabilities))),
    };
  }
}