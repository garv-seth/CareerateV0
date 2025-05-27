import { db } from './db';
import { userProgress, recommendations, learningPaths } from '../shared/schema';
import { eq } from 'drizzle-orm';
import type { UserProgress, Recommendation, LearningPath, InsertUserProgress, InsertRecommendation, InsertLearningPath } from '../shared/schema';

export interface IStorage {
  getUserProgress(userId: string): Promise<UserProgress[]>;
  getUserWeeklyStats(userId: string): Promise<{
    totalHours: number;
    completedTools: number;
    achievements: string[];
  }>;
  getUserPreferences(userId: string): Promise<{
    preferredTools: string[];
    skillLevels: Record<string, number>;
  }>;
  getUserPatterns(userId: string): Promise<{
    mostActiveHours: string[];
    preferredTools: string[];
    skillProgress: Record<string, number>;
  }>;
  saveLearningPath(path: InsertLearningPath): Promise<void>;
  saveRecommendation(recommendation: InsertRecommendation): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUserProgress(userId: string): Promise<UserProgress[]> {
    return await db.select().from(userProgress).where(eq(userProgress.userId, userId));
  }

  async getUserWeeklyStats(userId: string) {
    const progress = await this.getUserProgress(userId);
    return {
      totalHours: progress.reduce((sum, p) => sum + (p.hoursSpent || 0), 0),
      completedTools: progress.filter(p => p.status === 'completed').length,
      achievements: progress.flatMap(p => p.achievements || []),
    };
  }

  async getUserPreferences(userId: string) {
    const progress = await this.getUserProgress(userId);
    return {
      preferredTools: progress.map(p => p.toolId?.toString() || ''),
      skillLevels: progress.reduce((acc, p) => ({
        ...acc,
        [p.skillName || '']: p.progressPercentage || 0,
      }), {} as Record<string, number>),
    };
  }

  async getUserPatterns(userId: string) {
    const progress = await this.getUserProgress(userId);
    return {
      mostActiveHours: this.calculateMostActiveHours(progress),
      preferredTools: this.calculatePreferredTools(progress),
      skillProgress: this.calculateSkillProgress(progress),
    };
  }

  async saveLearningPath(path: InsertLearningPath) {
    await db.insert(learningPaths).values({
      userId: path.userId,
      tools: path.tools,
      steps: path.steps,
    });
  }

  async saveRecommendation(recommendation: InsertRecommendation) {
    await db.insert(recommendations).values({
      userId: recommendation.userId,
      tools: recommendation.tools,
      learningPathId: recommendation.learningPathId,
    });
  }

  private calculateMostActiveHours(progress: UserProgress[]) {
    // Analyze user activity patterns by hour of day
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
    
    // Find the top 3 most active hours
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

  private calculatePreferredTools(progress: UserProgress[]) {
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

  private calculateSkillProgress(progress: UserProgress[]) {
    return progress.reduce((acc, p) => ({
      ...acc,
      [p.skillName || '']: p.progressPercentage || 0,
    }), {} as Record<string, number>);
  }
}

// Export a singleton instance
export const storage = new DatabaseStorage(); 