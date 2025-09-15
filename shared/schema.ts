import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, index, integer, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - updated for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  preferences: jsonb("preferences").default({}), // coding preferences, themes, etc.
  subscription: text("subscription").default("free"), // "free", "pro", "enterprise"
  totalTokensUsed: integer("total_tokens_used").default(0),
  monthlyTokensUsed: integer("monthly_tokens_used").default(0),
  apiUsageLimit: integer("api_usage_limit").default(10000),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  framework: text("framework").notNull(),
  templateId: varchar("template_id").references(() => projectTemplates.id),
  files: jsonb("files").default({}),
  dependencies: jsonb("dependencies").default({}),
  configuration: jsonb("configuration").default({}),
  databaseSchema: jsonb("database_schema").default({}),
  apiEndpoints: jsonb("api_endpoints").default([]),
  status: text("status").notNull().default("draft"), // draft, building, deployed, error
  deploymentUrl: text("deployment_url"),
  repositoryUrl: text("repository_url"),
  tags: text("tags").array().default([]),
  isPublic: boolean("is_public").default(false),
  starCount: integer("star_count").default(0),
  viewCount: integer("view_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeGenerations = pgTable("code_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  generatedCode: jsonb("generated_code"),
  status: text("status").notNull().default("pending"), // "pending", "streaming", "completed", "failed"
  progress: integer("progress").default(0), // 0-100 percentage
  generationType: text("generation_type").notNull().default("full-app"), // "full-app", "component", "api", "database", "test"
  framework: text("framework"),
  metadata: jsonb("metadata").default({}),
  tokensUsed: integer("tokens_used").default(0),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 4 }).default("0"),
  quality: text("quality"), // "excellent", "good", "fair", "poor"
  errorMessage: text("error_message"),
  success: boolean("success").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI DevOps Agent System Tables

