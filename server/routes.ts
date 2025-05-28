import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { aiService } from "./services/aiService";
import { searchService } from "./services/searchService";
import { careerService } from "./services/careerService";
import multer from "multer";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { type InsertResume, type InsertCareerInsight, type User as AppUser } from "../shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

// Define a type for the authenticated user
interface AuthenticatedUser extends AppUser {
  claims: { sub: string; [key: string]: any };
  // Add other properties from oidc.TokenSet if needed, like id_token, access_token etc.
  id_token?: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
}

// Augment Express's User type
declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // User is now properly typed via declaration merging
      const userId = req.user!.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User profile routes
  app.patch('/api/profile', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const updatedUser = await storage.updateUserProfile(userId, req.body);
      if (!updatedUser) {
        res.status(404).json({ message: "User not found or update failed" });
        return;
      }
      res.json(updatedUser);
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

  app.get('/api/tools/recommendations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.claims.sub;
      const limit = parseInt(req.query.limit as string) || 6;
      
      const tools = await storage.getRecommendedTools(userId, limit);
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tool recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  // Progress tracking routes
  app.get('/api/progress', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const progress = await storage.getUserProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching progress:", error);
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.get('/api/progress/weekly-stats', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.claims.sub;
      const stats = await storage.getUserWeeklyStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  app.post('/api/progress', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const progressData = { ...req.body, userId }; // Ensure req.body matches InsertUserProgress
      const progress = await storage.createUserProgress(progressData);
      res.json(progress);
    } catch (error) {
      console.error("Error creating progress:", error);
      res.status(500).json({ message: "Failed to create progress entry" });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await storage.getUserRecommendations(userId, limit);
      res.json(recommendations);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/recommendations/generate', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      // Assuming careerService.generatePersonalizedRecommendations returns an array of objects
      // that are compatible with InsertRecommendation (excluding userId which is added here)
      const recommendationsFromService = await careerService.generatePersonalizedRecommendations(user);
      for (const rec of recommendationsFromService) {
        await storage.createRecommendation({ ...rec, userId });
      }
      res.json({ message: "Recommendations generated successfully", count: recommendationsFromService.length });
    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Resume analysis routes
  app.get('/api/resumes', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const resumes = await storage.getUserResumes(userId);
      res.json(resumes);
    } catch (error) {
      console.error("Error fetching resumes:", error);
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  app.post('/api/resumes/upload', isAuthenticated, upload.single('resume'), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }
      const resumeText = file.buffer.toString('utf-8');
      const analysisDataFromService = await aiService.analyzeResume(resumeText) as {
        overallScore: number;
        scoreBreakdown?: any; 
        aiEnhancedSections?: any; 
        strengths?: string[];
        improvements?: string[];
        missingKeywords?: string[];
        skills?: { technical?: string[]; soft?: string[]; missing?: string[]; emerging?: string[] }; 
        suggestions?: string[];
        aiEnhancedVersion?: string; 
      };

      const fileUrl = `data:text/plain;base64,${file.buffer.toString('base64')}`;
      
      const analysisResultsForDb: InsertResume['analysisResults'] = {
        overallScore: analysisDataFromService.overallScore,
        scoreBreakdown: analysisDataFromService.scoreBreakdown, 
        aiEnhancedSections: analysisDataFromService.aiEnhancedSections, 
        strengths: analysisDataFromService.strengths || [],
        improvements: analysisDataFromService.improvements || [],
        missingKeywords: analysisDataFromService.missingKeywords || [],
        skills: analysisDataFromService.skills || {}, 
      };

      const suggestionsForDb: string[] | null = (analysisDataFromService.suggestions && Array.isArray(analysisDataFromService.suggestions))
                                              ? analysisDataFromService.suggestions 
                                              : null;

      const resumeToCreate = {
        userId,
        fileName: file.originalname,
        fileUrl,
        analysisResults: analysisResultsForDb,
        suggestions: suggestionsForDb, 
        scoreBreakdown: analysisDataFromService.scoreBreakdown || {}, 
        aiEnhancedVersion: analysisDataFromService.aiEnhancedVersion || "",
      } as InsertResume; // Cast to InsertResume earlier

      // Cast to any before calling storage to bypass strict type checking for this specific call
      const resume = await storage.createResume(resumeToCreate as any);
      res.json(resume);
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to upload and analyze resume" });
    }
  });

  // Learning paths routes
  app.get('/api/learning-paths', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const paths = await storage.getUserLearningPaths(userId);
      res.json(paths);
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      res.status(500).json({ message: "Failed to fetch learning paths" });
    }
  });

  app.post('/api/learning-paths/generate', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const { targetRole, currentSkills, timeCommitment } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      // Ensure careerService.generateLearningPath returns data compatible with InsertLearningPath
      const learningPathFromService = await careerService.generateLearningPath(user, {
        targetRole,
        currentSkills,
        timeCommitment,
      });
      const createdPath = await storage.createLearningPath({
        userId,
        ...learningPathFromService, // Spread the properties from service
      });
      res.json(createdPath);
    } catch (error) {
      console.error("Error generating learning path:", error);
      res.status(500).json({ message: "Failed to generate learning path" });
    }
  });

  // Career insights routes
  app.get('/api/insights', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const insights = await storage.getUserCareerInsights(userId);
      res.json(insights);
    } catch (error) {
      console.error("Error fetching career insights:", error);
      res.status(500).json({ message: "Failed to fetch career insights" });
    }
  });

  app.post('/api/insights/generate', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const marketData = await searchService.searchCareerTrends(user.role || 'software engineer');
      const insightsFromService = await careerService.generateCareerInsights(user, marketData) as Array<{
        insightType: string;
        title: string;
        content: string;
        actionItems?: string | string[];
        relevanceScore?: number;
        sources?: string | string[];
      }>;
      
      for (const insight of insightsFromService) {
        const actionItemsForDb: string[] | null = insight.actionItems 
          ? (Array.isArray(insight.actionItems) ? insight.actionItems : [insight.actionItems]) 
          : null;
        const sourcesForDb: string[] | null = insight.sources 
          ? (Array.isArray(insight.sources) ? insight.sources : [insight.sources]) 
          : null;
        const relevanceScore = insight.relevanceScore ?? 0;

        const careerInsightData = {
          userId,
          insightType: insight.insightType,
          title: insight.title,
          content: insight.content,
          actionItems: actionItemsForDb, 
          relevanceScore,
          sources: sourcesForDb, 
        };
        // Cast to any before calling storage to bypass strict type checking for this specific call
        await storage.createCareerInsight(careerInsightData as any);
      }
      res.json({ message: "Career insights generated successfully", count: insightsFromService.length });
    } catch (error) {
      console.error("Error generating career insights:", error);
      res.status(500).json({ message: "Failed to generate career insights" });
    }
  });

  // AI Chat routes
  app.post('/api/ai/chat', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims.sub;
      const { message, context } = req.body; // Ensure message and context are properly typed if necessary
      const user = await storage.getUser(userId);
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      const response = await aiService.chatWithAssistant(message, user, context);
      res.json({ response });
    } catch (error) {
      console.error("Error in AI chat:", error);
      res.status(500).json({ message: "Failed to process AI chat request" });
    }
  });

  // Search routes
  app.get('/api/search/tools', isAuthenticated, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.query;
      if (!query || typeof query !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const results = await searchService.searchAITools(query);
      res.json(results);
    } catch (error) {
      console.error("Error searching AI tools:", error);
      res.status(500).json({ message: "Failed to search AI tools" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
