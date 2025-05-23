import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { searchService } from "./services/searchService";
import { careerService } from "./services/careerService";
import multer from "multer";
import { z } from "zod";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // AI Tools routes
  app.get('/api/tools', isAuthenticated, async (req, res) => {
    try {
      const { category } = req.query;
      
      const tools = category 
        ? await storage.getAiToolsByCategory(category as string)
        : await storage.getAllAiTools();
        
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ message: "Failed to fetch AI tools" });
    }
  });

  app.get('/api/tools/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 6;
      
      const tools = await storage.getRecommendedTools(userId, limit);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tool recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Progress tracking routes
  app.get('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get('/api/progress/weekly-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserWeeklyStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = { ...req.body, userId };
      
      const progress = await storage.createUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const recommendations = await storage.getUserRecommendations(userId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/recommendations/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const recommendations = await careerService.generatePersonalizedRecommendations(user);
      
      // Store recommendations in database
      for (const rec of recommendations) {
        await storage.createRecommendation({ ...rec, userId });
      }
      
      res.json({ message: "Recommendations generated successfully", count: recommendations.length });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Resume analysis routes
  app.get('/api/resumes', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const resumes = await storage.getUserResumes(userId);
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.post('/api/resumes/upload', isAuthenticated, upload.single('resume'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Convert buffer to text for analysis
      const resumeText = file.buffer.toString('utf-8');
      
      // Analyze resume with AI
      const analysisResults = await aiService.analyzeResume(resumeText);
      
      // For demo purposes, we'll store the file content as text
      // In production, you'd upload to Replit Object Storage
      const fileUrl = `data:text/plain;base64,${file.buffer.toString('base64')}`;
      
      const resume = await storage.createResume({
        userId,
        fileName: file.originalname,
        fileUrl,
        analysisResults,
        suggestions: analysisResults.suggestions || [],
        scoreBreakdown: analysisResults.scoreBreakdown || {},
      });
      
      res.json(resume);
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to upload and analyze resume" });
    }
  });

  // Learning paths routes
  app.get('/api/learning-paths', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const paths = await storage.getUserLearningPaths(userId);
      res.json(paths);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      res.status(500).json({ message: "Failed to fetch learning paths" });
    }
  });

  app.post('/api/learning-paths/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { targetRole, currentSkills, timeCommitment } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const learningPath = await careerService.generateLearningPath(user, {
        targetRole,
        currentSkills,
        timeCommitment,
      });
      
      const createdPath = await storage.createLearningPath({
        userId,
        ...learningPath,
      });
      
      res.json(createdPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      res.status(500).json({ message: "Failed to generate learning path" });
    }
  });

  // Career insights routes
  app.get('/api/insights', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const insights = await storage.getUserCareerInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching career insights:", error);
      res.status(500).json({ message: "Failed to fetch career insights" });
    }
  });

  app.post('/api/insights/generate', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Search for latest market trends and insights
      const marketData = await searchService.searchCareerTrends(user.role || 'software engineer');
      const insights = await careerService.generateCareerInsights(user, marketData);
      
      // Store insights in database
      for (const insight of insights) {
        await storage.createCareerInsight({ ...insight, userId });
      }
      
      res.json({ message: "Career insights generated successfully", count: insights.length });
    } catch (error) {
      console.error("Error generating career insights:", error);
      res.status(500).json({ message: "Failed to generate career insights" });
    }
  });

  // AI Chat routes
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, context } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const response = await aiService.chatWithAssistant(message, user, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat request" });
    }
  });

  // Search routes
  app.get('/api/search/tools', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Search query is required" });
      }

      const results = await searchService.searchAITools(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching tools:", error);
      res.status(500).json({ message: "Failed to search AI tools" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
