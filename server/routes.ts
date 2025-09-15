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
  insertCodeReviewSchema,
  insertMigrationProjectSchema,
  insertLegacySystemAssessmentSchema,
  insertCodeModernizationTaskSchema,
  insertCustomAiModelSchema,
  insertMigrationExecutionLogSchema,
  insertMigrationAssessmentFindingSchema,
  insertMigrationCostAnalysisSchema
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
import { legacyAssessmentService } from "./services/legacyAssessment";
import { integrationService } from "./services/integrationService";
import { repositoryIntegrationService } from "./services/repositoryIntegrationService";
import { apiConnectorManager, ApiConnectorFactory } from "./services/apiConnectorFramework";
import { encryptionService, secretsManager } from "./services/encryptionService";
import { 
  insertIntegrationSchema,
  insertIntegrationSecretSchema,
  insertRepositoryConnectionSchema,
  insertApiConnectionSchema,
  insertWebhookConfigurationSchema,
  insertApiRateLimitSchema
} from "@shared/schema";

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

  // =====================================================
  // Enterprise Migration System API Endpoints
  // =====================================================

  // Helper function to validate migration project ownership
  const validateMigrationProjectOwnership = async (migrationProjectId: string, userId: string) => {
    const migrationProject = await storage.getMigrationProject(migrationProjectId);
    if (!migrationProject) {
      throw new Error('Migration project not found');
    }
    const project = await storage.getProject(migrationProject.projectId);
    if (!project || project.userId !== userId) {
      throw new Error('Migration project not found or access denied');
    }
    return migrationProject;
  };

  // Migration Projects CRUD
  app.get("/api/migration-projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { status } = req.query;
      
      let migrationProjects;
      if (status) {
        migrationProjects = await storage.getMigrationProjectsByStatus(status as string);
        // Filter by user ownership
        const userProjects = await Promise.all(
          migrationProjects.map(async (mp) => {
            const project = await storage.getProject(mp.projectId);
            return project?.userId === userId ? mp : null;
          })
        );
        migrationProjects = userProjects.filter(Boolean);
      } else {
        migrationProjects = await storage.getUserMigrationProjects(userId);
      }
      
      res.json(migrationProjects);
    } catch (error) {
      console.error('Get migration projects error:', error);
      res.status(500).json({ message: "Failed to get migration projects" });
    }
  });

  app.get("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const migrationProject = await validateMigrationProjectOwnership(req.params.id, userId);
      res.json(migrationProject);
    } catch (error) {
      console.error('Get migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Migration project not found" });
    }
  });

  app.post("/api/migration-projects", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationProjectSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const migrationProject = await storage.createMigrationProject(data);
      res.status(201).json(migrationProject);
    } catch (error) {
      console.error('Create migration project error:', error);
      res.status(400).json({ message: "Invalid migration project data", error: (error as Error).message });
    }
  });

  app.patch("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateMigrationProjectOwnership(req.params.id, userId);
      const migrationProject = await storage.updateMigrationProject(req.params.id, req.body);
      if (!migrationProject) {
        return res.status(404).json({ message: "Migration project not found" });
      }
      res.json(migrationProject);
    } catch (error) {
      console.error('Update migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update migration project" });
    }
  });

  app.delete("/api/migration-projects/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await validateMigrationProjectOwnership(req.params.id, userId);
      const deleted = await storage.deleteMigrationProject(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Migration project not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Delete migration project error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to delete migration project" });
    }
  });

  // Legacy System Assessments CRUD
  app.get("/api/legacy-assessments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, migrationProjectId } = req.query;
      
      let assessments;
      if (projectId) {
        await validateProjectOwnership(projectId as string, userId);
        assessments = await storage.getProjectLegacyAssessments(projectId as string);
      } else if (migrationProjectId) {
        await validateMigrationProjectOwnership(migrationProjectId as string, userId);
        assessments = await storage.getMigrationProjectAssessments(migrationProjectId as string);
      } else {
        return res.status(400).json({ message: "projectId or migrationProjectId is required" });
      }
      
      res.json(assessments);
    } catch (error) {
      console.error('Get legacy assessments error:', error);
      res.status(500).json({ message: "Failed to get legacy assessments" });
    }
  });

  app.get("/api/legacy-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      res.json(assessment);
    } catch (error) {
      console.error('Get legacy assessment error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(404).json({ message: "Assessment not found" });
    }
  });

  app.post("/api/legacy-assessments", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertLegacySystemAssessmentSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const assessment = await storage.createLegacySystemAssessment(data);
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Create legacy assessment error:', error);
      res.status(400).json({ message: "Invalid assessment data", error: (error as Error).message });
    }
  });

  app.patch("/api/legacy-assessments/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      const updatedAssessment = await storage.updateLegacySystemAssessment(req.params.id, req.body);
      res.json(updatedAssessment);
    } catch (error) {
      console.error('Update legacy assessment error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update assessment" });
    }
  });

  // Code Modernization Tasks CRUD
  app.get("/api/modernization-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, migrationProjectId, legacySystemId, assignedTo } = req.query;
      
      let tasks;
      if (assignedTo === 'me') {
        tasks = await storage.getUserAssignedTasks(userId);
      } else if (projectId) {
        await validateProjectOwnership(projectId as string, userId);
        tasks = await storage.getProjectModernizationTasks(projectId as string);
      } else if (migrationProjectId) {
        await validateMigrationProjectOwnership(migrationProjectId as string, userId);
        tasks = await storage.getMigrationProjectTasks(migrationProjectId as string);
      } else if (legacySystemId) {
        const assessment = await storage.getLegacySystemAssessment(legacySystemId as string);
        if (!assessment) {
          return res.status(404).json({ message: "Legacy system not found" });
        }
        await validateProjectOwnership(assessment.projectId, userId);
        tasks = await storage.getLegacySystemTasks(legacySystemId as string);
      } else {
        return res.status(400).json({ message: "Filter parameter is required" });
      }
      
      res.json(tasks);
    } catch (error) {
      console.error('Get modernization tasks error:', error);
      res.status(500).json({ message: "Failed to get modernization tasks" });
    }
  });

  app.post("/api/modernization-tasks", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCodeModernizationTaskSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const task = await storage.createCodeModernizationTask(data);
      res.status(201).json(task);
    } catch (error) {
      console.error('Create modernization task error:', error);
      res.status(400).json({ message: "Invalid task data", error: (error as Error).message });
    }
  });

  app.patch("/api/modernization-tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const task = await storage.getCodeModernizationTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      await validateProjectOwnership(task.projectId, userId);
      
      const updatedTask = await storage.updateCodeModernizationTask(req.params.id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error('Update modernization task error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Custom AI Models CRUD
  app.get("/api/custom-ai-models", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, modelType, active } = req.query;
      
      if (!projectId) {
        return res.status(400).json({ message: "projectId is required" });
      }
      
      await validateProjectOwnership(projectId as string, userId);
      
      let models;
      if (active === 'true') {
        models = await storage.getActiveCustomModels(projectId as string);
      } else if (modelType) {
        models = await storage.getCustomModelsByType(projectId as string, modelType as string);
      } else {
        models = await storage.getProjectCustomModels(projectId as string);
      }
      
      res.json(models);
    } catch (error) {
      console.error('Get custom AI models error:', error);
      res.status(500).json({ message: "Failed to get custom AI models" });
    }
  });

  app.post("/api/custom-ai-models", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertCustomAiModelSchema.parse(req.body);
      
      // Validate project ownership
      await validateProjectOwnership(data.projectId, userId);
      
      const model = await storage.createCustomAiModel(data);
      res.status(201).json(model);
    } catch (error) {
      console.error('Create custom AI model error:', error);
      res.status(400).json({ message: "Invalid model data", error: (error as Error).message });
    }
  });

  app.patch("/api/custom-ai-models/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const model = await storage.getCustomAiModel(req.params.id);
      if (!model) {
        return res.status(404).json({ message: "Model not found" });
      }
      await validateProjectOwnership(model.projectId, userId);
      
      const updatedModel = await storage.updateCustomAiModel(req.params.id, req.body);
      res.json(updatedModel);
    } catch (error) {
      console.error('Update custom AI model error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to update model" });
    }
  });

  // Migration Execution Logs
  app.get("/api/migration-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { migrationProjectId, phase, status } = req.query;
      
      if (!migrationProjectId) {
        return res.status(400).json({ message: "migrationProjectId is required" });
      }
      
      await validateMigrationProjectOwnership(migrationProjectId as string, userId);
      
      let logs;
      if (phase) {
        logs = await storage.getMigrationLogsByPhase(migrationProjectId as string, phase as string);
      } else if (status) {
        logs = await storage.getMigrationLogsByStatus(migrationProjectId as string, status as string);
      } else {
        logs = await storage.getMigrationProjectLogs(migrationProjectId as string);
      }
      
      res.json(logs);
    } catch (error) {
      console.error('Get migration logs error:', error);
      res.status(500).json({ message: "Failed to get migration logs" });
    }
  });

  app.post("/api/migration-logs", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationExecutionLogSchema.parse(req.body);
      
      // Validate migration project ownership
      await validateMigrationProjectOwnership(data.migrationProjectId, userId);
      
      const log = await storage.createMigrationExecutionLog(data);
      res.status(201).json(log);
    } catch (error) {
      console.error('Create migration log error:', error);
      res.status(400).json({ message: "Invalid log data", error: (error as Error).message });
    }
  });

  // Assessment Findings
  app.get("/api/assessment-findings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { assessmentId, severity, findingType, status } = req.query;
      
      if (!assessmentId) {
        return res.status(400).json({ message: "assessmentId is required" });
      }
      
      const assessment = await storage.getLegacySystemAssessment(assessmentId as string);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      let findings;
      if (status === 'open') {
        findings = await storage.getOpenFindings(assessmentId as string);
      } else if (severity) {
        findings = await storage.getFindingsBySeverity(assessmentId as string, severity as string);
      } else if (findingType) {
        findings = await storage.getFindingsByType(assessmentId as string, findingType as string);
      } else {
        findings = await storage.getAssessmentFindings(assessmentId as string);
      }
      
      res.json(findings);
    } catch (error) {
      console.error('Get assessment findings error:', error);
      res.status(500).json({ message: "Failed to get assessment findings" });
    }
  });

  app.post("/api/assessment-findings", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationAssessmentFindingSchema.parse(req.body);
      
      // Validate assessment ownership
      const assessment = await storage.getLegacySystemAssessment(data.assessmentId);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      await validateProjectOwnership(assessment.projectId, userId);
      
      const finding = await storage.createMigrationAssessmentFinding(data);
      res.status(201).json(finding);
    } catch (error) {
      console.error('Create assessment finding error:', error);
      res.status(400).json({ message: "Invalid finding data", error: (error as Error).message });
    }
  });

  // Migration Cost Analysis
  app.get("/api/migration-cost-analysis", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { migrationProjectId, analysisType, latest } = req.query;
      
      if (!migrationProjectId) {
        return res.status(400).json({ message: "migrationProjectId is required" });
      }
      
      await validateMigrationProjectOwnership(migrationProjectId as string, userId);
      
      let analyses;
      if (latest === 'true') {
        const analysis = await storage.getLatestCostAnalysis(migrationProjectId as string);
        analyses = analysis ? [analysis] : [];
      } else if (analysisType) {
        analyses = await storage.getCostAnalysesByType(migrationProjectId as string, analysisType as string);
      } else {
        analyses = await storage.getMigrationProjectCostAnalyses(migrationProjectId as string);
      }
      
      res.json(analyses);
    } catch (error) {
      console.error('Get migration cost analysis error:', error);
      res.status(500).json({ message: "Failed to get cost analysis" });
    }
  });

  app.post("/api/migration-cost-analysis", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertMigrationCostAnalysisSchema.parse(req.body);
      
      // Validate migration project ownership
      await validateMigrationProjectOwnership(data.migrationProjectId, userId);
      
      const analysis = await storage.createMigrationCostAnalysis(data);
      res.status(201).json(analysis);
    } catch (error) {
      console.error('Create migration cost analysis error:', error);
      res.status(400).json({ message: "Invalid analysis data", error: (error as Error).message });
    }
  });

  // Legacy Assessment Service Endpoints
  app.post("/api/legacy-assessments/run-assessment", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, systemName, discoveryInput, assignedTo } = req.body;
      
      // Validate project ownership
      await validateProjectOwnership(projectId, userId);
      
      const assessment = await legacyAssessmentService.runCompleteAssessment(
        projectId,
        systemName,
        discoveryInput,
        assignedTo
      );
      
      res.status(201).json(assessment);
    } catch (error) {
      console.error('Run legacy assessment error:', error);
      res.status(500).json({ message: "Failed to run assessment", error: (error as Error).message });
    }
  });

  app.get("/api/legacy-assessments/:id/summary", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const assessment = await storage.getLegacySystemAssessment(req.params.id);
      if (!assessment) {
        return res.status(404).json({ message: "Assessment not found" });
      }
      
      // Validate project ownership
      await validateProjectOwnership(assessment.projectId, userId);
      
      const summary = await legacyAssessmentService.getAssessmentSummary(req.params.id);
      res.json(summary);
    } catch (error) {
      console.error('Get assessment summary error:', error);
      if (error.message.includes('access denied')) {
        return res.status(403).json({ message: "Access denied" });
      }
      res.status(500).json({ message: "Failed to get assessment summary" });
    }
  });

  app.post("/api/infrastructure/discover", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const discoveryInput = req.body;
      
      const discoveredInfra = await legacyAssessmentService.discoverInfrastructure(discoveryInput);
      res.json(discoveredInfra);
    } catch (error) {
      console.error('Infrastructure discovery error:', error);
      res.status(500).json({ message: "Failed to discover infrastructure" });
    }
  });

  // =====================================================
  // INTEGRATIONS HUB API ENDPOINTS
  // =====================================================

  // Integration Management
  app.get("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { projectId, type, service, status } = req.query;
      
      // Get integrations would be implemented in storage interface
      // For now, return placeholder
      const integrations = []; // await storage.getUserIntegrations(userId, { projectId, type, service, status });
      
      res.json(integrations);
    } catch (error) {
      console.error('Get integrations error:', error);
      res.status(500).json({ message: "Failed to get integrations" });
    }
  });

  app.post("/api/integrations", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const data = insertIntegrationSchema.parse({ ...req.body, userId });
      
      if (data.projectId) {
        await validateProjectOwnership(data.projectId, userId);
      }

      // Create integration using our service
      const result = await integrationService.createIntegration({
        type: data.type,
        service: data.service,
        configuration: data.configuration || {},
        secrets: {}, // secrets handled separately
        endpoints: data.endpoints || {},
        healthCheck: data.healthCheck || {
          enabled: true,
          interval: 300,
          timeout: 30,
          retries: 3
        }
      }, userId, data.projectId);

      res.status(201).json({
        integration: result.integration,
        connectionTest: result.connectionTest
      });
    } catch (error) {
      console.error('Create integration error:', error);
      res.status(400).json({ message: "Invalid integration data", error: (error as Error).message });
    }
  });

  app.get("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // const integration = await storage.getIntegration(req.params.id);
      
      // Placeholder response
      res.status(404).json({ message: "Integration not found" });
    } catch (error) {
      console.error('Get integration error:', error);
      res.status(500).json({ message: "Failed to get integration" });
    }
  });

  app.put("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      const result = await integrationService.updateIntegrationConfig(
        integrationId,
        req.body,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          connectionTest: result.connectionTest
        });
      } else {
        res.status(400).json({ 
          message: result.errorMessage || "Failed to update integration"
        });
      }
    } catch (error) {
      console.error('Update integration error:', error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  app.delete("/api/integrations/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // Implementation would validate ownership and delete integration
      res.status(204).send();
    } catch (error) {
      console.error('Delete integration error:', error);
      res.status(500).json({ message: "Failed to delete integration" });
    }
  });

  app.post("/api/integrations/:id/test", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      // Would fetch integration and test connection
      const mockIntegration = {
        id: integrationId,
        service: 'github',
        secrets: []
      };
      
      const result = await integrationService.testConnection(mockIntegration as any);
      res.json(result);
    } catch (error) {
      console.error('Test integration error:', error);
      res.status(500).json({ message: "Failed to test integration" });
    }
  });

  app.post("/api/integrations/:id/health-check", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      
      // Would fetch integration and perform health check
      const mockIntegration = {
        id: integrationId,
        service: 'github',
        type: 'repository',
        secrets: []
      };
      
      const result = await integrationService.performHealthCheck(mockIntegration as any);
      res.json(result);
    } catch (error) {
      console.error('Integration health check error:', error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  // Secrets Management
  app.get("/api/integrations/:id/secrets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // Return secret metadata only (not actual values)
      const secrets = []; // await storage.getIntegrationSecrets(req.params.id);
      
      // Remove encrypted values from response
      const safeSecrets = secrets.map((secret: any) => ({
        ...secret,
        encryptedValue: undefined,
        hasValue: !!secret.encryptedValue
      }));
      
      res.json(safeSecrets);
    } catch (error) {
      console.error('Get secrets error:', error);
      res.status(500).json({ message: "Failed to get secrets" });
    }
  });

  app.post("/api/integrations/:id/secrets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { secretName, secretValue, secretType, environment = 'production' } = req.body;
      const integrationId = req.params.id;
      
      if (!secretName || !secretValue) {
        return res.status(400).json({ message: "secretName and secretValue are required" });
      }

      // Encrypt the secret
      const encryptedData = await secretsManager.encryptApiKey(
        secretValue,
        'generic',
        environment
      );

      const secretData = {
        integrationId,
        secretType: secretType || 'api-key',
        secretName,
        encryptedValue: encryptedData.encryptedValue,
        encryptionAlgorithm: encryptedData.algorithm,
        keyId: encryptedData.keyId,
        environment,
        metadata: {
          ...encryptedData.metadata,
          createdBy: userId
        }
      };

      // Would save to database
      res.status(201).json({
        id: 'generated-id',
        ...secretData,
        encryptedValue: undefined, // Don't return encrypted value
        hasValue: true
      });
    } catch (error) {
      console.error('Create secret error:', error);
      res.status(400).json({ message: "Failed to create secret" });
    }
  });

  app.delete("/api/integrations/:integrationId/secrets/:secretId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      // Implementation would validate ownership and delete secret
      res.status(204).send();
    } catch (error) {
      console.error('Delete secret error:', error);
      res.status(500).json({ message: "Failed to delete secret" });
    }
  });

  // GitHub/GitLab OAuth and Repository Management
  app.post("/api/integrations/github/oauth/initiate", isAuthenticated, async (req, res) => {
    try {
      const { redirectUri, scopes = ['repo', 'user:email'] } = req.body;
      
      const config = {
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: redirectUri || `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/github/oauth/callback`,
        scopes
      };

      const result = repositoryIntegrationService.initiateGitHubOAuth(config);
      res.json(result);
    } catch (error) {
      console.error('GitHub OAuth initiate error:', error);
      res.status(500).json({ message: "Failed to initiate GitHub OAuth" });
    }
  });

  app.post("/api/integrations/github/oauth/callback", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code, state } = req.body;
      
      const config = {
        clientId: process.env.GITHUB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/github/oauth/callback`,
        scopes: ['repo', 'user:email']
      };

      const result = await repositoryIntegrationService.handleGitHubOAuthCallback(
        code,
        state,
        config,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          integration: result.integration,
          userInfo: result.userInfo
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('GitHub OAuth callback error:', error);
      res.status(500).json({ message: "Failed to handle GitHub OAuth callback" });
    }
  });

  app.post("/api/integrations/gitlab/oauth/initiate", isAuthenticated, async (req, res) => {
    try {
      const { redirectUri, scopes = ['api', 'read_user'], baseUrl } = req.body;
      
      const config = {
        clientId: process.env.GITLAB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITLAB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: redirectUri || `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/gitlab/oauth/callback`,
        scopes,
        baseUrl
      };

      const result = repositoryIntegrationService.initiateGitLabOAuth(config);
      res.json(result);
    } catch (error) {
      console.error('GitLab OAuth initiate error:', error);
      res.status(500).json({ message: "Failed to initiate GitLab OAuth" });
    }
  });

  app.post("/api/integrations/gitlab/oauth/callback", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code, state, baseUrl } = req.body;
      
      const config = {
        clientId: process.env.GITLAB_CLIENT_ID || 'demo-client-id',
        clientSecret: process.env.GITLAB_CLIENT_SECRET || 'demo-client-secret',
        redirectUri: `${process.env.BASE_URL || 'http://localhost:5000'}/api/integrations/gitlab/oauth/callback`,
        scopes: ['api', 'read_user'],
        baseUrl
      };

      const result = await repositoryIntegrationService.handleGitLabOAuthCallback(
        code,
        state,
        config,
        userId
      );

      if (result.success) {
        res.json({
          success: true,
          integration: result.integration,
          userInfo: result.userInfo
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('GitLab OAuth callback error:', error);
      res.status(500).json({ message: "Failed to handle GitLab OAuth callback" });
    }
  });

  app.get("/api/integrations/:id/repositories", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      const { type = 'all', sort = 'updated', per_page = 100, page = 1 } = req.query;
      
      // Would fetch integration and discover repositories
      // For demo, return mock data
      const repositories = [
        {
          id: '1',
          name: 'sample-repo',
          fullName: 'user/sample-repo',
          description: 'A sample repository',
          url: 'https://github.com/user/sample-repo',
          defaultBranch: 'main',
          isPrivate: false,
          language: 'JavaScript',
          topics: ['web', 'react'],
          stargazersCount: 42,
          forksCount: 7,
          owner: {
            login: 'user',
            type: 'User',
            avatarUrl: 'https://github.com/user.png'
          }
        }
      ];
      
      res.json(repositories);
    } catch (error) {
      console.error('Get repositories error:', error);
      res.status(500).json({ message: "Failed to get repositories" });
    }
  });

  app.post("/api/integrations/:id/repositories/connect", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const integrationId = req.params.id;
      const { repositoryId, projectId, syncBranches, webhookEvents } = req.body;
      
      // Would connect repository to project
      const result = {
        success: true,
        repositoryConnection: {
          id: 'generated-connection-id',
          integrationId,
          repositoryId,
          projectId,
          syncBranches: syncBranches || ['main'],
          autoSync: true
        }
      };
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Connect repository error:', error);
      res.status(500).json({ message: "Failed to connect repository" });
    }
  });

  // API Connector Framework
  app.get("/api/api-connectors/available", async (req, res) => {
    try {
      const connectors = ApiConnectorFactory.getAvailableConnectors();
      const connectorInfos = connectors.map(service => ({
        service,
        info: ApiConnectorFactory.getConnectorInfo(service)
      }));
      
      res.json(connectorInfos);
    } catch (error) {
      console.error('Get available connectors error:', error);
      res.status(500).json({ message: "Failed to get available connectors" });
    }
  });

  app.post("/api/api-connectors/:service/initialize", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { service } = req.params;
      const { secrets, integrationId } = req.body;
      
      const result = await apiConnectorManager.initializeConnector(
        integrationId,
        service,
        secrets
      );
      
      if (result.success) {
        res.json({
          success: true,
          testResult: result.testResult
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('Initialize connector error:', error);
      res.status(500).json({ message: "Failed to initialize connector" });
    }
  });

  app.get("/api/api-connectors/metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = apiConnectorManager.getAllMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Get connector metrics error:', error);
      res.status(500).json({ message: "Failed to get connector metrics" });
    }
  });

  app.post("/api/api-connectors/health-check", isAuthenticated, async (req, res) => {
    try {
      const healthResults = await apiConnectorManager.healthCheckAll();
      res.json(healthResults);
    } catch (error) {
      console.error('Connector health check error:', error);
      res.status(500).json({ message: "Failed to perform health check" });
    }
  });

  // Webhook Endpoints
  app.post("/api/webhooks/repository/:integrationId", async (req, res) => {
    try {
      const { integrationId } = req.params;
      const payload = req.body;
      const headers = req.headers as Record<string, string>;
      
      const result = await repositoryIntegrationService.handleWebhook(
        payload,
        headers,
        integrationId
      );
      
      if (result.processed) {
        res.status(200).json({ message: "Webhook processed successfully" });
      } else {
        res.status(400).json({ 
          message: "Webhook processing failed",
          error: result.errorMessage
        });
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ message: "Internal webhook processing error" });
    }
  });

  // Integration Health & Status Monitoring
  app.get("/api/integrations/health/overview", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      
      // Would aggregate health status across all user integrations
      const healthOverview = {
        totalIntegrations: 0,
        healthyIntegrations: 0,
        degradedIntegrations: 0,
        unhealthyIntegrations: 0,
        lastChecked: new Date(),
        integrationsByType: {
          'cloud-provider': { total: 0, healthy: 0 },
          'repository': { total: 0, healthy: 0 },
          'api': { total: 0, healthy: 0 },
          'communication': { total: 0, healthy: 0 }
        }
      };
      
      res.json(healthOverview);
    } catch (error) {
      console.error('Get health overview error:', error);
      res.status(500).json({ message: "Failed to get health overview" });
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
        },
        migration: {
          projects: 0,
          assessments: 0,
          tasksInProgress: 0,
          modelsTraining: 0
        }
      };

      // This would normally aggregate across all projects
      // For demo, we'll use sample data
      stats.agents = { total: 12, active: 10, inactive: 2 };
      stats.incidents = { open: 3, resolved: 47 };
      stats.deployments = { pending: 1, deployed: 23, failed: 2 };
      stats.migration = { projects: 8, assessments: 15, tasksInProgress: 12, modelsTraining: 3 };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to get system health" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
