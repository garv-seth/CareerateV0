import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertProjectSchema, 
  insertCodeGenerationSchema,
  insertAiAgentSchema,
  insertDeploymentSchema,
  insertIncidentSchema,
  insertPerformanceMetricSchema,
  insertSecurityScanSchema,
  insertAgentTaskSchema,
  insertInfrastructureResourceSchema,
  insertProjectTemplateSchema,
  insertCodeAnalysisSchema,
  insertCodeReviewSchema
} from "@shared/schema";
import { 
  generateCodeFromPrompt, 
  generateCodeStreamFromPrompt,
  improveCode,
  analyzeCode,
  generateTests,
  optimizeCode,
  type GenerationContext,
  type StreamingUpdate
} from "./services/ai";
import { agentManager } from "./services/agentManager";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth first
  await setupAuth(app);

  // Helper function to get authenticated user ID
  const getUserId = (req: any): string => {
    const user = req.user as any;
    return user?.claims?.sub || user?.id;
  };

  // Helper function to validate project ownership
  const validateProjectOwnership = async (projectId: string, userId: string) => {
    const project = await storage.getProject(projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Project not found or access denied');
    }
    return project;
  };
  // Get current authenticated user
  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Remove password from response (if it exists)
      const { password, ...userWithoutPassword } = user as any;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // Get authenticated user's projects
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const projects = await storage.getProjectsByUserId(userId);
      res.json(projects);
    } catch (error) {
      console.error('Get projects error:', error);
      res.status(500).json({ message: "Failed to get projects" });
    }
  });

  // Get single project with ownership validation
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const project = await validateProjectOwnership(req.params.id, userId);
      res.json(project);
    } catch (error) {
      console.error('Get project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Project not found" });
    }
  });

  // Create new project for authenticated user
  app.post("/api/projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertProjectSchema.parse(req.body);
      const project = await storage.createProject({
        ...data,
        userId
      });
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  // Update project with ownership validation
  app.patch("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateProjectOwnership(req.params.id, userId);
      const project = await storage.updateProject(req.params.id, req.body);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error('Update project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Delete project with ownership validation
  app.delete("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateProjectOwnership(req.params.id, userId);
      const deleted = await storage.deleteProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // =====================================================
  // Enhanced Vibe Coding Engine API Endpoints
  // =====================================================

  // Project Templates
  app.get("/api/templates", async (req, res) => {
    try {
      const { category } = req.query;
      const templates = await storage.getProjectTemplates(category as string);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  app.post("/api/templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertProjectTemplateSchema.parse({
        ...req.body,
        createdBy: userId
      });
      const template = await storage.createProjectTemplate(data);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Enhanced code generation with streaming support
  app.post("/api/generate-code", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeGenerationSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      // Create code generation record
      const generation = await storage.createCodeGeneration({
        ...data,
        status: "pending",
        progress: 0
      });
      
      // Get existing project context
      const project = await storage.getProject(data.projectId);
      
      const context: GenerationContext = {
        type: data.generationType || 'full-app',
        framework: data.framework || project?.framework,
        existingCode: project?.files as Record<string, string> || {}
      };
      
      try {
        // Generate code using enhanced AI service
        const generatedCode = await generateCodeFromPrompt(data.prompt, context);
        
        // Update generation record
        await storage.updateCodeGeneration(generation.id, {
          status: "completed",
          progress: 100,
          generatedCode: generatedCode,
          success: true,
          tokensUsed: generatedCode.metadata?.tokensUsed || 0,
          completedAt: new Date()
        });
        
        // Update project
        const updatedProject = await storage.updateProject(data.projectId, {
          files: generatedCode.files,
          framework: generatedCode.framework,
          description: generatedCode.description,
          dependencies: generatedCode.dependencies,
          databaseSchema: generatedCode.databaseSchema,
          apiEndpoints: generatedCode.apiEndpoints,
          status: "building"
        });

        // Create generation history
        const historyCount = await storage.getGenerationHistory(data.projectId);
        await storage.createGenerationHistory({
          projectId: data.projectId,
          generationId: generation.id,
          version: historyCount.length + 1,
          snapshot: {
            files: generatedCode.files,
            dependencies: generatedCode.dependencies
          },
          prompt: data.prompt,
          parentVersion: historyCount.length,
          isCurrent: true
        });

        // Real deployment using deployment manager
        const { deploymentManager } = await import("./services/deploymentManager");
        
        // Deploy the project using real deployment infrastructure
        deploymentManager.deployProject({
          projectId: data.projectId,
          version: historyCount.length + 1,
          strategy: "blue-green",
          environment: "production",
          buildCommand: "npm install",
          startCommand: "npm start",
          port: 5000 + Math.floor(Math.random() * 1000) // Allocate random port
        }).then(async (result) => {
          if (result.status === "success") {
            await storage.updateProject(data.projectId, {
              status: "deployed",
              deploymentUrl: result.url || `https://${updatedProject?.name?.toLowerCase().replace(/\s+/g, '-')}.careerate.dev`
            });
          } else {
            await storage.updateProject(data.projectId, {
              status: "error"
            });
          }
        }).catch(async (error) => {
          console.error('Deployment failed:', error);
          await storage.updateProject(data.projectId, {
            status: "error"
          });
        });

        res.json({ 
          success: true, 
          project: updatedProject,
          generatedCode,
          generationId: generation.id
        });
      } catch (aiError) {
        await storage.updateCodeGeneration(generation.id, {
          status: "failed",
          success: false,
          errorMessage: (aiError as Error).message
        });
        await storage.updateProject(data.projectId, { status: "error" });
        throw aiError;
      }
    } catch (error) {
      console.error("Code generation error:", error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ 
        message: "Failed to generate code",
        error: (error as Error).message 
      });
    }
  });

  // Streaming code generation
  app.post("/api/generate-code/stream", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeGenerationSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });
      
      const generation = await storage.createCodeGeneration({
        ...data,
        status: "streaming",
        progress: 0
      });
      
      const project = await storage.getProject(data.projectId);
      const context: GenerationContext = {
        type: data.generationType || 'full-app',
        framework: data.framework || project?.framework,
        existingCode: project?.files as Record<string, string> || {}
      };
      
      // Stream generation with progress updates
      const streamGenerator = generateCodeStreamFromPrompt(
        data.prompt, 
        context, 
        async (update: StreamingUpdate) => {
          res.write(`data: ${JSON.stringify(update)}\n\n`);
          
          if (update.progress) {
            await storage.updateCodeGeneration(generation.id, {
              progress: update.progress,
              status: update.type === 'complete' ? 'completed' : 'streaming'
            });
          }
        }
      );
      
      for await (const update of streamGenerator) {
        if (update.type === 'complete') {
          // Update generation and project
          await storage.updateCodeGeneration(generation.id, {
            status: "completed",
            progress: 100,
            generatedCode: update.data,
            success: true,
            completedAt: new Date()
          });
          
          await storage.updateProject(data.projectId, {
            files: update.data.files,
            framework: update.data.framework,
            description: update.data.description,
            status: "building"
          });
          
          break;
        }
      }
      
      res.write(`data: ${JSON.stringify({ type: 'end' })}\n\n`);
      res.end();
      
    } catch (error) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        data: (error as Error).message 
      })}\n\n`);
      res.end();
    }
  });

  // Code Analysis
  app.post("/api/projects/:projectId/analyze", async (req, res) => {
    try {
      const { analysisType = "quality" } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project?.files) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const analysis = await storage.createCodeAnalysis({
        projectId: req.params.projectId,
        analysisType,
        status: "running"
      });
      
      try {
        const analysisResult = await analyzeCode(project.files as Record<string, string>);
        
        await storage.updateCodeAnalysis(analysis.id, {
          status: "completed",
          score: analysisResult.overall?.score || 0,
          findings: analysisResult,
          completedAt: new Date()
        });
        
        res.json({ analysis: analysisResult, analysisId: analysis.id });
      } catch (error) {
        await storage.updateCodeAnalysis(analysis.id, { status: "failed" });
        throw error;
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze code" });
    }
  });

  // Code Improvement
  app.post("/api/projects/:projectId/improve", async (req, res) => {
    try {
      const { improvement } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project?.files) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const improvedCode = await improveCode(
        project.files as Record<string, string>, 
        improvement
      );
      
      await storage.updateProject(req.params.projectId, {
        files: improvedCode.files,
        dependencies: { ...project.dependencies, ...improvedCode.dependencies }
      });
      
      res.json({ 
        success: true, 
        improvements: improvedCode.metadata?.changes || []
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to improve code" });
    }
  });

  // Test Generation
  app.post("/api/projects/:projectId/generate-tests", async (req, res) => {
    try {
      const { testType = "unit" } = req.body;
      const project = await storage.getProject(req.params.projectId);
      
      if (!project?.files) {
        return res.status(404).json({ message: "Project or files not found" });
      }
      
      const testFiles = await generateTests(
        project.files as Record<string, string>, 
        testType as 'unit' | 'integration' | 'e2e'
      );
      
      const updatedFiles = { ...project.files, ...testFiles };
      await storage.updateProject(req.params.projectId, {
        files: updatedFiles
      });
      
      res.json({ success: true, testFiles, testType });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate tests" });
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
