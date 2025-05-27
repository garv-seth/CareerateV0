import { Anthropic } from '@anthropic-ai/sdk';
import { OpenAI } from 'openai';
import { DatabaseStorage } from '../storage';
import { MCPRegistry } from '../mcp_servers/registry';
import { eq, desc } from 'drizzle-orm';
import { aiTools, userProgress, recommendations, learningPaths, type InsertLearningPath, type InsertRecommendation } from '@shared/schema';

interface Server {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  lastHeartbeat: number;
}

interface Tool {
  id: string;
  name: string;
  relevance: number;
}

interface AgentState {
  userId: string;
  workflowData: Record<string, any>;
  discoveredTools: any[];
  learningPaths: any[];
  implementationGuides: any[];
  privacyConcerns: string[];
  messages: any[];
  currentTask: string;
  metadata: Record<string, any>;
}

export class AgentOrchestrator {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private storage: DatabaseStorage;
  private mcpRegistry: MCPRegistry;

  constructor(storage: DatabaseStorage, mcpRegistry: MCPRegistry) {
    this.storage = storage;
    this.mcpRegistry = mcpRegistry;
    this.anthropic = mcpRegistry.getAnthropic();
    this.openai = mcpRegistry.getOpenAI();
  }

  async initialize() {
    // Initialize any necessary connections or setup
    console.log("Initializing Agent Orchestrator...");
  }

  async analyzeUser(userId: string, workflowData: Record<string, any>) {
    const state: AgentState = {
      userId,
      workflowData,
      discoveredTools: [],
      learningPaths: [],
      implementationGuides: [],
      privacyConcerns: [],
      messages: [],
      currentTask: 'full_analysis',
      metadata: {}
    };

    // Run privacy check
    state.privacyConcerns = await this.privacyCheck(state.workflowData);
    if (state.privacyConcerns.length > 0) {
      state.workflowData = await this.sanitizeData(state.workflowData);
    }

    // Analyze workflow
    const analysis = await this.analyzeWorkflow(userId);
    state.workflowData = { ...state.workflowData, analysis };

    // Discover tools
    state.discoveredTools = await this.discoverTools(userId);

    // Create learning paths
    const learningPath = await this.createLearningPath(userId, state.discoveredTools);
    state.learningPaths = [learningPath];

    // Generate implementation guides
    state.implementationGuides = await this.generateGuides(
      state.discoveredTools.slice(0, 5),
      state.workflowData,
      state.learningPaths
    );

    // Save results
    await this.saveResults(userId, { tools: state.discoveredTools, learningPathId: state.learningPaths[0]?.id || 0 });

    return {
      status: 'success',
      workflowAnalysis: state.workflowData,
      recommendedTools: state.discoveredTools.slice(0, 10),
      learningPaths: state.learningPaths.slice(0, 5),
      implementationGuides: state.implementationGuides.slice(0, 5),
      messages: state.messages.map(msg => msg.content),
      privacyConcerns: state.privacyConcerns
    };
  }

  private async privacyCheck(data: Record<string, any>): Promise<string[]> {
    // Implement privacy checks
    return [];
  }

  private async sanitizeData(data: Record<string, any>): Promise<Record<string, any>> {
    // Implement data sanitization
    return data;
  }

  async analyzeWorkflow(userId: string) {
    // Get user data from storage
    const userProgress = await this.storage.getUserProgress(userId);
    const weeklyStats = await this.storage.getUserWeeklyStats(userId);

    // Use AI to analyze workflow patterns
    const analysis = await this.anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `Analyze this user's workflow patterns and suggest improvements:\n${JSON.stringify({ userProgress, weeklyStats }, null, 2)}`
      }]
    });

    return analysis.content[0]?.text || "";
  }

  async discoverTools(userId: string) {
    // Get user preferences and patterns
    const userPreferences = await this.storage.getUserPreferences(userId);
    const userPatterns = await this.storage.getUserPatterns(userId);

    // Get available MCP servers
    const availableServers = await this.mcpRegistry.getAvailableServers();

    // Filter and rank tools based on user patterns and preferences
    const tools = availableServers
      .filter((server: Server) => server.status === 'running')
      .map((server: Server) => ({
        id: server.id,
        name: server.name,
        relevance: this.calculateToolRelevance(server, userPatterns, userPreferences)
      }))
      .sort((a: Tool, b: Tool) => b.relevance - a.relevance);

    return tools;
  }

  private calculateToolRelevance(server: Server, patterns: any, preferences: any): number {
    // Implement tool relevance calculation logic
    return 0.5; // Placeholder
  }

  async createLearningPath(userId: string, tools: Tool[]) {
    // Use AI to generate a learning path
    const learningPath = await this.openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [{
        role: "user",
        content: `Create a learning path for these tools:\n${JSON.stringify(tools, null, 2)}`
      }]
    });

    // Save learning path to database
    const path: InsertLearningPath = {
      userId,
      tools: tools.map(t => t.id),
      steps: learningPath.choices[0]?.message?.content?.split('\n') || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.saveLearningPath(path);
    return path;
  }

  private async generateGuides(tools: any[], workflowContext: Record<string, any>, learningPaths: any[]) {
    const guides = [];

    for (const tool of tools) {
      const guide = {
        toolId: tool.id,
        title: `Getting Started with ${tool.name}`,
        content: await this.generateGuideContent(tool, workflowContext),
        difficulty: 'beginner',
        estimatedTime: '2 hours'
      };
      guides.push(guide);
    }

    return guides;
  }

  private async generateGuideContent(tool: any, workflowContext: Record<string, any>) {
    // Implement guide content generation
    return '';
  }

  async getRealTimeInsights(userId: string) {
    // Get real-time data from MCP servers
    const servers = await this.mcpRegistry.getAvailableServers();
    const insights = [];

    for (const server of servers) {
      if (server.status === 'running') {
        try {
          const serverStatus = await this.mcpRegistry.getServerStatus(server.id);
          insights.push({
            serverId: server.id,
            status: serverStatus.status,
            lastHeartbeat: serverStatus.lastHeartbeat
          });
        } catch (error) {
          console.error(`Failed to get insights from ${server.id}:`, error);
        }
      }
    }

    return insights;
  }

  async saveResults(userId: string, results: { tools: Tool[], learningPathId: number }) {
    // Save tools and learning paths to database
    const recommendation: InsertRecommendation = {
      userId,
      tools: results.tools,
      learningPathId: results.learningPathId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.storage.saveRecommendation(recommendation);
    return recommendation;
  }
} 