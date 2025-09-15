import { 
  users, 
  projects, 
  codeGenerations,
  aiAgents,
  deployments,
  incidents,
  performanceMetrics,
  securityScans,
  agentTasks,
  infrastructureResources,
  projectTemplates,
  codeAnalysis,
  generationHistory,
  codeReviews,
  apiDocumentation,
  deploymentEnvironments,
  healthChecks,
  loadBalancers,
  autoScalingPolicies,
  migrationProjects,
  legacySystemAssessments,
  codeModernizationTasks,
  customAiModels,
  migrationExecutionLogs,
  migrationAssessmentFindings,
  migrationCostAnalysis,
  apmTransactions,
  databasePerformanceMetrics,
  rumMetrics,
  timeSeriesMetrics,
  performanceBaselines,
  logEntries,
  type User, 
  type UpsertUser, 
  type Project, 
  type InsertProject, 
  type CodeGeneration, 
  type InsertCodeGeneration,
  type AiAgent,
  type InsertAiAgent,
  type Deployment,
  type InsertDeployment,
  type Incident,
  type InsertIncident,
  type PerformanceMetric,
  type InsertPerformanceMetric,
  type SecurityScan,
  type InsertSecurityScan,
  type AgentTask,
  type InsertAgentTask,
  type InfrastructureResource,
  type InsertInfrastructureResource,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type CodeAnalysis,
  type InsertCodeAnalysis,
  type GenerationHistory,
  type CodeReview,
  type InsertCodeReview,
  type ApiDocumentation,
  type DeploymentEnvironment,
  type InsertDeploymentEnvironment,
  type HealthCheck,
  type InsertHealthCheck,
  type LoadBalancer,
  type InsertLoadBalancer,
  type AutoScalingPolicy,
  type InsertAutoScalingPolicy,
  type MigrationProject,
  type InsertMigrationProject,
  type LegacySystemAssessment,
  type InsertLegacySystemAssessment,
  type CodeModernizationTask,
  type InsertCodeModernizationTask,
  type CustomAiModel,
  type InsertCustomAiModel,
  type MigrationExecutionLog,
  type InsertMigrationExecutionLog,
  type MigrationAssessmentFinding,
  type InsertMigrationAssessmentFinding,
  type MigrationCostAnalysis,
  type InsertMigrationCostAnalysis,
  type ApmTransaction,
  type InsertApmTransaction,
  type DatabasePerformanceMetric,
  type InsertDatabasePerformanceMetric,
  type RumMetric,
  type InsertRumMetric,
  type TimeSeriesMetric,
  type InsertTimeSeriesMetric,
  type PerformanceBaseline,
  type InsertPerformanceBaseline,
  type LogEntry,
  type InsertLogEntry,
  integrations,
  integrationSecrets,
  repositoryConnections,
  apiConnections,
  integrationHealthChecks,
  integrationAuditLogs,
  webhookConfigurations,
  apiRateLimits,
  type Integration,
  type InsertIntegration,
  type IntegrationSecret,
  type InsertIntegrationSecret,
  type RepositoryConnection,
  type InsertRepositoryConnection,
  type ApiConnection,
  type InsertApiConnection,
  type IntegrationHealthCheck,
  type InsertIntegrationHealthCheck,
  type IntegrationAuditLog,
  type InsertIntegrationAuditLog,
  type WebhookConfiguration,
  type InsertWebhookConfiguration,
  type ApiRateLimit,
  type InsertApiRateLimit
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Project operations
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByUserId(userId: string): Promise<Project[]>;
  createProject(project: InsertProject & { userId: string }): Promise<Project>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;

  // Code generation operations
  createCodeGeneration(generation: InsertCodeGeneration): Promise<CodeGeneration>;
  getCodeGenerationsByProjectId(projectId: string): Promise<CodeGeneration[]>;
  updateCodeGeneration(id: string, updates: Partial<CodeGeneration>): Promise<CodeGeneration | undefined>;
  getCodeGeneration(id: string): Promise<CodeGeneration | undefined>;

  // AI Agent operations
  createAiAgent(agent: InsertAiAgent): Promise<AiAgent>;
  getAiAgent(id: string): Promise<AiAgent | undefined>;
  getProjectAgents(projectId: string): Promise<AiAgent[]>;
  updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent | undefined>;
  deleteAiAgent(id: string): Promise<boolean>;

  // Deployment operations
  createDeployment(deployment: InsertDeployment): Promise<Deployment>;
  getDeployment(id: string): Promise<Deployment | undefined>;
  getProjectDeployments(projectId: string): Promise<Deployment[]>;
  updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined>;

  // Incident operations
  createIncident(incident: InsertIncident): Promise<Incident>;
  getIncident(id: string): Promise<Incident | undefined>;
  getProjectIncidents(projectId: string): Promise<Incident[]>;
  updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined>;
  getOpenIncidents(projectId: string): Promise<Incident[]>;

  // Performance Metrics operations
  createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric>;
  getProjectMetrics(projectId: string, metricType?: string): Promise<PerformanceMetric[]>;

  // Security Scan operations
  createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan>;
  getProjectSecurityScans(projectId: string): Promise<SecurityScan[]>;
  updateSecurityScan(id: string, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined>;

  // Agent Task operations
  createAgentTask(task: InsertAgentTask): Promise<AgentTask>;
  getAgentTask(id: string): Promise<AgentTask | undefined>;
  getAgentTasks(agentId: string): Promise<AgentTask[]>;
  updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined>;

  // Infrastructure Resource operations
  createInfrastructureResource(resource: InsertInfrastructureResource): Promise<InfrastructureResource>;
  getProjectResources(projectId: string): Promise<InfrastructureResource[]>;
  updateInfrastructureResource(id: string, updates: Partial<InfrastructureResource>): Promise<InfrastructureResource | undefined>;

  // Enhanced Vibe Coding operations
  // Project Template operations
  createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate>;
  getProjectTemplate(id: string): Promise<ProjectTemplate | undefined>;
  getProjectTemplates(category?: string): Promise<ProjectTemplate[]>;
  updateProjectTemplate(id: string, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate | undefined>;
  deleteProjectTemplate(id: string): Promise<boolean>;

  // Code Analysis operations
  createCodeAnalysis(analysis: InsertCodeAnalysis): Promise<CodeAnalysis>;
  getCodeAnalysis(id: string): Promise<CodeAnalysis | undefined>;
  getProjectCodeAnalysis(projectId: string): Promise<CodeAnalysis[]>;
  updateCodeAnalysis(id: string, updates: Partial<CodeAnalysis>): Promise<CodeAnalysis | undefined>;

  // Generation History operations
  createGenerationHistory(history: Omit<GenerationHistory, 'id' | 'createdAt'>): Promise<GenerationHistory>;
  getGenerationHistory(projectId: string): Promise<GenerationHistory[]>;
  getCurrentVersion(projectId: string): Promise<GenerationHistory | undefined>;

  // Code Review operations
  createCodeReview(review: InsertCodeReview): Promise<CodeReview>;
  getCodeReviews(projectId: string): Promise<CodeReview[]>;
  updateCodeReview(id: string, updates: Partial<CodeReview>): Promise<CodeReview | undefined>;

  // API Documentation operations
  createApiDocumentation(doc: Omit<ApiDocumentation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiDocumentation>;
  getApiDocumentation(projectId: string): Promise<ApiDocumentation | undefined>;
  updateApiDocumentation(id: string, updates: Partial<ApiDocumentation>): Promise<ApiDocumentation | undefined>;

  // Enhanced code generation operations
  updateCodeGeneration(id: string, updates: Partial<CodeGeneration>): Promise<CodeGeneration | undefined>;
  getCodeGeneration(id: string): Promise<CodeGeneration | undefined>;

  // Enhanced Infrastructure Operations
  // Deployment Environment operations
  createDeploymentEnvironment(env: InsertDeploymentEnvironment): Promise<DeploymentEnvironment>;
  getDeploymentEnvironment(id: string): Promise<DeploymentEnvironment | undefined>;
  getProjectEnvironments(projectId: string): Promise<DeploymentEnvironment[]>;
  updateDeploymentEnvironment(id: string, updates: Partial<DeploymentEnvironment>): Promise<DeploymentEnvironment | undefined>;
  deleteDeploymentEnvironment(id: string): Promise<boolean>;

  // Health Check operations
  createHealthCheck(check: InsertHealthCheck): Promise<HealthCheck>;
  getHealthCheck(id: string): Promise<HealthCheck | undefined>;
  getDeploymentHealthChecks(deploymentId: string): Promise<HealthCheck[]>;
  updateHealthCheck(id: string, updates: Partial<HealthCheck>): Promise<HealthCheck | undefined>;
  deleteHealthCheck(id: string): Promise<boolean>;

  // Load Balancer operations
  createLoadBalancer(lb: InsertLoadBalancer): Promise<LoadBalancer>;
  getLoadBalancer(id: string): Promise<LoadBalancer | undefined>;
  getProjectLoadBalancers(projectId: string): Promise<LoadBalancer[]>;
  updateLoadBalancer(id: string, updates: Partial<LoadBalancer>): Promise<LoadBalancer | undefined>;
  deleteLoadBalancer(id: string): Promise<boolean>;

  // Auto Scaling Policy operations
  createAutoScalingPolicy(policy: InsertAutoScalingPolicy): Promise<AutoScalingPolicy>;
  getAutoScalingPolicy(id: string): Promise<AutoScalingPolicy | undefined>;
  getProjectAutoScalingPolicies(projectId: string): Promise<AutoScalingPolicy[]>;
  updateAutoScalingPolicy(id: string, updates: Partial<AutoScalingPolicy>): Promise<AutoScalingPolicy | undefined>;
  deleteAutoScalingPolicy(id: string): Promise<boolean>;

  // =====================================================
  // Enterprise Migration System Operations
  // =====================================================

  // Legacy System Assessment operations
  createLegacySystemAssessment(assessment: InsertLegacySystemAssessment): Promise<LegacySystemAssessment>;
  getLegacySystemAssessment(id: string): Promise<LegacySystemAssessment | undefined>;
  getProjectLegacyAssessments(projectId: string): Promise<LegacySystemAssessment[]>;
  getMigrationProjectAssessments(migrationProjectId: string): Promise<LegacySystemAssessment[]>;
  updateLegacySystemAssessment(id: string, updates: Partial<LegacySystemAssessment>): Promise<LegacySystemAssessment | undefined>;
  deleteLegacySystemAssessment(id: string): Promise<boolean>;

  // Code Modernization Task operations
  createCodeModernizationTask(task: InsertCodeModernizationTask): Promise<CodeModernizationTask>;
  getCodeModernizationTask(id: string): Promise<CodeModernizationTask | undefined>;
  getProjectModernizationTasks(projectId: string): Promise<CodeModernizationTask[]>;
  getMigrationProjectTasks(migrationProjectId: string): Promise<CodeModernizationTask[]>;
  getLegacySystemTasks(legacySystemId: string): Promise<CodeModernizationTask[]>;
  getUserAssignedTasks(userId: string): Promise<CodeModernizationTask[]>;
  updateCodeModernizationTask(id: string, updates: Partial<CodeModernizationTask>): Promise<CodeModernizationTask | undefined>;
  deleteCodeModernizationTask(id: string): Promise<boolean>;

  // Custom AI Model operations
  createCustomAiModel(model: InsertCustomAiModel): Promise<CustomAiModel>;
  getCustomAiModel(id: string): Promise<CustomAiModel | undefined>;
  getProjectCustomModels(projectId: string): Promise<CustomAiModel[]>;
  getActiveCustomModels(projectId: string): Promise<CustomAiModel[]>;
  getCustomModelsByType(projectId: string, modelType: string): Promise<CustomAiModel[]>;
  updateCustomAiModel(id: string, updates: Partial<CustomAiModel>): Promise<CustomAiModel | undefined>;
  deleteCustomAiModel(id: string): Promise<boolean>;

  // Migration Execution Log operations
  createMigrationExecutionLog(log: InsertMigrationExecutionLog): Promise<MigrationExecutionLog>;
  getMigrationExecutionLog(id: string): Promise<MigrationExecutionLog | undefined>;
  getMigrationProjectLogs(migrationProjectId: string): Promise<MigrationExecutionLog[]>;
  getMigrationLogsByPhase(migrationProjectId: string, phase: string): Promise<MigrationExecutionLog[]>;
  getMigrationLogsByStatus(migrationProjectId: string, status: string): Promise<MigrationExecutionLog[]>;
  updateMigrationExecutionLog(id: string, updates: Partial<MigrationExecutionLog>): Promise<MigrationExecutionLog | undefined>;

  // Migration Assessment Finding operations
  createMigrationAssessmentFinding(finding: InsertMigrationAssessmentFinding): Promise<MigrationAssessmentFinding>;
  getMigrationAssessmentFinding(id: string): Promise<MigrationAssessmentFinding | undefined>;
  getAssessmentFindings(assessmentId: string): Promise<MigrationAssessmentFinding[]>;
  getFindingsBySeverity(assessmentId: string, severity: string): Promise<MigrationAssessmentFinding[]>;
  getFindingsByType(assessmentId: string, findingType: string): Promise<MigrationAssessmentFinding[]>;
  getOpenFindings(assessmentId: string): Promise<MigrationAssessmentFinding[]>;
  updateMigrationAssessmentFinding(id: string, updates: Partial<MigrationAssessmentFinding>): Promise<MigrationAssessmentFinding | undefined>;
  deleteMigrationAssessmentFinding(id: string): Promise<boolean>;

  // Migration Cost Analysis operations
  createMigrationCostAnalysis(analysis: InsertMigrationCostAnalysis): Promise<MigrationCostAnalysis>;
  getMigrationCostAnalysis(id: string): Promise<MigrationCostAnalysis | undefined>;
  getMigrationProjectCostAnalyses(migrationProjectId: string): Promise<MigrationCostAnalysis[]>;
  getLatestCostAnalysis(migrationProjectId: string): Promise<MigrationCostAnalysis | undefined>;
  getCostAnalysesByType(migrationProjectId: string, analysisType: string): Promise<MigrationCostAnalysis[]>;
  updateMigrationCostAnalysis(id: string, updates: Partial<MigrationCostAnalysis>): Promise<MigrationCostAnalysis | undefined>;
  deleteMigrationCostAnalysis(id: string): Promise<boolean>;

  // Enhanced Migration Project operations
  createMigrationProject(migrationProject: InsertMigrationProject): Promise<MigrationProject>;
  getMigrationProject(id: string): Promise<MigrationProject | undefined>;
  getProjectMigrationProjects(projectId: string): Promise<MigrationProject[]>;
  getUserMigrationProjects(userId: string): Promise<MigrationProject[]>;
  getMigrationProjectsByStatus(status: string): Promise<MigrationProject[]>;
  updateMigrationProject(id: string, updates: Partial<MigrationProject>): Promise<MigrationProject | undefined>;
  deleteMigrationProject(id: string): Promise<boolean>;

  // =====================================================
  // INTEGRATIONS HUB OPERATIONS
  // =====================================================

  // Integration operations
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  getIntegration(id: string): Promise<Integration | undefined>;
  getUserIntegrations(userId: string, filters?: {
    projectId?: string;
    type?: string;
    service?: string;
    status?: string;
  }): Promise<Integration[]>;
  getProjectIntegrations(projectId: string): Promise<Integration[]>;
  updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined>;
  deleteIntegration(id: string): Promise<boolean>;
  getIntegrationsByService(service: string): Promise<Integration[]>;
  getIntegrationsByType(type: string): Promise<Integration[]>;

  // Integration Secrets operations
  createIntegrationSecret(secret: InsertIntegrationSecret): Promise<IntegrationSecret>;
  getIntegrationSecret(id: string): Promise<IntegrationSecret | undefined>;
  getIntegrationSecrets(integrationId: string): Promise<IntegrationSecret[]>;
  updateIntegrationSecret(id: string, updates: Partial<IntegrationSecret>): Promise<IntegrationSecret | undefined>;
  deleteIntegrationSecret(id: string): Promise<boolean>;
  getSecretByName(integrationId: string, secretName: string): Promise<IntegrationSecret | undefined>;

  // Repository Connection operations
  createRepositoryConnection(connection: InsertRepositoryConnection): Promise<RepositoryConnection>;
  getRepositoryConnection(id: string): Promise<RepositoryConnection | undefined>;
  getIntegrationRepositoryConnections(integrationId: string): Promise<RepositoryConnection[]>;
  getProjectRepositoryConnections(projectId: string): Promise<RepositoryConnection[]>;
  updateRepositoryConnection(id: string, updates: Partial<RepositoryConnection>): Promise<RepositoryConnection | undefined>;
  deleteRepositoryConnection(id: string): Promise<boolean>;
  getRepositoryConnectionByRepo(integrationId: string, repositoryId: string): Promise<RepositoryConnection | undefined>;

  // API Connection operations
  createApiConnection(connection: InsertApiConnection): Promise<ApiConnection>;
  getApiConnection(id: string): Promise<ApiConnection | undefined>;
  getIntegrationApiConnections(integrationId: string): Promise<ApiConnection[]>;
  updateApiConnection(id: string, updates: Partial<ApiConnection>): Promise<ApiConnection | undefined>;
  deleteApiConnection(id: string): Promise<boolean>;
  getApiConnectionsByService(service: string): Promise<ApiConnection[]>;

  // Integration Health Check operations
  createIntegrationHealthCheck(healthCheck: InsertIntegrationHealthCheck): Promise<IntegrationHealthCheck>;
  getIntegrationHealthCheck(id: string): Promise<IntegrationHealthCheck | undefined>;
  getIntegrationHealthChecks(integrationId: string): Promise<IntegrationHealthCheck[]>;
  getLatestHealthCheck(integrationId: string): Promise<IntegrationHealthCheck | undefined>;
  updateIntegrationHealthCheck(id: string, updates: Partial<IntegrationHealthCheck>): Promise<IntegrationHealthCheck | undefined>;
  getHealthyIntegrations(): Promise<Integration[]>;
  getUnhealthyIntegrations(): Promise<Integration[]>;

  // Integration Audit Log operations
  createIntegrationAuditLog(log: InsertIntegrationAuditLog): Promise<IntegrationAuditLog>;
  getIntegrationAuditLogs(integrationId: string, limit?: number): Promise<IntegrationAuditLog[]>;
  getUserAuditLogs(userId: string, limit?: number): Promise<IntegrationAuditLog[]>;
  getAuditLogsByAction(action: string, limit?: number): Promise<IntegrationAuditLog[]>;

  // Webhook Configuration operations
  createWebhookConfiguration(webhook: InsertWebhookConfiguration): Promise<WebhookConfiguration>;
  getWebhookConfiguration(id: string): Promise<WebhookConfiguration | undefined>;
  getIntegrationWebhooks(integrationId: string): Promise<WebhookConfiguration[]>;
  updateWebhookConfiguration(id: string, updates: Partial<WebhookConfiguration>): Promise<WebhookConfiguration | undefined>;
  deleteWebhookConfiguration(id: string): Promise<boolean>;
  getActiveWebhooks(): Promise<WebhookConfiguration[]>;

  // API Rate Limit operations
  createApiRateLimit(rateLimit: InsertApiRateLimit): Promise<ApiRateLimit>;
  getApiRateLimit(id: string): Promise<ApiRateLimit | undefined>;
  getIntegrationRateLimits(integrationId: string): Promise<ApiRateLimit[]>;
  updateApiRateLimit(id: string, updates: Partial<ApiRateLimit>): Promise<ApiRateLimit | undefined>;
  deleteApiRateLimit(id: string): Promise<boolean>;
  getRateLimitsByService(service: string): Promise<ApiRateLimit[]>;

  // Performance Analytics operations
  createApmTransaction(transaction: InsertApmTransaction): Promise<ApmTransaction>;
  getApmTransactions(projectId: string, startTime: Date, endTime: Date): Promise<ApmTransaction[]>;
  createDatabasePerformanceMetric(metric: InsertDatabasePerformanceMetric): Promise<DatabasePerformanceMetric>;
  getDatabasePerformanceMetrics(projectId: string, startTime: Date, endTime: Date): Promise<DatabasePerformanceMetric[]>;
  createRumMetric(metric: InsertRumMetric): Promise<RumMetric>;
  getRumMetrics(projectId: string, startTime: Date, endTime: Date): Promise<RumMetric[]>;
  createTimeSeriesMetric(metric: InsertTimeSeriesMetric): Promise<TimeSeriesMetric>;
  getTimeSeriesMetrics(projectId: string, resourceId: string | null, startTime: Date, endTime: Date): Promise<TimeSeriesMetric[]>;
  createPerformanceBaseline(baseline: InsertPerformanceBaseline): Promise<PerformanceBaseline>;
  getPerformanceBaselines(projectId: string): Promise<PerformanceBaseline[]>;
  createLogEntry(logEntry: InsertLogEntry): Promise<LogEntry>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
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

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // Project operations
  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project;
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId));
  }

  async createProject(project: InsertProject & { userId: string }): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        files: {},
        status: "draft",
        deploymentUrl: null,
      })
      .returning();
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const [updatedProject] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    const result = await db.delete(projects).where(eq(projects.id, id));
    return result.rowCount > 0;
  }

  // Code generation operations
  async createCodeGeneration(generation: InsertCodeGeneration): Promise<CodeGeneration> {
    const [newGeneration] = await db
      .insert(codeGenerations)
      .values({
        ...generation,
        generatedCode: null,
        success: false,
      })
      .returning();
    return newGeneration;
  }

  async getCodeGenerationsByProjectId(projectId: string): Promise<CodeGeneration[]> {
    return await db.select().from(codeGenerations).where(eq(codeGenerations.projectId, projectId));
  }

  // AI Agent operations
  async createAiAgent(agent: InsertAiAgent): Promise<AiAgent> {
    const [newAgent] = await db
      .insert(aiAgents)
      .values(agent)
      .returning();
    return newAgent;
  }

  async getAiAgent(id: string): Promise<AiAgent | undefined> {
    const [agent] = await db.select().from(aiAgents).where(eq(aiAgents.id, id));
    return agent;
  }

  async getProjectAgents(projectId: string): Promise<AiAgent[]> {
    return await db.select().from(aiAgents).where(eq(aiAgents.projectId, projectId));
  }

  async updateAiAgent(id: string, updates: Partial<AiAgent>): Promise<AiAgent | undefined> {
    const [updatedAgent] = await db
      .update(aiAgents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(aiAgents.id, id))
      .returning();
    return updatedAgent;
  }

  async deleteAiAgent(id: string): Promise<boolean> {
    const result = await db.delete(aiAgents).where(eq(aiAgents.id, id));
    return result.rowCount > 0;
  }

  // Deployment operations
  async createDeployment(deployment: InsertDeployment): Promise<Deployment> {
    const [newDeployment] = await db
      .insert(deployments)
      .values(deployment)
      .returning();
    return newDeployment;
  }

  async getDeployment(id: string): Promise<Deployment | undefined> {
    const [deployment] = await db.select().from(deployments).where(eq(deployments.id, id));
    return deployment;
  }

  async getProjectDeployments(projectId: string): Promise<Deployment[]> {
    return await db.select().from(deployments)
      .where(eq(deployments.projectId, projectId))
      .orderBy(desc(deployments.createdAt));
  }

  async updateDeployment(id: string, updates: Partial<Deployment>): Promise<Deployment | undefined> {
    const [updatedDeployment] = await db
      .update(deployments)
      .set(updates)
      .where(eq(deployments.id, id))
      .returning();
    return updatedDeployment;
  }

  // Incident operations
  async createIncident(incident: InsertIncident): Promise<Incident> {
    const [newIncident] = await db
      .insert(incidents)
      .values(incident)
      .returning();
    return newIncident;
  }

  async getIncident(id: string): Promise<Incident | undefined> {
    const [incident] = await db.select().from(incidents).where(eq(incidents.id, id));
    return incident;
  }

  async getProjectIncidents(projectId: string): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(eq(incidents.projectId, projectId))
      .orderBy(desc(incidents.createdAt));
  }

  async updateIncident(id: string, updates: Partial<Incident>): Promise<Incident | undefined> {
    const [updatedIncident] = await db
      .update(incidents)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(incidents.id, id))
      .returning();
    return updatedIncident;
  }

  async getOpenIncidents(projectId: string): Promise<Incident[]> {
    return await db.select().from(incidents)
      .where(and(
        eq(incidents.projectId, projectId),
        eq(incidents.status, "open")
      ))
      .orderBy(desc(incidents.createdAt));
  }

  // Performance Metrics operations
  async createPerformanceMetric(metric: InsertPerformanceMetric): Promise<PerformanceMetric> {
    const [newMetric] = await db
      .insert(performanceMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getProjectMetrics(projectId: string, metricType?: string): Promise<PerformanceMetric[]> {
    const conditions = [eq(performanceMetrics.projectId, projectId)];
    if (metricType) {
      conditions.push(eq(performanceMetrics.metricType, metricType));
    }
    
    return await db.select().from(performanceMetrics)
      .where(and(...conditions))
      .orderBy(desc(performanceMetrics.timestamp));
  }

  // Security Scan operations
  async createSecurityScan(scan: InsertSecurityScan): Promise<SecurityScan> {
    const [newScan] = await db
      .insert(securityScans)
      .values(scan)
      .returning();
    return newScan;
  }

  async getProjectSecurityScans(projectId: string): Promise<SecurityScan[]> {
    return await db.select().from(securityScans)
      .where(eq(securityScans.projectId, projectId))
      .orderBy(desc(securityScans.createdAt));
  }

  async updateSecurityScan(id: string, updates: Partial<SecurityScan>): Promise<SecurityScan | undefined> {
    const [updatedScan] = await db
      .update(securityScans)
      .set(updates)
      .where(eq(securityScans.id, id))
      .returning();
    return updatedScan;
  }

  // Agent Task operations
  async createAgentTask(task: InsertAgentTask): Promise<AgentTask> {
    const [newTask] = await db
      .insert(agentTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getAgentTask(id: string): Promise<AgentTask | undefined> {
    const [task] = await db.select().from(agentTasks).where(eq(agentTasks.id, id));
    return task;
  }

  async getAgentTasks(agentId: string): Promise<AgentTask[]> {
    return await db.select().from(agentTasks)
      .where(eq(agentTasks.agentId, agentId))
      .orderBy(desc(agentTasks.createdAt));
  }

  async updateAgentTask(id: string, updates: Partial<AgentTask>): Promise<AgentTask | undefined> {
    const [updatedTask] = await db
      .update(agentTasks)
      .set(updates)
      .where(eq(agentTasks.id, id))
      .returning();
    return updatedTask;
  }

  // Infrastructure Resource operations
  async createInfrastructureResource(resource: InsertInfrastructureResource): Promise<InfrastructureResource> {
    const [newResource] = await db
      .insert(infrastructureResources)
      .values(resource)
      .returning();
    return newResource;
  }

  async getProjectResources(projectId: string): Promise<InfrastructureResource[]> {
    return await db.select().from(infrastructureResources)
      .where(eq(infrastructureResources.projectId, projectId))
      .orderBy(desc(infrastructureResources.createdAt));
  }

  async updateInfrastructureResource(id: string, updates: Partial<InfrastructureResource>): Promise<InfrastructureResource | undefined> {
    const [updatedResource] = await db
      .update(infrastructureResources)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(infrastructureResources.id, id))
      .returning();
    return updatedResource;
  }

  // Enhanced Vibe Coding operations
  
  // Project Template operations
  async createProjectTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const [newTemplate] = await db
      .insert(projectTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getProjectTemplate(id: string): Promise<ProjectTemplate | undefined> {
    const [template] = await db.select().from(projectTemplates).where(eq(projectTemplates.id, id));
    return template;
  }

  async getProjectTemplates(category?: string): Promise<ProjectTemplate[]> {
    let query = db.select().from(projectTemplates).where(eq(projectTemplates.isPublic, true));
    
    if (category) {
      query = query.where(eq(projectTemplates.category, category));
    }
    
    return await query.orderBy(desc(projectTemplates.downloads), desc(projectTemplates.rating));
  }

  async updateProjectTemplate(id: string, updates: Partial<ProjectTemplate>): Promise<ProjectTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(projectTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projectTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteProjectTemplate(id: string): Promise<boolean> {
    const result = await db.delete(projectTemplates).where(eq(projectTemplates.id, id));
    return result.rowCount > 0;
  }

  // Code Analysis operations
  async createCodeAnalysis(analysis: InsertCodeAnalysis): Promise<CodeAnalysis> {
    const [newAnalysis] = await db
      .insert(codeAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getCodeAnalysis(id: string): Promise<CodeAnalysis | undefined> {
    const [analysis] = await db.select().from(codeAnalysis).where(eq(codeAnalysis.id, id));
    return analysis;
  }

  async getProjectCodeAnalysis(projectId: string): Promise<CodeAnalysis[]> {
    return await db.select().from(codeAnalysis)
      .where(eq(codeAnalysis.projectId, projectId))
      .orderBy(desc(codeAnalysis.createdAt));
  }

  async updateCodeAnalysis(id: string, updates: Partial<CodeAnalysis>): Promise<CodeAnalysis | undefined> {
    const [updatedAnalysis] = await db
      .update(codeAnalysis)
      .set(updates)
      .where(eq(codeAnalysis.id, id))
      .returning();
    return updatedAnalysis;
  }

  // Generation History operations
  async createGenerationHistory(history: Omit<GenerationHistory, 'id' | 'createdAt'>): Promise<GenerationHistory> {
    const [newHistory] = await db
      .insert(generationHistory)
      .values(history)
      .returning();
    return newHistory;
  }

  async getGenerationHistory(projectId: string): Promise<GenerationHistory[]> {
    return await db.select().from(generationHistory)
      .where(eq(generationHistory.projectId, projectId))
      .orderBy(desc(generationHistory.version));
  }

  async getCurrentVersion(projectId: string): Promise<GenerationHistory | undefined> {
    const [current] = await db.select().from(generationHistory)
      .where(and(
        eq(generationHistory.projectId, projectId),
        eq(generationHistory.isCurrent, true)
      ));
    return current;
  }

  // Code Review operations
  async createCodeReview(review: InsertCodeReview): Promise<CodeReview> {
    const [newReview] = await db
      .insert(codeReviews)
      .values(review)
      .returning();
    return newReview;
  }

  async getCodeReviews(projectId: string): Promise<CodeReview[]> {
    return await db.select().from(codeReviews)
      .where(eq(codeReviews.projectId, projectId))
      .orderBy(desc(codeReviews.createdAt));
  }

  async updateCodeReview(id: string, updates: Partial<CodeReview>): Promise<CodeReview | undefined> {
    const [updatedReview] = await db
      .update(codeReviews)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(codeReviews.id, id))
      .returning();
    return updatedReview;
  }

  // API Documentation operations
  async createApiDocumentation(doc: Omit<ApiDocumentation, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiDocumentation> {
    const [newDoc] = await db
      .insert(apiDocumentation)
      .values(doc)
      .returning();
    return newDoc;
  }

  async getApiDocumentation(projectId: string): Promise<ApiDocumentation | undefined> {
    const [doc] = await db.select().from(apiDocumentation)
      .where(eq(apiDocumentation.projectId, projectId))
      .orderBy(desc(apiDocumentation.updatedAt));
    return doc;
  }

  async updateApiDocumentation(id: string, updates: Partial<ApiDocumentation>): Promise<ApiDocumentation | undefined> {
    const [updatedDoc] = await db
      .update(apiDocumentation)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(apiDocumentation.id, id))
      .returning();
    return updatedDoc;
  }

  // Enhanced code generation operations
  async updateCodeGeneration(id: string, updates: Partial<CodeGeneration>): Promise<CodeGeneration | undefined> {
    const [updatedGeneration] = await db
      .update(codeGenerations)
      .set(updates)
      .where(eq(codeGenerations.id, id))
      .returning();
    return updatedGeneration;
  }

  async getCodeGeneration(id: string): Promise<CodeGeneration | undefined> {
    const [generation] = await db.select().from(codeGenerations).where(eq(codeGenerations.id, id));
    return generation;
  }

  // Enhanced Infrastructure Operations Implementation
  
  // Deployment Environment operations
  async createDeploymentEnvironment(env: InsertDeploymentEnvironment): Promise<DeploymentEnvironment> {
    const [newEnv] = await db
      .insert(deploymentEnvironments)
      .values(env)
      .returning();
    return newEnv;
  }

  async getDeploymentEnvironment(id: string): Promise<DeploymentEnvironment | undefined> {
    const [env] = await db.select().from(deploymentEnvironments).where(eq(deploymentEnvironments.id, id));
    return env;
  }

  async getProjectEnvironments(projectId: string): Promise<DeploymentEnvironment[]> {
    return await db.select().from(deploymentEnvironments)
      .where(eq(deploymentEnvironments.projectId, projectId))
      .orderBy(desc(deploymentEnvironments.createdAt));
  }

  async updateDeploymentEnvironment(id: string, updates: Partial<DeploymentEnvironment>): Promise<DeploymentEnvironment | undefined> {
    const [updatedEnv] = await db
      .update(deploymentEnvironments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(deploymentEnvironments.id, id))
      .returning();
    return updatedEnv;
  }

  async deleteDeploymentEnvironment(id: string): Promise<boolean> {
    const result = await db
      .delete(deploymentEnvironments)
      .where(eq(deploymentEnvironments.id, id));
    return result.rowCount > 0;
  }

  // Health Check operations
  async createHealthCheck(check: InsertHealthCheck): Promise<HealthCheck> {
    const [newCheck] = await db
      .insert(healthChecks)
      .values(check)
      .returning();
    return newCheck;
  }

  async getHealthCheck(id: string): Promise<HealthCheck | undefined> {
    const [check] = await db.select().from(healthChecks).where(eq(healthChecks.id, id));
    return check;
  }

  async getDeploymentHealthChecks(deploymentId: string): Promise<HealthCheck[]> {
    return await db.select().from(healthChecks)
      .where(eq(healthChecks.deploymentId, deploymentId))
      .orderBy(desc(healthChecks.createdAt));
  }

  async updateHealthCheck(id: string, updates: Partial<HealthCheck>): Promise<HealthCheck | undefined> {
    const [updatedCheck] = await db
      .update(healthChecks)
      .set(updates)
      .where(eq(healthChecks.id, id))
      .returning();
    return updatedCheck;
  }

  async deleteHealthCheck(id: string): Promise<boolean> {
    const result = await db
      .delete(healthChecks)
      .where(eq(healthChecks.id, id));
    return result.rowCount > 0;
  }

  // Load Balancer operations
  async createLoadBalancer(lb: InsertLoadBalancer): Promise<LoadBalancer> {
    const [newLb] = await db
      .insert(loadBalancers)
      .values(lb)
      .returning();
    return newLb;
  }

  async getLoadBalancer(id: string): Promise<LoadBalancer | undefined> {
    const [lb] = await db.select().from(loadBalancers).where(eq(loadBalancers.id, id));
    return lb;
  }

  async getProjectLoadBalancers(projectId: string): Promise<LoadBalancer[]> {
    return await db.select().from(loadBalancers)
      .where(eq(loadBalancers.projectId, projectId))
      .orderBy(desc(loadBalancers.createdAt));
  }

  async updateLoadBalancer(id: string, updates: Partial<LoadBalancer>): Promise<LoadBalancer | undefined> {
    const [updatedLb] = await db
      .update(loadBalancers)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(loadBalancers.id, id))
      .returning();
    return updatedLb;
  }

  async deleteLoadBalancer(id: string): Promise<boolean> {
    const result = await db
      .delete(loadBalancers)
      .where(eq(loadBalancers.id, id));
    return result.rowCount > 0;
  }

  // Auto Scaling Policy operations
  async createAutoScalingPolicy(policy: InsertAutoScalingPolicy): Promise<AutoScalingPolicy> {
    const [newPolicy] = await db
      .insert(autoScalingPolicies)
      .values(policy)
      .returning();
    return newPolicy;
  }

  async getAutoScalingPolicy(id: string): Promise<AutoScalingPolicy | undefined> {
    const [policy] = await db.select().from(autoScalingPolicies).where(eq(autoScalingPolicies.id, id));
    return policy;
  }

  async getProjectAutoScalingPolicies(projectId: string): Promise<AutoScalingPolicy[]> {
    return await db.select().from(autoScalingPolicies)
      .where(eq(autoScalingPolicies.projectId, projectId))
      .orderBy(desc(autoScalingPolicies.createdAt));
  }

  async updateAutoScalingPolicy(id: string, updates: Partial<AutoScalingPolicy>): Promise<AutoScalingPolicy | undefined> {
    const [updatedPolicy] = await db
      .update(autoScalingPolicies)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(autoScalingPolicies.id, id))
      .returning();
    return updatedPolicy;
  }

  async deleteAutoScalingPolicy(id: string): Promise<boolean> {
    const result = await db
      .delete(autoScalingPolicies)
      .where(eq(autoScalingPolicies.id, id));
    return result.rowCount > 0;
  }

  // =====================================================
  // Enterprise Migration System Operations Implementation
  // =====================================================

  // Legacy System Assessment operations
  async createLegacySystemAssessment(assessment: InsertLegacySystemAssessment): Promise<LegacySystemAssessment> {
    const [newAssessment] = await db
      .insert(legacySystemAssessments)
      .values(assessment)
      .returning();
    return newAssessment;
  }

  async getLegacySystemAssessment(id: string): Promise<LegacySystemAssessment | undefined> {
    const [assessment] = await db.select().from(legacySystemAssessments)
      .where(eq(legacySystemAssessments.id, id));
    return assessment;
  }

  async getProjectLegacyAssessments(projectId: string): Promise<LegacySystemAssessment[]> {
    return await db.select().from(legacySystemAssessments)
      .where(eq(legacySystemAssessments.projectId, projectId))
      .orderBy(desc(legacySystemAssessments.createdAt));
  }

  async getMigrationProjectAssessments(migrationProjectId: string): Promise<LegacySystemAssessment[]> {
    return await db.select().from(legacySystemAssessments)
      .where(eq(legacySystemAssessments.migrationProjectId, migrationProjectId))
      .orderBy(desc(legacySystemAssessments.createdAt));
  }

  async updateLegacySystemAssessment(id: string, updates: Partial<LegacySystemAssessment>): Promise<LegacySystemAssessment | undefined> {
    const [updatedAssessment] = await db
      .update(legacySystemAssessments)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(legacySystemAssessments.id, id))
      .returning();
    return updatedAssessment;
  }

  async deleteLegacySystemAssessment(id: string): Promise<boolean> {
    const result = await db
      .delete(legacySystemAssessments)
      .where(eq(legacySystemAssessments.id, id));
    return result.rowCount > 0;
  }

  // Code Modernization Task operations
  async createCodeModernizationTask(task: InsertCodeModernizationTask): Promise<CodeModernizationTask> {
    const [newTask] = await db
      .insert(codeModernizationTasks)
      .values(task)
      .returning();
    return newTask;
  }

  async getCodeModernizationTask(id: string): Promise<CodeModernizationTask | undefined> {
    const [task] = await db.select().from(codeModernizationTasks)
      .where(eq(codeModernizationTasks.id, id));
    return task;
  }

  async getProjectModernizationTasks(projectId: string): Promise<CodeModernizationTask[]> {
    return await db.select().from(codeModernizationTasks)
      .where(eq(codeModernizationTasks.projectId, projectId))
      .orderBy(desc(codeModernizationTasks.createdAt));
  }

  async getMigrationProjectTasks(migrationProjectId: string): Promise<CodeModernizationTask[]> {
    return await db.select().from(codeModernizationTasks)
      .where(eq(codeModernizationTasks.migrationProjectId, migrationProjectId))
      .orderBy(desc(codeModernizationTasks.createdAt));
  }

  async getLegacySystemTasks(legacySystemId: string): Promise<CodeModernizationTask[]> {
    return await db.select().from(codeModernizationTasks)
      .where(eq(codeModernizationTasks.legacySystemId, legacySystemId))
      .orderBy(desc(codeModernizationTasks.createdAt));
  }

  async getUserAssignedTasks(userId: string): Promise<CodeModernizationTask[]> {
    return await db.select().from(codeModernizationTasks)
      .where(eq(codeModernizationTasks.assignedTo, userId))
      .orderBy(desc(codeModernizationTasks.createdAt));
  }

  async updateCodeModernizationTask(id: string, updates: Partial<CodeModernizationTask>): Promise<CodeModernizationTask | undefined> {
    const [updatedTask] = await db
      .update(codeModernizationTasks)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(codeModernizationTasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteCodeModernizationTask(id: string): Promise<boolean> {
    const result = await db
      .delete(codeModernizationTasks)
      .where(eq(codeModernizationTasks.id, id));
    return result.rowCount > 0;
  }

  // Custom AI Model operations
  async createCustomAiModel(model: InsertCustomAiModel): Promise<CustomAiModel> {
    const [newModel] = await db
      .insert(customAiModels)
      .values(model)
      .returning();
    return newModel;
  }

  async getCustomAiModel(id: string): Promise<CustomAiModel | undefined> {
    const [model] = await db.select().from(customAiModels)
      .where(eq(customAiModels.id, id));
    return model;
  }

  async getProjectCustomModels(projectId: string): Promise<CustomAiModel[]> {
    return await db.select().from(customAiModels)
      .where(eq(customAiModels.projectId, projectId))
      .orderBy(desc(customAiModels.createdAt));
  }

  async getActiveCustomModels(projectId: string): Promise<CustomAiModel[]> {
    return await db.select().from(customAiModels)
      .where(and(
        eq(customAiModels.projectId, projectId),
        eq(customAiModels.isActive, true)
      ))
      .orderBy(desc(customAiModels.createdAt));
  }

  async getCustomModelsByType(projectId: string, modelType: string): Promise<CustomAiModel[]> {
    return await db.select().from(customAiModels)
      .where(and(
        eq(customAiModels.projectId, projectId),
        eq(customAiModels.modelType, modelType)
      ))
      .orderBy(desc(customAiModels.createdAt));
  }

  async updateCustomAiModel(id: string, updates: Partial<CustomAiModel>): Promise<CustomAiModel | undefined> {
    const [updatedModel] = await db
      .update(customAiModels)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(customAiModels.id, id))
      .returning();
    return updatedModel;
  }

  async deleteCustomAiModel(id: string): Promise<boolean> {
    const result = await db
      .delete(customAiModels)
      .where(eq(customAiModels.id, id));
    return result.rowCount > 0;
  }

  // Migration Execution Log operations
  async createMigrationExecutionLog(log: InsertMigrationExecutionLog): Promise<MigrationExecutionLog> {
    const [newLog] = await db
      .insert(migrationExecutionLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getMigrationExecutionLog(id: string): Promise<MigrationExecutionLog | undefined> {
    const [log] = await db.select().from(migrationExecutionLogs)
      .where(eq(migrationExecutionLogs.id, id));
    return log;
  }

  async getMigrationProjectLogs(migrationProjectId: string): Promise<MigrationExecutionLog[]> {
    return await db.select().from(migrationExecutionLogs)
      .where(eq(migrationExecutionLogs.migrationProjectId, migrationProjectId))
      .orderBy(desc(migrationExecutionLogs.createdAt));
  }

  async getMigrationLogsByPhase(migrationProjectId: string, phase: string): Promise<MigrationExecutionLog[]> {
    return await db.select().from(migrationExecutionLogs)
      .where(and(
        eq(migrationExecutionLogs.migrationProjectId, migrationProjectId),
        eq(migrationExecutionLogs.executionPhase, phase)
      ))
      .orderBy(desc(migrationExecutionLogs.createdAt));
  }

  async getMigrationLogsByStatus(migrationProjectId: string, status: string): Promise<MigrationExecutionLog[]> {
    return await db.select().from(migrationExecutionLogs)
      .where(and(
        eq(migrationExecutionLogs.migrationProjectId, migrationProjectId),
        eq(migrationExecutionLogs.status, status)
      ))
      .orderBy(desc(migrationExecutionLogs.createdAt));
  }

  async updateMigrationExecutionLog(id: string, updates: Partial<MigrationExecutionLog>): Promise<MigrationExecutionLog | undefined> {
    const [updatedLog] = await db
      .update(migrationExecutionLogs)
      .set(updates)
      .where(eq(migrationExecutionLogs.id, id))
      .returning();
    return updatedLog;
  }

  // Migration Assessment Finding operations
  async createMigrationAssessmentFinding(finding: InsertMigrationAssessmentFinding): Promise<MigrationAssessmentFinding> {
    const [newFinding] = await db
      .insert(migrationAssessmentFindings)
      .values(finding)
      .returning();
    return newFinding;
  }

  async getMigrationAssessmentFinding(id: string): Promise<MigrationAssessmentFinding | undefined> {
    const [finding] = await db.select().from(migrationAssessmentFindings)
      .where(eq(migrationAssessmentFindings.id, id));
    return finding;
  }

  async getAssessmentFindings(assessmentId: string): Promise<MigrationAssessmentFinding[]> {
    return await db.select().from(migrationAssessmentFindings)
      .where(eq(migrationAssessmentFindings.assessmentId, assessmentId))
      .orderBy(desc(migrationAssessmentFindings.createdAt));
  }

  async getFindingsBySeverity(assessmentId: string, severity: string): Promise<MigrationAssessmentFinding[]> {
    return await db.select().from(migrationAssessmentFindings)
      .where(and(
        eq(migrationAssessmentFindings.assessmentId, assessmentId),
        eq(migrationAssessmentFindings.severity, severity)
      ))
      .orderBy(desc(migrationAssessmentFindings.createdAt));
  }

  async getFindingsByType(assessmentId: string, findingType: string): Promise<MigrationAssessmentFinding[]> {
    return await db.select().from(migrationAssessmentFindings)
      .where(and(
        eq(migrationAssessmentFindings.assessmentId, assessmentId),
        eq(migrationAssessmentFindings.findingType, findingType)
      ))
      .orderBy(desc(migrationAssessmentFindings.createdAt));
  }

  async getOpenFindings(assessmentId: string): Promise<MigrationAssessmentFinding[]> {
    return await db.select().from(migrationAssessmentFindings)
      .where(and(
        eq(migrationAssessmentFindings.assessmentId, assessmentId),
        eq(migrationAssessmentFindings.status, "open")
      ))
      .orderBy(desc(migrationAssessmentFindings.createdAt));
  }

  async updateMigrationAssessmentFinding(id: string, updates: Partial<MigrationAssessmentFinding>): Promise<MigrationAssessmentFinding | undefined> {
    const [updatedFinding] = await db
      .update(migrationAssessmentFindings)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(migrationAssessmentFindings.id, id))
      .returning();
    return updatedFinding;
  }

  async deleteMigrationAssessmentFinding(id: string): Promise<boolean> {
    const result = await db
      .delete(migrationAssessmentFindings)
      .where(eq(migrationAssessmentFindings.id, id));
    return result.rowCount > 0;
  }

  // Migration Cost Analysis operations
  async createMigrationCostAnalysis(analysis: InsertMigrationCostAnalysis): Promise<MigrationCostAnalysis> {
    const [newAnalysis] = await db
      .insert(migrationCostAnalysis)
      .values(analysis)
      .returning();
    return newAnalysis;
  }

  async getMigrationCostAnalysis(id: string): Promise<MigrationCostAnalysis | undefined> {
    const [analysis] = await db.select().from(migrationCostAnalysis)
      .where(eq(migrationCostAnalysis.id, id));
    return analysis;
  }

  async getMigrationProjectCostAnalyses(migrationProjectId: string): Promise<MigrationCostAnalysis[]> {
    return await db.select().from(migrationCostAnalysis)
      .where(eq(migrationCostAnalysis.migrationProjectId, migrationProjectId))
      .orderBy(desc(migrationCostAnalysis.createdAt));
  }

  async getLatestCostAnalysis(migrationProjectId: string): Promise<MigrationCostAnalysis | undefined> {
    const [analysis] = await db.select().from(migrationCostAnalysis)
      .where(eq(migrationCostAnalysis.migrationProjectId, migrationProjectId))
      .orderBy(desc(migrationCostAnalysis.analyzedAt))
      .limit(1);
    return analysis;
  }

  async getCostAnalysesByType(migrationProjectId: string, analysisType: string): Promise<MigrationCostAnalysis[]> {
    return await db.select().from(migrationCostAnalysis)
      .where(and(
        eq(migrationCostAnalysis.migrationProjectId, migrationProjectId),
        eq(migrationCostAnalysis.analysisType, analysisType)
      ))
      .orderBy(desc(migrationCostAnalysis.createdAt));
  }

  async updateMigrationCostAnalysis(id: string, updates: Partial<MigrationCostAnalysis>): Promise<MigrationCostAnalysis | undefined> {
    const [updatedAnalysis] = await db
      .update(migrationCostAnalysis)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(migrationCostAnalysis.id, id))
      .returning();
    return updatedAnalysis;
  }

  async deleteMigrationCostAnalysis(id: string): Promise<boolean> {
    const result = await db
      .delete(migrationCostAnalysis)
      .where(eq(migrationCostAnalysis.id, id));
    return result.rowCount > 0;
  }

  // Enhanced Migration Project operations
  async createMigrationProject(migrationProject: InsertMigrationProject): Promise<MigrationProject> {
    const [newMigrationProject] = await db
      .insert(migrationProjects)
      .values(migrationProject)
      .returning();
    return newMigrationProject;
  }

  async getMigrationProject(id: string): Promise<MigrationProject | undefined> {
    const [migrationProject] = await db.select().from(migrationProjects)
      .where(eq(migrationProjects.id, id));
    return migrationProject;
  }

  async getProjectMigrationProjects(projectId: string): Promise<MigrationProject[]> {
    return await db.select().from(migrationProjects)
      .where(eq(migrationProjects.projectId, projectId))
      .orderBy(desc(migrationProjects.createdAt));
  }

  async getUserMigrationProjects(userId: string): Promise<MigrationProject[]> {
    return await db.select().from(migrationProjects)
      .where(eq(migrationProjects.assignedTo, userId))
      .orderBy(desc(migrationProjects.createdAt));
  }

  async getMigrationProjectsByStatus(status: string): Promise<MigrationProject[]> {
    return await db.select().from(migrationProjects)
      .where(eq(migrationProjects.status, status))
      .orderBy(desc(migrationProjects.createdAt));
  }

  async updateMigrationProject(id: string, updates: Partial<MigrationProject>): Promise<MigrationProject | undefined> {
    const [updatedMigrationProject] = await db
      .update(migrationProjects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(migrationProjects.id, id))
      .returning();
    return updatedMigrationProject;
  }

  async deleteMigrationProject(id: string): Promise<boolean> {
    const result = await db
      .delete(migrationProjects)
      .where(eq(migrationProjects.id, id));
    return result.rowCount > 0;
  }

  // =====================================================
  // INTEGRATIONS HUB OPERATIONS IMPLEMENTATION
  // =====================================================

  // Integration operations
  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [newIntegration] = await db
      .insert(integrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async getIntegration(id: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations)
      .where(eq(integrations.id, id));
    return integration;
  }

  async getUserIntegrations(userId: string, filters?: {
    projectId?: string;
    type?: string;
    service?: string;
    status?: string;
  }): Promise<Integration[]> {
    const conditions = [eq(integrations.userId, userId)];
    
    if (filters?.projectId) {
      conditions.push(eq(integrations.projectId, filters.projectId));
    }
    if (filters?.type) {
      conditions.push(eq(integrations.type, filters.type));
    }
    if (filters?.service) {
      conditions.push(eq(integrations.service, filters.service));
    }
    if (filters?.status) {
      conditions.push(eq(integrations.status, filters.status));
    }

    return await db.select().from(integrations)
      .where(and(...conditions))
      .orderBy(desc(integrations.createdAt));
  }

  async getProjectIntegrations(projectId: string): Promise<Integration[]> {
    return await db.select().from(integrations)
      .where(eq(integrations.projectId, projectId))
      .orderBy(desc(integrations.createdAt));
  }

  async updateIntegration(id: string, updates: Partial<Integration>): Promise<Integration | undefined> {
    const [updatedIntegration] = await db
      .update(integrations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(integrations.id, id))
      .returning();
    return updatedIntegration;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const result = await db.delete(integrations).where(eq(integrations.id, id));
    return result.rowCount > 0;
  }

  async getIntegrationsByService(service: string): Promise<Integration[]> {
    return await db.select().from(integrations)
      .where(eq(integrations.service, service))
      .orderBy(desc(integrations.createdAt));
  }

  async getIntegrationsByType(type: string): Promise<Integration[]> {
    return await db.select().from(integrations)
      .where(eq(integrations.type, type))
      .orderBy(desc(integrations.createdAt));
  }

  // Integration Secrets operations
  async createIntegrationSecret(secret: InsertIntegrationSecret): Promise<IntegrationSecret> {
    const [newSecret] = await db
      .insert(integrationSecrets)
      .values(secret)
      .returning();
    return newSecret;
  }

  async getIntegrationSecret(id: string): Promise<IntegrationSecret | undefined> {
    const [secret] = await db.select().from(integrationSecrets)
      .where(eq(integrationSecrets.id, id));
    return secret;
  }

  async getIntegrationSecrets(integrationId: string): Promise<IntegrationSecret[]> {
    return await db.select().from(integrationSecrets)
      .where(eq(integrationSecrets.integrationId, integrationId))
      .orderBy(desc(integrationSecrets.createdAt));
  }

  async updateIntegrationSecret(id: string, updates: Partial<IntegrationSecret>): Promise<IntegrationSecret | undefined> {
    const [updatedSecret] = await db
      .update(integrationSecrets)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(integrationSecrets.id, id))
      .returning();
    return updatedSecret;
  }

  async deleteIntegrationSecret(id: string): Promise<boolean> {
    const result = await db.delete(integrationSecrets).where(eq(integrationSecrets.id, id));
    return result.rowCount > 0;
  }

  async getSecretByName(integrationId: string, secretName: string): Promise<IntegrationSecret | undefined> {
    const [secret] = await db.select().from(integrationSecrets)
      .where(and(
        eq(integrationSecrets.integrationId, integrationId),
        eq(integrationSecrets.secretName, secretName)
      ));
    return secret;
  }

  // Repository Connection operations
  async createRepositoryConnection(connection: InsertRepositoryConnection): Promise<RepositoryConnection> {
    const [newConnection] = await db
      .insert(repositoryConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getRepositoryConnection(id: string): Promise<RepositoryConnection | undefined> {
    const [connection] = await db.select().from(repositoryConnections)
      .where(eq(repositoryConnections.id, id));
    return connection;
  }

  async getIntegrationRepositoryConnections(integrationId: string): Promise<RepositoryConnection[]> {
    return await db.select().from(repositoryConnections)
      .where(eq(repositoryConnections.integrationId, integrationId))
      .orderBy(desc(repositoryConnections.createdAt));
  }

  async getProjectRepositoryConnections(projectId: string): Promise<RepositoryConnection[]> {
    return await db.select().from(repositoryConnections)
      .where(eq(repositoryConnections.projectId, projectId))
      .orderBy(desc(repositoryConnections.createdAt));
  }

  async updateRepositoryConnection(id: string, updates: Partial<RepositoryConnection>): Promise<RepositoryConnection | undefined> {
    const [updatedConnection] = await db
      .update(repositoryConnections)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(repositoryConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteRepositoryConnection(id: string): Promise<boolean> {
    const result = await db.delete(repositoryConnections).where(eq(repositoryConnections.id, id));
    return result.rowCount > 0;
  }

  async getRepositoryConnectionByRepo(integrationId: string, repositoryId: string): Promise<RepositoryConnection | undefined> {
    const [connection] = await db.select().from(repositoryConnections)
      .where(and(
        eq(repositoryConnections.integrationId, integrationId),
        eq(repositoryConnections.repositoryId, repositoryId)
      ));
    return connection;
  }

  // API Connection operations
  async createApiConnection(connection: InsertApiConnection): Promise<ApiConnection> {
    const [newConnection] = await db
      .insert(apiConnections)
      .values(connection)
      .returning();
    return newConnection;
  }

  async getApiConnection(id: string): Promise<ApiConnection | undefined> {
    const [connection] = await db.select().from(apiConnections)
      .where(eq(apiConnections.id, id));
    return connection;
  }

  async getIntegrationApiConnections(integrationId: string): Promise<ApiConnection[]> {
    return await db.select().from(apiConnections)
      .where(eq(apiConnections.integrationId, integrationId))
      .orderBy(desc(apiConnections.createdAt));
  }

  async updateApiConnection(id: string, updates: Partial<ApiConnection>): Promise<ApiConnection | undefined> {
    const [updatedConnection] = await db
      .update(apiConnections)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(apiConnections.id, id))
      .returning();
    return updatedConnection;
  }

  async deleteApiConnection(id: string): Promise<boolean> {
    const result = await db.delete(apiConnections).where(eq(apiConnections.id, id));
    return result.rowCount > 0;
  }

  async getApiConnectionsByService(service: string): Promise<ApiConnection[]> {
    return await db.select().from(apiConnections)
      .where(eq(apiConnections.service, service))
      .orderBy(desc(apiConnections.createdAt));
  }

  // Integration Health Check operations
  async createIntegrationHealthCheck(healthCheck: InsertIntegrationHealthCheck): Promise<IntegrationHealthCheck> {
    const [newHealthCheck] = await db
      .insert(integrationHealthChecks)
      .values(healthCheck)
      .returning();
    return newHealthCheck;
  }

  async getIntegrationHealthCheck(id: string): Promise<IntegrationHealthCheck | undefined> {
    const [healthCheck] = await db.select().from(integrationHealthChecks)
      .where(eq(integrationHealthChecks.id, id));
    return healthCheck;
  }

  async getIntegrationHealthChecks(integrationId: string): Promise<IntegrationHealthCheck[]> {
    return await db.select().from(integrationHealthChecks)
      .where(eq(integrationHealthChecks.integrationId, integrationId))
      .orderBy(desc(integrationHealthChecks.checkedAt));
  }

  async getLatestHealthCheck(integrationId: string): Promise<IntegrationHealthCheck | undefined> {
    const [healthCheck] = await db.select().from(integrationHealthChecks)
      .where(eq(integrationHealthChecks.integrationId, integrationId))
      .orderBy(desc(integrationHealthChecks.checkedAt))
      .limit(1);
    return healthCheck;
  }

  async updateIntegrationHealthCheck(id: string, updates: Partial<IntegrationHealthCheck>): Promise<IntegrationHealthCheck | undefined> {
    const [updatedHealthCheck] = await db
      .update(integrationHealthChecks)
      .set(updates)
      .where(eq(integrationHealthChecks.id, id))
      .returning();
    return updatedHealthCheck;
  }

  async getHealthyIntegrations(): Promise<Integration[]> {
    // This would require a JOIN query to get integrations with healthy status
    // For now, return all active integrations - would need proper health check join
    return await db.select().from(integrations)
      .where(eq(integrations.status, 'active'))
      .orderBy(desc(integrations.updatedAt));
  }

  async getUnhealthyIntegrations(): Promise<Integration[]> {
    // Similar to above - would need proper health check join
    return await db.select().from(integrations)
      .where(eq(integrations.status, 'error'))
      .orderBy(desc(integrations.updatedAt));
  }

  // Integration Audit Log operations
  async createIntegrationAuditLog(log: InsertIntegrationAuditLog): Promise<IntegrationAuditLog> {
    const [newLog] = await db
      .insert(integrationAuditLogs)
      .values(log)
      .returning();
    return newLog;
  }

  async getIntegrationAuditLogs(integrationId: string, limit: number = 100): Promise<IntegrationAuditLog[]> {
    return await db.select().from(integrationAuditLogs)
      .where(eq(integrationAuditLogs.integrationId, integrationId))
      .orderBy(desc(integrationAuditLogs.createdAt))
      .limit(limit);
  }

  async getUserAuditLogs(userId: string, limit: number = 100): Promise<IntegrationAuditLog[]> {
    return await db.select().from(integrationAuditLogs)
      .where(eq(integrationAuditLogs.userId, userId))
      .orderBy(desc(integrationAuditLogs.createdAt))
      .limit(limit);
  }

  async getAuditLogsByAction(action: string, limit: number = 100): Promise<IntegrationAuditLog[]> {
    return await db.select().from(integrationAuditLogs)
      .where(eq(integrationAuditLogs.action, action))
      .orderBy(desc(integrationAuditLogs.createdAt))
      .limit(limit);
  }

  // Webhook Configuration operations
  async createWebhookConfiguration(webhook: InsertWebhookConfiguration): Promise<WebhookConfiguration> {
    const [newWebhook] = await db
      .insert(webhookConfigurations)
      .values(webhook)
      .returning();
    return newWebhook;
  }

  async getWebhookConfiguration(id: string): Promise<WebhookConfiguration | undefined> {
    const [webhook] = await db.select().from(webhookConfigurations)
      .where(eq(webhookConfigurations.id, id));
    return webhook;
  }

  async getIntegrationWebhooks(integrationId: string): Promise<WebhookConfiguration[]> {
    return await db.select().from(webhookConfigurations)
      .where(eq(webhookConfigurations.integrationId, integrationId))
      .orderBy(desc(webhookConfigurations.createdAt));
  }

  async updateWebhookConfiguration(id: string, updates: Partial<WebhookConfiguration>): Promise<WebhookConfiguration | undefined> {
    const [updatedWebhook] = await db
      .update(webhookConfigurations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(webhookConfigurations.id, id))
      .returning();
    return updatedWebhook;
  }

  async deleteWebhookConfiguration(id: string): Promise<boolean> {
    const result = await db.delete(webhookConfigurations).where(eq(webhookConfigurations.id, id));
    return result.rowCount > 0;
  }

  async getActiveWebhooks(): Promise<WebhookConfiguration[]> {
    return await db.select().from(webhookConfigurations)
      .where(eq(webhookConfigurations.active, true))
      .orderBy(desc(webhookConfigurations.updatedAt));
  }

  // API Rate Limit operations
  async createApiRateLimit(rateLimit: InsertApiRateLimit): Promise<ApiRateLimit> {
    const [newRateLimit] = await db
      .insert(apiRateLimits)
      .values(rateLimit)
      .returning();
    return newRateLimit;
  }

  async getApiRateLimit(id: string): Promise<ApiRateLimit | undefined> {
    const [rateLimit] = await db.select().from(apiRateLimits)
      .where(eq(apiRateLimits.id, id));
    return rateLimit;
  }

  async getIntegrationRateLimits(integrationId: string): Promise<ApiRateLimit[]> {
    return await db.select().from(apiRateLimits)
      .where(eq(apiRateLimits.integrationId, integrationId))
      .orderBy(desc(apiRateLimits.createdAt));
  }

  async updateApiRateLimit(id: string, updates: Partial<ApiRateLimit>): Promise<ApiRateLimit | undefined> {
    const [updatedRateLimit] = await db
      .update(apiRateLimits)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(apiRateLimits.id, id))
      .returning();
    return updatedRateLimit;
  }

  async deleteApiRateLimit(id: string): Promise<boolean> {
    const result = await db.delete(apiRateLimits).where(eq(apiRateLimits.id, id));
    return result.rowCount > 0;
  }

  async getRateLimitsByService(service: string): Promise<ApiRateLimit[]> {
    return await db.select().from(apiRateLimits)
      .where(eq(apiRateLimits.service, service))
      .orderBy(desc(apiRateLimits.createdAt));
  }

  // Performance Analytics operations
  async createApmTransaction(transaction: InsertApmTransaction): Promise<ApmTransaction> {
    const [newTransaction] = await db
      .insert(apmTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getApmTransactions(projectId: string, startTime: Date, endTime: Date): Promise<ApmTransaction[]> {
    return await db.select().from(apmTransactions)
      .where(and(
        eq(apmTransactions.projectId, projectId),
        sql`${apmTransactions.startTime} >= ${startTime}`,
        sql`${apmTransactions.startTime} <= ${endTime}`
      ))
      .orderBy(desc(apmTransactions.startTime));
  }

  async createDatabasePerformanceMetric(metric: InsertDatabasePerformanceMetric): Promise<DatabasePerformanceMetric> {
    const [newMetric] = await db
      .insert(databasePerformanceMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getDatabasePerformanceMetrics(projectId: string, startTime: Date, endTime: Date): Promise<DatabasePerformanceMetric[]> {
    return await db.select().from(databasePerformanceMetrics)
      .where(and(
        eq(databasePerformanceMetrics.projectId, projectId),
        sql`${databasePerformanceMetrics.timestamp} >= ${startTime}`,
        sql`${databasePerformanceMetrics.timestamp} <= ${endTime}`
      ))
      .orderBy(desc(databasePerformanceMetrics.timestamp));
  }

  async createRumMetric(metric: InsertRumMetric): Promise<RumMetric> {
    const [newMetric] = await db
      .insert(rumMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getRumMetrics(projectId: string, startTime: Date, endTime: Date): Promise<RumMetric[]> {
    return await db.select().from(rumMetrics)
      .where(and(
        eq(rumMetrics.projectId, projectId),
        sql`${rumMetrics.timestamp} >= ${startTime}`,
        sql`${rumMetrics.timestamp} <= ${endTime}`
      ))
      .orderBy(desc(rumMetrics.timestamp));
  }

  async createTimeSeriesMetric(metric: InsertTimeSeriesMetric): Promise<TimeSeriesMetric> {
    const [newMetric] = await db
      .insert(timeSeriesMetrics)
      .values(metric)
      .returning();
    return newMetric;
  }

  async getTimeSeriesMetrics(projectId: string, resourceId: string | null, startTime: Date, endTime: Date): Promise<TimeSeriesMetric[]> {
    const conditions = [
      eq(timeSeriesMetrics.projectId, projectId),
      sql`${timeSeriesMetrics.timestamp} >= ${startTime}`,
      sql`${timeSeriesMetrics.timestamp} <= ${endTime}`
    ];
    
    if (resourceId) {
      conditions.push(eq(timeSeriesMetrics.resourceId, resourceId));
    }
    
    return await db.select().from(timeSeriesMetrics)
      .where(and(...conditions))
      .orderBy(desc(timeSeriesMetrics.timestamp));
  }

  async createPerformanceBaseline(baseline: InsertPerformanceBaseline): Promise<PerformanceBaseline> {
    const [newBaseline] = await db
      .insert(performanceBaselines)
      .values(baseline)
      .returning();
    return newBaseline;
  }

  async getPerformanceBaselines(projectId: string): Promise<PerformanceBaseline[]> {
    return await db.select().from(performanceBaselines)
      .where(eq(performanceBaselines.projectId, projectId))
      .orderBy(desc(performanceBaselines.createdAt));
  }

  async createLogEntry(logEntry: InsertLogEntry): Promise<LogEntry> {
    const [newLogEntry] = await db
      .insert(logEntries)
      .values(logEntry)
      .returning();
    return newLogEntry;
  }
}

export const storage = new DatabaseStorage();