export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "sre", "security", "performance", "deployment"
  status: text("status").notNull().default("active"), // "active", "inactive", "error"
  configuration: jsonb("configuration").default({}),
  lastHeartbeat: timestamp("last_heartbeat").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  version: text("version").notNull(),
  strategy: text("strategy").notNull().default("blue-green"), // "blue-green", "rolling", "canary"
  status: text("status").notNull().default("pending"), // "pending", "deploying", "deployed", "failed", "rolled-back"
  environment: text("environment").notNull().default("production"),
  deploymentUrl: text("deployment_url"),
  rollbackVersion: text("rollback_version"),
  metadata: jsonb("metadata").default({}),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const incidents = pgTable("incidents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  title: text("title").notNull(),
  description: text("description"),
  severity: text("severity").notNull().default("medium"), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("open"), // "open", "investigating", "resolved", "closed"
  category: text("category").notNull(), // "performance", "security", "infrastructure", "deployment"
  detectionMethod: text("detection_method").default("automated"), // "automated", "manual", "user-reported"
  resolution: text("resolution"),
  resolvedBy: text("resolved_by"), // agent id or user id
  metadata: jsonb("metadata").default({}),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const performanceMetrics = pgTable("performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  metricType: text("metric_type").notNull(), // "cpu", "memory", "response_time", "throughput", "error_rate"
  value: decimal("value", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(), // "percent", "seconds", "requests/sec", "mb", etc.
  timestamp: timestamp("timestamp").defaultNow(),
  tags: jsonb("tags").default({}), // environment, service, etc.
});

export const securityScans = pgTable("security_scans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  scanType: text("scan_type").notNull(), // "vulnerability", "compliance", "code-scan", "dependency-scan"
  status: text("status").notNull().default("pending"), // "pending", "running", "completed", "failed"
  findings: jsonb("findings").default([]),
  severity: text("severity").default("info"), // "info", "low", "medium", "high", "critical"
  resolved: boolean("resolved").default(false),
  metadata: jsonb("metadata").default({}),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(), // "deployment", "incident-response", "optimization", "monitoring"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  status: text("status").notNull().default("pending"), // "pending", "running", "completed", "failed"
  description: text("description").notNull(),
  input: jsonb("input").default({}),
  output: jsonb("output").default({}),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const infrastructureResources = pgTable("infrastructure_resources", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  resourceType: text("resource_type").notNull(), // "server", "container", "database", "load-balancer"
  resourceId: text("resource_id").notNull(), // external resource identifier
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // "active", "inactive", "maintenance", "error"
  provider: text("provider").notNull(), // "aws", "gcp", "azure", "local"
  region: text("region"),
  configuration: jsonb("configuration").default({}),
  metrics: jsonb("metrics").default({}),
  lastHealthCheck: timestamp("last_health_check").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced Vibe Coding Engine Tables

export const projectTemplates = pgTable("project_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "web-app", "mobile-app", "api", "full-stack", "e-commerce"
  framework: text("framework").notNull(), // "react", "vue", "next", "express", "fastapi"
  difficulty: text("difficulty").notNull().default("beginner"), // "beginner", "intermediate", "advanced"
  tags: text("tags").array().default([]),
  fileStructure: jsonb("file_structure").notNull(),
  dependencies: jsonb("dependencies").default({}),
  configuration: jsonb("configuration").default({}),
  databaseSchema: jsonb("database_schema").default({}),
  prompts: jsonb("prompts").default({}), // predefined prompts for this template
  thumbnail: text("thumbnail"),
  demoUrl: text("demo_url"),
  sourceUrl: text("source_url"),
  downloads: integer("downloads").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  isOfficial: boolean("is_official").default(false),
  isPublic: boolean("is_public").default(true),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeAnalysis = pgTable("code_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  generationId: varchar("generation_id").references(() => codeGenerations.id, { onDelete: "cascade" }),
  analysisType: text("analysis_type").notNull(), // "security", "performance", "quality", "accessibility", "seo"
  score: integer("score"), // 0-100
  findings: jsonb("findings").default([]),
  suggestions: jsonb("suggestions").default([]),
  metrics: jsonb("metrics").default({}),
  status: text("status").notNull().default("pending"), // "pending", "running", "completed", "failed"
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generationHistory = pgTable("generation_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  generationId: varchar("generation_id").notNull().references(() => codeGenerations.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(), // complete state at this version
  changes: jsonb("changes").default([]), // what changed from previous version
  prompt: text("prompt"),
  parentVersion: integer("parent_version"),
  isCurrent: boolean("is_current").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const codeReviews = pgTable("code_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  generationId: varchar("generation_id").notNull().references(() => codeGenerations.id, { onDelete: "cascade" }),
  reviewType: text("review_type").notNull(), // "automated", "manual", "ai-assisted"
  reviewer: varchar("reviewer"), // user id or "ai"
  status: text("status").notNull().default("pending"), // "pending", "approved", "rejected", "changes-requested"
  score: integer("score"), // 1-10
  comments: jsonb("comments").default([]),
  suggestions: jsonb("suggestions").default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const apiDocumentation = pgTable("api_documentation", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  endpoints: jsonb("endpoints").default([]),
  schemas: jsonb("schemas").default({}),
  examples: jsonb("examples").default({}),
  version: text("version").default("1.0.0"),
  format: text("format").default("openapi"), // "openapi", "swagger", "postman"
  autoGenerated: boolean("auto_generated").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  template: one(projectTemplates, {
    fields: [projects.templateId],
    references: [projectTemplates.id],
  }),
  codeGenerations: many(codeGenerations),
  aiAgents: many(aiAgents),
  deployments: many(deployments),
  incidents: many(incidents),
  performanceMetrics: many(performanceMetrics),
  securityScans: many(securityScans),
  infrastructureResources: many(infrastructureResources),
  codeAnalysis: many(codeAnalysis),
  generationHistory: many(generationHistory),
  codeReviews: many(codeReviews),
  apiDocumentation: many(apiDocumentation),
}));

export const codeGenerationsRelations = relations(codeGenerations, ({ one, many }) => ({
  project: one(projects, {
    fields: [codeGenerations.projectId],
    references: [projects.id],
  }),
  codeAnalysis: many(codeAnalysis),
  generationHistory: many(generationHistory),
  codeReviews: many(codeReviews),
}));

export const projectTemplatesRelations = relations(projectTemplates, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [projectTemplates.createdBy],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const codeAnalysisRelations = relations(codeAnalysis, ({ one }) => ({
  project: one(projects, {
    fields: [codeAnalysis.projectId],
    references: [projects.id],
  }),
  generation: one(codeGenerations, {
    fields: [codeAnalysis.generationId],
    references: [codeGenerations.id],
  }),
}));

export const generationHistoryRelations = relations(generationHistory, ({ one }) => ({
  project: one(projects, {
    fields: [generationHistory.projectId],
    references: [projects.id],
  }),
  generation: one(codeGenerations, {
    fields: [generationHistory.generationId],
    references: [codeGenerations.id],
  }),
}));

export const codeReviewsRelations = relations(codeReviews, ({ one }) => ({
  project: one(projects, {
    fields: [codeReviews.projectId],
    references: [projects.id],
  }),
  generation: one(codeGenerations, {
    fields: [codeReviews.generationId],
    references: [codeGenerations.id],
  }),
}));

export const apiDocumentationRelations = relations(apiDocumentation, ({ one }) => ({
  project: one(projects, {
    fields: [apiDocumentation.projectId],
    references: [projects.id],
  }),
}));

export const aiAgentsRelations = relations(aiAgents, ({ one, many }) => ({
  project: one(projects, {
    fields: [aiAgents.projectId],
    references: [projects.id],
  }),
  deployments: many(deployments),
  incidents: many(incidents),
  securityScans: many(securityScans),
  tasks: many(agentTasks),
}));

export const deploymentsRelations = relations(deployments, ({ one }) => ({
  project: one(projects, {
    fields: [deployments.projectId],
    references: [projects.id],
  }),
  agent: one(aiAgents, {
    fields: [deployments.agentId],
    references: [aiAgents.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  project: one(projects, {
    fields: [incidents.projectId],
    references: [projects.id],
  }),
  agent: one(aiAgents, {
    fields: [incidents.agentId],
    references: [aiAgents.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  project: one(projects, {
    fields: [performanceMetrics.projectId],
    references: [projects.id],
  }),
}));

export const securityScansRelations = relations(securityScans, ({ one }) => ({
  project: one(projects, {
    fields: [securityScans.projectId],
    references: [projects.id],
  }),
  agent: one(aiAgents, {
    fields: [securityScans.agentId],
    references: [aiAgents.id],
  }),
}));

export const agentTasksRelations = relations(agentTasks, ({ one }) => ({
  agent: one(aiAgents, {
    fields: [agentTasks.agentId],
    references: [aiAgents.id],
  }),
  project: one(projects, {
    fields: [agentTasks.projectId],
    references: [projects.id],
  }),
}));

export const infrastructureResourcesRelations = relations(infrastructureResources, ({ one }) => ({
  project: one(projects, {
    fields: [infrastructureResources.projectId],
    references: [projects.id],
  }),
}));

// Zod schemas for validation
export const upsertUserSchema = createInsertSchema(users);
export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  framework: true,
});
export const insertCodeGenerationSchema = createInsertSchema(codeGenerations).pick({
  projectId: true,
  prompt: true,
  generationType: true,
  framework: true,
  metadata: true,
});

export const insertProjectTemplateSchema = createInsertSchema(projectTemplates).pick({
  name: true,
  description: true,
  category: true,
  framework: true,
  difficulty: true,
  tags: true,
  fileStructure: true,
  dependencies: true,
  configuration: true,
  databaseSchema: true,
  prompts: true,
  thumbnail: true,
  demoUrl: true,
  isPublic: true,
});

export const insertCodeAnalysisSchema = createInsertSchema(codeAnalysis).pick({
  projectId: true,
  generationId: true,
  analysisType: true,
});

export const insertCodeReviewSchema = createInsertSchema(codeReviews).pick({
  projectId: true,
  generationId: true,
  reviewType: true,
  reviewer: true,
  score: true,
  comments: true,
  suggestions: true,
});

// AI DevOps schemas
export const insertAiAgentSchema = createInsertSchema(aiAgents).pick({
  projectId: true,
  name: true,
  type: true,
  configuration: true,
});

export const insertDeploymentSchema = createInsertSchema(deployments).pick({
  projectId: true,
  version: true,
  strategy: true,
  environment: true,
  metadata: true,
});

export const insertIncidentSchema = createInsertSchema(incidents).pick({
  projectId: true,
  title: true,
  description: true,
  severity: true,
  category: true,
  detectionMethod: true,
  metadata: true,
});

export const insertPerformanceMetricSchema = createInsertSchema(performanceMetrics).pick({
  projectId: true,
  metricType: true,
  value: true,
  unit: true,
  tags: true,
});

export const insertSecurityScanSchema = createInsertSchema(securityScans).pick({
  projectId: true,
  scanType: true,
  metadata: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).pick({
  agentId: true,
  projectId: true,
  taskType: true,
  priority: true,
  description: true,
  input: true,
});

export const insertInfrastructureResourceSchema = createInsertSchema(infrastructureResources).pick({
  projectId: true,
  resourceType: true,
  resourceId: true,
  name: true,
  provider: true,
  region: true,
  configuration: true,
});

// Type definitions
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertCodeGeneration = z.infer<typeof insertCodeGenerationSchema>;
export type CodeGeneration = typeof codeGenerations.$inferSelect;
export type InsertProjectTemplate = z.infer<typeof insertProjectTemplateSchema>;
export type ProjectTemplate = typeof projectTemplates.$inferSelect;
export type InsertCodeAnalysis = z.infer<typeof insertCodeAnalysisSchema>;
export type CodeAnalysis = typeof codeAnalysis.$inferSelect;
export type InsertCodeReview = z.infer<typeof insertCodeReviewSchema>;
export type CodeReview = typeof codeReviews.$inferSelect;
export type GenerationHistory = typeof generationHistory.$inferSelect;
export type ApiDocumentation = typeof apiDocumentation.$inferSelect;

// AI DevOps types
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertDeployment = z.infer<typeof insertDeploymentSchema>;
export type Deployment = typeof deployments.$inferSelect;
export type InsertIncident = z.infer<typeof insertIncidentSchema>;
export type Incident = typeof incidents.$inferSelect;
export type InsertPerformanceMetric = z.infer<typeof insertPerformanceMetricSchema>;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertSecurityScan = z.infer<typeof insertSecurityScanSchema>;
export type SecurityScan = typeof securityScans.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertInfrastructureResource = z.infer<typeof insertInfrastructureResourceSchema>;
export type InfrastructureResource = typeof infrastructureResources.$inferSelect;
