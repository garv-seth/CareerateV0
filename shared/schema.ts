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

// =====================================================
// Enterprise User Management System
// =====================================================

// Organizations for enterprise team management
export const organizations = pgTable("organizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug").unique().notNull(), // URL-friendly identifier
  description: text("description"),
  logoUrl: varchar("logo_url"),
  website: varchar("website"),
  industry: text("industry"),
  companySize: text("company_size"), // "startup", "small", "medium", "large", "enterprise"
  plan: text("plan").notNull().default("free"), // "free", "team", "business", "enterprise"
  billingEmail: varchar("billing_email"),
  settings: jsonb("settings").default({}), // org-wide settings
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Organization members with roles
export const organizationMembers = pgTable("organization_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // "owner", "admin", "member", "viewer"
  permissions: jsonb("permissions").default([]), // specific permissions
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_org_members_org_user").on(table.organizationId, table.userId),
  index("idx_org_members_role").on(table.role),
]);

// Teams within organizations
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  slug: varchar("slug").notNull(), // URL-friendly identifier within org
  teamType: text("team_type").default("development"), // "development", "devops", "security", "design"
  leaderId: varchar("leader_id").references(() => users.id),
  settings: jsonb("settings").default({}),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_teams_org_slug").on(table.organizationId, table.slug),
]);

// Team members with specific roles
export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: varchar("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // "lead", "senior", "member", "intern"
  permissions: jsonb("permissions").default([]), // team-specific permissions
  addedBy: varchar("added_by").references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastContribution: timestamp("last_contribution"),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_team_members_team_user").on(table.teamId, table.userId),
]);

// Role-based access control system
export const roles = pgTable("roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  scope: text("scope").notNull(), // "system", "organization", "team", "project"
  permissions: jsonb("permissions").notNull().default([]), // array of permission strings
  isDefault: boolean("is_default").default(false),
  isSystemRole: boolean("is_system_role").default(false), // system-defined roles
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Permission definitions
export const permissions = pgTable("permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // "projects", "deployments", "agents", "billing", "users"
  resource: text("resource"), // specific resource type
  actions: jsonb("actions").notNull().default([]), // ["read", "write", "delete", "deploy"]
  isSystemPermission: boolean("is_system_permission").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// User role assignments
export const userRoles = pgTable("user_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
  scope: text("scope").notNull(), // "system", "organization", "team", "project"
  scopeId: varchar("scope_id"), // ID of organization, team, or project
  grantedBy: varchar("granted_by").references(() => users.id),
  grantedAt: timestamp("granted_at").defaultNow(),
  expiresAt: timestamp("expires_at"), // for temporary roles
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_user_roles_user_scope").on(table.userId, table.scope, table.scopeId),
  index("idx_user_roles_role").on(table.roleId),
]);

// Project collaborators and access control
export const projectCollaborators = pgTable("project_collaborators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // "owner", "editor", "viewer", "deployer"
  permissions: jsonb("permissions").default([]), // specific permissions
  accessType: text("access_type").notNull(), // "direct", "team", "organization"
  invitedBy: varchar("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastAccess: timestamp("last_access"),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_project_collaborators_project").on(table.projectId),
  index("idx_project_collaborators_user").on(table.userId),
  index("idx_project_collaborators_team").on(table.teamId),
]);

// Audit log for enterprise compliance
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // "create", "read", "update", "delete", "deploy", "invite"
  resource: text("resource").notNull(), // "project", "user", "team", "deployment", "agent"
  resourceId: varchar("resource_id"),
  details: jsonb("details").default({}),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  severity: text("severity").default("info"), // "info", "warning", "error", "critical"
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_audit_logs_org_time").on(table.organizationId, table.timestamp),
  index("idx_audit_logs_user_action").on(table.userId, table.action),
  index("idx_audit_logs_resource").on(table.resource, table.resourceId),
]);

export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  organizationId: varchar("organization_id").references(() => organizations.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").references(() => teams.id, { onDelete: "set null" }),
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

// =====================================================
// Real-time Collaboration System Tables
// =====================================================

// Active collaboration sessions for real-time editing
export const collaborationSessions = pgTable("collaboration_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull().unique(), // WebSocket session identifier
  isActive: boolean("is_active").default(true),
  maxParticipants: integer("max_participants").default(10),
  lockingEnabled: boolean("locking_enabled").default(false), // file locking for exclusive editing
  conflictResolution: text("conflict_resolution").default("operational_transform"), // "operational_transform", "last_write_wins"
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_collaboration_sessions_project").on(table.projectId),
  index("idx_collaboration_sessions_active").on(table.isActive),
]);

// User presence tracking for active collaborators
export const userPresence = pgTable("user_presence", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  connectionId: varchar("connection_id").notNull(), // WebSocket connection identifier
  status: text("status").notNull().default("online"), // "online", "away", "editing", "idle"
  currentFile: text("current_file"), // file currently being edited
  viewportStart: integer("viewport_start").default(0), // visible line start
  viewportEnd: integer("viewport_end").default(0), // visible line end
  lastActivity: timestamp("last_activity").defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address"),
  metadata: jsonb("metadata").default({}),
  joinedAt: timestamp("joined_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_user_presence_session_user").on(table.sessionId, table.userId),
  index("idx_user_presence_connection").on(table.connectionId),
  index("idx_user_presence_activity").on(table.lastActivity),
]);

// Real-time cursor positions and selections
export const cursorPositions = pgTable("cursor_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  presenceId: varchar("presence_id").notNull().references(() => userPresence.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  line: integer("line").notNull(),
  column: integer("column").notNull(),
  selectionStart: jsonb("selection_start"), // { line, column } for selection start
  selectionEnd: jsonb("selection_end"), // { line, column } for selection end
  cursorColor: varchar("cursor_color").default("#007acc"), // user's cursor color
  isVisible: boolean("is_visible").default(true),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_cursor_positions_presence_file").on(table.presenceId, table.fileName),
  index("idx_cursor_positions_timestamp").on(table.timestamp),
]);

// Edit operations for operational transformation
export const editOperations = pgTable("edit_operations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  operationId: varchar("operation_id").notNull(), // unique operation identifier
  fileName: text("file_name").notNull(),
  operationType: text("operation_type").notNull(), // "insert", "delete", "replace"
  position: jsonb("position").notNull(), // { line, column } where operation starts
  content: text("content"), // content being inserted/replaced
  length: integer("length").default(0), // length of content being deleted/replaced
  vectorClock: jsonb("vector_clock").default({}), // for ordering operations
  dependsOn: jsonb("depends_on").default([]), // operations this depends on
  isApplied: boolean("is_applied").default(false),
  conflictResolved: boolean("conflict_resolved").default(false),
  metadata: jsonb("metadata").default({}),
  timestamp: timestamp("timestamp").defaultNow(),
}, (table) => [
  index("idx_edit_operations_session_file").on(table.sessionId, table.fileName),
  index("idx_edit_operations_user_time").on(table.userId, table.timestamp),
  index("idx_edit_operations_operation_id").on(table.operationId),
]);

// File locks for exclusive editing
export const fileLocks = pgTable("file_locks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  lockedBy: varchar("locked_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  lockType: text("lock_type").default("exclusive"), // "exclusive", "shared"
  autoRelease: boolean("auto_release").default(true), // auto-release on disconnect
  expiresAt: timestamp("expires_at"), // optional lock expiration
  metadata: jsonb("metadata").default({}),
  lockedAt: timestamp("locked_at").defaultNow(),
}, (table) => [
  index("idx_file_locks_session_file").on(table.sessionId, table.fileName),
  index("idx_file_locks_user").on(table.lockedBy),
]);

// Chat messages for project discussions
export const collaborationMessages = pgTable("collaboration_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => collaborationSessions.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  messageType: text("message_type").default("chat"), // "chat", "system", "code_comment", "file_share"
  content: text("content").notNull(),
  fileName: text("file_name"), // for code comments
  lineNumber: integer("line_number"), // for inline code comments
  replyTo: varchar("reply_to").references(() => collaborationMessages.id), // for threaded conversations
  mentions: jsonb("mentions").default([]), // user IDs mentioned in message
  attachments: jsonb("attachments").default([]), // file attachments
  isEdited: boolean("is_edited").default(false),
  editedAt: timestamp("edited_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_collaboration_messages_session_time").on(table.sessionId, table.createdAt),
  index("idx_collaboration_messages_user").on(table.userId),
  index("idx_collaboration_messages_file").on(table.fileName, table.lineNumber),
]);

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

