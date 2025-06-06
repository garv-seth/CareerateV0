import { MCPClient, MCPServer } from '@modelcontextprotocol/sdk';
import { Server as NodeHttpServer } from 'http';
import { WebSocket } from 'ws';

interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  type: 'local' | 'remote';
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
}

interface MCPInvocationParams {
  method: string;
  params: Record<string, any>;
  timeout?: number;
}

export class MCPManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private clients: Map<string, MCPClient> = new Map();
  private localServers: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    try {
      console.log('🔗 Initializing MCP Manager...');

      // Initialize built-in MCP servers
      await this.initializeBuiltInServers();

      // Discover and connect to external MCP servers
      await this.discoverExternalServers();

      console.log('✅ MCP Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MCP Manager:', error);
      throw error;
    }
  }

  private async initializeBuiltInServers(): Promise<void> {
    try {
      // Register Terraform MCP Server
      const terraformServer = {
        id: 'terraform-server',
        name: 'Terraform MCP Server',
        url: 'local://terraform',
        type: 'local' as const,
        capabilities: ['validate', 'plan', 'format', 'security-scan'],
        status: 'active' as const
      };
      this.servers.set('terraform-server', terraformServer);

      // Register Kubernetes MCP Server
      const k8sServer = {
        id: 'kubernetes-server',
        name: 'Kubernetes MCP Server',
        url: 'local://kubernetes',
        type: 'local' as const,
        capabilities: ['validate', 'troubleshoot', 'security-scan', 'explain'],
        status: 'active' as const
      };
      this.servers.set('kubernetes-server', k8sServer);

      // Register AWS MCP Server
      const awsServer = {
        id: 'aws-server',
        name: 'AWS MCP Server',
        url: 'local://aws',
        type: 'local' as const,
        capabilities: ['describe', 'cost-analyze', 'security-audit', 'optimize'],
        status: 'active' as const
      };
      this.servers.set('aws-server', awsServer);

      // Register GitHub MCP Server
      const githubServer = {
        id: 'github-server',
        name: 'GitHub MCP Server',
        url: 'local://github',
        type: 'local' as const,
        capabilities: ['analyze-repo', 'review-pr', 'security-scan', 'workflow-monitor'],
        status: 'active' as const
      };
      this.servers.set('github-server', githubServer);

      console.log('✅ Built-in MCP servers registered');
    } catch (error) {
      console.error('❌ Failed to initialize built-in servers:', error);
      throw error;
    }
  }

  private async discoverExternalServers(): Promise<void> {
    try {
      // This could discover MCP servers from environment variables,
      // configuration files, or service discovery mechanisms
      const externalServers = this.getExternalServerConfigs();

      for (const serverConfig of externalServers) {
        try {
          await this.connectToServer(serverConfig);
          console.log(`✅ Connected to external MCP server: ${serverConfig.name}`);
        } catch (error) {
          console.warn(`⚠️  Failed to connect to ${serverConfig.name}:`, error.message);
          serverConfig.status = 'error';
        }
        
        this.servers.set(serverConfig.id, serverConfig);
      }

      console.log('✅ External MCP server discovery completed');
    } catch (error) {
      console.error('❌ Failed to discover external servers:', error);
    }
  }

  private getExternalServerConfigs(): MCPServerConfig[] {
    // In a real implementation, this would read from configuration
    // For now, return empty array
    return [];
  }

  private async connectToServer(config: MCPServerConfig): Promise<void> {
    try {
      if (config.type === 'local') {
        // Handle local MCP servers
        return;
      }

      // Create MCP client for remote servers
      const client = new MCPClient({
        url: config.url,
        timeout: 30000
      });

      await client.connect();
      this.clients.set(config.id, client);

      config.status = 'active';
    } catch (error) {
      config.status = 'error';
      throw error;
    }
  }

  async invokeServer(serverId: string, method: string, params: Record<string, any>): Promise<any> {
    try {
      const server = this.servers.get(serverId);
      if (!server) {
        throw new Error(`MCP server '${serverId}' not found`);
      }

      if (server.status !== 'active') {
        throw new Error(`MCP server '${serverId}' is not active`);
      }

      if (server.type === 'local') {
        return await this.invokeLocalServer(serverId, method, params);
      } else {
        return await this.invokeRemoteServer(serverId, method, params);
      }
    } catch (error) {
      console.error(`❌ MCP invocation failed for ${serverId}.${method}:`, error);
      throw error;
    }
  }

  private async invokeLocalServer(serverId: string, method: string, params: Record<string, any>): Promise<any> {
    try {
      // Route to appropriate local server implementation
      switch (serverId) {
        case 'terraform-server':
          return await this.invokeTerraformServer(method, params);
        case 'kubernetes-server':
          return await this.invokeKubernetesServer(method, params);
        case 'aws-server':
          return await this.invokeAWSServer(method, params);
        case 'github-server':
          return await this.invokeGitHubServer(method, params);
        default:
          throw new Error(`Unknown local MCP server: ${serverId}`);
      }
    } catch (error) {
      console.error(`❌ Local MCP server invocation failed:`, error);
      throw error;
    }
  }

  private async invokeRemoteServer(serverId: string, method: string, params: Record<string, any>): Promise<any> {
    try {
      const client = this.clients.get(serverId);
      if (!client) {
        throw new Error(`MCP client not found for server: ${serverId}`);
      }

      return await client.invoke(method, params);
    } catch (error) {
      console.error(`❌ Remote MCP server invocation failed:`, error);
      throw error;
    }
  }

  private async invokeTerraformServer(method: string, params: Record<string, any>): Promise<any> {
    try {
      // Import and use the Terraform MCP server
      const { TerraformMCPServer } = await import('../mcp_servers/terraform-mcp-server.js');
      const server = new TerraformMCPServer();
      
      switch (method) {
        case 'validate':
          return await server.validateConfiguration(params.config);
        case 'plan':
          return await server.generatePlan(params.config);
        case 'format':
          return await server.formatCode(params.code);
        case 'security-scan':
          return await server.securityScan(params.config);
        default:
          throw new Error(`Unknown Terraform MCP method: ${method}`);
      }
    } catch (error) {
      console.error('❌ Terraform MCP server error:', error);
      throw error;
    }
  }

  private async invokeKubernetesServer(method: string, params: Record<string, any>): Promise<any> {
    try {
      // Import and use the Kubernetes MCP server
      const { KubernetesMCPServer } = await import('../mcp_servers/kubernetes-mcp-server.js');
      const server = new KubernetesMCPServer();
      
      switch (method) {
        case 'validate':
          return await server.validateManifests(params.manifests);
        case 'troubleshoot':
          return await server.troubleshootIssue(params.namespace, params.resource);
        case 'security-scan':
          return await server.securityScan(params.manifests);
        case 'explain':
          return await server.explainResource(params.resource);
        default:
          throw new Error(`Unknown Kubernetes MCP method: ${method}`);
      }
    } catch (error) {
      console.error('❌ Kubernetes MCP server error:', error);
      throw error;
    }
  }

  private async invokeAWSServer(method: string, params: Record<string, any>): Promise<any> {
    try {
      // Import and use the AWS MCP server
      const { AWSMCPServer } = await import('../mcp_servers/aws-mcp-server.js');
      const server = new AWSMCPServer();
      
      switch (method) {
        case 'describe':
          return await server.describeResource(params.service, params.resourceId);
        case 'cost-analyze':
          return await server.analyzeCosts(params.timeRange);
        case 'security-audit':
          return await server.securityAudit(params.service);
        case 'optimize':
          return await server.optimizeResources(params.service);
        default:
          throw new Error(`Unknown AWS MCP method: ${method}`);
      }
    } catch (error) {
      console.error('❌ AWS MCP server error:', error);
      throw error;
    }
  }

  private async invokeGitHubServer(method: string, params: Record<string, any>): Promise<any> {
    try {
      // Import and use the GitHub MCP server
      const { GitHubMCPServer } = await import('../mcp_servers/github-mcp-server.js');
      const server = new GitHubMCPServer();
      
      switch (method) {
        case 'analyze-repo':
          return await server.analyzeRepository(params.owner, params.repo);
        case 'review-pr':
          return await server.reviewPullRequest(params.owner, params.repo, params.prNumber);
        case 'security-scan':
          return await server.securityScan(params.owner, params.repo);
        case 'workflow-monitor':
          return await server.monitorWorkflows(params.owner, params.repo);
        default:
          throw new Error(`Unknown GitHub MCP method: ${method}`);
      }
    } catch (error) {
      console.error('❌ GitHub MCP server error:', error);
      throw error;
    }
  }

  async listServers(): Promise<MCPServerConfig[]> {
    return Array.from(this.servers.values());
  }

  async getServerCapabilities(serverId: string): Promise<string[]> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`MCP server '${serverId}' not found`);
    }
    return server.capabilities;
  }

  async healthCheck(): Promise<{ serverId: string; status: string; latency?: number }[]> {
    const results: { serverId: string; status: string; latency?: number }[] = [];

    for (const [serverId, server] of this.servers.entries()) {
      try {
        const startTime = Date.now();
        
        if (server.type === 'local') {
          // For local servers, just check if they're configured
          results.push({
            serverId,
            status: 'healthy',
            latency: Date.now() - startTime
          });
        } else {
          // For remote servers, ping them
          const client = this.clients.get(serverId);
          if (client) {
            await client.ping();
            results.push({
              serverId,
              status: 'healthy',
              latency: Date.now() - startTime
            });
          } else {
            results.push({
              serverId,
              status: 'disconnected'
            });
          }
        }
      } catch (error) {
        results.push({
          serverId,
          status: 'error'
        });
      }
    }

    return results;
  }

  async refreshConnections(): Promise<void> {
    try {
      console.log('🔄 Refreshing MCP connections...');

      // Reconnect to any failed servers
      for (const [serverId, server] of this.servers.entries()) {
        if (server.status === 'error' && server.type === 'remote') {
          try {
            await this.connectToServer(server);
            console.log(`✅ Reconnected to MCP server: ${server.name}`);
          } catch (error) {
            console.warn(`⚠️  Failed to reconnect to ${server.name}:`, error.message);
          }
        }
      }

      console.log('✅ MCP connection refresh completed');
    } catch (error) {
      console.error('❌ Failed to refresh MCP connections:', error);
    }
  }

  async shutdown(): Promise<void> {
    try {
      console.log('🛑 Shutting down MCP Manager...');

      // Close all remote client connections
      for (const [serverId, client] of this.clients.entries()) {
        try {
          await client.disconnect();
          console.log(`✅ Disconnected from MCP server: ${serverId}`);
        } catch (error) {
          console.warn(`⚠️  Error disconnecting from ${serverId}:`, error.message);
        }
      }

      this.clients.clear();
      this.servers.clear();

      console.log('✅ MCP Manager shut down successfully');
    } catch (error) {
      console.error('❌ Error shutting down MCP Manager:', error);
    }
  }
}