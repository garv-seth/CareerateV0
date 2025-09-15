import { spawn, ChildProcess } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import fetch from "node-fetch";
import { storage } from "../storage";
import { 
  Deployment, 
  InsertDeployment, 
  DeploymentEnvironment,
  InsertDeploymentEnvironment,
  HealthCheck,
  InsertHealthCheck,
  Project 
} from "@shared/schema";

export interface DeploymentOptions {
  projectId: string;
  version: string;
  strategy: "blue-green" | "rolling" | "canary";
  environment: string;
  agentId?: string;
  buildCommand?: string;
  startCommand?: string;
  port?: number;
}

export interface DeploymentResult {
  deploymentId: string;
  status: "success" | "failed";
  url?: string;
  containerId?: string;
  processId?: string;
  error?: string;
  logs: string[];
}

export class DeploymentManager {
  private runningDeployments = new Map<string, ChildProcess>();
  private healthCheckIntervals = new Map<string, NodeJS.Timer>();
  private deploymentPorts = new Map<string, number>();
  private nextPort = 6000; // Start port allocation from 6000

  constructor() {
    this.startHealthCheckMonitor();
  }

  // Main deployment method that replaces setTimeout simulation
  async deployProject(options: DeploymentOptions): Promise<DeploymentResult> {
    const logs: string[] = [];
    
    try {
      logs.push(`Starting deployment for project ${options.projectId}`);
      
      // Create deployment record
      const deployment = await storage.createDeployment({
        projectId: options.projectId,
        version: options.version,
        strategy: options.strategy,
        environment: options.environment,
        agentId: options.agentId,
        status: "deploying",
        port: options.port || this.allocatePort(),
        startedAt: new Date()
      });

      logs.push(`Deployment record created: ${deployment.id}`);

      // Get project files and configuration
      const project = await storage.getProject(options.projectId);
      if (!project) {
        throw new Error(`Project ${options.projectId} not found`);
      }

      // Setup deployment directory
      const deploymentPath = await this.setupDeploymentDirectory(deployment.id, project);
      logs.push(`Deployment directory setup: ${deploymentPath}`);

      // Build the application
      const buildResult = await this.buildApplication(deploymentPath, options.buildCommand, project.framework);
      logs.push(`Build result: ${buildResult.success ? 'SUCCESS' : 'FAILED'}`);
      if (!buildResult.success) {
        await this.updateDeploymentStatus(deployment.id, "failed", buildResult.error, logs);
        return { deploymentId: deployment.id, status: "failed", error: buildResult.error, logs };
      }

      // Deploy based on strategy
      let deployResult: any;
      switch (options.strategy) {
        case "blue-green":
          deployResult = await this.deployBlueGreen(deployment, deploymentPath, options);
          break;
        case "rolling":
          deployResult = await this.deployRolling(deployment, deploymentPath, options);
          break;
        case "canary":
          deployResult = await this.deployCanary(deployment, deploymentPath, options);
          break;
        default:
          deployResult = await this.deployDirect(deployment, deploymentPath, options);
      }

      logs.push(`Deployment strategy ${options.strategy} completed`);

      if (deployResult.success) {
        // Setup health checks
        await this.setupHealthChecks(deployment.id, deployResult.url, deployment.port);
        logs.push(`Health checks configured for ${deployResult.url}`);

        // Update deployment record with success
        await this.updateDeploymentStatus(
          deployment.id, 
          "deployed", 
          null, 
          logs, 
          {
            deploymentUrl: deployResult.url,
            containerId: deployResult.containerId,
            processId: deployResult.processId?.toString(),
            healthCheckUrl: `${deployResult.url}/health`,
            deployedAt: new Date(),
            completedAt: new Date()
          }
        );

        return {
          deploymentId: deployment.id,
          status: "success",
          url: deployResult.url,
          containerId: deployResult.containerId,
          processId: deployResult.processId?.toString(),
          logs
        };
      } else {
        await this.updateDeploymentStatus(deployment.id, "failed", deployResult.error, logs);
        return { deploymentId: deployment.id, status: "failed", error: deployResult.error, logs };
      }

    } catch (error) {
      const errorMessage = (error as Error).message;
      logs.push(`Deployment failed: ${errorMessage}`);
      
      // Update deployment record with failure
      if (logs.length > 0) {
        try {
          await this.updateDeploymentStatus(
            logs.find(log => log.includes('Deployment record created'))?.split(': ')[1] || '',
            "failed",
            errorMessage,
            logs
          );
        } catch (updateError) {
          console.error('Failed to update deployment status:', updateError);
        }
      }

      return {
        deploymentId: '',
        status: "failed",
        error: errorMessage,
        logs
      };
    }
  }

