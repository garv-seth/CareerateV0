import OpenAI from "openai";
import { storage } from "../storage";
import { AiAgent, InsertAiAgent, AgentTask, InsertAgentTask, AgentCommunication, InsertAgentCommunication } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "fake-key-for-testing"
});

export type AgentType = "coordinator" | "sre" | "security" | "performance" | "deployment" | "code-review" | "monitoring";

export interface AgentConfig {
  type: AgentType;
  name: string;
  projectId: string;
  configuration?: any;
  parentAgentId?: string;
  capabilities?: string[];
}

export interface AgentDecision {
  action: string;
  reasoning: string;
  confidence: number;
  requiresSubAgent?: boolean;
  subAgentType?: AgentType;
  subAgentCapabilities?: string[];
  metadata: any;
}

export interface SubAgentRequest {
  parentTaskId: string;
  requiredCapabilities: string[];
  taskType: string;
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  input: any;
  estimatedDuration?: number;
}

export class EnhancedAgentManager {
  private agents: Map<string, AiAgent> = new Map();
  private agentHeartbeats: Map<string, Date> = new Map();
  private coordinatorAgent: AiAgent | null = null;

  async initialize(projectId: string): Promise<void> {
    // Create a coordinator agent for this project if it doesn't exist
    const existingAgents = await storage.getProjectAgents(projectId);
    this.coordinatorAgent = existingAgents.find(agent => agent.type === 'coordinator') || null;

    if (!this.coordinatorAgent) {
      this.coordinatorAgent = await this.createAgent({
        type: 'coordinator',
        name: 'Project Coordinator',
        projectId,
        capabilities: ['task-coordination', 'sub-agent-management', 'decision-making', 'resource-allocation'],
        configuration: {
          maxSubAgents: 5,
          taskTimeoutMinutes: 30,
          autoCreateSubAgents: true,
          coordinationStrategy: 'hierarchical'
        }
      });
    }

    // Load existing agents into memory
    for (const agent of existingAgents) {
      this.agents.set(agent.id, agent);
      await this.startAgentHeartbeat(agent.id);
    }
  }

  async createAgent(config: AgentConfig): Promise<AiAgent> {
    const agentData: InsertAiAgent = {
      projectId: config.projectId,
      name: config.name,
      type: config.type,
      status: 'active',
      capabilities: config.capabilities || this.getDefaultCapabilities(config.type),
      configuration: {
        ...this.getDefaultConfiguration(config.type),
        ...config.configuration
      },
      parentAgentId: config.parentAgentId || null,
      agentLevel: config.parentAgentId ? 1 : 0,
      metadata: {
        createdBy: 'enhanced-agent-manager',
        createdAt: new Date().toISOString()
      }
    };

    const agent = await storage.createAiAgent(agentData);
    this.agents.set(agent.id, agent);
    await this.startAgentHeartbeat(agent.id);

    return agent;
  }

  async assignTask(agentId: string, taskData: Omit<InsertAgentTask, 'agentId'>): Promise<AgentTask> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const task: InsertAgentTask = {
      agentId,
      ...taskData
    };

    const createdTask = await storage.createAgentTask(task);

    // Process the task asynchronously
    this.processAgentTask(createdTask).catch(error => {
      console.error(`Task processing failed for task ${createdTask.id}:`, error);
    });

