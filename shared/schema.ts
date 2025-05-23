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
  json,
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
  userId: text("user_id").notNull(),
  toolId: integer("tool_id"),
  skillName: text("skill_name"),
  progressType: text("progress_type").notNull(),
  status: text("status").notNull(),
  progressPercentage: integer("progress_percentage"),
  hoursSpent: integer("hours_spent"),
  achievements: json("achievements").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const recommendations = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  tools: json("tools").$type<any[]>(),
  learningPathId: integer("learning_path_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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
  userId: text("user_id").notNull(),
  tools: json("tools").$type<string[]>(),
  steps: json("steps").$type<string[]>(),
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
export type InsertUserProgress = typeof userProgress.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;
export type InsertRecommendation = typeof recommendations.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type InsertResume = z.infer<typeof insertResumeSchema>;
export type LearningPath = typeof learningPaths.$inferSelect;
export type InsertLearningPath = typeof learningPaths.$inferInsert;
export type CareerInsight = typeof careerInsights.$inferSelect;
export type InsertCareerInsight = z.infer<typeof insertCareerInsightSchema>;
