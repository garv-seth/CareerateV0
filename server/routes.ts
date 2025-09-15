import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertCodeGenerationSchema,
  insertAiAgentSchema,
  insertDeploymentSchema,
  insertIncidentSchema,
  insertPerformanceMetricSchema,
  insertSecurityScanSchema,
  insertAgentTaskSchema,
  insertInfrastructureResourceSchema
} from "@shared/schema";
import { generateCodeFromPrompt } from "./services/ai";
import { agentManager } from "./services/agentManager";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current user (demo user for now)
  app.get("/api/user", async (req, res) => {
    try {
      const user = await storage.getUser("demo-user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get user projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjectsByUserId("demo-user-1");
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  // Get single project
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to get project" });
    }
  });

  // Create new project
  app.post("/api/projects", async (req, res) => {
    try {
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...data,
        userId: "demo-user-1"
      });
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Update project
  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Generate code from prompt
  app.post("/api/generate-code", async (req, res) => {
    try {
      const data = insertCodeGenerationSchema.parse(req.body);
      
      // Create code generation record
      const generation = await storage.createCodeGeneration(data);
      
      try {
        // Generate code using AI
        const generatedCode = await generateCodeFromPrompt(data.prompt);
        
        // Update the project with generated code
        const project = await storage.updateProject(data.projectId, {
          files: generatedCode.files,
          framework: generatedCode.framework,
          description: generatedCode.description,
          status: "building"
        });

        // Simulate deployment process
        setTimeout(async () => {
          await storage.updateProject(data.projectId, {
            status: "deployed",
            deploymentUrl: `https://${project?.name?.toLowerCase().replace(/\s+/g, '-')}.careerate.dev`
          });
        }, 3000);

        res.json({ 
          success: true, 
          project,
          generatedCode 
        });
      } catch (aiError) {
        await storage.updateProject(data.projectId, { status: "error" });
        throw aiError;
      }
    } catch (error) {
      console.error("Code generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate code",
        error: (error as Error).message 
      });
    }
  });

  // =====================================================
  // AI DevOps Agent System API Endpoints
  // =====================================================

  // Agent Management Endpoints
  app.get("/api/projects/:projectId/agents", async (req, res) => {
    try {
      const agents = await storage.getProjectAgents(req.params.projectId);
      res.json(agents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agents" });
    }
  });

  app.post("/api/projects/:projectId/agents", async (req, res) => {
    try {
      const data = insertAiAgentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const agent = await agentManager.createAgent(data);
      res.status(201).json(agent);
    } catch (error) {
      res.status(400).json({ message: "Invalid agent data", error: (error as Error).message });
    }
  });

  app.get("/api/agents/:agentId", async (req, res) => {
    try {
      const agent = await agentManager.getAgent(req.params.agentId);
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      const health = await agentManager.getAgentHealth(req.params.agentId);
      res.json({ ...agent, health });
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent" });
    }
  });

  app.post("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const data = insertAgentTaskSchema.parse({
        ...req.body,
        agentId: req.params.agentId
      });
      const task = await agentManager.assignTask(req.params.agentId, data);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign task", error: (error as Error).message });
    }
  });

  app.get("/api/agents/:agentId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getAgentTasks(req.params.agentId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get agent tasks" });
    }
  });

  app.post("/api/agents/:agentId/decision", async (req, res) => {
    try {
      const { context, options } = req.body;
      const decision = await agentManager.makeIntelligentDecision(
        req.params.agentId, 
        context, 
        options || []
      );
      res.json(decision);
    } catch (error) {
      res.status(500).json({ message: "Failed to make decision", error: (error as Error).message });
    }
  });

  // Deployment Management Endpoints
  app.get("/api/projects/:projectId/deployments", async (req, res) => {
    try {
      const deployments = await storage.getProjectDeployments(req.params.projectId);
      res.json(deployments);
    } catch (error) {
      res.status(500).json({ message: "Failed to get deployments" });
    }
  });

  app.post("/api/projects/:projectId/deployments", async (req, res) => {
    try {
      const data = insertDeploymentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const deployment = await storage.createDeployment(data);

      // Trigger deployment via agent if available
      const agents = await storage.getProjectAgents(req.params.projectId);
      const deploymentAgent = agents.find(agent => agent.type === "deployment");
      
      if (deploymentAgent) {
        await agentManager.assignTask(deploymentAgent.id, {
          projectId: req.params.projectId,
          taskType: "deployment",
          priority: "high",
          description: `Deploy version ${data.version} using ${data.strategy} strategy`,
          input: { deploymentId: deployment.id, ...data }
        });
      }

      res.status(201).json(deployment);
    } catch (error) {
      res.status(400).json({ message: "Failed to create deployment", error: (error as Error).message });
    }
  });

  app.post("/api/deployments/:deploymentId/rollback", async (req, res) => {
    try {
      const deployment = await storage.getDeployment(req.params.deploymentId);
      if (!deployment) {
        return res.status(404).json({ message: "Deployment not found" });
      }

      const rollbackDeployment = await storage.createDeployment({
        projectId: deployment.projectId,
        version: deployment.rollbackVersion || "previous",
        strategy: "blue-green",
        environment: deployment.environment,
        metadata: { rollback: true, originalDeploymentId: req.params.deploymentId }
      });

      await storage.updateDeployment(req.params.deploymentId, {
        status: "rolled-back"
      });

      res.json(rollbackDeployment);
    } catch (error) {
      res.status(500).json({ message: "Failed to rollback deployment" });
    }
  });

  // Incident Management Endpoints
  app.get("/api/projects/:projectId/incidents", async (req, res) => {
    try {
      const incidents = await storage.getProjectIncidents(req.params.projectId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get incidents" });
    }
  });

  app.get("/api/projects/:projectId/incidents/open", async (req, res) => {
    try {
      const incidents = await storage.getOpenIncidents(req.params.projectId);
      res.json(incidents);
    } catch (error) {
      res.status(500).json({ message: "Failed to get open incidents" });
    }
  });

  app.post("/api/projects/:projectId/incidents", async (req, res) => {
    try {
      const data = insertIncidentSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const incident = await storage.createIncident(data);

      // Auto-assign to SRE agent for incident response
      const agents = await storage.getProjectAgents(req.params.projectId);
      const sreAgent = agents.find(agent => agent.type === "sre");
      
      if (sreAgent) {
        await agentManager.assignTask(sreAgent.id, {
          projectId: req.params.projectId,
          taskType: "incident-response",
          priority: data.severity === "critical" ? "urgent" : "high",
          description: `Respond to ${data.severity} incident: ${data.title}`,
          input: { incidentId: incident.id, ...data }
        });
      }

      res.status(201).json(incident);
    } catch (error) {
      res.status(400).json({ message: "Failed to create incident", error: (error as Error).message });
    }
  });

  app.patch("/api/incidents/:incidentId", async (req, res) => {
    try {
      const incident = await storage.updateIncident(req.params.incidentId, req.body);
      if (!incident) {
        return res.status(404).json({ message: "Incident not found" });
      }
      res.json(incident);
    } catch (error) {
      res.status(500).json({ message: "Failed to update incident" });
    }
  });

  // Performance Metrics Endpoints
  app.get("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const { metricType, limit = 100 } = req.query;
      const metrics = await storage.getProjectMetrics(
        req.params.projectId, 
        metricType as string
      );
      res.json(metrics.slice(0, Number(limit)));
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  app.post("/api/projects/:projectId/metrics", async (req, res) => {
    try {
      const data = insertPerformanceMetricSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const metric = await storage.createPerformanceMetric(data);

      // Check for performance issues and trigger optimization if needed
      if (data.metricType === "cpu_usage" && parseFloat(data.value) > 80) {
        const agents = await storage.getProjectAgents(req.params.projectId);
        const perfAgent = agents.find(agent => agent.type === "performance");
        
        if (perfAgent) {
          await agentManager.assignTask(perfAgent.id, {
            projectId: req.params.projectId,
            taskType: "optimization",
            priority: "medium",
            description: `High CPU usage detected: ${data.value}%`,
            input: { metrics: [data] }
          });
        }
      }

      res.status(201).json(metric);
    } catch (error) {
      res.status(400).json({ message: "Failed to create metric", error: (error as Error).message });
    }
  });

  // Security Scan Endpoints
  app.get("/api/projects/:projectId/security-scans", async (req, res) => {
    try {
      const scans = await storage.getProjectSecurityScans(req.params.projectId);
      res.json(scans);
    } catch (error) {
      res.status(500).json({ message: "Failed to get security scans" });
    }
  });

  app.post("/api/projects/:projectId/security-scans", async (req, res) => {
    try {
      const data = insertSecurityScanSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const scan = await storage.createSecurityScan(data);

      // Trigger security scan via security agent
      const agents = await storage.getProjectAgents(req.params.projectId);
      const securityAgent = agents.find(agent => agent.type === "security");
      
      if (securityAgent) {
        await agentManager.assignTask(securityAgent.id, {
          projectId: req.params.projectId,
          taskType: "vulnerability-scan",
          priority: "medium",
          description: `Perform ${data.scanType} security scan`,
          input: { scanId: scan.id, scanType: data.scanType }
        });
      }

      res.status(201).json(scan);
    } catch (error) {
      res.status(400).json({ message: "Failed to create security scan", error: (error as Error).message });
    }
  });

  // Infrastructure Resource Endpoints
  app.get("/api/projects/:projectId/resources", async (req, res) => {
    try {
      const resources = await storage.getProjectResources(req.params.projectId);
      res.json(resources);
    } catch (error) {
      res.status(500).json({ message: "Failed to get resources" });
    }
  });

  app.post("/api/projects/:projectId/resources", async (req, res) => {
    try {
      const data = insertInfrastructureResourceSchema.parse({
        ...req.body,
        projectId: req.params.projectId
      });
      const resource = await storage.createInfrastructureResource(data);
      res.status(201).json(resource);
    } catch (error) {
      res.status(400).json({ message: "Failed to create resource", error: (error as Error).message });
    }
  });

  // Auto-initialize AI agents for new projects
  app.post("/api/projects/:projectId/initialize-agents", async (req, res) => {
    try {
      const projectId = req.params.projectId;
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Create default agents for the project
      const agentTypes: Array<{ type: "sre" | "security" | "performance" | "deployment", name: string }> = [
        { type: "sre", name: `${project.name} - SRE Agent` },
        { type: "security", name: `${project.name} - Security Agent` },
        { type: "performance", name: `${project.name} - Performance Agent` },
        { type: "deployment", name: `${project.name} - Deployment Agent` }
      ];

      const createdAgents = [];
      for (const agentConfig of agentTypes) {
        const agent = await agentManager.createAgent({
          projectId,
          type: agentConfig.type,
          name: agentConfig.name
        });
        createdAgents.push(agent);
      }

      res.json({ 
        message: "Agents initialized successfully", 
        agents: createdAgents 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize agents", error: (error as Error).message });
    }
  });

  // System Health Check
  app.get("/api/system/health", async (req, res) => {
    try {
      const stats = {
        timestamp: new Date(),
        agents: {
          total: 0,
          active: 0,
          inactive: 0
        },
        incidents: {
          open: 0,
          resolved: 0
        },
        deployments: {
          pending: 0,
          deployed: 0,
          failed: 0
        }
      };

      // This would normally aggregate across all projects
      // For demo, we'll use sample data
      stats.agents = { total: 12, active: 10, inactive: 2 };
      stats.incidents = { open: 3, resolved: 47 };
      stats.deployments = { pending: 1, deployed: 23, failed: 2 };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