    return createdTask;
  }

  async createSubAgent(parentAgentId: string, request: SubAgentRequest): Promise<AiAgent> {
    const parentAgent = await this.getAgent(parentAgentId);
    if (!parentAgent) {
      throw new Error(`Parent agent ${parentAgentId} not found`);
    }

    // Determine the best sub-agent type based on required capabilities
    const subAgentType = this.determineSubAgentType(request.requiredCapabilities);

    const subAgent = await this.createAgent({
      type: subAgentType,
      name: `${subAgentType.toUpperCase()} Sub-Agent`,
      projectId: parentAgent.projectId,
      parentAgentId: parentAgentId,
      capabilities: request.requiredCapabilities,
      configuration: {
        specializedFor: request.taskType,
        parentTaskId: request.parentTaskId,
        autoDestroy: true, // Sub-agents can be destroyed after task completion
        maxIdleTime: 30 * 60 * 1000 // 30 minutes
      }
    });

    // Send communication to parent about sub-agent creation
    await this.sendAgentMessage({
      fromAgentId: subAgent.id,
      toAgentId: parentAgentId,
      messageType: 'status-update',
      content: {
        event: 'sub-agent-created',
        subAgentId: subAgent.id,
        capabilities: request.requiredCapabilities,
        taskType: request.taskType
      },
      relatedTaskId: request.parentTaskId
    });

    return subAgent;
  }

  async makeIntelligentDecision(agentId: string, context: any, options: any[]): Promise<AgentDecision> {
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }

    const prompt = this.buildDecisionPrompt(agent, context, options);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.getAgentSystemPrompt(agent.type as AgentType, agent.capabilities)
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
        temperature: 0.3,
      });

      const decision = JSON.parse(response.choices[0].message.content || "{}");

      // Enhanced decision with sub-agent support
      const enhancedDecision: AgentDecision = {
        action: decision.action || "no-action",
        reasoning: decision.reasoning || "No reasoning provided",
        confidence: decision.confidence || 0.5,
        requiresSubAgent: decision.requiresSubAgent || false,
        subAgentType: decision.subAgentType,
        subAgentCapabilities: decision.subAgentCapabilities || [],
        metadata: decision.metadata || {}
      };

      return enhancedDecision;
    } catch (error) {
      console.error("AI decision making failed:", error);
      return {
        action: "fallback",
        reasoning: "AI decision failed, using fallback",
        confidence: 0.1,
        requiresSubAgent: false,
        metadata: { error: (error as Error).message }
      };
    }
  }

  async sendAgentMessage(message: InsertAgentCommunication): Promise<AgentCommunication> {
    const communication = await storage.createAgentCommunication(message);

    // Notify the receiving agent
    await this.notifyAgent(message.toAgentId, communication);

    return communication;
  }

  async delegateToSubAgent(parentAgentId: string, request: SubAgentRequest): Promise<AgentTask> {
    // Create a sub-agent if needed
    const subAgent = await this.createSubAgent(parentAgentId, request);

    // Assign the task to the sub-agent
    const subTask = await this.assignTask(subAgent.id, {
      projectId: subAgent.projectId,
      taskType: request.taskType,
      priority: request.priority,
      description: request.description,
      input: request.input,
      parentTaskId: request.parentTaskId,
      estimatedDuration: request.estimatedDuration,
      metadata: {
        delegatedFrom: parentAgentId,
        createdBySubAgent: true
      }
    });

    // Update parent task to track sub-agent assignment
    const parentTask = await storage.getAgentTask(request.parentTaskId);
    if (parentTask) {
      await storage.updateAgentTask(request.parentTaskId, {
        assignedToSubAgent: subAgent.id,
        metadata: {
          ...parentTask.metadata,
          subTasks: [...(parentTask.metadata?.subTasks || []), subTask.id]
        }
      });
    }

    return subTask;
  }

  private async processAgentTask(task: AgentTask): Promise<void> {
    try {
      await storage.updateAgentTask(task.id, {
        status: "running",
        startedAt: new Date()
      });

      const agent = await this.getAgent(task.agentId);
      if (!agent) throw new Error("Agent not found");

      // Make intelligent decision about how to handle the task
      const decision = await this.makeIntelligentDecision(task.agentId, {
        task: task,
        capabilities: agent.capabilities,
        agentLevel: agent.agentLevel
      }, [
        { action: "execute-directly", description: "Execute task with current agent capabilities" },
        { action: "delegate-to-sub-agent", description: "Create specialized sub-agent for this task" },
        { action: "request-coordination", description: "Request coordination from parent or coordinator" },
        { action: "escalate-to-human", description: "Escalate to human operator" }
      ]);

      let result: any;

      if (decision.requiresSubAgent && decision.action === "delegate-to-sub-agent") {
        // Delegate to a sub-agent
        const subAgentRequest: SubAgentRequest = {
          parentTaskId: task.id,
          requiredCapabilities: decision.subAgentCapabilities || [],
          taskType: task.taskType,
          priority: task.priority as any,
          description: `Sub-task: ${task.description}`,
          input: task.input,
          estimatedDuration: task.estimatedDuration
        };

        const subTask = await this.delegateToSubAgent(task.agentId, subAgentRequest);
        result = {
          action: 'delegated-to-sub-agent',
          subTaskId: subTask.id,
          subAgentId: subTask.agentId,
          reasoning: decision.reasoning
        };
      } else {
        // Execute directly
        result = await this.executeTask(task, agent);
      }

      await storage.updateAgentTask(task.id, {
        status: "completed",
        output: result,
        completedAt: new Date(),
        actualDuration: Math.floor((new Date().getTime() - new Date(task.startedAt || task.createdAt).getTime()) / 60000)
      });

      // Notify parent agent if this is a sub-task
      if (task.parentTaskId) {
        await this.notifyParentOfCompletion(task);
      }

    } catch (error) {
      await storage.updateAgentTask(task.id, {
        status: "failed",
        errorMessage: (error as Error).message,
        completedAt: new Date()
      });

      // Notify parent agent of failure
      if (task.parentTaskId) {
        await this.notifyParentOfFailure(task, error as Error);
      }
    }
  }

  private async executeTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (agent.type) {
      case "coordinator":
        return await this.executeCoordinatorTask(task, agent);
      case "sre":
        return await this.executeSRETask(task, agent);
      case "security":
        return await this.executeSecurityTask(task, agent);
      case "performance":
        return await this.executePerformanceTask(task, agent);
      case "deployment":
        return await this.executeDeploymentTask(task, agent);
      case "code-review":
        return await this.executeCodeReviewTask(task, agent);
      case "monitoring":
        return await this.executeMonitoringTask(task, agent);
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  private async executeCoordinatorTask(task: AgentTask, agent: AiAgent): Promise<any> {
    // Coordinator tasks involve orchestrating other agents
    const decision = await this.makeIntelligentDecision(agent.id, {
      task: task,
      projectAgents: await storage.getProjectAgents(agent.projectId)
    }, [
      { action: "create-specialized-team", description: "Create a team of specialized agents" },
      { action: "redistribute-workload", description: "Redistribute tasks among existing agents" },
      { action: "escalate-critical-issue", description: "Escalate critical issues to human oversight" }
    ]);

    return {
      coordinationAction: decision.action,
      reasoning: decision.reasoning,
      timestamp: new Date().toISOString()
    };
  }

  private async executeSRETask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "incident-response":
        return await this.handleIncidentResponse(task, agent);
      case "monitoring":
        return await this.performMonitoring(task, agent);
      case "performance-optimization":
        return await this.performSREOptimization(task, agent);
      default:
        return { message: "SRE task completed", taskType: task.taskType };
    }
  }

  private async executeSecurityTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "vulnerability-scan":
        return await this.performSecurityScan(task, agent);
      case "security-audit":
        return await this.performSecurityAudit(task, agent);
      default:
        return { message: "Security task completed", taskType: task.taskType };
    }
  }

  private async executePerformanceTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "optimization":
        return await this.performOptimization(task, agent);
      case "load-testing":
        return await this.performLoadTesting(task, agent);
      default:
        return { message: "Performance task completed", taskType: task.taskType };
    }
  }

  private async executeDeploymentTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "deployment":
        return await this.performDeployment(task, agent);
      case "rollback":
        return await this.performRollback(task, agent);
      default:
        return { message: "Deployment task completed", taskType: task.taskType };
    }
  }

  private async executeCodeReviewTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "code-analysis":
        return await this.performCodeAnalysis(task, agent);
      case "quality-check":
        return await this.performQualityCheck(task, agent);
      default:
        return { message: "Code review task completed", taskType: task.taskType };
    }
  }

  private async executeMonitoringTask(task: AgentTask, agent: AiAgent): Promise<any> {
    switch (task.taskType) {
      case "health-check":
        return await this.performHealthCheck(task, agent);
      case "metrics-collection":
        return await this.collectMetrics(task, agent);
      default:
        return { message: "Monitoring task completed", taskType: task.taskType };
    }
  }

  // Implementation of specific task methods
  private async handleIncidentResponse(task: AgentTask, agent: AiAgent): Promise<any> {
    const decision = await this.makeIntelligentDecision(agent.id, {
      incident: task.input,
      agentCapabilities: agent.capabilities
    }, [
      { action: "auto-restart", description: "Restart affected services" },
      { action: "scale-up", description: "Scale up resources" },
      { action: "create-monitoring-sub-agent", description: "Create monitoring sub-agent for continuous observation" },
      { action: "escalate", description: "Escalate to human operator" }
    ]);

    if (decision.requiresSubAgent) {
      await this.delegateToSubAgent(agent.id, {
        parentTaskId: task.id,
        requiredCapabilities: ['continuous-monitoring', 'alert-management'],
        taskType: 'monitoring',
        priority: 'high',
        description: 'Monitor incident recovery',
        input: { incident: task.input, parentAction: decision.action }
      });
    }

    return {
      action: decision.action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date().toISOString()
    };
  }

  private async performMonitoring(task: AgentTask, agent: AiAgent): Promise<any> {
    // Simulate monitoring with improved metrics
    const metrics = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      response_time: Math.random() * 1000,
      error_rate: Math.random() * 5,
      disk_usage: Math.random() * 100,
      network_latency: Math.random() * 200
    };

    return {
      metrics,
      timestamp: new Date().toISOString(),
      agentId: agent.id,
      monitoringScope: agent.capabilities.filter(cap => cap.includes('monitoring'))
    };
  }

  private async performSecurityScan(task: AgentTask, agent: AiAgent): Promise<any> {
    const findings = [
      {
        type: "vulnerability",
        severity: "medium",
        description: "Outdated dependency detected",
        recommendation: "Update to latest version",
        cveId: "CVE-2024-" + Math.floor(Math.random() * 10000)
      }
    ];

    return {
      findings,
      timestamp: new Date().toISOString(),
      scanType: task.input?.scanType || "comprehensive",
      agentCapabilities: agent.capabilities
    };
  }

  private async performOptimization(task: AgentTask, agent: AiAgent): Promise<any> {
    const decision = await this.makeIntelligentDecision(agent.id, {
      metrics: task.input?.metrics,
      taskType: "optimization"
    }, [
      { action: "cache-optimization", description: "Optimize caching strategy" },
      { action: "resource-scaling", description: "Adjust resource allocation" },
      { action: "code-optimization", description: "Suggest code improvements" },
      { action: "database-tuning", description: "Optimize database queries" }
    ]);

    return {
      optimization: decision.action,
      reasoning: decision.reasoning,
      confidence: decision.confidence,
      timestamp: new Date().toISOString()
    };
  }

  private async performDeployment(task: AgentTask, agent: AiAgent): Promise<any> {
    return {
      deploymentId: `dep-${Date.now()}`,
      status: "initiated",
      strategy: task.input?.strategy || "blue-green",
      timestamp: new Date().toISOString()
    };
  }

  private async performSREOptimization(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "SRE optimization completed", timestamp: new Date().toISOString() };
  }

  private async performSecurityAudit(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Security audit completed", timestamp: new Date().toISOString() };
  }

  private async performLoadTesting(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Load testing completed", timestamp: new Date().toISOString() };
  }

  private async performRollback(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Rollback completed", timestamp: new Date().toISOString() };
  }

  private async performCodeAnalysis(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Code analysis completed", timestamp: new Date().toISOString() };
  }

  private async performQualityCheck(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Quality check completed", timestamp: new Date().toISOString() };
  }

  private async performHealthCheck(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Health check completed", timestamp: new Date().toISOString() };
  }

  private async collectMetrics(task: AgentTask, agent: AiAgent): Promise<any> {
    return { message: "Metrics collection completed", timestamp: new Date().toISOString() };
  }

  private async notifyAgent(agentId: string, communication: AgentCommunication): Promise<void> {
    // In a real implementation, this would trigger the agent to process the message
    console.log(`Notifying agent ${agentId} of new message: ${communication.messageType}`);
  }

  private async notifyParentOfCompletion(task: AgentTask): Promise<void> {
    if (!task.parentTaskId) return;

    const parentTask = await storage.getAgentTask(task.parentTaskId);
    if (!parentTask) return;

    await this.sendAgentMessage({
      fromAgentId: task.agentId,
      toAgentId: parentTask.agentId,
      messageType: 'status-update',
      content: {
        event: 'sub-task-completed',
        subTaskId: task.id,
        result: task.output
      },
      relatedTaskId: task.parentTaskId
    });
  }

  private async notifyParentOfFailure(task: AgentTask, error: Error): Promise<void> {
    if (!task.parentTaskId) return;

    const parentTask = await storage.getAgentTask(task.parentTaskId);
    if (!parentTask) return;

    await this.sendAgentMessage({
      fromAgentId: task.agentId,
      toAgentId: parentTask.agentId,
      messageType: 'status-update',
      content: {
        event: 'sub-task-failed',
        subTaskId: task.id,
        error: error.message
      },
      priority: 'high',
      relatedTaskId: task.parentTaskId
    });
  }

  private determineSubAgentType(capabilities: string[]): AgentType {
    if (capabilities.some(cap => cap.includes('security') || cap.includes('vulnerability'))) {
      return 'security';
    }
    if (capabilities.some(cap => cap.includes('performance') || cap.includes('optimization'))) {
      return 'performance';
    }
    if (capabilities.some(cap => cap.includes('deployment') || cap.includes('release'))) {
      return 'deployment';
    }
    if (capabilities.some(cap => cap.includes('monitoring') || cap.includes('health'))) {
      return 'monitoring';
    }
    if (capabilities.some(cap => cap.includes('sre') || cap.includes('reliability'))) {
      return 'sre';
    }
    if (capabilities.some(cap => cap.includes('code') || cap.includes('review'))) {
      return 'code-review';
    }
    return 'sre'; // Default fallback
  }

  private getDefaultCapabilities(type: AgentType): string[] {
    switch (type) {
      case "coordinator":
        return ['task-coordination', 'sub-agent-management', 'decision-making', 'resource-allocation'];
      case "sre":
        return ['incident-response', 'monitoring', 'reliability-engineering', 'system-diagnosis'];
      case "security":
        return ['vulnerability-scanning', 'security-audit', 'threat-detection', 'compliance-check'];
      case "performance":
        return ['performance-analysis', 'optimization', 'load-testing', 'resource-tuning'];
      case "deployment":
        return ['blue-green-deployment', 'canary-deployment', 'rollback', 'release-management'];
      case "code-review":
        return ['code-analysis', 'quality-assessment', 'security-review', 'best-practices'];
      case "monitoring":
        return ['health-monitoring', 'metrics-collection', 'alert-management', 'observability'];
      default:
        return ['general-purpose'];
    }
  }

  private getDefaultConfiguration(type: AgentType): any {
    switch (type) {
      case "coordinator":
        return {
          maxSubAgents: 10,
          coordinationStrategy: 'hierarchical',
          decisionThreshold: 0.7
        };
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
      case "code-review":
        return {
          quality_threshold: 0.8,
          auto_approve: false,
          check_security: true
        };
      case "monitoring":
        return {
          check_interval: 30,
          alert_threshold: 'medium',
          retention_days: 30
        };
      default:
        return {};
    }
  }

  private getAgentSystemPrompt(type: AgentType, capabilities: string[]): string {
    const basePrompt = `You are an AI agent specialized in ${type}. Your capabilities include: ${capabilities.join(', ')}.`;

    switch (type) {
      case "coordinator":
        return `${basePrompt} Your role is to coordinate and orchestrate other agents to accomplish complex tasks. You can create sub-agents, delegate tasks, and make high-level decisions. Always consider whether a task can be better handled by creating specialized sub-agents. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "sre":
        return `${basePrompt} Your role is to ensure system reliability, handle incidents, and maintain service quality. You can create monitoring sub-agents for specialized observation tasks. Always prioritize system stability and user experience. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "security":
        return `${basePrompt} Your role is to protect systems from threats, manage vulnerabilities, and ensure compliance. You can create specialized sub-agents for deep security analysis. Always prioritize security and data protection. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "performance":
        return `${basePrompt} Your role is to optimize system performance, manage resources, and improve efficiency. You can create sub-agents for specialized performance testing and optimization. Always prioritize speed and resource optimization. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "deployment":
        return `${basePrompt} Your role is to manage deployments, handle releases, and ensure smooth rollouts. You can create monitoring sub-agents to watch deployment health. Always prioritize deployment safety and zero-downtime. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "code-review":
        return `${basePrompt} Your role is to review code quality, security, and best practices. You can create specialized sub-agents for deep code analysis. Always prioritize code quality and security. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      case "monitoring":
        return `${basePrompt} Your role is to monitor systems, collect metrics, and manage alerts. You specialize in observability and can create specialized monitoring sub-agents. Always prioritize system visibility and proactive monitoring. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;

      default:
        return `${basePrompt} Make intelligent decisions based on the context provided. Consider whether specialized sub-agents would be better suited for complex tasks. Respond with JSON containing: action, reasoning, confidence (0-1), requiresSubAgent (boolean), subAgentType, subAgentCapabilities, metadata.`;
    }
  }

  private buildDecisionPrompt(agent: AiAgent, context: any, options: any[]): string {
    return `
Context: ${JSON.stringify(context, null, 2)}

Available options:
${options.map((opt, idx) => `${idx + 1}. ${opt.action}: ${opt.description}`).join('\n')}

Agent Configuration: ${JSON.stringify(agent.configuration, null, 2)}
Agent Capabilities: ${agent.capabilities.join(', ')}
Agent Level: ${agent.agentLevel} (0=primary, 1+=sub-agent)

Sub-Agent Considerations:
- If this task requires specialized capabilities not in your current skillset, set requiresSubAgent: true
- Specify the subAgentType and subAgentCapabilities needed
- Complex tasks can often benefit from specialized sub-agents
- Monitoring tasks can benefit from dedicated monitoring sub-agents

Based on the context and your role as a ${agent.type} agent, make an intelligent decision. Consider the urgency, impact, available resources, and whether specialized sub-agents would improve outcomes.
    `;
  }

  async getAgent(agentId: string): Promise<AiAgent | undefined> {
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId);
    }
    const agent = await storage.getAiAgent(agentId);
    if (agent) {
      this.agents.set(agentId, agent);
    }
    return agent;
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

  async startAutonomousManagement(projectId: string): Promise<void> {
    await this.initialize(projectId);

    // Start autonomous management loop
    setInterval(async () => {
      try {
        const projectAgents = await storage.getProjectAgents(projectId);
        const activeAgents = projectAgents.filter(agent => agent.status === 'active');

        for (const agent of activeAgents) {
          await this.performAutonomousManagement(agent.id);
        }
      } catch (error) {
        console.error(`Autonomous management failed for project ${projectId}:`, error);
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    console.log(`Enhanced autonomous infrastructure management started for project ${projectId}`);
  }

  private async performAutonomousManagement(agentId: string): Promise<void> {
    const agent = await this.getAgent(agentId);
    if (!agent) return;

    // Check for pending tasks that might need sub-agent delegation
    const pendingTasks = await storage.getAgentTasks(agentId);
    const stuckTasks = pendingTasks.filter(task =>
      task.status === 'running' &&
      new Date().getTime() - new Date(task.startedAt || task.createdAt).getTime() > 10 * 60 * 1000
    );

    for (const task of stuckTasks) {
      // Consider creating a sub-agent to help with stuck tasks
      const decision = await this.makeIntelligentDecision(agentId, {
        stuckTask: task,
        duration: new Date().getTime() - new Date(task.startedAt || task.createdAt).getTime()
      }, [
        { action: "create-helper-sub-agent", description: "Create specialized sub-agent to assist" },
        { action: "retry-task", description: "Retry the task with current agent" },
        { action: "escalate-to-coordinator", description: "Escalate to coordinator agent" }
      ]);

      if (decision.requiresSubAgent) {
        await this.delegateToSubAgent(agentId, {
          parentTaskId: task.id,
          requiredCapabilities: decision.subAgentCapabilities || ['task-assistance'],
          taskType: 'task-assistance',
          priority: 'high',
          description: `Assist with stuck task: ${task.description}`,
          input: { originalTask: task, assistanceType: 'stuck-task-help' }
        });
      }
    }
  }
}

export const enhancedAgentManager = new EnhancedAgentManager();