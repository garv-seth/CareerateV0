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
  type ApiDocumentation
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
