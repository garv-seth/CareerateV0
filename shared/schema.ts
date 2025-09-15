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
