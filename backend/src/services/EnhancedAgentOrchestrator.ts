import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage, BaseMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AzureSecretsManager } from './AzureSecretsManager.js';
import { createMCPTools } from '../utils/mcpTools.js';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import winston from 'winston';

const execAsync = promisify(exec);

interface AgentState {
  messages: BaseMessage[];
  context: {
    agentType: string;
    userId: string;
    sessionId: string;
    cloudProvider?: string;
    repository?: string;
    permissions?: string[];
    executionResults?: any[];
  };
  plan?: string;
  currentStep: string;
  tools: any[];
  executionHistory: Array<{
    action: string;
    result: any;
    timestamp: Date;
  }>;
}

interface AgentCapabilities {
  canExecute: boolean;
  tools: string[];
  permissions: string[];
  integrations: string[];
}

export class EnhancedAgentOrchestrator {
  private llm: ChatOpenAI | ChatAnthropic;
  private mcpClients: Map<string, MCPClient> = new Map();
  private graphs: Map<string, any> = new Map();
  private secretsManager: AzureSecretsManager;
  private logger: winston.Logger;
  private agentCapabilities: Map<string, AgentCapabilities> = new Map();

  constructor(private options: {
    useOpenAI?: boolean;
    useAnthropic?: boolean;
    apiKey?: string;
  } = {}) {
    // Initialize logger
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      transports: [new winston.transports.Console()]
    });

    // Initialize LLM - prefer GPT-4.1 Mini for cost efficiency
    if (options.useAnthropic && process.env.ANTHROPIC_API_KEY) {
      this.llm = new ChatAnthropic({
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        modelName: "claude-3-5-haiku-20241022", // Cheapest Claude model for June 2025
        streaming: true,
      });
    } else {
      this.llm = new ChatOpenAI({
        openAIApiKey: options.apiKey || process.env.OPENAI_API_KEY,
        modelName: "gpt-4.1-mini", // Latest cheap model as of June 2025
        temperature: 0.1,
        streaming: true,
      });
    }

    this.secretsManager = new AzureSecretsManager();
    this.initializeAgentCapabilities();
  }

  async initialize() {
    await this.secretsManager.initialize();
    await this.initializeMCPServers();
    await this.buildAgentGraphs();
    this.logger.info('✅ Enhanced Agent Orchestrator initialized with task execution capabilities');
  }

  private initializeAgentCapabilities() {
    // Define what each agent can actually DO, not just recommend
    this.agentCapabilities.set('terraform', {
      canExecute: true,
      tools: ['terraform_plan', 'terraform_apply', 'terraform_destroy', 'terraform_validate'],
      permissions: ['infrastructure:write', 'cloud:manage'],
      integrations: ['aws', 'azure', 'gcp']
    });

    this.agentCapabilities.set('kubernetes', {
      canExecute: true,
      tools: ['kubectl_apply', 'kubectl_get', 'kubectl_scale', 'kubectl_rollout'],
      permissions: ['kubernetes:admin'],
      integrations: ['k8s', 'helm', 'docker']
    });

    this.agentCapabilities.set('monitoring', {
      canExecute: true,
      tools: ['create_alert', 'query_metrics', 'create_dashboard', 'send_notification'],
      permissions: ['monitoring:write', 'alerts:manage'],
      integrations: ['prometheus', 'grafana', 'pagerduty', 'slack']
    });

    this.agentCapabilities.set('incident', {
      canExecute: true,
      tools: ['escalate_incident', 'run_diagnostics', 'execute_playbook', 'rollback_deployment'],
      permissions: ['incident:manage', 'system:admin'],
      integrations: ['pagerduty', 'opsgenie', 'jira', 'slack']
    });

    this.agentCapabilities.set('github', {
      canExecute: true,
      tools: ['create_pr', 'merge_pr', 'create_issue', 'trigger_workflow'],
      permissions: ['repo:write', 'actions:execute'],
      integrations: ['github', 'gitlab', 'bitbucket']
    });
  }

  private async initializeMCPServers() {
    const mcpServers = [
      { name: 'terraform', path: './mcp_servers/terraform-mcp-server.ts' },
      { name: 'kubernetes', path: './mcp_servers/kubernetes-mcp-server.ts' },
      { name: 'github', path: './mcp_servers/github-mcp-server.ts' },
      { name: 'aws', path: './mcp_servers/aws-mcp-server.ts' },
      { name: 'web_search', path: './mcp_servers/web_search_server.py' }
    ];

    for (const server of mcpServers) {
      try {
        const transport = new StdioClientTransport({
          command: server.path.endsWith('.py') ? 'python' : 'tsx',
          args: [server.path],
          env: {
            ...process.env,
            OPENAI_API_KEY: await this.secretsManager.getSecret('OPENAI_API_KEY'),
            ANTHROPIC_API_KEY: await this.secretsManager.getSecret('ANTHROPIC_API_KEY'),
            GITHUB_TOKEN: await this.secretsManager.getSecret('GITHUB_TOKEN'),
            AWS_ACCESS_KEY_ID: await this.secretsManager.getSecret('AWS_ACCESS_KEY_ID'),
            AWS_SECRET_ACCESS_KEY: await this.secretsManager.getSecret('AWS_SECRET_ACCESS_KEY')
          }
        });

        const client = new MCPClient(
          {
            name: `careerate-${server.name}`,
            version: "1.0.0",
          },
          {
            capabilities: {
              tools: {},
              resources: {},
              prompts: {}
            },
          }
        );

        await client.connect(transport);
        this.mcpClients.set(server.name, client);
        this.logger.info(`✅ Connected to MCP server: ${server.name}`);
      } catch (error) {
        this.logger.warn(`⚠️  Failed to connect to MCP server ${server.name}:`, error);
      }
    }
  }

  private async buildAgentGraphs() {
    const agentTypes = ['terraform', 'kubernetes', 'monitoring', 'incident', 'github'];
    
    for (const agentType of agentTypes) {
      const graph = new StateGraph<AgentState>({
        channels: {
          messages: {
            value: (x: any, y: any) => x.concat(y),
            default: () => [],
          },
          context: {
            value: (x: any, y: any) => ({ ...x, ...y }),
            default: () => ({}),
          },
          plan: {
            value: (x: any, y: any) => y ?? x,
            default: () => null,
          },
          currentStep: {
            value: (x: any, y: any) => y ?? x,
            default: () => "analyze",
          },
          tools: {
            value: (x: any, y: any) => y ?? x,
            default: () => [],
          },
          executionHistory: {
            value: (x: any, y: any) => x.concat(y || []),
            default: () => [],
          }
        },
      });

      // Add nodes
      graph.addNode("analyze", this.analyzeRequest.bind(this));
      graph.addNode("plan", this.planExecution.bind(this));
      graph.addNode("execute", this.executeTask.bind(this));
      graph.addNode("verify", this.verifyExecution.bind(this));
      graph.addNode("tools", new ToolNode(await this.getToolsForAgent(agentType)));

      // Add edges
      graph.addEdge(START, "analyze");
      graph.addConditionalEdges(
        "analyze",
        this.shouldProceed.bind(this),
        {
          plan: "plan",
          execute: "execute",
          deny: END,
        }
      );
      graph.addEdge("plan", "execute");
      graph.addConditionalEdges(
        "execute",
        this.checkExecution.bind(this),
        {
          tools: "tools",
          verify: "verify",
          retry: "execute",
          end: END,
        }
      );
      graph.addEdge("tools", "execute");
      graph.addEdge("verify", END);

      this.graphs.set(agentType, graph.compile());
    }
  }

  private async getToolsForAgent(agentType: string): Promise<any[]> {
    const tools = [];
    const mcpClient = this.mcpClients.get(agentType);
    
    if (mcpClient) {
      const mcpTools = await mcpClient.listTools();
      tools.push(...createMCPTools(mcpTools.tools, mcpClient));
    }

    // Add built-in execution tools
    const capabilities = this.agentCapabilities.get(agentType);
    if (capabilities?.canExecute) {
      tools.push(...this.createBuiltInTools(agentType, capabilities));
    }

    return tools;
  }

  private createBuiltInTools(agentType: string, capabilities: AgentCapabilities): any[] {
    const tools = [];

    // Add specific tools based on agent type
    switch (agentType) {
      case 'terraform':
        tools.push({
          name: 'terraform_plan',
          description: 'Run terraform plan to preview infrastructure changes',
          execute: async (args: any) => this.executeTerraformCommand('plan', args)
        });
        tools.push({
          name: 'terraform_apply',
          description: 'Apply terraform changes to create/update infrastructure',
          execute: async (args: any) => this.executeTerraformCommand('apply', args)
        });
        break;
      
      case 'kubernetes':
        tools.push({
          name: 'kubectl_apply',
          description: 'Apply kubernetes configuration',
          execute: async (args: any) => this.executeKubectlCommand('apply', args)
        });
        tools.push({
          name: 'kubectl_scale',
          description: 'Scale kubernetes deployment',
          execute: async (args: any) => this.executeKubectlCommand('scale', args)
        });
        break;

      case 'github':
        tools.push({
          name: 'create_pr',
          description: 'Create a pull request on GitHub',
          execute: async (args: any) => this.executeGitHubAction('create_pr', args)
        });
        tools.push({
          name: 'merge_pr',
          description: 'Merge a pull request on GitHub',
          execute: async (args: any) => this.executeGitHubAction('merge_pr', args)
        });
        break;
    }

    return tools;
  }

  private async analyzeRequest(state: AgentState): Promise<Partial<AgentState>> {
    const systemPrompt = `You are an expert ${state.context.agentType} agent with the ability to EXECUTE tasks, not just recommend them.
    
    Analyze the user's request to determine:
    1. What specific action they want performed
    2. Whether you have permission to execute it
    3. What tools/commands are needed
    4. Any safety considerations
    
    You have these capabilities: ${JSON.stringify(this.agentCapabilities.get(state.context.agentType))}
    
    If the user asks you to DO something (not just explain), you should proceed to execute it.`;

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      ...state.messages,
    ]);

    // Check permissions
    const hasPermission = await this.checkPermissions(state.context);
    
    return {
      messages: [response],
      currentStep: hasPermission ? "plan" : "deny",
    };
  }

  private async planExecution(state: AgentState): Promise<Partial<AgentState>> {
    const planPrompt = `Create a detailed execution plan for the requested task.
    
    Include:
    1. Specific commands/API calls to execute
    2. Order of operations
    3. Rollback strategy if something fails
    4. Expected outcomes
    
    Be precise - you will actually execute these commands.`;

    const response = await this.llm.invoke([
      new SystemMessage(planPrompt),
      ...state.messages,
    ]);

    return {
      messages: [response],
      plan: response.content as string,
      currentStep: "execute",
    };
  }

  private async executeTask(state: AgentState): Promise<Partial<AgentState>> {
    const executePrompt = `Execute the planned task using the available tools.
    
    Plan: ${state.plan}
    
    Use the tools to perform the actual work. Report what you're doing as you go.`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(executePrompt),
        ...state.messages,
      ]);

      // Log execution
      const execution = {
        action: 'task_execution',
        result: response.content,
        timestamp: new Date()
      };

      return {
        messages: [response],
        executionHistory: [execution],
        currentStep: "verify",
      };
    } catch (error) {
      this.logger.error('Execution failed:', error);
      return {
        messages: [new AIMessage(`Execution failed: ${error.message}`)],
        currentStep: "end",
      };
    }
  }

  private async verifyExecution(state: AgentState): Promise<Partial<AgentState>> {
    const verifyPrompt = `Verify the execution completed successfully.
    
    Check:
    1. Did the task complete as expected?
    2. Are there any errors or warnings?
    3. Should we run any validation commands?
    
    Execution history: ${JSON.stringify(state.executionHistory)}`;

    const response = await this.llm.invoke([
      new SystemMessage(verifyPrompt),
      ...state.messages,
    ]);

    return {
      messages: [response],
      currentStep: "end",
    };
  }

  // Helper methods for actual execution
  private async executeTerraformCommand(command: string, args: any): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(`terraform ${command} ${args.flags || ''}`);
      return { success: true, output: stdout, error: stderr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeKubectlCommand(command: string, args: any): Promise<any> {
    try {
      const { stdout, stderr } = await execAsync(`kubectl ${command} ${args.flags || ''}`);
      return { success: true, output: stdout, error: stderr };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async executeGitHubAction(action: string, args: any): Promise<any> {
    const token = await this.secretsManager.getSecret('GITHUB_TOKEN');
    
    try {
      switch (action) {
        case 'create_pr':
          const response = await axios.post(
            `https://api.github.com/repos/${args.repo}/pulls`,
            {
              title: args.title,
              body: args.body,
              head: args.head,
              base: args.base
            },
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          return { success: true, pr: response.data };
        
        case 'merge_pr':
          const mergeResponse = await axios.put(
            `https://api.github.com/repos/${args.repo}/pulls/${args.number}/merge`,
            {
              commit_title: args.title,
              commit_message: args.message,
              merge_method: args.method || 'merge'
            },
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          return { success: true, merge: mergeResponse.data };
        
        default:
          return { success: false, error: `Unknown action: ${action}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  private async checkPermissions(context: any): Promise<boolean> {
    // Check user permissions against required permissions
    const requiredPermissions = this.agentCapabilities.get(context.agentType)?.permissions || [];
    const userPermissions = context.permissions || [];
    
    return requiredPermissions.every(perm => userPermissions.includes(perm));
  }

  private shouldProceed(state: AgentState): string {
    if (state.currentStep === "deny") return "deny";
    if (state.plan) return "execute";
    return "plan";
  }

  private checkExecution(state: AgentState): string {
    const lastExecution = state.executionHistory[state.executionHistory.length - 1];
    if (!lastExecution) return "end";
    
    if (lastExecution.result?.success === false) return "retry";
    if (lastExecution.result?.needsVerification) return "verify";
    return "end";
  }

  // Public interface
  async processRequest(params: {
    message: string;
    agentType: string;
    userId: string;
    sessionId: string;
    context?: any;
  }): Promise<AsyncIterable<any>> {
    const graph = this.graphs.get(params.agentType);
    if (!graph) {
      throw new Error(`Unknown agent type: ${params.agentType}`);
    }

    const initialState: AgentState = {
      messages: [new HumanMessage(params.message)],
      context: {
        agentType: params.agentType,
        userId: params.userId,
        sessionId: params.sessionId,
        ...params.context
      },
      currentStep: "analyze",
      tools: [],
      executionHistory: []
    };

    return graph.stream(initialState);
  }

  async listAgents() {
    return Array.from(this.agentCapabilities.entries()).map(([id, capabilities]) => ({
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      capabilities,
      status: this.mcpClients.has(id) ? 'active' : 'limited'
    }));
  }

  async getAgentCapabilities(agentType: string) {
    const capabilities = this.agentCapabilities.get(agentType);
    const mcpClient = this.mcpClients.get(agentType);
    
    let availableTools = capabilities?.tools || [];
    if (mcpClient) {
      const mcpTools = await mcpClient.listTools();
      availableTools = [...availableTools, ...mcpTools.tools.map(t => t.name)];
    }

    return {
      agent: agentType,
      canExecute: capabilities?.canExecute || false,
      tools: availableTools,
      permissions: capabilities?.permissions || [],
      integrations: capabilities?.integrations || [],
      modelProvider: this.llm instanceof ChatAnthropic ? 'Anthropic' : 'OpenAI'
    };
  }
} 