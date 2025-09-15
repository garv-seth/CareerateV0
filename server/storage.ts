import { 
  users, 
  projects, 
  codeGenerations,
  type User, 
  type UpsertUser, 
  type Project, 
  type InsertProject, 
  type CodeGeneration, 
  type InsertCodeGeneration 
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
