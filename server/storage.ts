import { db } from './db';
import { userProgress, recommendations, learningPaths, users, aiTools, resumes, careerInsights, type User, type InsertResume, type CareerInsight, type UpsertUser } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import type { 
    UserProgress as UserProgressType,
    Recommendation as RecommendationType,
    LearningPath as LearningPathType,
    InsertUserProgress as InsertUserProgressType,
    InsertRecommendation as InsertRecommendationType,
    InsertLearningPath as InsertLearningPathType,
    AiTool as AiToolType,
    Resume as ResumeType
} from '../shared/schema';

export interface IStorage {
  getUser(userId: string): Promise<User | null>;
  updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User | null>;
  getAiToolsByCategory(category: string): Promise<AiToolType[]>;
  getAllAiTools(): Promise<AiToolType[]>;
  getUserProgress(userId: string): Promise<UserProgressType[]>;
  getUserWeeklyStats(userId: string): Promise<any>;
  getUserPreferences(userId: string): Promise<any>;
  getUserPatterns(userId: string): Promise<any>;
  saveLearningPath(path: InsertLearningPathType): Promise<LearningPathType | null>;
  saveRecommendation(recommendation: InsertRecommendationType): Promise<RecommendationType | null>;
  createUserProgress(progress: InsertUserProgressType): Promise<UserProgressType | null>;
  getUserRecommendations(userId: string, limit?: number): Promise<RecommendationType[]>;
  createRecommendation(recommendation: InsertRecommendationType): Promise<RecommendationType | null>;
  getUserResumes(userId: string): Promise<ResumeType[]>;
  createResume(resume: InsertResume): Promise<ResumeType | null>;
  getUserLearningPaths(userId: string): Promise<LearningPathType[]>;
  createLearningPath(path: InsertLearningPathType): Promise<LearningPathType | null>;
  getUserCareerInsights(userId: string): Promise<CareerInsight[]>;
  createCareerInsight(insight: Omit<CareerInsight, 'id' | 'createdAt'>): Promise<CareerInsight | null>;
  getRecommendedTools(userId: string, limit?: number): Promise<AiToolType[]>;
  upsertUser(userData: UpsertUser): Promise<User | null>;
}

export class DatabaseStorage implements IStorage {
  async getUser(userId: string): Promise<User | null> {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  }

  async updateUserProfile(userId: string, data: Partial<UpsertUser>): Promise<User | null> {
    const result = await db.update(users).set({...data, updatedAt: new Date()}).where(eq(users.id, userId)).returning();
    return result[0] || null;
  }

  async getAiToolsByCategory(category: string): Promise<AiToolType[]> {
    return await db.select().from(aiTools).where(eq(aiTools.category, category));
  }

  async getAllAiTools(): Promise<AiToolType[]> {
    return await db.select().from(aiTools);
  }
  
