import { StateGraph, END, START } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { MCPClient } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

interface TerraformState {
  messages: Array<HumanMessage | AIMessage | SystemMessage>;
  context: {
    cloudProvider?: 'aws' | 'azure' | 'gcp';
    currentFiles?: string[];
    workingDirectory?: string;
    errorLogs?: string[];
  };
  plan?: string;
  currentStep: 'analyze' | 'plan' | 'generate' | 'validate' | 'complete';
  tools: any[];
}

class TerraformAgentV2 {
  private llm: ChatOpenAI;
  private mcpClient: MCPClient;
  private graph: StateGraph<TerraformState>;

  constructor(apiKey: string) {
    this.llm = new ChatOpenAI({
      apiKey,
      model: "gpt-4o-mini",
      temperature: 0.1,
    });

    this.initializeMCPClient();
    this.buildGraph();
  }

  private async initializeMCPClient() {
    // Initialize MCP client for Terraform tools
    const transport = new StdioClientTransport({
      command: "terraform-mcp-server", // We'll create this
      args: [],
    });

    this.mcpClient = new MCPClient(
      {
        name: "careerate-terraform",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    await this.mcpClient.connect(transport);
  }

  private buildGraph() {
    const graph = new StateGraph<TerraformState>({
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
      },
    });

    // Add nodes
    graph.addNode("analyze_context", this.analyzeContext.bind(this));
    graph.addNode("plan_infrastructure", this.planInfrastructure.bind(this));
    graph.addNode("generate_terraform", this.generateTerraform.bind(this));
    graph.addNode("validate_config", this.validateConfig.bind(this));
    graph.addNode("tools", new ToolNode([])); // Will be populated with MCP tools

    // Add edges
    graph.addEdge(START, "analyze_context");
    graph.addConditionalEdges(
      "analyze_context",
      this.shouldPlan.bind(this),
      {
        plan: "plan_infrastructure",
        generate: "generate_terraform",
        validate: "validate_config",
      }
    );
    graph.addEdge("plan_infrastructure", "generate_terraform");
    graph.addEdge("generate_terraform", "validate_config");
    graph.addConditionalEdges(
      "validate_config",
      this.shouldContinue.bind(this),
      {
        continue: "generate_terraform",
        tools: "tools",
        end: END,
      }
    );
    graph.addEdge("tools", "validate_config");

    this.graph = graph.compile();
  }

  private async analyzeContext(state: TerraformState): Promise<Partial<TerraformState>> {
    const systemPrompt = `You are a senior DevOps engineer specializing in Terraform infrastructure as code.
    
    Analyze the user's request and current context to understand:
    1. What infrastructure they want to create/modify
    2. Which cloud provider they're using
    3. Current state of their Terraform configuration
    4. Any errors or issues they're facing
    
    Context provided: ${JSON.stringify(state.context)}
    Latest message: ${state.messages[state.messages.length - 1]?.content}`;

    const response = await this.llm.invoke([
      new SystemMessage(systemPrompt),
      ...state.messages,
    ]);

    // Extract cloud provider and determine next step
    const content = response.content as string;
    const cloudProvider = this.extractCloudProvider(content);
    
    return {
      messages: [response],
      context: { ...state.context, cloudProvider },
      currentStep: "plan",
    };
  }

  private async planInfrastructure(state: TerraformState): Promise<Partial<TerraformState>> {
    const planningPrompt = `Based on the analysis, create a detailed plan for the Terraform infrastructure.
    
    Include:
    1. Resource hierarchy and dependencies
    2. Required providers and versions
    3. Variables and outputs needed
    4. Security considerations
    5. Best practices to follow
    
    Cloud Provider: ${state.context.cloudProvider}
    Requirements: ${state.messages[state.messages.length - 1]?.content}`;

    const response = await this.llm.invoke([
      new SystemMessage(planningPrompt),
      ...state.messages,
    ]);

    return {
      messages: [response],
      plan: response.content as string,
      currentStep: "generate",
    };
  }

  private async generateTerraform(state: TerraformState): Promise<Partial<TerraformState>> {
    const generationPrompt = `Generate production-ready Terraform configuration based on the plan.
    
    Requirements:
    - Use latest provider versions
    - Include proper variable definitions
    - Add comprehensive outputs
    - Follow naming conventions
    - Include security best practices
    - Add resource tags
    
    Plan: ${state.plan}
    Cloud Provider: ${state.context.cloudProvider}`;

    const response = await this.llm.invoke([
      new SystemMessage(generationPrompt),
      ...state.messages,
    ]);

    return {
      messages: [response],
      currentStep: "validate",
    };
  }

  private async validateConfig(state: TerraformState): Promise<Partial<TerraformState>> {
    try {
      // Use MCP tools to validate Terraform configuration
      const tools = await this.mcpClient.listTools();
      const validateTool = tools.tools.find(t => t.name === "terraform_validate");
      
      if (validateTool) {
        const lastMessage = state.messages[state.messages.length - 1];
        const tfConfig = this.extractTerraformCode(lastMessage.content as string);
        
        const validationResult = await this.mcpClient.callTool({
          name: "terraform_validate",
          arguments: { config: tfConfig },
        });

        if (validationResult.isError) {
          const errorPrompt = `The generated Terraform configuration has validation errors:
          ${validationResult.content}
          
          Please fix these issues and regenerate the configuration.`;

          const response = await this.llm.invoke([
            new SystemMessage(errorPrompt),
            ...state.messages,
          ]);

          return {
            messages: [response],
            currentStep: "generate", // Go back to generation
          };
        }
      }

      return { currentStep: "complete" };
    } catch (error) {
      console.error("Validation error:", error);
      return { currentStep: "complete" };
    }
  }

  private shouldPlan(state: TerraformState): string {
    // Determine next step based on context analysis
    if (state.context.errorLogs?.length) return "validate";
    if (state.context.currentFiles?.length) return "generate";
    return "plan";
  }

  private shouldContinue(state: TerraformState): string {
    if (state.currentStep === "complete") return "end";
    if (state.context.errorLogs?.length) return "tools";
    return "end";
  }

  private extractCloudProvider(content: string): 'aws' | 'azure' | 'gcp' | undefined {
    const lower = content.toLowerCase();
    if (lower.includes('aws') || lower.includes('amazon')) return 'aws';
    if (lower.includes('azure') || lower.includes('microsoft')) return 'azure';
    if (lower.includes('gcp') || lower.includes('google')) return 'gcp';
    return undefined;
  }

  private extractTerraformCode(content: string): string {
    const matches = content.match(/```(?:terraform|hcl)?\n?([\s\S]*?)```/);
    return matches ? matches[1] : content;
  }

  async processQuery(query: string, context: any = {}): Promise<string> {
    const initialState: TerraformState = {
      messages: [new HumanMessage(query)],
      context,
      currentStep: "analyze",
      tools: [],
    };

    const result = await this.graph.invoke(initialState);
    const lastMessage = result.messages[result.messages.length - 1];
    return lastMessage.content as string;
  }
}

export default TerraformAgentV2; 