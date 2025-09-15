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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  framework: text("framework").notNull(),
  files: jsonb("files").default({}),
  status: text("status").notNull().default("draft"), // draft, building, deployed, error
  deploymentUrl: text("deployment_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeGenerations = pgTable("code_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  generatedCode: jsonb("generated_code"),
  success: boolean("success").notNull().default(false),
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

// Define table relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  codeGenerations: many(codeGenerations),
  aiAgents: many(aiAgents),
  deployments: many(deployments),
  incidents: many(incidents),
  performanceMetrics: many(performanceMetrics),
  securityScans: many(securityScans),
  infrastructureResources: many(infrastructureResources),
}));

export const codeGenerationsRelations = relations(codeGenerations, ({ one }) => ({
  project: one(projects, {
    fields: [codeGenerations.projectId],
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