  async getUserProgress(userId: string): Promise<UserProgressType[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getUserWeeklyStats(userId: string): Promise<any> {
    const progress = await this.getUserProgress(userId);
    return {
      totalHours: progress.reduce((sum, p) => sum + (p.hoursSpent || 0), 0),
      completedTools: progress.filter(p => p.status === 'completed').length,
      achievements: progress.flatMap(p => p.achievements || []),
    };
  }

  async getUserPreferences(userId: string): Promise<any> {
    const progress = await this.getUserProgress(userId);
    return {
      preferredTools: progress.map(p => p.toolId?.toString() || ''),
      skillLevels: progress.reduce((acc, p) => ({
        ...acc,
        [p.skillName || '']: p.progressPercentage || 0,
      }), {} as Record<string, number>),
    };
  }

  async getUserPatterns(userId: string): Promise<any> {
    const progress = await this.getUserProgress(userId);
    return {
      mostActiveHours: this.calculateMostActiveHours(progress),
      preferredTools: this.calculatePreferredTools(progress),
      skillProgress: this.calculateSkillProgress(progress),
    };
  }

  async saveLearningPath(path: InsertLearningPathType): Promise<LearningPathType | null> {
    const result = await db.insert(learningPaths).values(path).returning();
    return result[0] || null;
  }

  async saveRecommendation(recommendation: InsertRecommendationType): Promise<RecommendationType | null> {
    const result = await db.insert(recommendations).values(recommendation).returning();
    return result[0] || null;
  }

  async createUserProgress(progress: InsertUserProgressType): Promise<UserProgressType | null> {
    const result = await db.insert(userProgress).values(progress).returning();
    return result[0] || null;
  }

  async getUserRecommendations(userId: string, limit: number = 10): Promise<RecommendationType[]> {
    return await db.select().from(recommendations)
      .where(eq(recommendations.userId, userId))
      .orderBy(desc(recommendations.createdAt))
      .limit(limit);
  }

  async createRecommendation(recommendation: InsertRecommendationType): Promise<RecommendationType | null> {
    return this.saveRecommendation(recommendation);
  }

  async getUserResumes(userId: string): Promise<ResumeType[]> {
    return await db.select().from(resumes).where(eq(resumes.userId, userId));
  }

  async createResume(resume: InsertResume): Promise<ResumeType | null> {
    const resumeData = {
      ...resume,
      analysisResults: resume.analysisResults ? resume.analysisResults as any : undefined,
      suggestions: resume.suggestions ? (Array.isArray(resume.suggestions) ? resume.suggestions : [resume.suggestions]) : undefined,
    };
    const result = await db.insert(resumes).values(resumeData).returning();
    return result[0] || null;
  }

  async getUserLearningPaths(userId: string): Promise<LearningPathType[]> {
    return await db.select().from(learningPaths).where(eq(learningPaths.userId, userId));
  }

  async createLearningPath(path: InsertLearningPathType): Promise<LearningPathType | null> {
    return this.saveLearningPath(path);
  }

  async getUserCareerInsights(userId: string): Promise<CareerInsight[]> {
    return await db.select().from(careerInsights).where(eq(careerInsights.userId, userId));
  }

  async createCareerInsight(insight: Omit<CareerInsight, 'id' | 'createdAt'>): Promise<CareerInsight | null> {
    const dataToInsert: any = { ...insight };
    if (insight.actionItems && !Array.isArray(insight.actionItems)) {
      dataToInsert.actionItems = [insight.actionItems];
    } else if (insight.actionItems === null || insight.actionItems === undefined) {
      dataToInsert.actionItems = [];
    }
    const result = await db.insert(careerInsights).values(dataToInsert).returning();
    return result[0] || null;
  }
  
  async getRecommendedTools(userId: string, limit: number = 5): Promise<AiToolType[]> {
    return await db.select().from(aiTools).orderBy(desc(aiTools.rating)).limit(limit).execute() || [];
  }

  async upsertUser(userData: UpsertUser): Promise<User | null> {
    const result = await db.insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        }
      })
      .returning();
    return result[0] || null;
  }

  private calculateMostActiveHours(progress: UserProgressType[]) {
    const hourCounts = new Array(24).fill(0);
    progress.forEach(p => {
      if (p.createdAt) {
        const hour = new Date(p.createdAt).getHours();
        hourCounts[hour]++;
      }
      if (p.updatedAt) {
        const hour = new Date(p.updatedAt).getHours();
        hourCounts[hour]++;
      }
    });
    const hourActivity = hourCounts
      .map((count, hour) => ({ hour, count }))
      .filter(({ count }) => count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
    return hourActivity.map(({ hour }) => {
      if (hour === 0) return '12:00 AM';
      if (hour < 12) return `${hour}:00 AM`;
      if (hour === 12) return '12:00 PM';
      return `${hour - 12}:00 PM`;
    });
  }

  private calculatePreferredTools(progress: UserProgressType[]) {
    const toolCounts = progress.reduce((acc, p) => {
      if (p.toolId) {
        acc[p.toolId] = (acc[p.toolId] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);
    return Object.entries(toolCounts)
      .sort(([, a], [, b]) => b - a)
      .map(([toolId]) => toolId);
  }

  private calculateSkillProgress(progress: UserProgressType[]) {
    return progress.reduce((acc, p) => ({
      ...acc,
      [p.skillName || '']: p.progressPercentage || 0,
    }), {} as Record<string, number>);
  }
}

export const storage = new DatabaseStorage(); 