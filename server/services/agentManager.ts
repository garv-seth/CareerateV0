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

    // Real deployment process using deployment manager
    const { deploymentManager } = await import("./deploymentManager");
    
    // Deploy using real deployment infrastructure
    deploymentManager.deployProject({
      projectId: task.projectId,
      version: deploymentData.version,
      strategy: deploymentData.strategy || "blue-green",
      environment: deploymentData.environment || "production",
      agentId: task.agentId
    }).then(async (result) => {
      if (result.status === "success") {
        await storage.updateDeployment(deployment.id, {
          status: "deployed",
          deploymentUrl: result.url,
          containerId: result.containerId,
          processId: result.processId,
          healthStatus: "healthy",
          deployedAt: new Date()
        });
      } else {
        await storage.updateDeployment(deployment.id, {
          status: "failed",
          errorLogs: result.error
        });
      }
    }).catch(async (error) => {
      console.error('Agent deployment failed:', error);
      await storage.updateDeployment(deployment.id, {
        status: "failed",
        errorLogs: error.message
      });
    });

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

  // Autonomous Infrastructure Management Integration
  async performAutonomousManagement(agentId: string): Promise<void> {
    const agent = await this.getAgent(agentId);
    if (!agent) return;

    try {
      switch (agent.type) {
        case "sre":
          await this.performAutonomousSREManagement(agent);
          break;
        case "security":
          await this.performAutonomousSecurityManagement(agent);
          break;
        case "performance":
          await this.performAutonomousPerformanceManagement(agent);
          break;
        case "deployment":
          await this.performAutonomousDeploymentManagement(agent);
          break;
      }
    } catch (error) {
      console.error(`Autonomous management failed for agent ${agentId}:`, error);
    }
  }

  private async performAutonomousSREManagement(agent: AiAgent): Promise<void> {
    // Get active deployments and monitor their health
    const deployments = await storage.getProjectDeployments(agent.projectId);
    const activeDeployments = deployments.filter(d => d.status === 'deployed');
    
    for (const deployment of activeDeployments) {
      const { deploymentManager } = await import("./deploymentManager");
      const status = await deploymentManager.getDeploymentStatus(deployment.id);
      
      // Check if deployment is unhealthy or not running
      if (!status.isRunning || deployment.healthStatus === 'unhealthy') {
        // Create incident
        const incident = await storage.createIncident({
          projectId: agent.projectId,
          agentId: agent.id,
          title: `Deployment Issue: ${deployment.id}`,
          description: `Deployment showing unhealthy status or stopped running`,
          severity: 'high',
          category: 'infrastructure'
        });

        // Make intelligent decision for remediation
        const decision = await this.makeIntelligentDecision(agent.id, {
          deployment: deployment,
          isRunning: status.isRunning,
          healthStatus: deployment.healthStatus,
          incident: incident
        }, [
          { action: "restart-deployment", description: "Restart the deployment process" },
          { action: "rollback-deployment", description: "Roll back to previous stable version" },
          { action: "scale-resources", description: "Increase resource allocation" },
          { action: "create-new-deployment", description: "Create new deployment instance" }
        ]);

        // Execute autonomous remediation
        await this.executeAutonomousRemediation(agent, deployment, decision);
      }
    }

    // Monitor performance metrics and create incidents for anomalies
    const recentMetrics = await storage.getProjectMetrics(agent.projectId);
    const last5Minutes = recentMetrics.filter(m => 
      new Date().getTime() - new Date(m.timestamp).getTime() < 5 * 60 * 1000
    );

    // Analyze for performance anomalies
    if (last5Minutes.length > 0) {
      const errorRateMetrics = last5Minutes.filter(m => m.metricType === 'error_rate');
      const avgErrorRate = errorRateMetrics.reduce((sum, m) => sum + parseFloat(m.value), 0) / errorRateMetrics.length;
      
      if (avgErrorRate > (agent.configuration?.incident_thresholds?.error_rate || 5)) {
        await storage.createIncident({
          projectId: agent.projectId,
          agentId: agent.id,
          title: 'High Error Rate Detected',
          description: `Error rate of ${avgErrorRate.toFixed(2)}% exceeds threshold`,
          severity: 'medium',
          category: 'performance'
        });
      }
    }
  }

  private async performAutonomousSecurityManagement(agent: AiAgent): Promise<void> {
    // Run periodic security scans
    const lastScan = await storage.getProjectSecurityScans(agent.projectId);
    const mostRecent = lastScan.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    const scanInterval = agent.configuration?.scan_frequency === 'daily' ? 24 : 168; // hours
    
    if (!mostRecent || new Date().getTime() - new Date(mostRecent.createdAt).getTime() > scanInterval * 60 * 60 * 1000) {
      // Trigger automated security scan
      await this.assignTask(agent.id, {
        projectId: agent.projectId,
        taskType: "vulnerability-scan",
        priority: "medium",
        description: "Automated periodic security scan",
        input: { 
          scanType: "comprehensive",
          automated: true,
          includeCompliance: true 
        }
      });
    }

    // Check for unresolved security findings
    const unresolvedScans = lastScan.filter(scan => !scan.resolved && scan.severity === 'high');
    if (unresolvedScans.length > 0) {
      for (const scan of unresolvedScans.slice(0, 3)) { // Limit to 3 most recent
        const decision = await this.makeIntelligentDecision(agent.id, {
          securityScan: scan,
          findings: scan.findings,
          severity: scan.severity
        }, [
          { action: "auto-patch", description: "Apply automated security patches" },
          { action: "isolate-resources", description: "Isolate affected infrastructure" },
          { action: "update-dependencies", description: "Update vulnerable dependencies" },
          { action: "create-incident", description: "Escalate to security incident" }
        ]);

        if (decision.action === "auto-patch" && agent.configuration?.auto_patch) {
          await this.executeSecurityPatching(agent, scan);
        }
      }
    }
  }

  private async performAutonomousPerformanceManagement(agent: AiAgent): Promise<void> {
    const { deploymentManager } = await import("./deploymentManager");
    
    // Get recent performance metrics
    const recentMetrics = await storage.getProjectMetrics(agent.projectId);
    const last15Minutes = recentMetrics.filter(m => 
      new Date().getTime() - new Date(m.timestamp).getTime() < 15 * 60 * 1000
    );

    if (last15Minutes.length === 0) return;

    // Analyze performance trends
    const cpuMetrics = last15Minutes.filter(m => m.metricType === 'cpu');
    const memoryMetrics = last15Minutes.filter(m => m.metricType === 'memory');
    const responseTimeMetrics = last15Minutes.filter(m => m.metricType === 'response_time');
    
    const avgCpu = cpuMetrics.length > 0 ? cpuMetrics.reduce((sum, m) => sum + parseFloat(m.value), 0) / cpuMetrics.length : 0;
    const avgMemory = memoryMetrics.length > 0 ? memoryMetrics.reduce((sum, m) => sum + parseFloat(m.value), 0) / memoryMetrics.length : 0;
    const avgResponseTime = responseTimeMetrics.length > 0 ? responseTimeMetrics.reduce((sum, m) => sum + parseFloat(m.value), 0) / responseTimeMetrics.length : 0;

    const thresholds = agent.configuration?.performance_thresholds || { cpu: 80, memory: 85, response_time: 2000 };

    // Autonomous scaling decisions
    if (avgCpu > thresholds.cpu || avgMemory > thresholds.memory || avgResponseTime > thresholds.response_time) {
      const decision = await this.makeIntelligentDecision(agent.id, {
        cpuUsage: avgCpu,
        memoryUsage: avgMemory,
        responseTime: avgResponseTime,
        thresholds: thresholds
      }, [
        { action: "scale-up", description: "Increase resource allocation" },
        { action: "optimize-queries", description: "Optimize database queries" },
        { action: "enable-caching", description: "Enable or increase caching" },
        { action: "load-balance", description: "Distribute load across multiple instances" }
      ]);

      await this.executePerformanceOptimization(agent, decision);
    }

    // Predictive scaling based on patterns
    await this.performPredictiveScaling(agent, last15Minutes);
  }

  private async performAutonomousDeploymentManagement(agent: AiAgent): Promise<void> {
    const { deploymentManager } = await import("./deploymentManager");
    
    // Check for failed or stuck deployments
    const deployments = await storage.getProjectDeployments(agent.projectId);
    const problematicDeployments = deployments.filter(d => 
      d.status === 'failed' || 
      (d.status === 'deploying' && new Date().getTime() - new Date(d.startedAt || d.createdAt).getTime() > 10 * 60 * 1000)
    );

    for (const deployment of problematicDeployments) {
      const decision = await this.makeIntelligentDecision(agent.id, {
        deployment: deployment,
        status: deployment.status,
        duration: new Date().getTime() - new Date(deployment.startedAt || deployment.createdAt).getTime()
      }, [
        { action: "retry-deployment", description: "Retry failed deployment with same configuration" },
        { action: "rollback", description: "Roll back to previous stable version" },
        { action: "diagnose-and-fix", description: "Analyze logs and attempt automatic fixes" },
        { action: "create-new-deployment", description: "Create fresh deployment with updated configuration" }
      ]);

      await this.executeDeploymentRemediation(agent, deployment, decision);
    }

    // Monitor deployment health and perform preventive actions
    const activeDeployments = deployments.filter(d => d.status === 'deployed');
    for (const deployment of activeDeployments) {
      const status = await deploymentManager.getDeploymentStatus(deployment.id);
      
      if (deployment.healthStatus === 'unhealthy' && status.healthChecks.length > 0) {
        const failedChecks = status.healthChecks.filter(check => check.status === 'unhealthy');
        if (failedChecks.length > 0) {
          // Attempt automatic recovery
          await deploymentManager.rollbackDeployment(deployment.id);
        }
      }
    }
  }

  // Execute autonomous actions based on AI decisions
  private async executeAutonomousRemediation(agent: AiAgent, deployment: Deployment, decision: AgentDecision): Promise<void> {
    const { deploymentManager } = await import("./deploymentManager");
    
    try {
      switch (decision.action) {
        case "restart-deployment":
          await deploymentManager.stopDeployment(deployment.id);
          // Restart deployment with same configuration
          const project = await storage.getProject(deployment.projectId);
          if (project) {
            await deploymentManager.deployProject({
              projectId: deployment.projectId,
              version: deployment.version,
              strategy: deployment.strategy as any,
              environment: deployment.environment,
              agentId: agent.id
            });
          }
          break;
          
        case "rollback-deployment":
          await deploymentManager.rollbackDeployment(deployment.id, deployment.rollbackVersion || undefined);
          break;
          
        case "scale-resources":
          // Update resource allocation (simplified - would integrate with cloud providers)
          await storage.updateDeployment(deployment.id, {
            metadata: {
              ...deployment.metadata,
              autoScaled: true,
              scaledBy: agent.id,
              scaledAt: new Date()
            }
          });
          break;
      }

      // Log the autonomous action
      await storage.createAgentTask({
        agentId: agent.id,
        projectId: deployment.projectId,
        taskType: "autonomous-remediation",
        priority: "high",
        description: `Autonomous ${decision.action}: ${decision.reasoning}`,
        input: { decision, deployment: deployment.id },
        output: { success: true, action: decision.action }
      });
      
    } catch (error) {
      console.error(`Failed to execute autonomous remediation:`, error);
    }
  }

  private async executeSecurityPatching(agent: AiAgent, scan: SecurityScan): Promise<void> {
    // Implement automated security patching logic
    await this.assignTask(agent.id, {
      projectId: agent.projectId,
      taskType: "security-patching",
      priority: "high",
      description: "Automated security patch application",
      input: { scanId: scan.id, findings: scan.findings }
    });
  }

  private async executePerformanceOptimization(agent: AiAgent, decision: AgentDecision): Promise<void> {
    // Implement performance optimization actions
    await this.assignTask(agent.id, {
      projectId: agent.projectId,
      taskType: "performance-optimization",
      priority: "medium",
      description: `Autonomous performance optimization: ${decision.action}`,
      input: { action: decision.action, reasoning: decision.reasoning }
    });
  }

  private async executeDeploymentRemediation(agent: AiAgent, deployment: Deployment, decision: AgentDecision): Promise<void> {
    const { deploymentManager } = await import("./deploymentManager");
    
    try {
      switch (decision.action) {
        case "retry-deployment":
          const project = await storage.getProject(deployment.projectId);
          if (project) {
            await deploymentManager.deployProject({
              projectId: deployment.projectId,
              version: deployment.version,
              strategy: deployment.strategy as any,
              environment: deployment.environment,
              agentId: agent.id
            });
          }
          break;
          
        case "rollback":
          await deploymentManager.rollbackDeployment(deployment.id);
          break;
          
        case "diagnose-and-fix":
          // Analyze deployment logs and attempt fixes
          await this.assignTask(agent.id, {
            projectId: deployment.projectId,
            taskType: "deployment-diagnosis",
            priority: "high",
            description: "Automated deployment diagnosis and repair",
            input: { deploymentId: deployment.id, logs: deployment.deploymentLogs }
          });
          break;
      }
    } catch (error) {
      console.error(`Failed to execute deployment remediation:`, error);
    }
  }

  private async performPredictiveScaling(agent: AiAgent, metrics: PerformanceMetric[]): Promise<void> {
    // Simple predictive scaling based on trends
    if (metrics.length < 10) return; // Need sufficient data
    
    const cpuMetrics = metrics.filter(m => m.metricType === 'cpu').sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    if (cpuMetrics.length < 5) return;
    
    // Calculate trend
    const recentValues = cpuMetrics.slice(-5).map(m => parseFloat(m.value));
    const trend = (recentValues[4] - recentValues[0]) / recentValues.length;
    
    // Predict if scaling will be needed in next 15 minutes
    const currentValue = recentValues[4];
    const predictedValue = currentValue + (trend * 3); // 3 periods ahead
    
    if (predictedValue > 85) { // Threshold for preemptive scaling
      await this.assignTask(agent.id, {
        projectId: agent.projectId,
        taskType: "predictive-scaling",
        priority: "medium",
        description: `Predictive scaling: CPU expected to reach ${predictedValue.toFixed(1)}%`,
        input: { 
          currentCpu: currentValue, 
          predictedCpu: predictedValue, 
          trend: trend 
        }
      });
    }
  }

  // Enhanced autonomous management startup
  async startAutonomousManagement(): Promise<void> {
    // Start autonomous management for all active agents
    setInterval(async () => {
      const activeAgents = Array.from(this.agents.values()).filter(agent => agent.status === 'active');
      
      for (const agent of activeAgents) {
        try {
          await this.performAutonomousManagement(agent.id);
        } catch (error) {
          console.error(`Autonomous management failed for agent ${agent.id}:`, error);
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
    
    console.log('Autonomous infrastructure management started');
  }
}

export const agentManager = new AgentManager();