  private async setupDeploymentDirectory(deploymentId: string, project: Project): Promise<string> {
    const deploymentPath = path.join(process.cwd(), 'deployments', deploymentId);
    await fs.mkdir(deploymentPath, { recursive: true });

    // Write project files to deployment directory
    if (project.files && typeof project.files === 'object') {
      for (const [filePath, content] of Object.entries(project.files)) {
        if (typeof content === 'string') {
          const fullPath = path.join(deploymentPath, filePath);
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          await fs.writeFile(fullPath, content);
        }
      }
    }

    // Create package.json if it doesn't exist
    const packageJsonPath = path.join(deploymentPath, 'package.json');
    try {
      await fs.access(packageJsonPath);
    } catch {
      // Create basic package.json based on project dependencies
      const packageJson = {
        name: project.name?.toLowerCase().replace(/\s+/g, '-') || 'vibe-app',
        version: '1.0.0',
        scripts: {
          start: 'node server.js',
          dev: 'node server.js'
        },
        dependencies: project.dependencies || {}
      };
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    return deploymentPath;
  }

  private async buildApplication(deploymentPath: string, buildCommand?: string, framework?: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const command = buildCommand || this.getDefaultBuildCommand(framework);
      
      if (!command) {
        resolve({ success: true }); // No build step needed
        return;
      }

      const [cmd, ...args] = command.split(' ');
      const buildProcess = spawn(cmd, args, { 
        cwd: deploymentPath,
        stdio: 'pipe'
      });

      let output = '';
      let errorOutput = '';

      buildProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: `Build failed: ${errorOutput || output}` });
        }
      });

      buildProcess.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        buildProcess.kill();
        resolve({ success: false, error: 'Build timeout after 5 minutes' });
      }, 5 * 60 * 1000);
    });
  }

  private getDefaultBuildCommand(framework?: string): string | null {
    switch (framework) {
      case 'react':
      case 'vue':
      case 'next':
        return 'npm install';
      case 'express':
      case 'fastapi':
        return 'npm install';
      default:
        return 'npm install';
    }
  }

  private async deployDirect(deployment: Deployment, deploymentPath: string, options: DeploymentOptions): Promise<any> {
    const port = deployment.port || this.allocatePort();
    const url = `http://localhost:${port}`;

    return new Promise((resolve) => {
      const startCommand = options.startCommand || this.getDefaultStartCommand(options);
      const [cmd, ...args] = startCommand.split(' ');
      
      // Set environment variables
      const env = {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: options.environment === 'production' ? 'production' : 'development'
      };

      const appProcess = spawn(cmd, args, {
        cwd: deploymentPath,
        stdio: 'pipe',
        env
      });

      let output = '';
      let started = false;

      const timeout = setTimeout(() => {
        if (!started) {
          appProcess.kill();
          resolve({ success: false, error: 'Application failed to start within 30 seconds' });
        }
      }, 30000);

      appProcess.stdout?.on('data', (data) => {
        output += data.toString();
        // Check if server started (common patterns)
        if (!started && (output.includes('listening') || output.includes('started') || output.includes(`${port}`))) {
          started = true;
          clearTimeout(timeout);
          
          // Store the process
          this.runningDeployments.set(deployment.id, appProcess);
          this.deploymentPorts.set(deployment.id, port);

          resolve({
            success: true,
            url,
            processId: appProcess.pid,
            containerId: null
          });
        }
      });

      appProcess.stderr?.on('data', (data) => {
        output += data.toString();
      });

      appProcess.on('close', (code) => {
        if (!started) {
          clearTimeout(timeout);
          resolve({ success: false, error: `Process exited with code ${code}: ${output}` });
        }
      });

      appProcess.on('error', (error) => {
        if (!started) {
          clearTimeout(timeout);
          resolve({ success: false, error: error.message });
        }
      });
    });
  }

  private async deployBlueGreen(deployment: Deployment, deploymentPath: string, options: DeploymentOptions): Promise<any> {
    // Blue-green deployment: deploy to new instance, then switch traffic
    const result = await this.deployDirect(deployment, deploymentPath, options);
    
    if (result.success) {
      // In a real implementation, this would involve load balancer configuration
      // For now, we'll simulate the blue-green switch
      await this.simulateTrafficSwitch(deployment.id, result.url);
    }
    
    return result;
  }

  private async deployRolling(deployment: Deployment, deploymentPath: string, options: DeploymentOptions): Promise<any> {
    // Rolling deployment: gradual replacement of instances
    // For simplicity, we'll use direct deployment but with health checks
    const result = await this.deployDirect(deployment, deploymentPath, options);
    
    if (result.success) {
      // Wait for health check before considering it fully rolled out
      await this.waitForHealthy(result.url);
    }
    
    return result;
  }

  private async deployCanary(deployment: Deployment, deploymentPath: string, options: DeploymentOptions): Promise<any> {
    // Canary deployment: deploy to subset of traffic first
    const result = await this.deployDirect(deployment, deploymentPath, options);
    
    if (result.success) {
      // In a real implementation, this would configure canary traffic routing
      await this.simulateCanaryDeployment(deployment.id, result.url);
    }
    
    return result;
  }

  private getDefaultStartCommand(options: DeploymentOptions): string {
    // Generate appropriate start command based on project type
    return 'npm start';
  }

  private allocatePort(): number {
    return this.nextPort++;
  }

  private async setupHealthChecks(deploymentId: string, url: string, port?: number): Promise<void> {
    const healthCheck: InsertHealthCheck = {
      deploymentId,
      checkType: "http",
      endpoint: `${url}/health`,
      expectedResponse: "OK",
      timeout: 30,
      interval: 30,
      retries: 3
    };

    await storage.createHealthCheck(healthCheck);

    // Start health check monitoring
    this.startHealthCheckForDeployment(deploymentId, healthCheck);
  }

  private startHealthCheckForDeployment(deploymentId: string, healthCheck: HealthCheck): void {
    const interval = setInterval(async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(healthCheck.endpoint || '', {
          timeout: (healthCheck.timeout || 30) * 1000
        });
        
        const responseTime = Date.now() - startTime;
        const isHealthy = response.ok;

        await storage.updateHealthCheck(healthCheck.id, {
          status: isHealthy ? "healthy" : "unhealthy",
          lastCheck: new Date(),
          responseTime,
          failureCount: isHealthy ? 0 : (healthCheck.failureCount || 0) + 1,
          lastSuccessful: isHealthy ? new Date() : healthCheck.lastSuccessful,
          errorMessage: isHealthy ? null : `HTTP ${response.status}`
        });

        // Update deployment health status
        await storage.updateDeployment(deploymentId, {
          healthStatus: isHealthy ? "healthy" : "unhealthy",
          lastHealthCheck: new Date()
        });

      } catch (error) {
        await storage.updateHealthCheck(healthCheck.id, {
          status: "unhealthy",
          lastCheck: new Date(),
          failureCount: (healthCheck.failureCount || 0) + 1,
          errorMessage: (error as Error).message
        });

        await storage.updateDeployment(deploymentId, {
          healthStatus: "unhealthy",
          lastHealthCheck: new Date()
        });
      }
    }, (healthCheck.interval || 60) * 1000);

    this.healthCheckIntervals.set(deploymentId, interval);
  }

  private startHealthCheckMonitor(): void {
    // Start monitoring for all active deployments on startup
    setInterval(async () => {
      try {
        // This would get all active deployments and ensure health checks are running
        // Implementation depends on storage methods
      } catch (error) {
        console.error('Health check monitor error:', error);
      }
    }, 60000); // Check every minute
  }

  private async simulateTrafficSwitch(deploymentId: string, url: string): Promise<void> {
    // In a real implementation, this would configure load balancer
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private async simulateCanaryDeployment(deploymentId: string, url: string): Promise<void> {
    // In a real implementation, this would configure canary routing
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  private async waitForHealthy(url: string): Promise<boolean> {
    const maxAttempts = 10;
    const delay = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${url}/health`, { timeout: 5000 });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Health check failed, continue trying
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return false;
  }

  private async updateDeploymentStatus(
    deploymentId: string, 
    status: string, 
    error?: string | null, 
    logs?: string[], 
    updates: Partial<Deployment> = {}
  ): Promise<void> {
    await storage.updateDeployment(deploymentId, {
      status,
      errorLogs: error || undefined,
      deploymentLogs: logs?.join('\n'),
      ...updates
    });
  }

  // Rollback functionality
  async rollbackDeployment(deploymentId: string, rollbackVersion?: string): Promise<DeploymentResult> {
    const logs: string[] = [];
    
    try {
      logs.push(`Starting rollback for deployment ${deploymentId}`);

      // Stop current deployment
      await this.stopDeployment(deploymentId);
      
      // Get deployment info
      const deployment = await storage.getDeployment(deploymentId);
      if (!deployment) {
        throw new Error(`Deployment ${deploymentId} not found`);
      }

      // Deploy previous version
      const rollbackOptions: DeploymentOptions = {
        projectId: deployment.projectId,
        version: rollbackVersion || deployment.rollbackVersion || 'previous',
        strategy: deployment.strategy as any,
        environment: deployment.environment,
        agentId: deployment.agentId
      };

      const rollbackResult = await this.deployProject(rollbackOptions);
      
      if (rollbackResult.status === 'success') {
        // Update original deployment status
        await storage.updateDeployment(deploymentId, {
          status: "rolled-back",
          completedAt: new Date()
        });
        
        logs.push(`Rollback completed successfully`);
      }

      return rollbackResult;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      logs.push(`Rollback failed: ${errorMessage}`);
      
      return {
        deploymentId,
        status: "failed",
        error: errorMessage,
        logs
      };
    }
  }

  async stopDeployment(deploymentId: string): Promise<boolean> {
    const process = this.runningDeployments.get(deploymentId);
    if (process) {
      process.kill();
      this.runningDeployments.delete(deploymentId);
    }

    const healthCheckInterval = this.healthCheckIntervals.get(deploymentId);
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      this.healthCheckIntervals.delete(deploymentId);
    }

    this.deploymentPorts.delete(deploymentId);

    // Update deployment status
    await storage.updateDeployment(deploymentId, {
      status: "stopped",
      completedAt: new Date()
    });

    return true;
  }

  async getDeploymentStatus(deploymentId: string): Promise<{
    deployment: Deployment | undefined;
    healthChecks: HealthCheck[];
    isRunning: boolean;
  }> {
    const deployment = await storage.getDeployment(deploymentId);
    const healthChecks = deployment ? await storage.getDeploymentHealthChecks(deploymentId) : [];
    const isRunning = this.runningDeployments.has(deploymentId);

    return {
      deployment,
      healthChecks,
      isRunning
    };
  }

  async getRunningDeployments(): Promise<string[]> {
    return Array.from(this.runningDeployments.keys());
  }
}

export const deploymentManager = new DeploymentManager();