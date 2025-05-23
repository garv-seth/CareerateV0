import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role"),
  company: varchar("company"),
  yearsExperience: integer("years_experience"),
  aiReadinessScore: integer("ai_readiness_score").default(0),
  currentLevel: varchar("current_level").default("beginner"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const aiTools = pgTable("ai_tools", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  category: varchar("category").notNull(),
  url: varchar("url"),
  icon: varchar("icon"),
  pricing: varchar("pricing"),
  difficulty: varchar("difficulty"),
  tags: text("tags").array(),
  rating: real("rating"),
  useCases: text("use_cases").array(),
  integrations: text("integrations").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  toolId: integer("tool_id").references(() => aiTools.id),
  skillName: varchar("skill_name"),
  progressType: varchar("progress_type").notNull(), // 'tool_completion', 'skill_acquisition', 'learning_path'
  status: varchar("status").notNull(), // 'started', 'in_progress', 'completed'
  progressPercentage: integer("progress_percentage").default(0),
  hoursSpent: real("hours_spent").default(0),
  achievements: text("achievements").array(),
  metadata: jsonb("metadata"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  toolId: integer("tool_id").references(() => aiTools.id),
  type: varchar("type").notNull(), // 'ai_tool', 'learning_path', 'skill_development'
  title: varchar("title").notNull(),
  description: text("description"),
  reasoning: text("reasoning"),
  matchScore: integer("match_score"), // 0-100
  priority: varchar("priority").default("medium"), // 'low', 'medium', 'high'
  status: varchar("status").default("pending"), // 'pending', 'accepted', 'dismissed'
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  fileName: varchar("file_name").notNull(),
  fileUrl: varchar("file_url").notNull(),
  analysisResults: jsonb("analysis_results"),
  suggestions: text("suggestions").array(),
  aiEnhancedVersion: text("ai_enhanced_version"),
  scoreBreakdown: jsonb("score_breakdown"),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title").notNull(),
  description: text("description"),
  targetRole: varchar("target_role"),
  estimatedHours: integer("estimated_hours"),
  difficulty: varchar("difficulty"),
  steps: jsonb("steps"), // Array of learning steps with tools and skills
  progress: integer("progress").default(0),
  status: varchar("status").default("active"), // 'active', 'completed', 'paused'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const careerInsights = pgTable("career_insights", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  insightType: varchar("insight_type").notNull(), // 'market_trend', 'skill_gap', 'opportunity'
  title: varchar("title").notNull(),
  content: text("content").notNull(),
  actionItems: text("action_items").array(),
  relevanceScore: integer("relevance_score"),
  sources: text("sources").array(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema exports for validation
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAiToolSchema = createInsertSchema(aiTools).omit({
  id: true,
  createdAt: true,
});

export const insertUserProgressSchema = createInsertSchema(userProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRecommendationSchema = createInsertSchema(recommendations).omit({
  id: true,
  createdAt: true,
});

export const insertResumeSchema = createInsertSchema(resumes).omit({
  id: true,
  uploadedAt: true,
});

export const insertLearningPathSchema = createInsertSchema(learningPaths).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareerInsightSchema = createInsertSchema(careerInsights).omit({
  id: true,
  createdAt: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type AiTool = typeof aiTools.$inferSelect;
export type InsertAiTool = z.infer<typeof insertAiToolSchema>;
export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = z.infer<typeof insertRecommendationSchema>;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type CareerInsight = typeof careerInsights.$inferSelect;
export type InsertCareerInsight = z.infer<typeof insertCareerInsightSchema>;
