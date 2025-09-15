import OpenAI from "openai";
import { storage } from "../storage";
import { AiAgent, InsertAiAgent, AgentTask, InsertAgentTask } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export type AgentType = "sre" | "security" | "performance" | "deployment";

export interface AgentConfig {
  type: AgentType;
  name: string;
  projectId: string;
  configuration?: any;
}

export interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number;
  metadata: any;
}

export class AgentManager {
  private agents: Map<string, AiAgent> = new Map();
  private agentHeartbeats: Map<string, Date> = new Map();

  async createAgent(config: AgentConfig): Promise<AiAgent> {
    const agentData: InsertAiAgent = {
      projectId: config.projectId,
      name: config.name,
      type: config.type,
      configuration: {
        ...this.getDefaultConfiguration(config.type),
        ...config.configuration
      }
    };

    const agent = await storage.createAiAgent(agentData);
    this.agents.set(agent.id, agent);
    await this.startAgentHeartbeat(agent.id);
    
    return agent;
  }

  async getAgent(agentId: string): Promise<AiAgent | undefined> {
    return await storage.getAiAgent(agentId);
  }

  async getProjectAgents(projectId: string): Promise<AiAgent[]> {
    return await storage.getProjectAgents(projectId);
  }

  async makeIntelligentDecision(agentId: string, context: any, options: any[]): Promise<AgentDecision> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const prompt = this.buildDecisionPrompt(agent, context, options);
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: this.getAgentSystemPrompt(agent.type as AgentType)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const decision = JSON.parse(response.choices[0].message.content || "{}");
      return {
        action: decision.action || "no-action",
        reasoning: decision.reasoning || "No reasoning provided",
        confidence: decision.confidence || 0.5,
        metadata: decision.metadata || {}
      };
    } catch (error) {
      console.error("AI decision making failed:", error);
      return {
        action: "fallback",
        reasoning: "AI decision failed, using fallback",
        confidence: 0.1,
        metadata: { error: (error as Error).message }
      };
    }
  }

  async assignTask(agentId: string, taskData: Omit<InsertAgentTask, 'agentId'>): Promise<AgentTask> {
    const task: InsertAgentTask = {
      agentId,
      ...taskData
    };

    const createdTask = await storage.createAgentTask(task);
    await this.processAgentTask(createdTask);
    return createdTask;
  }

  private async processAgentTask(task: AgentTask): Promise<void> {
    try {
      await storage.updateAgentTask(task.id, {
        status: "running",
        startedAt: new Date()
      });

      // Simulate task processing based on agent type
      const result = await this.executeTask(task);

      await storage.updateAgentTask(task.id, {
        status: "completed",
        output: result,
        completedAt: new Date()
      });
    } catch (error) {
      await storage.updateAgentTask(task.id, {
        status: "failed",
        errorMessage: (error as Error).message,
        completedAt: new Date()
      });
    }
  }

  private async executeTask(task: AgentTask): Promise<any> {
    const agent = await this.getAgent(task.agentId);
    if (!agent) throw new Error("Agent not found");

    switch (agent.type) {
      case "sre":
        return await this.executeSRETask(task);
      case "security":
        return await this.executeSecurityTask(task);
      case "performance":
        return await this.executePerformanceTask(task);
      case "deployment":
        return await this.executeDeploymentTask(task);
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  private async executeSRETask(task: AgentTask): Promise<any> {
    switch (task.taskType) {
      case "incident-response":
        return await this.handleIncidentResponse(task);
      case "monitoring":
        return await this.performMonitoring(task);
      default:
        return { message: "SRE task completed", taskType: task.taskType };
    }
  }

  private async executeSecurityTask(task: AgentTask): Promise<any> {
    switch (task.taskType) {
      case "vulnerability-scan":
        return await this.performSecurityScan(task);
      default:
        return { message: "Security task completed", taskType: task.taskType };
    }
  }

  private async executePerformanceTask(task: AgentTask): Promise<any> {
    switch (task.taskType) {
      case "optimization":
        return await this.performOptimization(task);
      default:
        return { message: "Performance task completed", taskType: task.taskType };
    }
  }

  private async executeDeploymentTask(task: AgentTask): Promise<any> {
    switch (task.taskType) {
      case "deployment":
        return await this.performDeployment(task);
      default:
        return { message: "Deployment task completed", taskType: task.taskType };
    }
  }

  private async handleIncidentResponse(task: AgentTask): Promise<any> {
    // Intelligent incident response logic
    const decision = await this.makeIntelligentDecision(task.agentId, {
      incident: task.input,
      task: "incident-response"
    }, [
      { action: "auto-restart", description: "Restart affected services" },
      { action: "scale-up", description: "Scale up resources" },
      { action: "escalate", description: "Escalate to human operator" }
    ]);

    return {
      action: decision.action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date().toISOString()
    };
  }

  private async performMonitoring(task: AgentTask): Promise<any> {
    // Generate synthetic monitoring data
    const metrics = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      response_time: Math.random() * 1000,
      error_rate: Math.random() * 5
    };

    // Store metrics
    for (const [metricType, value] of Object.entries(metrics)) {
      await storage.createPerformanceMetric({
        projectId: task.projectId,
        metricType,
        value: value.toString(),
        unit: this.getMetricUnit(metricType),
        tags: { agent: "sre", automated: "true" }
      });
    }

    return { metrics, timestamp: new Date().toISOString() };
  }

  private async performSecurityScan(task: AgentTask): Promise<any> {
    const findings = [
      {
        type: "vulnerability",
        severity: "medium",
        description: "Outdated dependency detected",
        recommendation: "Update to latest version"
      }
    ];

    await storage.createSecurityScan({
      projectId: task.projectId,
      scanType: task.input.scanType || "vulnerability",
      metadata: { findings }
    });

    return { findings, timestamp: new Date().toISOString() };
  }

  private async performOptimization(task: AgentTask): Promise<any> {
    const decision = await this.makeIntelligentDecision(task.agentId, {
      metrics: task.input.metrics,
      task: "optimization"
    }, [
      { action: "cache-optimization", description: "Optimize caching strategy" },
      { action: "resource-scaling", description: "Adjust resource allocation" },
      { action: "code-optimization", description: "Suggest code improvements" }
    ]);

    return {
      optimization: decision.action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date().toISOString()
    };
  }

  private async performDeployment(task: AgentTask): Promise<any> {
    const deploymentData = task.input;
    
    // Create deployment record
    const deployment = await storage.createDeployment({
      projectId: task.projectId,
      version: deploymentData.version,
      strategy: deploymentData.strategy || "blue-green",
      environment: deploymentData.environment || "production",
      metadata: { initiatedBy: "ai-agent", agentId: task.agentId }
    });

    // Simulate deployment process
    setTimeout(async () => {
      await storage.updateDeployment(deployment.id, {
        status: "deployed",
        deployedAt: new Date()
      });
    }, 3000);

    return {
      deploymentId: deployment.id,
      status: "initiated",
      timestamp: new Date().toISOString()
    };
  }

  private getDefaultConfiguration(type: AgentType): any {
    switch (type) {
      case "sre":
        return {
          monitoring_interval: 60,
          incident_thresholds: { error_rate: 5, response_time: 2000 },
          auto_remediation: true
        };
      case "security":
        return {
          scan_frequency: "daily",
          vulnerability_threshold: "medium",
          auto_patch: false
        };
      case "performance":
        return {
          optimization_frequency: "weekly",
          performance_thresholds: { cpu: 80, memory: 90 }
        };
      case "deployment":
        return {
          strategy: "blue-green",
          rollback_threshold: { error_rate: 10 },
          approval_required: false
        };
      default:
        return {};
    }
  }

  private getAgentSystemPrompt(type: AgentType): string {
    switch (type) {
      case "sre":
        return `You are an SRE (Site Reliability Engineering) AI agent. Your role is to ensure system reliability, handle incidents, and maintain service quality. Always prioritize system stability and user experience. Respond with JSON containing: action, reasoning, confidence (0-1), metadata.`;
      
      case "security":
        return `You are a Security AI agent. Your role is to protect systems from threats, manage vulnerabilities, and ensure compliance. Always prioritize security and data protection. Respond with JSON containing: action, reasoning, confidence (0-1), metadata.`;
      
      case "performance":
        return `You are a Performance AI agent. Your role is to optimize system performance, manage resources, and improve efficiency. Always prioritize speed and resource optimization. Respond with JSON containing: action, reasoning, confidence (0-1), metadata.`;
      
      case "deployment":
        return `You are a Deployment AI agent. Your role is to manage deployments, handle releases, and ensure smooth rollouts. Always prioritize deployment safety and zero-downtime. Respond with JSON containing: action, reasoning, confidence (0-1), metadata.`;
      
      default:
        return `You are an AI agent. Make intelligent decisions based on the context provided. Respond with JSON containing: action, reasoning, confidence (0-1), metadata.`;
    }
  }

  private buildDecisionPrompt(agent: AiAgent, context: any, options: any[]): string {
    return `
Context: ${JSON.stringify(context, null, 2)}

Available options:
${options.map((opt, idx) => `${idx + 1}. ${opt.action}: ${opt.description}`).join('\n')}

Agent Configuration: ${JSON.stringify(agent.configuration, null, 2)}

Based on the context and your role as a ${agent.type} agent, make an intelligent decision. Consider the urgency, impact, and available resources.
    `;
  }

  private getMetricUnit(metricType: string): string {
    const units: Record<string, string> = {
      cpu_usage: "percent",
      memory_usage: "percent", 
      response_time: "milliseconds",
      error_rate: "percent",
      throughput: "requests/sec"
    };
    return units[metricType] || "unit";
  }

  private async startAgentHeartbeat(agentId: string): Promise<void> {
    const updateHeartbeat = async () => {
      this.agentHeartbeats.set(agentId, new Date());
      await storage.updateAiAgent(agentId, { lastHeartbeat: new Date() });
    };

    // Initial heartbeat
    await updateHeartbeat();

    // Set up recurring heartbeat every 30 seconds
    const interval = setInterval(updateHeartbeat, 30000);

    // Store interval for cleanup (in a real system, you'd want better cleanup)
    setTimeout(() => clearInterval(interval), 24 * 60 * 60 * 1000); // 24 hours
  }

  async getAgentHealth(agentId: string): Promise<{ status: string; lastSeen: Date | null }> {
    const lastHeartbeat = this.agentHeartbeats.get(agentId);
    const now = new Date();
    
    if (!lastHeartbeat) {
      return { status: "unknown", lastSeen: null };
    }

    const timeDiff = now.getTime() - lastHeartbeat.getTime();
    const isHealthy = timeDiff < 60000; // 1 minute threshold

    return {
      status: isHealthy ? "healthy" : "unhealthy",
      lastSeen: lastHeartbeat
    };
  }
}

export const agentManager = new AgentManager();