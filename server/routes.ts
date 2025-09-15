import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertCodeGenerationSchema } from "@shared/schema";
import { generateCodeFromPrompt } from "./services/ai";

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

  const httpServer = createServer(app);
  return httpServer;
}