// Deployment Environments for Real Infrastructure Management
export const deploymentEnvironments = pgTable("deployment_environments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "development", "staging", "production", "preview"
  type: text("type").notNull().default("staging"), // "development", "staging", "production", "preview"
  status: text("status").notNull().default("inactive"), // "active", "inactive", "deploying", "error"
  url: text("url"), // environment URL
  branch: text("branch").default("main"), // Git branch for this environment
  autoDeployBranch: text("auto_deploy_branch"), // branch that triggers auto-deployment
  configuration: jsonb("configuration").default({}), // env vars, build settings
  resourceLimits: jsonb("resource_limits").default({}), // CPU, memory, storage limits
  secrets: jsonb("secrets").default({}), // encrypted environment secrets
  lastDeployment: varchar("last_deployment").references(() => deployments.id),
  isProtected: boolean("is_protected").default(false), // requires approval for deployments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Health Checks for Real Infrastructure Monitoring
export const healthChecks = pgTable("health_checks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deploymentId: varchar("deployment_id").notNull().references(() => deployments.id, { onDelete: "cascade" }),
  checkType: text("check_type").notNull(), // "http", "tcp", "command", "database"
  endpoint: text("endpoint"), // URL or command to check
  expectedResponse: text("expected_response"),
  timeout: integer("timeout").default(30), // timeout in seconds
  interval: integer("interval").default(60), // check interval in seconds
  retries: integer("retries").default(3), // number of retries before marking as failed
  status: text("status").default("unknown"), // "healthy", "unhealthy", "unknown"
  lastCheck: timestamp("last_check"),
  lastSuccessful: timestamp("last_successful"),
  failureCount: integer("failure_count").default(0),
  responseTime: integer("response_time"), // last response time in ms
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Load Balancers for Real Traffic Management
export const loadBalancers = pgTable("load_balancers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("application"), // "application", "network", "classic"
  status: text("status").notNull().default("active"), // "active", "inactive", "provisioning", "error"
  algorithm: text("algorithm").default("round-robin"), // "round-robin", "least-connections", "ip-hash"
  healthCheckPath: text("health_check_path").default("/health"),
  healthCheckInterval: integer("health_check_interval").default(30),
  configuration: jsonb("configuration").default({}),
  targets: jsonb("targets").default([]), // list of backend targets
  metrics: jsonb("metrics").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Auto-scaling Configuration for Real Resource Management
export const autoScalingPolicies = pgTable("auto_scaling_policies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  environmentId: varchar("environment_id").references(() => deploymentEnvironments.id),
  name: text("name").notNull(),
  targetType: text("target_type").notNull(), // "deployment", "container", "instance"
  targetId: text("target_id").notNull(),
  scaleDirection: text("scale_direction").notNull(), // "up", "down", "both"
  minInstances: integer("min_instances").default(1),
  maxInstances: integer("max_instances").default(10),
  metrics: jsonb("metrics").notNull(), // scaling metrics and thresholds
  cooldownPeriod: integer("cooldown_period").default(300), // seconds
  isEnabled: boolean("is_enabled").default(true),
  lastScalingAction: timestamp("last_scaling_action"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const deployments = pgTable("deployments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  agentId: varchar("agent_id").references(() => aiAgents.id),
  environmentId: varchar("environment_id").references(() => deploymentEnvironments.id),
  version: text("version").notNull(),
  strategy: text("strategy").notNull().default("blue-green"), // "blue-green", "rolling", "canary"
  status: text("status").notNull().default("pending"), // "pending", "deploying", "deployed", "failed", "rolled-back"
  environment: text("environment").notNull().default("production"),
  deploymentUrl: text("deployment_url"),
  rollbackVersion: text("rollback_version"),
  containerId: text("container_id"), // Docker container ID for real deployment
  processId: text("process_id"), // Process ID for running application
  port: integer("port").default(5000), // Port where app is running
  healthCheckUrl: text("health_check_url"),
  healthStatus: text("health_status").default("unknown"), // "healthy", "unhealthy", "unknown"
  lastHealthCheck: timestamp("last_health_check"),
  deploymentLogs: text("deployment_logs"),
  errorLogs: text("error_logs"),
  buildLogs: text("build_logs"),
  metadata: jsonb("metadata").default({}),
  deployedAt: timestamp("deployed_at"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
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
  environmentId: varchar("environment_id").references(() => deploymentEnvironments.id),
  resourceType: text("resource_type").notNull(), // "server", "container", "database", "load-balancer", "auto-scaler"
  resourceId: text("resource_id").notNull(), // external resource identifier
  name: text("name").notNull(),
  status: text("status").notNull().default("active"), // "active", "inactive", "maintenance", "error", "scaling"
  provider: text("provider").notNull(), // "aws", "gcp", "azure", "local", "replit"
  region: text("region"),
  configuration: jsonb("configuration").default({}),
  metrics: jsonb("metrics").default({}),
  specs: jsonb("specs").default({}), // CPU, memory, disk, network specs
  cost: jsonb("cost").default({}), // cost tracking per resource
  autoScaling: jsonb("auto_scaling").default({}), // auto-scaling configuration
  lastHealthCheck: timestamp("last_health_check").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================================================
// Advanced Monitoring & Analytics Platform
// =====================================================

// SLA Configuration and Tracking
export const slaConfigurations = pgTable("sla_configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  slaType: text("sla_type").notNull(), // "uptime", "response_time", "throughput", "error_rate", "availability"
  targetValue: decimal("target_value", { precision: 10, scale: 4 }).notNull(),
  unit: text("unit").notNull(), // "percent", "ms", "req/sec", etc.
  measurementWindow: integer("measurement_window").default(86400), // seconds
  breachThreshold: decimal("breach_threshold", { precision: 10, scale: 4 }),
  violationActions: jsonb("violation_actions").default([]), // automated actions on SLA breach
  escalationPolicy: jsonb("escalation_policy").default({}),
  notificationChannels: jsonb("notification_channels").default([]),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// SLA Violations and Tracking
export const slaViolations = pgTable("sla_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slaConfigurationId: varchar("sla_configuration_id").notNull().references(() => slaConfigurations.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  violationType: text("violation_type").notNull(), // "threshold_breach", "downtime", "performance_degradation"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  actualValue: decimal("actual_value", { precision: 10, scale: 4 }),
  expectedValue: decimal("expected_value", { precision: 10, scale: 4 }),
  duration: integer("duration"), // violation duration in seconds
  impactDescription: text("impact_description"),
  rootCause: text("root_cause"),
  resolution: text("resolution"),
  status: text("status").notNull().default("open"), // "open", "investigating", "resolved", "closed"
  resolvedBy: varchar("resolved_by").references(() => users.id),
  automaticActions: jsonb("automatic_actions").default([]),
  metadata: jsonb("metadata").default({}),
  startedAt: timestamp("started_at").notNull(),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced Time-Series Metrics Storage
export const timeSeriesMetrics = pgTable("time_series_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  resourceId: varchar("resource_id").references(() => infrastructureResources.id),
  metricName: text("metric_name").notNull(),
  metricType: text("metric_type").notNull(), // "counter", "gauge", "histogram", "rate"
  value: decimal("value", { precision: 15, scale: 6 }).notNull(),
  unit: text("unit").notNull(),
  dimensions: jsonb("dimensions").default({}), // key-value pairs for grouping
  tags: jsonb("tags").default({}),
  aggregation: text("aggregation").default("avg"), // "avg", "sum", "min", "max", "count"
  timeWindow: integer("time_window").default(60), // seconds
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_time_series_metrics_project_name_time").on(table.projectId, table.metricName, table.timestamp),
  index("idx_time_series_metrics_resource_name_time").on(table.resourceId, table.metricName, table.timestamp),
]);

// Anomaly Detection Models and Results
export const anomalyDetectionModels = pgTable("anomaly_detection_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  modelName: text("model_name").notNull(),
  modelType: text("model_type").notNull(), // "isolation_forest", "lstm", "arima", "statistical"
  targetMetrics: jsonb("target_metrics").notNull(), // metrics this model monitors
  trainingData: jsonb("training_data").default({}),
  hyperparameters: jsonb("hyperparameters").default({}),
  modelArtifacts: jsonb("model_artifacts").default({}), // serialized model
  sensitivity: decimal("sensitivity", { precision: 3, scale: 2 }).default("0.8"),
  accuracy: decimal("accuracy", { precision: 3, scale: 2 }).default("0"),
  lastTrained: timestamp("last_trained"),
  retrainingSchedule: text("retraining_schedule").default("daily"), // "hourly", "daily", "weekly"
  status: text("status").notNull().default("active"), // "active", "training", "inactive", "error"
  version: text("version").default("1.0"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Anomaly Detection Results
export const anomalyDetections = pgTable("anomaly_detections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").notNull().references(() => anomalyDetectionModels.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  metricName: text("metric_name").notNull(),
  anomalyType: text("anomaly_type").notNull(), // "spike", "drop", "trend_change", "seasonality_break"
  severity: text("severity").notNull(), // "low", "medium", "high", "critical"
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }).notNull(),
  actualValue: decimal("actual_value", { precision: 15, scale: 6 }),
  expectedValue: decimal("expected_value", { precision: 15, scale: 6 }),
  deviation: decimal("deviation", { precision: 15, scale: 6 }),
  context: jsonb("context").default({}), // surrounding metrics and conditions
  relatedIncidents: jsonb("related_incidents").default([]),
  automaticActions: jsonb("automatic_actions").default([]),
  status: text("status").notNull().default("new"), // "new", "investigating", "resolved", "false_positive"
  acknowledgedBy: varchar("acknowledged_by").references(() => users.id),
  resolution: text("resolution"),
  metadata: jsonb("metadata").default({}),
  detectedAt: timestamp("detected_at").notNull(),
  acknowledgedAt: timestamp("acknowledged_at"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Alert Rules and Configuration
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  ruleType: text("rule_type").notNull(), // "threshold", "anomaly", "composite", "sla_breach"
  metricQuery: text("metric_query").notNull(), // query or filter for metrics
  conditions: jsonb("conditions").notNull(), // threshold values, operators
  severity: text("severity").notNull().default("medium"), // "low", "medium", "high", "critical"
  evaluationInterval: integer("evaluation_interval").default(60), // seconds
  silenceDuration: integer("silence_duration").default(300), // seconds to silence after trigger
  escalationRules: jsonb("escalation_rules").default([]),
  notificationChannels: jsonb("notification_channels").default([]),
  automaticActions: jsonb("automatic_actions").default([]),
  suppressionConditions: jsonb("suppression_conditions").default({}),
  labels: jsonb("labels").default({}),
  isEnabled: boolean("is_enabled").default(true),
  lastTriggered: timestamp("last_triggered"),
  triggerCount: integer("trigger_count").default(0),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Alert Notifications and History
export const alertNotifications = pgTable("alert_notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertRuleId: varchar("alert_rule_id").notNull().references(() => alertRules.id, { onDelete: "cascade" }),
  incidentId: varchar("incident_id").references(() => incidents.id),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  notificationType: text("notification_type").notNull(), // "email", "sms", "slack", "webhook", "pagerduty"
  channel: text("channel").notNull(), // recipient or endpoint
  subject: text("subject"),
  message: text("message"),
  priority: text("priority").notNull().default("normal"), // "low", "normal", "high", "urgent"
  status: text("status").notNull().default("pending"), // "pending", "sent", "delivered", "failed"
  deliveredAt: timestamp("delivered_at"),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Performance Baselines and Trend Analysis
export const performanceBaselines = pgTable("performance_baselines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  metricName: text("metric_name").notNull(),
  resourceType: text("resource_type"), // "deployment", "database", "api", "frontend"
  resourceId: varchar("resource_id"),
  baselineType: text("baseline_type").notNull(), // "historical", "target", "industry_standard"
  timeFrame: text("time_frame").notNull(), // "1h", "1d", "1w", "1m", "3m"
  baselineValue: decimal("baseline_value", { precision: 15, scale: 6 }).notNull(),
  standardDeviation: decimal("standard_deviation", { precision: 15, scale: 6 }),
  percentile95: decimal("percentile_95", { precision: 15, scale: 6 }),
  percentile99: decimal("percentile_99", { precision: 15, scale: 6 }),
  trendDirection: text("trend_direction"), // "improving", "degrading", "stable"
  trendStrength: decimal("trend_strength", { precision: 3, scale: 2 }), // -1 to 1
  seasonalityPattern: jsonb("seasonality_pattern").default({}),
  confidenceLevel: decimal("confidence_level", { precision: 3, scale: 2 }).default("0.95"),
  sampleSize: integer("sample_size"),
  lastCalculated: timestamp("last_calculated").notNull(),
  validUntil: timestamp("valid_until"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// APM (Application Performance Monitoring) Data
export const apmTransactions = pgTable("apm_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  traceId: text("trace_id").notNull(),
  spanId: text("span_id").notNull(),
  parentSpanId: text("parent_span_id"),
  transactionName: text("transaction_name").notNull(),
  serviceName: text("service_name").notNull(),
  operationType: text("operation_type"), // "http", "db", "cache", "external"
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  duration: integer("duration").notNull(), // microseconds
  status: text("status").notNull(), // "success", "error", "timeout"
  statusCode: integer("status_code"),
  errorMessage: text("error_message"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  userId: varchar("user_id"),
  sessionId: text("session_id"),
  tags: jsonb("tags").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_apm_transactions_project_service_time").on(table.projectId, table.serviceName, table.startTime),
  index("idx_apm_transactions_trace_id").on(table.traceId),
]);

// Database Performance Monitoring
export const databasePerformanceMetrics = pgTable("database_performance_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  databaseType: text("database_type").notNull(), // "postgresql", "mysql", "mongodb", "redis"
  instanceId: text("instance_id"),
  queryHash: text("query_hash"), // hash of the normalized query
  query: text("query"),
  executionTime: decimal("execution_time", { precision: 12, scale: 6 }), // milliseconds
  rowsAffected: integer("rows_affected"),
  rowsExamined: integer("rows_examined"),
  indexesUsed: jsonb("indexes_used").default([]),
  executionPlan: jsonb("execution_plan").default({}),
  lockTime: decimal("lock_time", { precision: 12, scale: 6 }),
  ioCost: decimal("io_cost", { precision: 12, scale: 6 }),
  cpuCost: decimal("cpu_cost", { precision: 12, scale: 6 }),
  memoryCost: decimal("memory_cost", { precision: 12, scale: 6 }),
  optimizationSuggestions: jsonb("optimization_suggestions").default([]),
  isSlowQuery: boolean("is_slow_query").default(false),
  frequency: integer("frequency").default(1), // how often this query runs
  timestamp: timestamp("timestamp").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_db_perf_metrics_project_time").on(table.projectId, table.timestamp),
  index("idx_db_perf_metrics_query_hash").on(table.queryHash),
]);

// Log Aggregation and Analysis
export const logEntries = pgTable("log_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  source: text("source").notNull(), // "application", "database", "infrastructure", "security"
  logLevel: text("log_level").notNull(), // "DEBUG", "INFO", "WARN", "ERROR", "FATAL"
  serviceName: text("service_name"),
  hostname: text("hostname"),
  message: text("message").notNull(),
  structuredData: jsonb("structured_data").default({}), // parsed JSON data from log
  traceId: text("trace_id"), // correlation with APM traces
  userId: varchar("user_id"),
  sessionId: text("session_id"),
  requestId: text("request_id"),
  errorCode: text("error_code"),
  stackTrace: text("stack_trace"),
  fingerprint: text("fingerprint"), // unique identifier for similar logs
  tags: jsonb("tags").default({}),
  isProcessed: boolean("is_processed").default(false),
  isIndexed: boolean("is_indexed").default(false),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_log_entries_project_level_time").on(table.projectId, table.logLevel, table.timestamp),
  index("idx_log_entries_trace_id").on(table.traceId),
  index("idx_log_entries_fingerprint").on(table.fingerprint),
]);

// Predictive Analytics and Forecasting
export const predictiveModels = pgTable("predictive_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  modelName: text("model_name").notNull(),
  modelType: text("model_type").notNull(), // "traffic_prediction", "capacity_planning", "cost_forecasting", "failure_prediction"
  targetMetric: text("target_metric").notNull(),
  inputFeatures: jsonb("input_features").notNull(),
  algorithm: text("algorithm").notNull(), // "lstm", "arima", "prophet", "linear_regression", "random_forest"
  hyperparameters: jsonb("hyperparameters").default({}),
  trainingWindow: integer("training_window").default(30), // days
  predictionHorizon: integer("prediction_horizon").default(7), // days
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  meanAbsoluteError: decimal("mean_absolute_error", { precision: 15, scale: 6 }),
  modelArtifacts: jsonb("model_artifacts").default({}),
  featureImportance: jsonb("feature_importance").default({}),
  lastTrained: timestamp("last_trained"),
  nextRetraining: timestamp("next_retraining"),
  status: text("status").notNull().default("active"), // "active", "training", "inactive", "error"
  version: text("version").default("1.0"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prediction Results and Recommendations
export const predictions = pgTable("predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelId: varchar("model_id").notNull().references(() => predictiveModels.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  predictionType: text("prediction_type").notNull(), // "traffic", "capacity", "cost", "failure"
  targetTimestamp: timestamp("target_timestamp").notNull(),
  predictedValue: decimal("predicted_value", { precision: 15, scale: 6 }).notNull(),
  confidenceInterval: jsonb("confidence_interval").default({}), // lower/upper bounds
  confidence: decimal("confidence", { precision: 3, scale: 2 }),
  actualValue: decimal("actual_value", { precision: 15, scale: 6 }), // filled after target timestamp
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }), // calculated after actuals known
  recommendations: jsonb("recommendations").default([]), // suggested actions
  impactAssessment: jsonb("impact_assessment").default({}),
  automationTriggered: boolean("automation_triggered").default(false),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("idx_predictions_project_type_target").on(table.projectId, table.predictionType, table.targetTimestamp),
]);

// Real-User Monitoring (RUM) Data
export const rumMetrics = pgTable("rum_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  pageUrl: text("page_url").notNull(),
  userAgent: text("user_agent"),
  deviceType: text("device_type"), // "desktop", "mobile", "tablet"
  browserName: text("browser_name"),
  browserVersion: text("browser_version"),
  connectionType: text("connection_type"), // "4g", "3g", "wifi", "ethernet"
  country: text("country"),
  region: text("region"),
  firstContentfulPaint: integer("first_contentful_paint"), // milliseconds
  largestContentfulPaint: integer("largest_contentful_paint"),
  firstInputDelay: integer("first_input_delay"),
  cumulativeLayoutShift: decimal("cumulative_layout_shift", { precision: 5, scale: 4 }),
  timeToInteractive: integer("time_to_interactive"),
  domContentLoaded: integer("dom_content_loaded"),
  pageLoadTime: integer("page_load_time"),
  errorCount: integer("error_count").default(0),
  jsErrorMessages: jsonb("js_error_messages").default([]),
  performanceEntries: jsonb("performance_entries").default({}),
  customMetrics: jsonb("custom_metrics").default({}),
  userId: varchar("user_id"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_rum_metrics_project_page_time").on(table.projectId, table.pageUrl, table.timestamp),
  index("idx_rum_metrics_session_id").on(table.sessionId),
]);

// Uptime Monitoring and Availability Tracking
export const uptimeMonitors = pgTable("uptime_monitors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  monitorType: text("monitor_type").notNull(), // "http", "https", "tcp", "udp", "ping", "dns"
  targetUrl: text("target_url").notNull(),
  checkInterval: integer("check_interval").default(60), // seconds
  timeout: integer("timeout").default(10), // seconds
  expectedStatusCode: integer("expected_status_code").default(200),
  expectedContent: text("expected_content"),
  followRedirects: boolean("follow_redirects").default(true),
  requestHeaders: jsonb("request_headers").default({}),
  monitoringRegions: jsonb("monitoring_regions").default(["us-east-1"]),
  alertThresholds: jsonb("alert_thresholds").default({}),
  maintenanceWindows: jsonb("maintenance_windows").default([]),
  isEnabled: boolean("is_enabled").default(true),
  lastCheck: timestamp("last_check"),
  currentStatus: text("current_status").default("unknown"), // "up", "down", "degraded", "unknown"
  uptimePercentage: decimal("uptime_percentage", { precision: 5, scale: 4 }),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Uptime Check Results
export const uptimeCheckResults = pgTable("uptime_check_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  monitorId: varchar("monitor_id").notNull().references(() => uptimeMonitors.id, { onDelete: "cascade" }),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  checkRegion: text("check_region").notNull(),
  status: text("status").notNull(), // "success", "failure", "timeout", "error"
  responseTime: integer("response_time"), // milliseconds
  statusCode: integer("status_code"),
  responseSize: integer("response_size"), // bytes
  errorMessage: text("error_message"),
  sslCertExpiry: timestamp("ssl_cert_expiry"),
  dnsLookupTime: integer("dns_lookup_time"),
  connectTime: integer("connect_time"),
  tlsHandshakeTime: integer("tls_handshake_time"),
  transferTime: integer("transfer_time"),
  redirectCount: integer("redirect_count").default(0),
  incidentCreated: boolean("incident_created").default(false),
  incidentId: varchar("incident_id").references(() => incidents.id),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_uptime_check_results_monitor_time").on(table.monitorId, table.timestamp),
  index("idx_uptime_check_results_project_status").on(table.projectId, table.status),
]);

// Custom Dashboard Configurations
export const customDashboards = pgTable("custom_dashboards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  dashboardType: text("dashboard_type").default("custom"), // "custom", "template", "shared"
  layout: jsonb("layout").notNull(), // widget positions and configurations
  widgets: jsonb("widgets").notNull(), // widget definitions and queries
  filters: jsonb("filters").default({}), // global dashboard filters
  refreshInterval: integer("refresh_interval").default(60), // seconds
  timeRange: jsonb("time_range").default({}), // default time range
  isPublic: boolean("is_public").default(false),
  sharedWith: jsonb("shared_with").default([]), // user IDs with access
  tags: jsonb("tags").default([]),
  version: text("version").default("1.0"),
  lastViewed: timestamp("last_viewed"),
  viewCount: integer("view_count").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// =====================================================
// Multi-Cloud Provider Integration Tables
// =====================================================

// Cloud Providers Master Table
export const cloudProviders = pgTable("cloud_providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // "aws", "azure", "gcp", "digitalocean", "linode"
  displayName: text("display_name").notNull(), // "Amazon Web Services", "Microsoft Azure", etc.
  type: text("type").notNull().default("public"), // "public", "private", "hybrid"
  status: text("status").notNull().default("active"), // "active", "inactive", "maintenance"
  apiEndpoint: text("api_endpoint"),
  documentationUrl: text("documentation_url"),
  pricing: jsonb("pricing").default({}), // pricing models and calculators
  features: jsonb("features").default({}), // supported services and capabilities
  regions: jsonb("regions").default([]), // list of available regions
  compliance: jsonb("compliance").default([]), // SOC2, GDPR, HIPAA, etc.
  supportTiers: jsonb("support_tiers").default([]),
  metadata: jsonb("metadata").default({}),
  isEnabled: boolean("is_enabled").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Secure Cloud Credentials Storage (encrypted)
export const cloudCredentials = pgTable("cloud_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => cloudProviders.id),
  name: text("name").notNull(), // user-friendly name
  credentialType: text("credential_type").notNull(), // "api-key", "service-account", "access-token", "certificate"
  encryptedCredentials: text("encrypted_credentials").notNull(), // encrypted JSON blob
  region: text("region"), // default region for this credential
  scope: jsonb("scope").default([]), // permissions/scopes
  isDefault: boolean("is_default").default(false),
  lastUsed: timestamp("last_used"),
  expiresAt: timestamp("expires_at"),
  rotationPolicy: jsonb("rotation_policy").default({}),
  metadata: jsonb("metadata").default({}),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Detailed Cloud Regions and Availability Zones
export const cloudRegions = pgTable("cloud_regions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => cloudProviders.id),
  regionCode: text("region_code").notNull(), // "us-east-1", "eastus", "us-central1"
  regionName: text("region_name").notNull(), // "US East (N. Virginia)"
  country: text("country"),
  city: text("city"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  availabilityZones: jsonb("availability_zones").default([]),
  services: jsonb("services").default([]), // available services in this region
  compliance: jsonb("compliance").default([]),
  costs: jsonb("costs").default({}), // regional cost multipliers
  latencyBenchmarks: jsonb("latency_benchmarks").default({}),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Provider Service Capabilities Mapping
export const providerCapabilities = pgTable("provider_capabilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => cloudProviders.id),
  serviceType: text("service_type").notNull(), // "compute", "storage", "database", "networking", "ml", "analytics"
  serviceName: text("service_name").notNull(), // "EC2", "App Service", "Compute Engine"
  capability: text("capability").notNull(), // "auto-scaling", "load-balancing", "backup", "monitoring"
  isSupported: boolean("is_supported").default(true),
  limitations: jsonb("limitations").default({}),
  configuration: jsonb("configuration").default({}),
  pricing: jsonb("pricing").default({}),
  performance: jsonb("performance").default({}), // benchmarks and metrics
  maturityLevel: text("maturity_level").default("stable"), // "alpha", "beta", "stable", "deprecated"
  lastVerified: timestamp("last_verified").defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Real-time Cost Analytics Across Providers
export const costAnalytics = pgTable("cost_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => cloudProviders.id),
  resourceId: varchar("resource_id").references(() => infrastructureResources.id),
  period: text("period").notNull(), // "hourly", "daily", "monthly"
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  actualCost: decimal("actual_cost", { precision: 12, scale: 4 }).notNull(),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 4 }),
  currency: text("currency").default("USD"),
  costCategory: text("cost_category"), // "compute", "storage", "network", "database", "other"
  usageMetrics: jsonb("usage_metrics").default({}), // CPU hours, GB-hours, requests, etc.
  optimizationOpportunities: jsonb("optimization_opportunities").default([]),
  tags: jsonb("tags").default({}),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Migration Projects and Workload Analysis
export const migrationProjects = pgTable("migration_projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  sourceProvider: varchar("source_provider").references(() => cloudProviders.id),
  targetProvider: varchar("target_provider").notNull().references(() => cloudProviders.id),
  migrationStrategy: text("migration_strategy").notNull(), // "lift-and-shift", "re-platform", "re-architect", "hybrid"
  status: text("status").notNull().default("planning"), // "planning", "assessment", "executing", "testing", "completed", "failed"
  complexity: text("complexity").default("medium"), // "low", "medium", "high", "critical"
  estimatedDuration: integer("estimated_duration"), // days
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 4 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 4 }),
  riskAssessment: jsonb("risk_assessment").default({}),
  dependencies: jsonb("dependencies").default([]),
  milestones: jsonb("milestones").default([]),
  workloadAnalysis: jsonb("workload_analysis").default({}),
  performanceBaseline: jsonb("performance_baseline").default({}),
  rollbackPlan: jsonb("rollback_plan").default({}),
  progressPercentage: integer("progress_percentage").default(0),
  assignedTo: varchar("assigned_to").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI-Powered Provider Recommendations
export const providerRecommendations = pgTable("provider_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  requestedBy: varchar("requested_by").notNull().references(() => users.id),
  workloadCharacteristics: jsonb("workload_characteristics").notNull(),
  requirements: jsonb("requirements").notNull(), // performance, cost, compliance, geographic
  recommendations: jsonb("recommendations").default([]), // ranked list of providers with scores
  reasoning: jsonb("reasoning").default({}), // AI explanation for recommendations
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  alternativeOptions: jsonb("alternative_options").default([]),
  costComparison: jsonb("cost_comparison").default({}),
  performanceProjections: jsonb("performance_projections").default({}),
  complianceMapping: jsonb("compliance_mapping").default({}),
  status: text("status").default("active"), // "active", "accepted", "rejected", "superseded"
  implementedProvider: varchar("implemented_provider").references(() => cloudProviders.id),
  feedback: jsonb("feedback").default({}),
  validUntil: timestamp("valid_until"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cross-Cloud Resource Mapping
export const resourceMappings = pgTable("resource_mappings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceProvider: varchar("source_provider").notNull().references(() => cloudProviders.id),
  targetProvider: varchar("target_provider").notNull().references(() => cloudProviders.id),
  resourceType: text("resource_type").notNull(), // "compute", "storage", "database", "network"
  sourceService: text("source_service").notNull(), // "EC2", "RDS", etc.
  targetService: text("target_service").notNull(), // "Virtual Machines", "SQL Database", etc.
  mappingType: text("mapping_type").notNull(), // "direct", "approximate", "complex", "unsupported"
  conversionComplexity: text("conversion_complexity").default("medium"), // "low", "medium", "high"
  automationSupported: boolean("automation_supported").default(false),
  configurationMapping: jsonb("configuration_mapping").default({}),
  limitations: jsonb("limitations").default([]),
  bestPractices: jsonb("best_practices").default([]),
  costImplications: jsonb("cost_implications").default({}),
  performanceImpact: jsonb("performance_impact").default({}),
  isRecommended: boolean("is_recommended").default(true),
  lastVerified: timestamp("last_verified").defaultNow(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Compliance and Security Profiles
export const complianceProfiles = pgTable("compliance_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  requiredCertifications: jsonb("required_certifications").default([]), // SOC2, GDPR, HIPAA, PCI-DSS
  dataResidencyRequirements: jsonb("data_residency_requirements").default({}),
  encryptionRequirements: jsonb("encryption_requirements").default({}),
  accessControlRequirements: jsonb("access_control_requirements").default({}),
  auditingRequirements: jsonb("auditing_requirements").default({}),
  networkSecurityRequirements: jsonb("network_security_requirements").default({}),
  providerCompliance: jsonb("provider_compliance").default({}), // compliance mapping per provider
  riskTolerance: text("risk_tolerance").default("medium"), // "low", "medium", "high"
  isActive: boolean("is_active").default(true),
  lastReviewed: timestamp("last_reviewed").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cloud Resource State Tracking
export const cloudResourceStates = pgTable("cloud_resource_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resourceId: varchar("resource_id").notNull().references(() => infrastructureResources.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id").notNull().references(() => cloudProviders.id),
  externalResourceId: text("external_resource_id").notNull(), // provider's resource ID
  resourceArn: text("resource_arn"), // for AWS resources
  currentState: text("current_state").notNull(), // "creating", "running", "stopped", "terminated", "error"
  desiredState: text("desired_state").notNull(),
  providerRegion: text("provider_region"),
  providerZone: text("provider_zone"),
  lastSyncAt: timestamp("last_sync_at").defaultNow(),
  syncStatus: text("sync_status").default("synced"), // "synced", "drift", "error", "pending"
  configurationDrift: jsonb("configuration_drift").default({}),
  tags: jsonb("tags").default({}),
  providerMetadata: jsonb("provider_metadata").default({}),
  errorMessage: text("error_message"),
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

export const infrastructureResourcesRelations = relations(infrastructureResources, ({ one, many }) => ({
  project: one(projects, {
    fields: [infrastructureResources.projectId],
    references: [projects.id],
  }),
  cloudResourceState: one(cloudResourceStates, {
    fields: [infrastructureResources.id],
    references: [cloudResourceStates.resourceId],
  }),
  costAnalytics: many(costAnalytics),
}));

// Cloud Provider Relations
export const cloudProvidersRelations = relations(cloudProviders, ({ many }) => ({
  credentials: many(cloudCredentials),
  regions: many(cloudRegions),
  capabilities: many(providerCapabilities),
  costAnalytics: many(costAnalytics),
  migrationProjectsAsSource: many(migrationProjects, { relationName: "sourceProviderRelation" }),
  migrationProjectsAsTarget: many(migrationProjects, { relationName: "targetProviderRelation" }),
  recommendations: many(providerRecommendations),
  resourceMappingsAsSource: many(resourceMappings, { relationName: "sourceProviderMappingRelation" }),
  resourceMappingsAsTarget: many(resourceMappings, { relationName: "targetProviderMappingRelation" }),
  cloudResourceStates: many(cloudResourceStates),
}));

export const cloudCredentialsRelations = relations(cloudCredentials, ({ one }) => ({
  user: one(users, {
    fields: [cloudCredentials.userId],
    references: [users.id],
  }),
  provider: one(cloudProviders, {
    fields: [cloudCredentials.providerId],
    references: [cloudProviders.id],
  }),
}));

export const cloudRegionsRelations = relations(cloudRegions, ({ one }) => ({
  provider: one(cloudProviders, {
    fields: [cloudRegions.providerId],
    references: [cloudProviders.id],
  }),
}));

export const providerCapabilitiesRelations = relations(providerCapabilities, ({ one }) => ({
  provider: one(cloudProviders, {
    fields: [providerCapabilities.providerId],
    references: [cloudProviders.id],
  }),
}));

export const costAnalyticsRelations = relations(costAnalytics, ({ one }) => ({
  project: one(projects, {
    fields: [costAnalytics.projectId],
    references: [projects.id],
  }),
  provider: one(cloudProviders, {
    fields: [costAnalytics.providerId],
    references: [cloudProviders.id],
  }),
  resource: one(infrastructureResources, {
    fields: [costAnalytics.resourceId],
    references: [infrastructureResources.id],
  }),
}));

export const migrationProjectsRelations = relations(migrationProjects, ({ one }) => ({
  project: one(projects, {
    fields: [migrationProjects.projectId],
    references: [projects.id],
  }),
  sourceProvider: one(cloudProviders, {
    fields: [migrationProjects.sourceProvider],
    references: [cloudProviders.id],
    relationName: "sourceProviderRelation",
  }),
  targetProvider: one(cloudProviders, {
    fields: [migrationProjects.targetProvider],
    references: [cloudProviders.id],
    relationName: "targetProviderRelation",
  }),
  assignedUser: one(users, {
    fields: [migrationProjects.assignedTo],
    references: [users.id],
  }),
}));

export const providerRecommendationsRelations = relations(providerRecommendations, ({ one }) => ({
  project: one(projects, {
    fields: [providerRecommendations.projectId],
    references: [projects.id],
  }),
  requestedByUser: one(users, {
    fields: [providerRecommendations.requestedBy],
    references: [users.id],
  }),
  implementedProvider: one(cloudProviders, {
    fields: [providerRecommendations.implementedProvider],
    references: [cloudProviders.id],
  }),
}));

export const resourceMappingsRelations = relations(resourceMappings, ({ one }) => ({
  sourceProvider: one(cloudProviders, {
    fields: [resourceMappings.sourceProvider],
    references: [cloudProviders.id],
    relationName: "sourceProviderMappingRelation",
  }),
  targetProvider: one(cloudProviders, {
    fields: [resourceMappings.targetProvider],
    references: [cloudProviders.id],
    relationName: "targetProviderMappingRelation",
  }),
}));

export const complianceProfilesRelations = relations(complianceProfiles, ({ one }) => ({
  project: one(projects, {
    fields: [complianceProfiles.projectId],
    references: [projects.id],
  }),
}));

export const cloudResourceStatesRelations = relations(cloudResourceStates, ({ one }) => ({
  resource: one(infrastructureResources, {
    fields: [cloudResourceStates.resourceId],
    references: [infrastructureResources.id],
  }),
  provider: one(cloudProviders, {
    fields: [cloudResourceStates.providerId],
    references: [cloudProviders.id],
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

// New Enhanced Infrastructure Types
export type DeploymentEnvironment = typeof deploymentEnvironments.$inferSelect;
export type InsertDeploymentEnvironment = typeof deploymentEnvironments.$inferInsert;
export type HealthCheck = typeof healthChecks.$inferSelect;
export type InsertHealthCheck = typeof healthChecks.$inferInsert;
export type LoadBalancer = typeof loadBalancers.$inferSelect;
export type InsertLoadBalancer = typeof loadBalancers.$inferInsert;
export type AutoScalingPolicy = typeof autoScalingPolicies.$inferSelect;
export type InsertAutoScalingPolicy = typeof autoScalingPolicies.$inferInsert;

// Cloud Provider Types
export type CloudProvider = typeof cloudProviders.$inferSelect;
export type InsertCloudProvider = z.infer<typeof insertCloudProviderSchema>;
export type CloudCredential = typeof cloudCredentials.$inferSelect;
export type InsertCloudCredential = z.infer<typeof insertCloudCredentialSchema>;
export type CloudRegion = typeof cloudRegions.$inferSelect;
export type InsertCloudRegion = z.infer<typeof insertCloudRegionSchema>;
export type ProviderCapability = typeof providerCapabilities.$inferSelect;
export type InsertProviderCapability = z.infer<typeof insertProviderCapabilitySchema>;
export type CostAnalytic = typeof costAnalytics.$inferSelect;
export type InsertCostAnalytic = z.infer<typeof insertCostAnalyticSchema>;
export type MigrationProject = typeof migrationProjects.$inferSelect;
export type InsertMigrationProject = z.infer<typeof insertMigrationProjectSchema>;
export type ProviderRecommendation = typeof providerRecommendations.$inferSelect;
export type InsertProviderRecommendation = z.infer<typeof insertProviderRecommendationSchema>;
export type ResourceMapping = typeof resourceMappings.$inferSelect;
export type InsertResourceMapping = z.infer<typeof insertResourceMappingSchema>;
export type ComplianceProfile = typeof complianceProfiles.$inferSelect;
export type InsertComplianceProfile = z.infer<typeof insertComplianceProfileSchema>;
export type CloudResourceState = typeof cloudResourceStates.$inferSelect;
export type InsertCloudResourceState = z.infer<typeof insertCloudResourceStateSchema>;

// New Infrastructure Schema Validations
export const insertDeploymentEnvironmentSchema = createInsertSchema(deploymentEnvironments).pick({
  projectId: true,
  name: true,
  type: true,
  branch: true,
  autoDeployBranch: true,
  configuration: true,
  resourceLimits: true,
  isProtected: true,
});

export const insertHealthCheckSchema = createInsertSchema(healthChecks).pick({
  deploymentId: true,
  checkType: true,
  endpoint: true,
  expectedResponse: true,
  timeout: true,
  interval: true,
  retries: true,
});

export const insertLoadBalancerSchema = createInsertSchema(loadBalancers).pick({
  projectId: true,
  name: true,
  type: true,
  algorithm: true,
  healthCheckPath: true,
  healthCheckInterval: true,
  configuration: true,
  targets: true,
});

export const insertAutoScalingPolicySchema = createInsertSchema(autoScalingPolicies).pick({
  projectId: true,
  environmentId: true,
  name: true,
  targetType: true,
  targetId: true,
  scaleDirection: true,
  minInstances: true,
  maxInstances: true,
  metrics: true,
  cooldownPeriod: true,
  isEnabled: true,
});

// Cloud Provider Insert Schemas
export const insertCloudProviderSchema = createInsertSchema(cloudProviders).pick({
  name: true,
  displayName: true,
  type: true,
  status: true,
  apiEndpoint: true,
  documentationUrl: true,
  pricing: true,
  features: true,
  regions: true,
  compliance: true,
  supportTiers: true,
  metadata: true,
  isEnabled: true,
});

export const insertCloudCredentialSchema = createInsertSchema(cloudCredentials).pick({
  userId: true,
  providerId: true,
  name: true,
  credentialType: true,
  encryptedCredentials: true,
  region: true,
  scope: true,
  isDefault: true,
  expiresAt: true,
  rotationPolicy: true,
  metadata: true,
  isActive: true,
});

export const insertCloudRegionSchema = createInsertSchema(cloudRegions).pick({
  providerId: true,
  regionCode: true,
  regionName: true,
  country: true,
  city: true,
  latitude: true,
  longitude: true,
  availabilityZones: true,
  services: true,
  compliance: true,
  costs: true,
  latencyBenchmarks: true,
  isActive: true,
  metadata: true,
});

export const insertProviderCapabilitySchema = createInsertSchema(providerCapabilities).pick({
  providerId: true,
  serviceType: true,
  serviceName: true,
  capability: true,
  isSupported: true,
  limitations: true,
  configuration: true,
  pricing: true,
  performance: true,
  maturityLevel: true,
  metadata: true,
});

export const insertCostAnalyticSchema = createInsertSchema(costAnalytics).pick({
  projectId: true,
  providerId: true,
  resourceId: true,
  period: true,
  periodStart: true,
  periodEnd: true,
  actualCost: true,
  estimatedCost: true,
  currency: true,
  costCategory: true,
  usageMetrics: true,
  optimizationOpportunities: true,
  tags: true,
  metadata: true,
});

export const insertMigrationProjectSchema = createInsertSchema(migrationProjects).pick({
  projectId: true,
  name: true,
  description: true,
  sourceProvider: true,
  targetProvider: true,
  migrationStrategy: true,
  complexity: true,
  estimatedDuration: true,
  estimatedCost: true,
  riskAssessment: true,
  dependencies: true,
  milestones: true,
  workloadAnalysis: true,
  performanceBaseline: true,
  rollbackPlan: true,
  assignedTo: true,
});

export const insertProviderRecommendationSchema = createInsertSchema(providerRecommendations).pick({
  projectId: true,
  requestedBy: true,
  workloadCharacteristics: true,
  requirements: true,
  recommendations: true,
  reasoning: true,
  confidenceScore: true,
  alternativeOptions: true,
  costComparison: true,
  performanceProjections: true,
  complianceMapping: true,
  validUntil: true,
});

export const insertResourceMappingSchema = createInsertSchema(resourceMappings).pick({
  sourceProvider: true,
  targetProvider: true,
  resourceType: true,
  sourceService: true,
  targetService: true,
  mappingType: true,
  conversionComplexity: true,
  automationSupported: true,
  configurationMapping: true,
  limitations: true,
  bestPractices: true,
  costImplications: true,
  performanceImpact: true,
  isRecommended: true,
  metadata: true,
});

export const insertComplianceProfileSchema = createInsertSchema(complianceProfiles).pick({
  projectId: true,
  name: true,
  description: true,
  requiredCertifications: true,
  dataResidencyRequirements: true,
  encryptionRequirements: true,
  accessControlRequirements: true,
  auditingRequirements: true,
  networkSecurityRequirements: true,
  providerCompliance: true,
  riskTolerance: true,
  isActive: true,
});

export const insertCloudResourceStateSchema = createInsertSchema(cloudResourceStates).pick({
  resourceId: true,
  providerId: true,
  externalResourceId: true,
  resourceArn: true,
  currentState: true,
  desiredState: true,
  providerRegion: true,
  providerZone: true,
  syncStatus: true,
  configurationDrift: true,
  tags: true,
  providerMetadata: true,
  errorMessage: true,
});

// =====================================================
// Enterprise Migration System Tables
// =====================================================

// Legacy System Inventory and Assessment
export const legacySystemAssessments = pgTable("legacy_system_assessments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  migrationProjectId: varchar("migration_project_id").references(() => migrationProjects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  systemType: text("system_type").notNull(), // "web-app", "database", "microservice", "monolith", "legacy-app"
  technologyStack: jsonb("technology_stack").default({}), // languages, frameworks, databases, etc.
  architecture: text("architecture"), // "monolith", "microservices", "soa", "n-tier"
  infrastructure: jsonb("infrastructure").default({}), // servers, containers, cloud resources
  dependencies: jsonb("dependencies").default([]), // internal and external dependencies
  dataVolume: jsonb("data_volume").default({}), // database sizes, file storage, etc.
  performanceMetrics: jsonb("performance_metrics").default({}), // current performance baseline
  securityProfiles: jsonb("security_profiles").default({}), // security configurations and vulnerabilities
  complianceRequirements: jsonb("compliance_requirements").default([]), // regulatory requirements
  businessCriticality: text("business_criticality").default("medium"), // "low", "medium", "high", "critical"
  userBase: jsonb("user_base").default({}), // number of users, geographic distribution
  operatingCosts: decimal("operating_costs", { precision: 12, scale: 4 }),
  lastUpdated: timestamp("last_updated").defaultNow(),
  assessmentStatus: text("assessment_status").default("pending"), // "pending", "in-progress", "completed", "failed"
  assessmentFindings: jsonb("assessment_findings").default([]),
  migrationReadiness: text("migration_readiness").default("unknown"), // "ready", "needs-work", "complex", "high-risk"
  riskFactors: jsonb("risk_factors").default([]),
  recommendedStrategy: text("recommended_strategy"), // "lift-and-shift", "re-platform", "refactor", "retire"
  automationPotential: integer("automation_potential").default(0), // 0-100 percentage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Code Modernization Tracking
export const codeModernizationTasks = pgTable("code_modernization_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  migrationProjectId: varchar("migration_project_id").references(() => migrationProjects.id, { onDelete: "cascade" }),
  legacySystemId: varchar("legacy_system_id").references(() => legacySystemAssessments.id, { onDelete: "cascade" }),
  taskName: text("task_name").notNull(),
  taskType: text("task_type").notNull(), // "framework-migration", "database-migration", "api-modernization", "security-hardening"
  priority: text("priority").default("medium"), // "low", "medium", "high", "critical"
  status: text("status").default("pending"), // "pending", "in-progress", "completed", "blocked", "failed"
  sourceFramework: text("source_framework"),
  targetFramework: text("target_framework"),
  codebaseSize: integer("codebase_size"), // lines of code
  complexityScore: integer("complexity_score").default(0), // 0-100
  automationLevel: text("automation_level").default("manual"), // "manual", "semi-automated", "fully-automated"
  estimatedEffort: integer("estimated_effort"), // hours
  actualEffort: integer("actual_effort"), // hours
  findings: jsonb("findings").default([]), // code analysis findings
  recommendations: jsonb("recommendations").default([]), // modernization recommendations
  dependencies: jsonb("dependencies").default([]), // other tasks or systems this depends on
  riskAssessment: jsonb("risk_assessment").default({}),
  testingStrategy: jsonb("testing_strategy").default({}),
  rollbackPlan: jsonb("rollback_plan").default({}),
  progress: integer("progress").default(0), // 0-100 percentage
  blockers: jsonb("blockers").default([]),
  assignedTo: varchar("assigned_to").references(() => users.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Custom AI Model Training Records
export const customAiModels = pgTable("custom_ai_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  modelType: text("model_type").notNull(), // "code-generation", "code-review", "security-analysis", "performance-optimization"
  baseModel: text("base_model").notNull(), // "gpt-5", "claude-3", "custom"
  domain: text("domain"), // "fintech", "healthcare", "e-commerce", "government", etc.
  trainingData: jsonb("training_data").default({}), // metadata about training datasets
  customPrompts: jsonb("custom_prompts").default([]), // organization-specific prompts
  terminology: jsonb("terminology").default({}), // domain-specific terminology
  complianceRules: jsonb("compliance_rules").default([]), // regulatory and compliance rules
  qualityMetrics: jsonb("quality_metrics").default({}), // model performance metrics
  trainingStatus: text("training_status").default("pending"), // "pending", "training", "completed", "failed", "deployed"
  trainingProgress: integer("training_progress").default(0), // 0-100 percentage
  epochs: integer("epochs").default(1),
  learningRate: decimal("learning_rate", { precision: 10, scale: 8 }),
  batchSize: integer("batch_size"),
  validationAccuracy: decimal("validation_accuracy", { precision: 5, scale: 4 }),
  trainingCost: decimal("training_cost", { precision: 12, scale: 4 }),
  deploymentUrl: text("deployment_url"),
  apiEndpoint: text("api_endpoint"),
  modelVersion: text("model_version").default("1.0.0"),
  isActive: boolean("is_active").default(false),
  usageStats: jsonb("usage_stats").default({}),
  feedback: jsonb("feedback").default([]),
  trainingStartedAt: timestamp("training_started_at"),
  trainingCompletedAt: timestamp("training_completed_at"),
  deployedAt: timestamp("deployed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Migration Execution Logs
export const migrationExecutionLogs = pgTable("migration_execution_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  migrationProjectId: varchar("migration_project_id").notNull().references(() => migrationProjects.id, { onDelete: "cascade" }),
  executionPhase: text("execution_phase").notNull(), // "discovery", "planning", "execution", "testing", "cutover", "validation"
  stepName: text("step_name").notNull(),
  stepType: text("step_type").notNull(), // "infrastructure", "database", "application", "network", "security", "testing"
  status: text("status").notNull(), // "pending", "running", "completed", "failed", "skipped", "rolled-back"
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"), // seconds
  details: jsonb("details").default({}), // step-specific details
  logs: text("logs"), // execution logs
  errorMessage: text("error_message"),
  rollbackPossible: boolean("rollback_possible").default(false),
  rollbackExecuted: boolean("rollback_executed").default(false),
  resourcesCreated: jsonb("resources_created").default([]), // infrastructure resources created
  resourcesModified: jsonb("resources_modified").default([]), // existing resources modified
  resourcesDeleted: jsonb("resources_deleted").default([]), // resources cleaned up
  dataTransferred: jsonb("data_transferred").default({}), // data migration details
  performanceMetrics: jsonb("performance_metrics").default({}), // execution performance
  securityChecks: jsonb("security_checks").default([]), // security validations performed
  complianceChecks: jsonb("compliance_checks").default([]), // compliance validations
  automationLevel: text("automation_level").default("manual"), // "manual", "semi-automated", "fully-automated"
  executedBy: varchar("executed_by").references(() => users.id), // user or agent
  agentId: varchar("agent_id").references(() => aiAgents.id), // AI agent if automated
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

// Migration Assessment Findings
export const migrationAssessmentFindings = pgTable("migration_assessment_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  assessmentId: varchar("assessment_id").notNull().references(() => legacySystemAssessments.id, { onDelete: "cascade" }),
  findingType: text("finding_type").notNull(), // "security", "performance", "compatibility", "compliance", "architecture"
  severity: text("severity").notNull(), // "info", "low", "medium", "high", "critical"
  category: text("category").notNull(), // "vulnerability", "bottleneck", "dependency", "technical-debt", "compliance-gap"
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location"), // file path, configuration section, database table, etc.
  evidence: jsonb("evidence").default({}), // supporting evidence and data
  impact: text("impact"), // business or technical impact
  recommendation: text("recommendation"), // how to address this finding
  effort: text("effort").default("medium"), // "low", "medium", "high" - effort to resolve
  automationPossible: boolean("automation_possible").default(false),
  priority: integer("priority").default(50), // 1-100 priority score
  businessRisk: text("business_risk").default("medium"), // "low", "medium", "high", "critical"
  technicalRisk: text("technical_risk").default("medium"), // "low", "medium", "high", "critical"
  dependencies: jsonb("dependencies").default([]), // what this finding depends on
  tags: text("tags").array().default([]),
  status: text("status").default("open"), // "open", "acknowledged", "resolved", "deferred", "false-positive"
  resolvedBy: varchar("resolved_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolutionDetails: text("resolution_details"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Migration Cost Analysis
export const migrationCostAnalysis = pgTable("migration_cost_analysis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  migrationProjectId: varchar("migration_project_id").notNull().references(() => migrationProjects.id, { onDelete: "cascade" }),
  analysisType: text("analysis_type").notNull(), // "current-state", "target-state", "migration-costs", "roi-analysis"
  period: text("period").notNull(), // "monthly", "quarterly", "annually"
  currency: text("currency").default("USD"),
  
  // Current State Costs
  currentInfrastructureCost: decimal("current_infrastructure_cost", { precision: 12, scale: 4 }).default("0"),
  currentOperationalCost: decimal("current_operational_cost", { precision: 12, scale: 4 }).default("0"),
  currentMaintenanceCost: decimal("current_maintenance_cost", { precision: 12, scale: 4 }).default("0"),
  currentLicenseCost: decimal("current_license_cost", { precision: 12, scale: 4 }).default("0"),
  currentTotalCost: decimal("current_total_cost", { precision: 12, scale: 4 }).default("0"),
  
  // Target State Costs
  targetInfrastructureCost: decimal("target_infrastructure_cost", { precision: 12, scale: 4 }).default("0"),
  targetOperationalCost: decimal("target_operational_cost", { precision: 12, scale: 4 }).default("0"),
  targetMaintenanceCost: decimal("target_maintenance_cost", { precision: 12, scale: 4 }).default("0"),
  targetLicenseCost: decimal("target_license_cost", { precision: 12, scale: 4 }).default("0"),
  targetTotalCost: decimal("target_total_cost", { precision: 12, scale: 4 }).default("0"),
  
  // Migration Costs
  planningCost: decimal("planning_cost", { precision: 12, scale: 4 }).default("0"),
  executionCost: decimal("execution_cost", { precision: 12, scale: 4 }).default("0"),
  trainingCost: decimal("training_cost", { precision: 12, scale: 4 }).default("0"),
  riskMitigationCost: decimal("risk_mitigation_cost", { precision: 12, scale: 4 }).default("0"),
  totalMigrationCost: decimal("total_migration_cost", { precision: 12, scale: 4 }).default("0"),
  
  // ROI Analysis
  monthlySavings: decimal("monthly_savings", { precision: 12, scale: 4 }).default("0"),
  paybackPeriod: integer("payback_period"), // months
  roi: decimal("roi", { precision: 5, scale: 2 }).default("0"), // percentage
  netPresentValue: decimal("net_present_value", { precision: 12, scale: 4 }).default("0"),
  
  // Additional Benefits
  performanceImprovements: jsonb("performance_improvements").default({}),
  scalabilityBenefits: jsonb("scalability_benefits").default({}),
  securityImprovements: jsonb("security_improvements").default({}),
  complianceBenefits: jsonb("compliance_benefits").default({}),
  operationalBenefits: jsonb("operational_benefits").default({}),
  
  assumptions: jsonb("assumptions").default([]),
  riskFactors: jsonb("risk_factors").default([]),
  metadata: jsonb("metadata").default({}),
  analyzedAt: timestamp("analyzed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations for new migration tables
export const legacySystemAssessmentsRelations = relations(legacySystemAssessments, ({ one, many }) => ({
  project: one(projects, {
    fields: [legacySystemAssessments.projectId],
    references: [projects.id],
  }),
  migrationProject: one(migrationProjects, {
    fields: [legacySystemAssessments.migrationProjectId],
    references: [migrationProjects.id],
  }),
  modernizationTasks: many(codeModernizationTasks),
  findings: many(migrationAssessmentFindings),
}));

export const codeModernizationTasksRelations = relations(codeModernizationTasks, ({ one }) => ({
  project: one(projects, {
    fields: [codeModernizationTasks.projectId],
    references: [projects.id],
  }),
  migrationProject: one(migrationProjects, {
    fields: [codeModernizationTasks.migrationProjectId],
    references: [migrationProjects.id],
  }),
  legacySystem: one(legacySystemAssessments, {
    fields: [codeModernizationTasks.legacySystemId],
    references: [legacySystemAssessments.id],
  }),
  assignedUser: one(users, {
    fields: [codeModernizationTasks.assignedTo],
    references: [users.id],
  }),
}));

export const customAiModelsRelations = relations(customAiModels, ({ one }) => ({
  project: one(projects, {
    fields: [customAiModels.projectId],
    references: [projects.id],
  }),
}));

export const migrationExecutionLogsRelations = relations(migrationExecutionLogs, ({ one }) => ({
  migrationProject: one(migrationProjects, {
    fields: [migrationExecutionLogs.migrationProjectId],
    references: [migrationProjects.id],
  }),
  executedByUser: one(users, {
    fields: [migrationExecutionLogs.executedBy],
    references: [users.id],
  }),
  agent: one(aiAgents, {
    fields: [migrationExecutionLogs.agentId],
    references: [aiAgents.id],
  }),
}));

export const migrationAssessmentFindingsRelations = relations(migrationAssessmentFindings, ({ one }) => ({
  assessment: one(legacySystemAssessments, {
    fields: [migrationAssessmentFindings.assessmentId],
    references: [legacySystemAssessments.id],
  }),
  resolvedByUser: one(users, {
    fields: [migrationAssessmentFindings.resolvedBy],
    references: [users.id],
  }),
}));

export const migrationCostAnalysisRelations = relations(migrationCostAnalysis, ({ one }) => ({
  migrationProject: one(migrationProjects, {
    fields: [migrationCostAnalysis.migrationProjectId],
    references: [migrationProjects.id],
  }),
}));

// Insert schemas for new migration tables
export const insertLegacySystemAssessmentSchema = createInsertSchema(legacySystemAssessments).pick({
  projectId: true,
  migrationProjectId: true,
  name: true,
  description: true,
  systemType: true,
  technologyStack: true,
  architecture: true,
  infrastructure: true,
  dependencies: true,
  dataVolume: true,
  performanceMetrics: true,
  securityProfiles: true,
  complianceRequirements: true,
  businessCriticality: true,
  userBase: true,
  operatingCosts: true,
});

export const insertCodeModernizationTaskSchema = createInsertSchema(codeModernizationTasks).pick({
  projectId: true,
  migrationProjectId: true,
  legacySystemId: true,
  taskName: true,
  taskType: true,
  priority: true,
  sourceFramework: true,
  targetFramework: true,
  codebaseSize: true,
  complexityScore: true,
  automationLevel: true,
  estimatedEffort: true,
  recommendations: true,
  dependencies: true,
  riskAssessment: true,
  testingStrategy: true,
  rollbackPlan: true,
  assignedTo: true,
});

export const insertCustomAiModelSchema = createInsertSchema(customAiModels).pick({
  projectId: true,
  name: true,
  description: true,
  modelType: true,
  baseModel: true,
  domain: true,
  trainingData: true,
  customPrompts: true,
  terminology: true,
  complianceRules: true,
  epochs: true,
  learningRate: true,
  batchSize: true,
});

export const insertMigrationExecutionLogSchema = createInsertSchema(migrationExecutionLogs).pick({
  migrationProjectId: true,
  executionPhase: true,
  stepName: true,
  stepType: true,
  status: true,
  startedAt: true,
  details: true,
  logs: true,
  errorMessage: true,
  rollbackPossible: true,
  resourcesCreated: true,
  resourcesModified: true,
  dataTransferred: true,
  automationLevel: true,
  executedBy: true,
  agentId: true,
  metadata: true,
});

export const insertMigrationAssessmentFindingSchema = createInsertSchema(migrationAssessmentFindings).pick({
  assessmentId: true,
  findingType: true,
  severity: true,
  category: true,
  title: true,
  description: true,
  location: true,
  evidence: true,
  impact: true,
  recommendation: true,
  effort: true,
  automationPossible: true,
  priority: true,
  businessRisk: true,
  technicalRisk: true,
  dependencies: true,
  tags: true,
});

export const insertMigrationCostAnalysisSchema = createInsertSchema(migrationCostAnalysis).pick({
  migrationProjectId: true,
  analysisType: true,
  period: true,
  currency: true,
  currentInfrastructureCost: true,
  currentOperationalCost: true,
  currentMaintenanceCost: true,
  currentLicenseCost: true,
  targetInfrastructureCost: true,
  targetOperationalCost: true,
  targetMaintenanceCost: true,
  targetLicenseCost: true,
  planningCost: true,
  executionCost: true,
  trainingCost: true,
  riskMitigationCost: true,
  assumptions: true,
  riskFactors: true,
  metadata: true,
});

// Type definitions for new migration tables
export type LegacySystemAssessment = typeof legacySystemAssessments.$inferSelect;
export type InsertLegacySystemAssessment = z.infer<typeof insertLegacySystemAssessmentSchema>;
export type CodeModernizationTask = typeof codeModernizationTasks.$inferSelect;
export type InsertCodeModernizationTask = z.infer<typeof insertCodeModernizationTaskSchema>;
export type CustomAiModel = typeof customAiModels.$inferSelect;
export type InsertCustomAiModel = z.infer<typeof insertCustomAiModelSchema>;
export type MigrationExecutionLog = typeof migrationExecutionLogs.$inferSelect;
export type InsertMigrationExecutionLog = z.infer<typeof insertMigrationExecutionLogSchema>;
export type MigrationAssessmentFinding = typeof migrationAssessmentFindings.$inferSelect;
export type InsertMigrationAssessmentFinding = z.infer<typeof insertMigrationAssessmentFindingSchema>;
export type MigrationCostAnalysis = typeof migrationCostAnalysis.$inferSelect;
export type InsertMigrationCostAnalysis = z.infer<typeof insertMigrationCostAnalysisSchema>;

// =====================================================
// INTEGRATIONS HUB - Comprehensive External Service Management
// =====================================================

// Central Integration Management
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
  status: text("status").notNull().default("unknown"), // "healthy", "degraded", "unhealthy", "unknown"
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

// Insert schemas for Advanced Monitoring Platform
export const insertSlaConfigurationSchema = createInsertSchema(slaConfigurations).pick({
  projectId: true,
  name: true,
  description: true,
  slaType: true,
  targetValue: true,
  unit: true,
  measurementWindow: true,
  breachThreshold: true,
  violationActions: true,
  escalationPolicy: true,
  notificationChannels: true,
  isActive: true,
  metadata: true,
});

export const insertSlaViolationSchema = createInsertSchema(slaViolations).pick({
  slaConfigurationId: true,
  projectId: true,
  violationType: true,
  severity: true,
  actualValue: true,
  expectedValue: true,
  duration: true,
  impactDescription: true,
  rootCause: true,
  resolution: true,
  status: true,
  resolvedBy: true,
  automaticActions: true,
  metadata: true,
  startedAt: true,
});

export const insertTimeSeriesMetricSchema = createInsertSchema(timeSeriesMetrics).pick({
  projectId: true,
  resourceId: true,
  metricName: true,
  metricType: true,
  value: true,
  unit: true,
  dimensions: true,
  tags: true,
  aggregation: true,
  timeWindow: true,
  timestamp: true,
});

export const insertAnomalyDetectionModelSchema = createInsertSchema(anomalyDetectionModels).pick({
  projectId: true,
  modelName: true,
  modelType: true,
  targetMetrics: true,
  trainingData: true,
  hyperparameters: true,
  modelArtifacts: true,
  sensitivity: true,
  retrainingSchedule: true,
  status: true,
  version: true,
  metadata: true,
});

export const insertAnomalyDetectionSchema = createInsertSchema(anomalyDetections).pick({
  modelId: true,
  projectId: true,
  metricName: true,
  anomalyType: true,
  severity: true,
  confidenceScore: true,
  actualValue: true,
  expectedValue: true,
  deviation: true,
  context: true,
  relatedIncidents: true,
  automaticActions: true,
  status: true,
  acknowledgedBy: true,
  resolution: true,
  metadata: true,
  detectedAt: true,
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).pick({
  projectId: true,
  name: true,
  description: true,
  ruleType: true,
  metricQuery: true,
  conditions: true,
  severity: true,
  evaluationInterval: true,
  silenceDuration: true,
  escalationRules: true,
  notificationChannels: true,
  automaticActions: true,
  suppressionConditions: true,
  labels: true,
  isEnabled: true,
  createdBy: true,
  metadata: true,
});

export const insertAlertNotificationSchema = createInsertSchema(alertNotifications).pick({
  alertRuleId: true,
  incidentId: true,
  projectId: true,
  notificationType: true,
  channel: true,
  subject: true,
  message: true,
  priority: true,
  status: true,
  metadata: true,
});

export const insertPerformanceBaselineSchema = createInsertSchema(performanceBaselines).pick({
  projectId: true,
  metricName: true,
  resourceType: true,
  resourceId: true,
  baselineType: true,
  timeFrame: true,
  baselineValue: true,
  standardDeviation: true,
  percentile95: true,
  percentile99: true,
  trendDirection: true,
  trendStrength: true,
  seasonalityPattern: true,
  confidenceLevel: true,
  sampleSize: true,
  lastCalculated: true,
  validUntil: true,
  metadata: true,
});

export const insertApmTransactionSchema = createInsertSchema(apmTransactions).pick({
  projectId: true,
  traceId: true,
  spanId: true,
  parentSpanId: true,
  transactionName: true,
  serviceName: true,
  operationType: true,
  startTime: true,
  endTime: true,
  duration: true,
  status: true,
  statusCode: true,
  errorMessage: true,
  userAgent: true,
  ipAddress: true,
  userId: true,
  sessionId: true,
  tags: true,
  metadata: true,
});

export const insertDatabasePerformanceMetricSchema = createInsertSchema(databasePerformanceMetrics).pick({
  projectId: true,
  databaseType: true,
  instanceId: true,
  queryHash: true,
  query: true,
  executionTime: true,
  rowsAffected: true,
  rowsExamined: true,
  indexesUsed: true,
  executionPlan: true,
  lockTime: true,
  ioCost: true,
  cpuCost: true,
  memoryCost: true,
  optimizationSuggestions: true,
  isSlowQuery: true,
  frequency: true,
  timestamp: true,
  metadata: true,
});

export const insertLogEntrySchema = createInsertSchema(logEntries).pick({
  projectId: true,
  source: true,
  logLevel: true,
  serviceName: true,
  hostname: true,
  message: true,
  structuredData: true,
  traceId: true,
  userId: true,
  sessionId: true,
  requestId: true,
  errorCode: true,
  stackTrace: true,
  fingerprint: true,
  tags: true,
  timestamp: true,
});

export const insertPredictiveModelSchema = createInsertSchema(predictiveModels).pick({
  projectId: true,
  modelName: true,
  modelType: true,
  targetMetric: true,
  inputFeatures: true,
  algorithm: true,
  hyperparameters: true,
  trainingWindow: true,
  predictionHorizon: true,
  modelArtifacts: true,
  featureImportance: true,
  status: true,
  version: true,
  metadata: true,
});

export const insertPredictionSchema = createInsertSchema(predictions).pick({
  modelId: true,
  projectId: true,
  predictionType: true,
  targetTimestamp: true,
  predictedValue: true,
  confidenceInterval: true,
  confidence: true,
  actualValue: true,
  recommendations: true,
  impactAssessment: true,
  automationTriggered: true,
  metadata: true,
});

export const insertRumMetricSchema = createInsertSchema(rumMetrics).pick({
  projectId: true,
  sessionId: true,
  pageUrl: true,
  userAgent: true,
  deviceType: true,
  browserName: true,
  browserVersion: true,
  connectionType: true,
  country: true,
  region: true,
  firstContentfulPaint: true,
  largestContentfulPaint: true,
  firstInputDelay: true,
  cumulativeLayoutShift: true,
  timeToInteractive: true,
  domContentLoaded: true,
  pageLoadTime: true,
  errorCount: true,
  jsErrorMessages: true,
  performanceEntries: true,
  customMetrics: true,
  userId: true,
  timestamp: true,
});

export const insertUptimeMonitorSchema = createInsertSchema(uptimeMonitors).pick({
  projectId: true,
  name: true,
  monitorType: true,
  targetUrl: true,
  checkInterval: true,
  timeout: true,
  expectedStatusCode: true,
  expectedContent: true,
  followRedirects: true,
  requestHeaders: true,
  monitoringRegions: true,
  alertThresholds: true,
  maintenanceWindows: true,
  isEnabled: true,
  metadata: true,
});

export const insertUptimeCheckResultSchema = createInsertSchema(uptimeCheckResults).pick({
  monitorId: true,
  projectId: true,
  checkRegion: true,
  status: true,
  responseTime: true,
  statusCode: true,
  responseSize: true,
  errorMessage: true,
  sslCertExpiry: true,
  dnsLookupTime: true,
  connectTime: true,
  tlsHandshakeTime: true,
  transferTime: true,
  redirectCount: true,
  incidentCreated: true,
  incidentId: true,
  timestamp: true,
});

export const insertCustomDashboardSchema = createInsertSchema(customDashboards).pick({
  projectId: true,
  userId: true,
  name: true,
  description: true,
  dashboardType: true,
  layout: true,
  widgets: true,
  filters: true,
  refreshInterval: true,
  timeRange: true,
  isPublic: true,
  sharedWith: true,
  tags: true,
  version: true,
  metadata: true,
});

// Type Definitions for Advanced Monitoring Platform
export type SlaConfiguration = typeof slaConfigurations.$inferSelect;
export type InsertSlaConfiguration = z.infer<typeof insertSlaConfigurationSchema>;
export type SlaViolation = typeof slaViolations.$inferSelect;
export type InsertSlaViolation = z.infer<typeof insertSlaViolationSchema>;
export type TimeSeriesMetric = typeof timeSeriesMetrics.$inferSelect;
export type InsertTimeSeriesMetric = z.infer<typeof insertTimeSeriesMetricSchema>;
export type AnomalyDetectionModel = typeof anomalyDetectionModels.$inferSelect;
export type InsertAnomalyDetectionModel = z.infer<typeof insertAnomalyDetectionModelSchema>;
export type AnomalyDetection = typeof anomalyDetections.$inferSelect;
export type InsertAnomalyDetection = z.infer<typeof insertAnomalyDetectionSchema>;
export type AlertRule = typeof alertRules.$inferSelect;
export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertNotification = typeof alertNotifications.$inferSelect;
export type InsertAlertNotification = z.infer<typeof insertAlertNotificationSchema>;
export type PerformanceBaseline = typeof performanceBaselines.$inferSelect;
export type InsertPerformanceBaseline = z.infer<typeof insertPerformanceBaselineSchema>;
export type ApmTransaction = typeof apmTransactions.$inferSelect;
export type InsertApmTransaction = z.infer<typeof insertApmTransactionSchema>;
export type DatabasePerformanceMetric = typeof databasePerformanceMetrics.$inferSelect;
export type InsertDatabasePerformanceMetric = z.infer<typeof insertDatabasePerformanceMetricSchema>;
export type LogEntry = typeof logEntries.$inferSelect;
export type InsertLogEntry = z.infer<typeof insertLogEntrySchema>;
export type PredictiveModel = typeof predictiveModels.$inferSelect;
export type InsertPredictiveModel = z.infer<typeof insertPredictiveModelSchema>;
export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type RumMetric = typeof rumMetrics.$inferSelect;
export type InsertRumMetric = z.infer<typeof insertRumMetricSchema>;
export type UptimeMonitor = typeof uptimeMonitors.$inferSelect;
export type InsertUptimeMonitor = z.infer<typeof insertUptimeMonitorSchema>;
export type UptimeCheckResult = typeof uptimeCheckResults.$inferSelect;
export type InsertUptimeCheckResult = z.infer<typeof insertUptimeCheckResultSchema>;
export type CustomDashboard = typeof customDashboards.$inferSelect;
export type InsertCustomDashboard = z.infer<typeof insertCustomDashboardSchema>;

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
// Enterprise User Management Zod Schemas
// =====================================================

// Organization schemas
export const insertOrganizationSchema = createInsertSchema(organizations).pick({
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  website: true,
  industry: true,
  companySize: true,
  plan: true,
  billingEmail: true,
  settings: true,
  metadata: true,
  isActive: true,
});

export const insertOrganizationMemberSchema = createInsertSchema(organizationMembers).pick({
  organizationId: true,
  userId: true,
  role: true,
  permissions: true,
  invitedBy: true,
  invitedAt: true,
  metadata: true,
  isActive: true,
});

// Team schemas
export const insertTeamSchema = createInsertSchema(teams).pick({
  organizationId: true,
  name: true,
  description: true,
  slug: true,
  teamType: true,
  leaderId: true,
  settings: true,
  metadata: true,
  isActive: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).pick({
  teamId: true,
  userId: true,
  role: true,
  permissions: true,
  addedBy: true,
  metadata: true,
  isActive: true,
});

// Role and permission schemas
export const insertRoleSchema = createInsertSchema(roles).pick({
  name: true,
  displayName: true,
  description: true,
  scope: true,
  permissions: true,
  isDefault: true,
  isSystemRole: true,
  metadata: true,
});

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
