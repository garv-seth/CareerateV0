import {
  users,
  aiTools,
  userProgress,
  recommendations,
  resumes,
  learningPaths,
  careerInsights,
  type User,
  type UpsertUser,
  type AiTool,
  type InsertAiTool,
  type UserProgress,
  type InsertUserProgress,
  type Recommendation,
  type InsertRecommendation,
  type Resume,
  type InsertResume,
  type LearningPath,
  type InsertLearningPath,
  type CareerInsight,
  type InsertCareerInsight,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;

  // AI Tools
  getAllAiTools(): Promise<AiTool[]>;
  getAiToolsByCategory(category: string): Promise<AiTool[]>;
  createAiTool(tool: InsertAiTool): Promise<AiTool>;
  getRecommendedTools(userId: string, limit?: number): Promise<AiTool[]>;

  // User Progress
  getUserProgress(userId: string): Promise<UserProgress[]>;
  createUserProgress(progress: InsertUserProgress): Promise<UserProgress>;
  updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress>;
  getUserWeeklyStats(userId: string): Promise<{
    toolsExplored: number;
    hoursLearned: number;
    skillsGained: number;
  }>;

  // Recommendations
  getUserRecommendations(userId: string, limit?: number): Promise<Recommendation[]>;
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  updateRecommendationStatus(id: number, status: string): Promise<Recommendation>;

  // Resumes
  getUserResumes(userId: string): Promise<Resume[]>;
  createResume(resume: InsertResume): Promise<Resume>;
  getResumeById(id: number): Promise<Resume | undefined>;

  // Learning Paths
  getUserLearningPaths(userId: string): Promise<LearningPath[]>;
  createLearningPath(path: InsertLearningPath): Promise<LearningPath>;
  updateLearningPathProgress(id: number, progress: number): Promise<LearningPath>;

  // Career Insights
  getUserCareerInsights(userId: string, limit?: number): Promise<CareerInsight[]>;
  createCareerInsight(insight: InsertCareerInsight): Promise<CareerInsight>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // AI Tools
  async getAllAiTools(): Promise<AiTool[]> {
    return await db.select().from(aiTools).orderBy(desc(aiTools.rating));
  }

  async getAiToolsByCategory(category: string): Promise<AiTool[]> {
    return await db
      .select()
      .from(aiTools)
      .where(eq(aiTools.category, category))
      .orderBy(desc(aiTools.rating));
  }

  async createAiTool(tool: InsertAiTool): Promise<AiTool> {
    const [createdTool] = await db.insert(aiTools).values(tool).returning();
    return createdTool;
  }

  async getRecommendedTools(userId: string, limit = 10): Promise<AiTool[]> {
    // Get user's current role and preferences to recommend relevant tools
    const user = await this.getUser(userId);
    if (!user) return [];

    return await db
      .select()
      .from(aiTools)
      .limit(limit)
      .orderBy(desc(aiTools.rating));
  }

  // User Progress
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId))
      .orderBy(desc(userProgress.updatedAt));
  }

  async createUserProgress(progress: InsertUserProgress): Promise<UserProgress> {
    const [createdProgress] = await db
      .insert(userProgress)
      .values(progress)
      .returning();
    return createdProgress;
  }

  async updateUserProgress(id: number, data: Partial<UserProgress>): Promise<UserProgress> {
    const [updatedProgress] = await db
      .update(userProgress)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(userProgress.id, id))
      .returning();
    return updatedProgress;
  }

  async getUserWeeklyStats(userId: string): Promise<{
    toolsExplored: number;
    hoursLearned: number;
    skillsGained: number;
  }> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const weeklyProgress = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          gte(userProgress.createdAt, oneWeekAgo)
        )
      );

    const toolsExplored = new Set(weeklyProgress.map(p => p.toolId)).size;
    const hoursLearned = weeklyProgress.reduce((sum, p) => sum + (p.hoursSpent || 0), 0);
    const skillsGained = weeklyProgress.filter(p => p.status === 'completed').length;

    return { toolsExplored, hoursLearned, skillsGained };
  }

  // Recommendations
  async getUserRecommendations(userId: string, limit = 10): Promise<Recommendation[]> {
    return await db
      .select()
      .from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.matchScore), desc(recommendations.createdAt))
      .limit(limit);
  }

  async createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation> {
    const [createdRecommendation] = await db
      .insert(recommendations)
      .values(recommendation)
      .returning();
    return createdRecommendation;
  }

  async updateRecommendationStatus(id: number, status: string): Promise<Recommendation> {
    const [updatedRecommendation] = await db
      .update(recommendations)
      .set({ status })
      .where(eq(recommendations.id, id))
      .returning();
    return updatedRecommendation;
  }

  // Resumes
  async getUserResumes(userId: string): Promise<Resume[]> {
    return await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, userId))
      .orderBy(desc(resumes.uploadedAt));
  }

  async createResume(resume: InsertResume): Promise<Resume> {
    const [createdResume] = await db.insert(resumes).values(resume).returning();
    return createdResume;
  }

  async getResumeById(id: number): Promise<Resume | undefined> {
    const [resume] = await db.select().from(resumes).where(eq(resumes.id, id));
    return resume;
  }

  // Learning Paths
  async getUserLearningPaths(userId: string): Promise<LearningPath[]> {
    return await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.userId, userId))
      .orderBy(desc(learningPaths.updatedAt));
  }

  async createLearningPath(path: InsertLearningPath): Promise<LearningPath> {
    const [createdPath] = await db
      .insert(learningPaths)
      .values(path)
      .returning();
    return createdPath;
  }

  async updateLearningPathProgress(id: number, progress: number): Promise<LearningPath> {
    const [updatedPath] = await db
      .update(learningPaths)
      .set({ progress, updatedAt: new Date() })
      .where(eq(learningPaths.id, id))
      .returning();
    return updatedPath;
  }

  // Career Insights
  async getUserCareerInsights(userId: string, limit = 5): Promise<CareerInsight[]> {
    return await db
      .select()
      .from(careerInsights)
      .where(eq(careerInsights.userId, userId))
      .orderBy(desc(careerInsights.relevanceScore), desc(careerInsights.createdAt))
      .limit(limit);
  }

  async createCareerInsight(insight: InsertCareerInsight): Promise<CareerInsight> {
    const [createdInsight] = await db
      .insert(careerInsights)
      .values(insight)
      .returning();
    return createdInsight;
  }
}

export const storage = new DatabaseStorage();
