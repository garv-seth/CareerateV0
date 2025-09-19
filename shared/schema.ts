import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, index, integer, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Core tables
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  name: text("name"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  framework: text("framework").notNull().default('react'),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const codeGenerations = pgTable("code_generations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  generatedCode: text("generated_code"),
  framework: text("framework"),
  language: text("language"),
  status: text("status").notNull().default("pending"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integrations table
export const integrations = pgTable("integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }), // optional project binding
  name: text("name").notNull(), // user-friendly name
  type: text("type").notNull(), // "cloud-provider", "repository", "api", "database", "monitoring", "payment", "communication"
  service: text("service").notNull(), // "github", "stripe", "twilio", "sendgrid", "aws", "azure", "gcp"
  category: text("category").notNull(), // "development", "deployment", "analytics", "payments", "communication"
  status: text("status").notNull().default("inactive"), // "active", "inactive", "error", "configuring", "testing"
  connectionType: text("connection_type").notNull(), // "oauth", "api-key", "service-account", "webhook"
  configuration: jsonb("configuration").default({}), // service-specific config
  endpoints: jsonb("endpoints").default({}), // API endpoints and URLs
  permissions: jsonb("permissions").default([]), // granted scopes/permissions
  rateLimits: jsonb("rate_limits").default({}), // rate limiting config
  healthCheck: jsonb("health_check").default({}), // health check configuration
  isEnabled: boolean("is_enabled").default(true),
  autoRotate: boolean("auto_rotate").default(false), // automatic credential rotation
  lastHealthCheck: timestamp("last_health_check"),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"), // for temporary connections
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Secure Secrets and Credentials Management
export const integrationSecrets = pgTable("integration_secrets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  secretType: text("secret_type").notNull(), // "api-key", "oauth-token", "webhook-secret", "certificate", "private-key"
  secretName: text("secret_name").notNull(), // name/identifier
  encryptedValue: text("encrypted_value").notNull(), // AES-256 encrypted secret
  encryptionAlgorithm: text("encryption_algorithm").default("AES-256-GCM"),
  keyId: text("key_id"), // reference to encryption key
  environment: text("environment").default("all"), // "development", "staging", "production", "all"
  scope: jsonb("scope").default([]), // permissions/access scope
  rotationPolicy: jsonb("rotation_policy").default({}), // auto-rotation settings
  lastRotated: timestamp("last_rotated"),
  expiresAt: timestamp("expires_at"),
  isActive: boolean("is_active").default(true),
  accessCount: integer("access_count").default(0),
  lastAccessed: timestamp("last_accessed"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// GitHub/GitLab Repository Connections
export const repositoryConnections = pgTable("repository_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").references(() => projects.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "github", "gitlab", "bitbucket", "azure-repos"
  repositoryId: text("repository_id").notNull(), // external repository ID
  repositoryName: text("repository_name").notNull(),
  repositoryUrl: text("repository_url").notNull(),
  ownerName: text("owner_name").notNull(),
  ownerType: text("owner_type").notNull(), // "user", "organization"
  defaultBranch: text("default_branch").default("main"),
  syncBranches: text("sync_branches").array().default(["main"]), // branches to sync
  webhookUrl: text("webhook_url"), // webhook endpoint
  webhookSecret: text("webhook_secret"), // webhook verification secret
  deployKeys: jsonb("deploy_keys").default([]), // deployment keys
  permissions: jsonb("permissions").default({}), // repo permissions
  autoSync: boolean("auto_sync").default(true),
  lastSync: timestamp("last_sync"),
  syncStatus: text("sync_status").default("pending"), // "synced", "pending", "error", "conflict"
  conflictResolution: text("conflict_resolution").default("manual"), // "manual", "auto-theirs", "auto-ours"
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Third-Party API Connections
export const apiConnections = pgTable("api_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  apiName: text("api_name").notNull(), // "Stripe API", "Twilio API", etc.
  baseUrl: text("base_url").notNull(), // API base URL
  version: text("version"), // API version
  authenticationType: text("authentication_type").notNull(), // "bearer", "api-key", "oauth", "basic", "custom"
  authenticationConfig: jsonb("authentication_config").default({}),
  endpoints: jsonb("endpoints").default([]), // available endpoints
  rateLimitConfig: jsonb("rate_limit_config").default({}),
  retryConfig: jsonb("retry_config").default({}), // retry policies
  timeout: integer("timeout").default(30000), // request timeout in ms
  customHeaders: jsonb("custom_headers").default({}),
  transformations: jsonb("transformations").default({}), // request/response transformations
  monitoring: jsonb("monitoring").default({}), // monitoring configuration
  healthEndpoint: text("health_endpoint"), // health check endpoint
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Integration Health Monitoring
export const integrationHealthChecks = pgTable("integration_health_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  checkType: text("check_type").notNull(), // "connectivity", "authentication", "api-health", "rate-limit", "webhook"
  status: text("status").default("unknown"), // "healthy", "degraded", "unhealthy", "unknown"
  responseTime: integer("response_time"), // response time in milliseconds
  statusCode: integer("status_code"), // HTTP status code
  errorMessage: text("error_message"),
  checkDetails: jsonb("check_details").default({}),
  consecutiveFailures: integer("consecutive_failures").default(0),
  lastSuccessful: timestamp("last_successful"),
  nextCheck: timestamp("next_check"),
  alertsTriggered: jsonb("alerts_triggered").default([]),
  metadata: jsonb("metadata").default({}),
  checkedAt: timestamp("checked_at").defaultNow(),
});

// Integration Audit Logs for Security and Compliance
export const integrationAuditLogs = pgTable("integration_audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").references(() => integrations.id, { onDelete: "set null" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "created", "updated", "deleted", "accessed", "rotated", "failed"
  resourceType: text("resource_type").notNull(), // "integration", "secret", "connection", "webhook"
  resourceId: text("resource_id"),
  details: jsonb("details").default({}), // action-specific details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: jsonb("location").default({}), // geo location if available
  risk: text("risk").default("low"), // "low", "medium", "high", "critical"
  complianceFlags: text("compliance_flags").array().default([]), // GDPR, SOC2, HIPAA etc
  sessionId: text("session_id"),
  requestId: text("request_id"),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Webhook Configuration Management
export const webhookConfigurations = pgTable("webhook_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  repositoryId: varchar("repository_id").references(() => repositoryConnections.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(), // webhook URL
  secret: text("secret"), // webhook verification secret
  events: text("events").array().default([]), // subscribed events
  active: boolean("active").default(true),
  sslVerification: boolean("ssl_verification").default(true),
  contentType: text("content_type").default("application/json"), // "application/json", "application/x-www-form-urlencoded"
  deliveryAttempts: integer("delivery_attempts").default(0),
  lastDelivery: timestamp("last_delivery"),
  lastDeliveryStatus: text("last_delivery_status"), // "success", "failed", "pending"
  lastDeliveryResponse: jsonb("last_delivery_response").default({}),
  failedDeliveries: integer("failed_deliveries").default(0),
  configuration: jsonb("configuration").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Rate Limiting and Usage Tracking
export const apiRateLimits = pgTable("api_rate_limits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  apiConnectionId: varchar("api_connection_id").references(() => apiConnections.id, { onDelete: "cascade" }),
  limitType: text("limit_type").notNull(), // "requests-per-minute", "requests-per-hour", "requests-per-day", "data-transfer"
  limitValue: integer("limit_value").notNull(), // limit amount
  currentUsage: integer("current_usage").default(0), // current usage
  resetPeriod: text("reset_period").notNull(), // "minute", "hour", "day", "month"
  resetAt: timestamp("reset_at").notNull(), // when usage counter resets
  warningThreshold: integer("warning_threshold"), // warning threshold (percentage)
  alertTriggered: boolean("alert_triggered").default(false),
  isBlocked: boolean("is_blocked").default(false), // if limit exceeded and blocked
  lastRequest: timestamp("last_request"),
  requestsInWindow: integer("requests_in_window").default(0), // requests in current window
  windowStart: timestamp("window_start"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// API Usage Analytics
export const apiUsageAnalytics = pgTable("api_usage_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  integrationId: varchar("integration_id").notNull().references(() => integrations.id, { onDelete: "cascade" }),
  apiConnectionId: varchar("api_connection_id").references(() => apiConnections.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(), // "GET", "POST", "PUT", "DELETE"
  requestCount: integer("request_count").default(1),
  responseTimeMs: integer("response_time_ms"),
  statusCode: integer("status_code"),
  errorCount: integer("error_count").default(0),
  dataTransferBytes: integer("data_transfer_bytes").default(0),
  period: text("period").notNull(), // "hourly", "daily", "monthly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// AI Agents for Autonomous Infrastructure Management
export const aiAgents = pgTable("ai_agents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // "sre", "security", "performance", "deployment", "code-review"
  status: text("status").notNull().default("active"), // "active", "inactive", "error", "paused"
  capabilities: text("capabilities").array().default([]), // list of what this agent can do
  configuration: jsonb("configuration").default({}),
  parentAgentId: varchar("parent_agent_id").references(() => aiAgents.id, { onDelete: "set null" }), // for sub-agents
  agentLevel: integer("agent_level").default(0), // 0 = primary, 1+ = sub-agent levels
  lastHeartbeat: timestamp("last_heartbeat"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Tasks for tracking AI agent work
export const agentTasks = pgTable("agent_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agentId: varchar("agent_id").notNull().references(() => aiAgents.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  taskType: text("task_type").notNull(), // "incident-response", "deployment", "monitoring", "security-scan"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "critical"
  status: text("status").notNull().default("pending"), // "pending", "running", "completed", "failed", "cancelled"
  description: text("description").notNull(),
  input: jsonb("input").default({}), // task input parameters
  output: jsonb("output").default({}), // task results
  errorMessage: text("error_message"),
  parentTaskId: varchar("parent_task_id").references(() => agentTasks.id, { onDelete: "set null" }), // for sub-tasks
  assignedToSubAgent: varchar("assigned_to_sub_agent").references(() => aiAgents.id, { onDelete: "set null" }),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  estimatedDuration: integer("estimated_duration"), // minutes
  actualDuration: integer("actual_duration"), // minutes
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agent Communication for inter-agent messaging
export const agentCommunications = pgTable("agent_communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromAgentId: varchar("from_agent_id").notNull().references(() => aiAgents.id, { onDelete: "cascade" }),
  toAgentId: varchar("to_agent_id").notNull().references(() => aiAgents.id, { onDelete: "cascade" }),
  messageType: text("message_type").notNull(), // "task-assignment", "status-update", "request-help", "coordination"
  content: jsonb("content").notNull(),
  priority: text("priority").default("normal"), // "low", "normal", "high", "urgent"
  status: text("status").default("sent"), // "sent", "delivered", "read", "processed"
  relatedTaskId: varchar("related_task_id").references(() => agentTasks.id, { onDelete: "set null" }),
  responseToId: varchar("response_to_id").references(() => agentCommunications.id, { onDelete: "set null" }),
  expiresAt: timestamp("expires_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
  processedAt: timestamp("processed_at"),
});

// Relations for Integration Hub
export const integrationsRelations = relations(integrations, ({ one, many }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [integrations.projectId],
    references: [projects.id],
  }),
  secrets: many(integrationSecrets),
  healthChecks: many(integrationHealthChecks),
  auditLogs: many(integrationAuditLogs),
  webhooks: many(webhookConfigurations),
  rateLimits: many(apiRateLimits),
  repositoryConnection: one(repositoryConnections),
  apiConnection: one(apiConnections),
}));

export const integrationSecretsRelations = relations(integrationSecrets, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationSecrets.integrationId],
    references: [integrations.id],
  }),
}));

export const repositoryConnectionsRelations = relations(repositoryConnections, ({ one, many }) => ({
  integration: one(integrations, {
    fields: [repositoryConnections.integrationId],
    references: [integrations.id],
  }),
  project: one(projects, {
    fields: [repositoryConnections.projectId],
    references: [projects.id],
  }),
  webhooks: many(webhookConfigurations),
}));

export const apiConnectionsRelations = relations(apiConnections, ({ one, many }) => ({
  integration: one(integrations, {
    fields: [apiConnections.integrationId],
    references: [integrations.id],
  }),
  rateLimits: many(apiRateLimits),
  usageAnalytics: many(apiUsageAnalytics),
}));

export const integrationHealthChecksRelations = relations(integrationHealthChecks, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationHealthChecks.integrationId],
    references: [integrations.id],
  }),
}));

export const integrationAuditLogsRelations = relations(integrationAuditLogs, ({ one }) => ({
  integration: one(integrations, {
    fields: [integrationAuditLogs.integrationId],
    references: [integrations.id],
  }),
  user: one(users, {
    fields: [integrationAuditLogs.userId],
    references: [users.id],
  }),
}));

export const webhookConfigurationsRelations = relations(webhookConfigurations, ({ one }) => ({
  integration: one(integrations, {
    fields: [webhookConfigurations.integrationId],
    references: [integrations.id],
  }),
  repository: one(repositoryConnections, {
    fields: [webhookConfigurations.repositoryId],
    references: [repositoryConnections.id],
  }),
}));

export const apiRateLimitsRelations = relations(apiRateLimits, ({ one }) => ({
  integration: one(integrations, {
    fields: [apiRateLimits.integrationId],
    references: [integrations.id],
  }),
  apiConnection: one(apiConnections, {
    fields: [apiRateLimits.apiConnectionId],
    references: [apiConnections.id],
  }),
}));

export const apiUsageAnalyticsRelations = relations(apiUsageAnalytics, ({ one }) => ({
  integration: one(integrations, {
    fields: [apiUsageAnalytics.integrationId],
    references: [integrations.id],
  }),
  apiConnection: one(apiConnections, {
    fields: [apiUsageAnalytics.apiConnectionId],
    references: [apiConnections.id],
  }),
}));

// AI Agent Relations
export const aiAgentsRelations = relations(aiAgents, ({ one, many }) => ({
  project: one(projects, {
    fields: [aiAgents.projectId],
    references: [projects.id],
  }),
  parentAgent: one(aiAgents, {
    fields: [aiAgents.parentAgentId],
    references: [aiAgents.id],
    relationName: "parent_agent",
  }),
  subAgents: many(aiAgents, { relationName: "parent_agent" }),
  tasks: many(agentTasks),
  sentMessages: many(agentCommunications, { relationName: "sent_messages" }),
  receivedMessages: many(agentCommunications, { relationName: "received_messages" }),
}));

export const agentTasksRelations = relations(agentTasks, ({ one, many }) => ({
  agent: one(aiAgents, {
    fields: [agentTasks.agentId],
    references: [aiAgents.id],
  }),
  project: one(projects, {
    fields: [agentTasks.projectId],
    references: [projects.id],
  }),
  parentTask: one(agentTasks, {
    fields: [agentTasks.parentTaskId],
    references: [agentTasks.id],
    relationName: "parent_task",
  }),
  subTasks: many(agentTasks, { relationName: "parent_task" }),
  assignedSubAgent: one(aiAgents, {
    fields: [agentTasks.assignedToSubAgent],
    references: [aiAgents.id],
  }),
  communications: many(agentCommunications),
}));

export const agentCommunicationsRelations = relations(agentCommunications, ({ one }) => ({
  fromAgent: one(aiAgents, {
    fields: [agentCommunications.fromAgentId],
    references: [aiAgents.id],
    relationName: "sent_messages",
  }),
  toAgent: one(aiAgents, {
    fields: [agentCommunications.toAgentId],
    references: [aiAgents.id],
    relationName: "received_messages",
  }),
  relatedTask: one(agentTasks, {
    fields: [agentCommunications.relatedTaskId],
    references: [agentTasks.id],
  }),
  responseToMessage: one(agentCommunications, {
    fields: [agentCommunications.responseToId],
    references: [agentCommunications.id],
  }),
}));

// Insert Schemas for Integration Hub
export const insertIntegrationSchema = createInsertSchema(integrations).pick({
  userId: true,
  projectId: true,
  name: true,
  type: true,
  service: true,
  category: true,
  connectionType: true,
  configuration: true,
  endpoints: true,
  permissions: true,
  rateLimits: true,
  healthCheck: true,
  isEnabled: true,
  autoRotate: true,
  expiresAt: true,
  metadata: true,
});

export const insertIntegrationSecretSchema = createInsertSchema(integrationSecrets).pick({
  integrationId: true,
  secretType: true,
  secretName: true,
  encryptedValue: true,
  encryptionAlgorithm: true,
  keyId: true,
  environment: true,
  scope: true,
  rotationPolicy: true,
  expiresAt: true,
  metadata: true,
});

export const insertRepositoryConnectionSchema = createInsertSchema(repositoryConnections).pick({
  integrationId: true,
  projectId: true,
  provider: true,
  repositoryId: true,
  repositoryName: true,
  repositoryUrl: true,
  ownerName: true,
  ownerType: true,
  defaultBranch: true,
  syncBranches: true,
  webhookUrl: true,
  deployKeys: true,
  permissions: true,
  autoSync: true,
  conflictResolution: true,
  metadata: true,
});

export const insertApiConnectionSchema = createInsertSchema(apiConnections).pick({
  integrationId: true,
  apiName: true,
  baseUrl: true,
  version: true,
  authenticationType: true,
  authenticationConfig: true,
  endpoints: true,
  rateLimitConfig: true,
  retryConfig: true,
  timeout: true,
  customHeaders: true,
  transformations: true,
  monitoring: true,
  healthEndpoint: true,
  metadata: true,
});

export const insertWebhookConfigurationSchema = createInsertSchema(webhookConfigurations).pick({
  integrationId: true,
  repositoryId: true,
  name: true,
  url: true,
  secret: true,
  events: true,
  active: true,
  sslVerification: true,
  contentType: true,
  configuration: true,
  metadata: true,
});

export const insertApiRateLimitSchema = createInsertSchema(apiRateLimits).pick({
  integrationId: true,
  apiConnectionId: true,
  limitType: true,
  limitValue: true,
  resetPeriod: true,
  resetAt: true,
  warningThreshold: true,
  metadata: true,
});

// Type Definitions for Integration Hub
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type IntegrationSecret = typeof integrationSecrets.$inferSelect;
export type InsertIntegrationSecret = z.infer<typeof insertIntegrationSecretSchema>;
export type RepositoryConnection = typeof repositoryConnections.$inferSelect;
export type InsertRepositoryConnection = z.infer<typeof insertRepositoryConnectionSchema>;
export type ApiConnection = typeof apiConnections.$inferSelect;
export type InsertApiConnection = z.infer<typeof insertApiConnectionSchema>;
export type IntegrationHealthCheck = typeof integrationHealthChecks.$inferSelect;
export type IntegrationAuditLog = typeof integrationAuditLogs.$inferSelect;
export type WebhookConfiguration = typeof webhookConfigurations.$inferSelect;
export type InsertWebhookConfiguration = z.infer<typeof insertWebhookConfigurationSchema>;
export type ApiRateLimit = typeof apiRateLimits.$inferSelect;
export type InsertApiRateLimit = z.infer<typeof insertApiRateLimitSchema>;
export type ApiUsageAnalytics = typeof apiUsageAnalytics.$inferSelect;

// =====================================================
// Core table schemas and types
// =====================================================

export const insertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  name: true,
  metadata: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  userId: true,
  name: true,
  description: true,
  metadata: true,
});

export const insertCodeGenerationSchema = createInsertSchema(codeGenerations).pick({
  userId: true,
  projectId: true,
  prompt: true,
  generatedCode: true,
  framework: true,
  language: true,
  status: true,
  metadata: true,
});

export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type CodeGeneration = typeof codeGenerations.$inferSelect;
export type InsertCodeGeneration = z.infer<typeof insertCodeGenerationSchema>;

// AI Agent Schemas
export const insertAiAgentSchema = createInsertSchema(aiAgents).pick({
  projectId: true,
  name: true,
  type: true,
  status: true,
  capabilities: true,
  configuration: true,
  parentAgentId: true,
  agentLevel: true,
  metadata: true,
});

export const insertAgentTaskSchema = createInsertSchema(agentTasks).pick({
  agentId: true,
  projectId: true,
  taskType: true,
  priority: true,
  description: true,
  input: true,
  parentTaskId: true,
  assignedToSubAgent: true,
  estimatedDuration: true,
  metadata: true,
});

export const insertAgentCommunicationSchema = createInsertSchema(agentCommunications).pick({
  fromAgentId: true,
  toAgentId: true,
  messageType: true,
  content: true,
  priority: true,
  relatedTaskId: true,
  responseToId: true,
  expiresAt: true,
  metadata: true,
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = z.infer<typeof insertAiAgentSchema>;
export type AgentTask = typeof agentTasks.$inferSelect;
export type InsertAgentTask = z.infer<typeof insertAgentTaskSchema>;
export type AgentCommunication = typeof agentCommunications.$inferSelect;
export type InsertAgentCommunication = z.infer<typeof insertAgentCommunicationSchema>;

// =====================================================
// Enterprise User Management Zod Schemas (COMMENTED OUT - TABLES NOT DEFINED)
// =====================================================
/*

// Organization schemas
// Commented out - organization tables not yet defined
// export const insertOrganizationSchema = createInsertSchema(organizations).pick({
//   name: true,
//   slug: true,
//   description: true,
//   logoUrl: true,
//   website: true,
//   industry: true,
//   companySize: true,
//   plan: true,
//   billingEmail: true,
//   settings: true,
//   metadata: true,
//   isActive: true,
// });

// export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
//   organizationId: true,
//   userId: true,
//   role: true,
//   permissions: true,
//   invitedBy: true,
//   invitedAt: true,
//   metadata: true,
//   isActive: true,
// });

// // Team schemas
// export const insertTeamSchema = createInsertSchema(teams).pick({
//   organizationId: true,
//   name: true,
//   description: true,
//   slug: true,
//   teamType: true,
//   leaderId: true,
//   settings: true,
//   metadata: true,
//   isActive: true,
// });

// export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
//   teamId: true,
//   userId: true,
//   role: true,
//   permissions: true,
//   addedBy: true,
//   metadata: true,
//   isActive: true,
// });

// Role and permission schemas
// export const insertRoleSchema = createInsertSchema(roles).pick({
//   name: true,
//   displayName: true,
//   description: true,
//   scope: true,
//   permissions: true,
//   isDefault: true,
//   isSystemRole: true,
//   metadata: true,
// });

export const insertPermissionSchema = createInsertSchema(permissions).pick({
  name: true,
  displayName: true,
  description: true,
  category: true,
  resource: true,
  actions: true,
  isSystemPermission: true,
  metadata: true,
});

export const insertUserRoleSchema = createInsertSchema(userRoles).pick({
  userId: true,
  roleId: true,
  scope: true,
  scopeId: true,
  grantedBy: true,
  expiresAt: true,
  metadata: true,
  isActive: true,
});

// Project collaboration schemas
export const insertProjectCollaboratorSchema = createInsertSchema(projectCollaborators).pick({
  projectId: true,
  userId: true,
  teamId: true,
  role: true,
  permissions: true,
  accessType: true,
  invitedBy: true,
  invitedAt: true,
  metadata: true,
  isActive: true,
});

// Audit log schema
export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  organizationId: true,
  userId: true,
  action: true,
  resource: true,
  resourceId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
  sessionId: true,
  severity: true,
  metadata: true,
});

// Type definitions for enterprise management
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type InsertOrganizationMember = z.infer<typeof insertOrganizationMemberSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;
export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = z.infer<typeof insertUserRoleSchema>;
export type ProjectCollaborator = typeof projectCollaborators.$inferSelect;
export type InsertProjectCollaborator = z.infer<typeof insertProjectCollaboratorSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// =====================================================
// Real-time Collaboration Zod Schemas
// =====================================================

export const insertCollaborationSessionSchema = createInsertSchema(collaborationSessions).pick({
  projectId: true,
  sessionId: true,
  isActive: true,
  maxParticipants: true,
  lockingEnabled: true,
  conflictResolution: true,
  metadata: true,
});

export const insertUserPresenceSchema = createInsertSchema(userPresence).pick({
  sessionId: true,
  userId: true,
  connectionId: true,
  status: true,
  currentFile: true,
  viewportStart: true,
  viewportEnd: true,
  userAgent: true,
  ipAddress: true,
  metadata: true,
});

export const insertCursorPositionSchema = createInsertSchema(cursorPositions).pick({
  presenceId: true,
  fileName: true,
  line: true,
  column: true,
  selectionStart: true,
  selectionEnd: true,
  cursorColor: true,
  isVisible: true,
  metadata: true,
});

export const insertEditOperationSchema = createInsertSchema(editOperations).pick({
  sessionId: true,
  userId: true,
  operationId: true,
  fileName: true,
  operationType: true,
  position: true,
  content: true,
  length: true,
  vectorClock: true,
  dependsOn: true,
  isApplied: true,
  conflictResolved: true,
  metadata: true,
});

export const insertFileLockSchema = createInsertSchema(fileLocks).pick({
  sessionId: true,
  fileName: true,
  lockedBy: true,
  lockType: true,
  autoRelease: true,
  expiresAt: true,
  metadata: true,
});

export const insertCollaborationMessageSchema = createInsertSchema(collaborationMessages).pick({
  sessionId: true,
  userId: true,
  messageType: true,
  content: true,
  fileName: true,
  lineNumber: true,
  replyTo: true,
  mentions: true,
  attachments: true,
  metadata: true,
});

// Real-time Collaboration Type Definitions
export type CollaborationSession = typeof collaborationSessions.$inferSelect;
export type InsertCollaborationSession = z.infer<typeof insertCollaborationSessionSchema>;
export type UserPresence = typeof userPresence.$inferSelect;
export type InsertUserPresence = z.infer<typeof insertUserPresenceSchema>;
export type CursorPosition = typeof cursorPositions.$inferSelect;
export type InsertCursorPosition = z.infer<typeof insertCursorPositionSchema>;
export type EditOperation = typeof editOperations.$inferSelect;
export type InsertEditOperation = z.infer<typeof insertEditOperationSchema>;
export type FileLock = typeof fileLocks.$inferSelect;
export type InsertFileLock = z.infer<typeof insertFileLockSchema>;
export type CollaborationMessage = typeof collaborationMessages.$inferSelect;
export type InsertCollaborationMessage = z.infer<typeof insertCollaborationMessageSchema>;

// =====================================================
// Subscription and Billing Zod Schemas
// =====================================================

// Subscription plan schemas
export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).pick({
  name: true,
  displayName: true,
  description: true,
  monthlyPrice: true,
  yearlyPrice: true,
  stripeMonthlyPriceId: true,
  stripeYearlyPriceId: true,
  features: true,
  limits: true,
  isActive: true,
  isPopular: true,
  trialDays: true,
  sortOrder: true,
  metadata: true,
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).pick({
  userId: true,
  planId: true,
  stripeSubscriptionId: true,
  status: true,
  billingCycle: true,
  currentPeriodStart: true,
  currentPeriodEnd: true,
  trialStart: true,
  trialEnd: true,
  canceledAt: true,
  cancelAtPeriodEnd: true,
  quantity: true,
  unitAmount: true,
  currency: true,
  metadata: true,
});

export const insertUsageTrackingSchema = createInsertSchema(usageTracking).pick({
  userId: true,
  organizationId: true,
  subscriptionId: true,
  metricType: true,
  metricValue: true,
  period: true,
  periodStart: true,
  periodEnd: true,
  resetAt: true,
  limit: true,
  lastIncrement: true,
  metadata: true,
});

export const insertBillingHistorySchema = createInsertSchema(billingHistory).pick({
  userId: true,
  subscriptionId: true,
  stripeInvoiceId: true,
  stripePaymentIntentId: true,
  invoiceNumber: true,
  amount: true,
  currency: true,
  status: true,
  paymentStatus: true,
  description: true,
  invoiceUrl: true,
  pdfUrl: true,
  dueDate: true,
  paidAt: true,
  attemptedAt: true,
  nextPaymentAttempt: true,
  failureReason: true,
  lineItems: true,
  taxAmount: true,
  discountAmount: true,
  metadata: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).pick({
  userId: true,
  stripePaymentMethodId: true,
  type: true,
  brand: true,
  last4: true,
  expiryMonth: true,
  expiryYear: true,
  fingerprint: true,
  isDefault: true,
  isVerified: true,
  billingDetails: true,
  metadata: true,
});

export const insertPlanFeatureSchema = createInsertSchema(planFeatures).pick({
  planId: true,
  featureName: true,
  featureType: true,
  isEnabled: true,
  limitValue: true,
  displayName: true,
  description: true,
  sortOrder: true,
  metadata: true,
});

export const insertDiscountCodeSchema = createInsertSchema(discountCodes).pick({
  code: true,
  name: true,
  description: true,
  discountType: true,
  discountValue: true,
  currency: true,
  minAmount: true,
  maxDiscountAmount: true,
  usageLimit: true,
  userLimit: true,
  validFrom: true,
  validUntil: true,
  applicablePlans: true,
  isActive: true,
  metadata: true,
});

export const insertDiscountUsageSchema = createInsertSchema(discountUsage).pick({
  discountCodeId: true,
  userId: true,
  subscriptionId: true,
  invoiceId: true,
  discountAmount: true,
  originalAmount: true,
  finalAmount: true,
  metadata: true,
});

// =====================================================
// Subscription and Billing Type Definitions
// =====================================================

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UsageTracking = typeof usageTracking.$inferSelect;
export type InsertUsageTracking = z.infer<typeof insertUsageTrackingSchema>;
export type BillingHistory = typeof billingHistory.$inferSelect;
export type InsertBillingHistory = z.infer<typeof insertBillingHistorySchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;
export type PlanFeature = typeof planFeatures.$inferSelect;
export type InsertPlanFeature = z.infer<typeof insertPlanFeatureSchema>;
export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = z.infer<typeof insertDiscountCodeSchema>;
export type DiscountUsage = typeof discountUsage.$inferSelect;
export type InsertDiscountUsage = z.infer<typeof insertDiscountUsageSchema>;

*/