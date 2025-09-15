import { type User, type InsertUser, type Project, type InsertProject, type CodeGeneration, type InsertCodeGeneration } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private codeGenerations: Map<string, CodeGeneration>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.codeGenerations = new Map();
    
    // Create a demo user and projects
    this.initDemoData();
  }

  private async initDemoData() {
    const demoUser: User = {
      id: "demo-user-1",
      username: "demo",
      email: "demo@careerate.com",
      password: "demo123",
      createdAt: new Date(),
    };
    this.users.set(demoUser.id, demoUser);

    const demoProjects: Project[] = [
      {
        id: "project-1",
        userId: demoUser.id,
        name: "E-commerce Platform",
        description: "Full-stack React app with Stripe integration",
        framework: "react",
        files: {
          "src/App.tsx": "import React from 'react';\n\nfunction App() {\n  return <div>E-commerce App</div>;\n}\n\nexport default App;",
          "src/components/ProductCard.tsx": "export function ProductCard() {\n  return <div>Product Card</div>;\n}"
        },
        status: "deployed",
        deploymentUrl: "https://ecommerce-demo.careerate.dev",
        createdAt: new Date(Date.now() - 86400000 * 5),
        updatedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        id: "project-2",
        userId: demoUser.id,
        name: "Task Manager App",
        description: "React Native app with real-time sync",
        framework: "react-native",
        files: {},
        status: "building",
        deploymentUrl: null,
        createdAt: new Date(Date.now() - 86400000 * 2),
        updatedAt: new Date(),
      },
      {
        id: "project-3",
        userId: demoUser.id,
        name: "Analytics Dashboard",
        description: "Vue.js dashboard with real-time charts",
        framework: "vue",
        files: {},
        status: "deployed",
        deploymentUrl: "https://analytics-demo.careerate.dev",
        createdAt: new Date(Date.now() - 86400000 * 10),
        updatedAt: new Date(Date.now() - 86400000 * 3),
      }
    ];

    demoProjects.forEach(project => {
      this.projects.set(project.id, project);
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(project => project.userId === userId);
  }

  async createProject(project: InsertProject & { userId: string }): Promise<Project> {
    const id = randomUUID();
    const newProject: Project = {
      ...project,
      id,
      files: {},
      status: "draft",
      deploymentUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.projects.set(id, newProject);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updatedProject = { 
      ...project, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: string): Promise<boolean> {
    return this.projects.delete(id);
  }

  async createCodeGeneration(generation: InsertCodeGeneration): Promise<CodeGeneration> {
    const id = randomUUID();
    const newGeneration: CodeGeneration = {
      ...generation,
      id,
      generatedCode: null,
      success: false,
      createdAt: new Date(),
    };
    this.codeGenerations.set(id, newGeneration);
    return newGeneration;
  }

  async getCodeGenerationsByProjectId(projectId: string): Promise<CodeGeneration[]> {
    return Array.from(this.codeGenerations.values()).filter(gen => gen.projectId === projectId);
  }
}

export const storage = new MemStorage();
