import { WebSocket } from 'ws';
import axios from 'axios';
import { Anthropic } from "@anthropic-ai/sdk";
import { OpenAI } from "openai";

interface MCPServer {
  name: string;
  url: string;
  status: 'running' | 'stopped' | 'error';
  lastHeartbeat: number;
}

export class MCPRegistry {
  private servers: Record<string, MCPServer> = {};
  private activeConnections: Record<string, any> = {};
  private anthropic: Anthropic;
  private openai: OpenAI;

  constructor() {
    // Initialize AI clients
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Initialize MCP servers
    this.servers = {
      web_search: {
        name: 'Web Search MCP',
        url: process.env.WEB_SEARCH_MCP_URL || 'http://localhost:5001',
        status: 'stopped',
        lastHeartbeat: 0
      },
      github: {
        name: 'GitHub MCP',
        url: process.env.GITHUB_MCP_URL || 'http://localhost:5002',
        status: 'stopped',
        lastHeartbeat: 0
      }
    };
  }

  async initialize() {
    console.log("Initializing MCP Registry...");
    await this.startServer('web_search');
    await this.startServer('github');
  }

  async shutdown() {
    console.log("Shutting down MCP Registry...");
    for (const serverId of Object.keys(this.activeConnections)) {
      await this.stopServer(serverId);
    }
    this.activeConnections = {};
  }

  private async startServer(serverId: string) {
    const server = this.servers[serverId];
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const response = await axios.post(`${server.url}/start`);
      if (response.status === 200) {
        server.status = 'running';
        server.lastHeartbeat = Date.now();
        console.log(`Started ${server.name}`);
      }
    } catch (error) {
      server.status = 'error';
      console.error(`Failed to start ${server.name}:`, error);
    }
  }

  private async stopServer(serverId: string) {
    const server = this.servers[serverId];
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const response = await axios.post(`${server.url}/stop`);
      if (response.status === 200) {
        server.status = 'stopped';
        console.log(`Stopped ${server.name}`);
      }
    } catch (error) {
      console.error(`Failed to stop ${server.name}:`, error);
    }
  }

  async getServerStatus(serverId: string) {
    const server = this.servers[serverId];
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    try {
      const response = await axios.get(`${server.url}/status`);
      if (response.status === 200) {
        server.status = response.data.status;
        server.lastHeartbeat = Date.now();
      }
    } catch (error) {
      server.status = 'error';
    }

    return server;
  }

  getAnthropic() {
    return this.anthropic;
  }

  getOpenAI() {
    return this.openai;
  }

  async getAvailableServers() {
    const servers = [];
    for (const [id, server] of Object.entries(this.servers)) {
      const status = await this.getServerStatus(id);
      servers.push({
        id,
        name: server.name,
        status: status.status,
        lastHeartbeat: status.lastHeartbeat
      });
    }
    return servers;
  }
} 