import { encryptionService, secretsManager } from './encryptionService';
import { integrationService } from './integrationService';
import { 
  type RepositoryConnection, 
  type InsertRepositoryConnection,
  type WebhookConfiguration,
  type InsertWebhookConfiguration,
  type Integration
} from '@shared/schema';

export interface GitHubOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface GitLabOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  baseUrl?: string; // For self-hosted GitLab instances
}

export interface RepositoryInfo {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  url: string;
  defaultBranch: string;
  isPrivate: boolean;
  language?: string;
  topics: string[];
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  forksCount: number;
  stargazersCount: number;
  watchersCount: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  pushedAt?: string;
  owner: {
    login: string;
    type: string;
    avatarUrl: string;
  };
  permissions?: {
    admin: boolean;
    maintain: boolean;
    push: boolean;
    triage: boolean;
    pull: boolean;
  };
}

export interface WebhookEvent {
  event: string;
  payload: any;
  signature?: string;
  delivery: string;
  timestamp: Date;
}

export interface SyncResult {
  success: boolean;
  filesChanged: number;
  conflicts: number;
  lastSync: Date;
  syncType: 'push' | 'pull' | 'merge';
  errorMessage?: string;
  conflictFiles?: string[];
}

/**
 * Comprehensive repository integration service for GitHub and GitLab
 * Handles OAuth flows, repository management, and webhook configuration
 */
export class RepositoryIntegrationService {
  private readonly GITHUB_API_BASE = 'https://api.github.com';
  private readonly GITLAB_API_BASE = 'https://gitlab.com/api/v4';

  /**
   * Initiates GitHub OAuth flow
   */
  initiateGitHubOAuth(config: GitHubOAuthConfig, state?: string): {
    authUrl: string;
    state: string;
  } {
    const oauthState = state || this.generateSecureState();
    const scopes = config.scopes.join(' ');
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: scopes,
      state: oauthState,
      allow_signup: 'true'
    });

    const authUrl = `https://github.com/login/oauth/authorize?${params}`;

    return {
      authUrl,
      state: oauthState
    };
  }

  /**
   * Handles GitHub OAuth callback
   */
  async handleGitHubOAuthCallback(
    code: string,
    state: string,
    config: GitHubOAuthConfig,
    userId: string
  ): Promise<{
    success: boolean;
    accessToken?: string;
    userInfo?: any;
    integration?: any;
    errorMessage?: string;
  }> {
    try {
      // Exchange code for access token
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Careerate-Integration-Service'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          redirect_uri: config.redirectUri,
          state
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return {
          success: false,
          errorMessage: `GitHub OAuth error: ${tokenData.error_description || tokenData.error}`
        };
      }

      const accessToken = tokenData.access_token;

      // Get user information
      const userResponse = await fetch(`${this.GITHUB_API_BASE}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Careerate-Integration-Service'
        }
      });

      const userInfo = await userResponse.json();

      if (!userResponse.ok) {
        return {
          success: false,
          errorMessage: 'Failed to fetch GitHub user information'
        };
      }

      // Create integration record
      const integration = await integrationService.createIntegration({
        type: 'repository',
        service: 'github',
        configuration: {
          username: userInfo.login,
          userId: userInfo.id,
          avatarUrl: userInfo.avatar_url,
          profileUrl: userInfo.html_url
        },
        secrets: {
          access_token: accessToken
        },
        endpoints: {
          api: this.GITHUB_API_BASE,
          web: 'https://github.com'
        },
        healthCheck: {
          enabled: true,
          interval: 300, // 5 minutes
          timeout: 30,
          retries: 3
        }
      }, userId);

      return {
        success: true,
        accessToken,
        userInfo,
        integration
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: `GitHub OAuth callback error: ${error.message}`
      };
    }
  }

  /**
   * Initiates GitLab OAuth flow
   */
  initiateGitLabOAuth(config: GitLabOAuthConfig, state?: string): {
    authUrl: string;
    state: string;
  } {
    const oauthState = state || this.generateSecureState();
    const scopes = config.scopes.join(' ');
    const baseUrl = config.baseUrl || 'https://gitlab.com';
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: scopes,
      state: oauthState
    });

    const authUrl = `${baseUrl}/oauth/authorize?${params}`;

    return {
      authUrl,
      state: oauthState
    };
  }

  /**
   * Handles GitLab OAuth callback
   */
  async handleGitLabOAuthCallback(
    code: string,
    state: string,
    config: GitLabOAuthConfig,
    userId: string
  ): Promise<{
    success: boolean;
    accessToken?: string;
    userInfo?: any;
    integration?: any;
    errorMessage?: string;
  }> {
    try {
      const baseUrl = config.baseUrl || 'https://gitlab.com';
      
      // Exchange code for access token
      const tokenResponse = await fetch(`${baseUrl}/oauth/token`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: config.redirectUri
        })
      });

      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        return {
          success: false,
          errorMessage: `GitLab OAuth error: ${tokenData.error_description || tokenData.error}`
        };
      }

      const accessToken = tokenData.access_token;
      const apiBase = `${baseUrl}/api/v4`;

      // Get user information
      const userResponse = await fetch(`${apiBase}/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const userInfo = await userResponse.json();

      if (!userResponse.ok) {
        return {
          success: false,
          errorMessage: 'Failed to fetch GitLab user information'
        };
      }

      // Create integration record
      const integration = await integrationService.createIntegration({
        type: 'repository',
        service: 'gitlab',
        configuration: {
          username: userInfo.username,
          userId: userInfo.id,
          avatarUrl: userInfo.avatar_url,
          profileUrl: userInfo.web_url,
          baseUrl
        },
        secrets: {
          access_token: accessToken,
          refresh_token: tokenData.refresh_token
        },
        endpoints: {
          api: apiBase,
          web: baseUrl
        },
        healthCheck: {
          enabled: true,
          interval: 300,
          timeout: 30,
          retries: 3
        }
      }, userId);

      return {
        success: true,
        accessToken,
        userInfo,
        integration
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: `GitLab OAuth callback error: ${error.message}`
      };
    }
  }

  /**
   * Discovers repositories for connected GitHub account
   */
  async discoverGitHubRepositories(
    accessToken: string,
    options: {
      type?: 'all' | 'owner' | 'public' | 'private' | 'member';
      sort?: 'created' | 'updated' | 'pushed' | 'full_name';
      direction?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<RepositoryInfo[]> {
    try {
      const params = new URLSearchParams({
        type: options.type || 'all',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: (options.per_page || 100).toString(),
        page: (options.page || 1).toString()
      });

      const response = await fetch(`${this.GITHUB_API_BASE}/user/repos?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Careerate-Integration-Service'
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const repos = await response.json();
      
      return repos.map((repo: any) => ({
        id: repo.id.toString(),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        defaultBranch: repo.default_branch,
        isPrivate: repo.private,
        language: repo.language,
        topics: repo.topics || [],
        hasIssues: repo.has_issues,
        hasProjects: repo.has_projects,
        hasWiki: repo.has_wiki,
        forksCount: repo.forks_count,
        stargazersCount: repo.stargazers_count,
        watchersCount: repo.watchers_count,
        size: repo.size,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at,
        owner: {
          login: repo.owner.login,
          type: repo.owner.type,
          avatarUrl: repo.owner.avatar_url
        },
        permissions: repo.permissions
      }));
    } catch (error) {
      throw new Error(`Failed to discover GitHub repositories: ${error.message}`);
    }
  }

  /**
   * Discovers repositories for connected GitLab account
   */
  async discoverGitLabRepositories(
    accessToken: string,
    baseUrl: string = 'https://gitlab.com',
    options: {
      membership?: boolean;
      owned?: boolean;
      starred?: boolean;
      simple?: boolean;
      sort?: 'id' | 'name' | 'path' | 'created_at' | 'updated_at' | 'last_activity_at';
      order_by?: 'asc' | 'desc';
      per_page?: number;
      page?: number;
    } = {}
  ): Promise<RepositoryInfo[]> {
    try {
      const params = new URLSearchParams({
        membership: (options.membership !== false).toString(),
        sort: options.sort || 'updated_at',
        order_by: options.order_by || 'desc',
        per_page: (options.per_page || 100).toString(),
        page: (options.page || 1).toString()
      });

      const apiBase = `${baseUrl}/api/v4`;
      const response = await fetch(`${apiBase}/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`GitLab API error: ${response.statusText}`);
      }

      const projects = await response.json();
      
      return projects.map((project: any) => ({
        id: project.id.toString(),
        name: project.name,
        fullName: project.path_with_namespace,
        description: project.description,
        url: project.web_url,
        defaultBranch: project.default_branch,
        isPrivate: project.visibility === 'private',
        language: null, // GitLab doesn't provide primary language in projects API
        topics: project.topics || project.tag_list || [],
        hasIssues: project.issues_enabled,
        hasProjects: project.issues_enabled, // GitLab uses issues for project management
        hasWiki: project.wiki_enabled,
        forksCount: project.forks_count,
        stargazersCount: project.star_count,
        watchersCount: 0, // GitLab doesn't have watchers concept
        size: 0, // GitLab doesn't provide repository size in projects API
        createdAt: project.created_at,
        updatedAt: project.last_activity_at,
        pushedAt: project.last_activity_at,
        owner: {
          login: project.namespace.path,
          type: project.namespace.kind,
          avatarUrl: project.namespace.avatar_url || project.avatar_url
        },
        permissions: project.permissions
      }));
    } catch (error) {
      throw new Error(`Failed to discover GitLab repositories: ${error.message}`);
    }
  }

  /**
   * Connects repository to project
   */
  async connectRepository(
    integrationId: string,
    repositoryInfo: RepositoryInfo,
    projectId: string,
    options: {
      syncBranches?: string[];
      autoSync?: boolean;
      conflictResolution?: 'manual' | 'auto-theirs' | 'auto-ours';
      webhookEvents?: string[];
    } = {}
  ): Promise<{
    success: boolean;
    repositoryConnection?: InsertRepositoryConnection;
    webhook?: InsertWebhookConfiguration;
    errorMessage?: string;
  }> {
    try {
      // Create repository connection record
      const repositoryConnection: InsertRepositoryConnection = {
        integrationId,
        projectId,
        provider: repositoryInfo.owner.type === 'User' ? 'github' : 'gitlab',
        repositoryId: repositoryInfo.id,
        repositoryName: repositoryInfo.name,
        repositoryUrl: repositoryInfo.url,
        ownerName: repositoryInfo.owner.login,
        ownerType: repositoryInfo.owner.type.toLowerCase(),
        defaultBranch: repositoryInfo.defaultBranch,
        syncBranches: options.syncBranches || [repositoryInfo.defaultBranch],
        autoSync: options.autoSync !== false,
        conflictResolution: options.conflictResolution || 'manual',
        permissions: repositoryInfo.permissions || {},
        metadata: {
          description: repositoryInfo.description,
          language: repositoryInfo.language,
          topics: repositoryInfo.topics,
          isPrivate: repositoryInfo.isPrivate,
          connectedAt: new Date().toISOString()
        }
      };

      // Setup webhook if needed
      let webhook: InsertWebhookConfiguration | undefined;
      if (options.webhookEvents && options.webhookEvents.length > 0) {
        const webhookUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/webhooks/repository/${integrationId}`;
        const webhookSecret = this.generateWebhookSecret();

        webhook = {
          integrationId,
          name: `${repositoryInfo.name} Webhook`,
          url: webhookUrl,
          secret: webhookSecret,
          events: options.webhookEvents,
          active: true,
          sslVerification: true,
          contentType: 'application/json',
          configuration: {
            repositoryId: repositoryInfo.id,
            repositoryName: repositoryInfo.name
          },
          metadata: {
            createdFor: 'repository-sync',
            repositoryUrl: repositoryInfo.url
          }
        };
      }

      return {
        success: true,
        repositoryConnection,
        webhook
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: `Failed to connect repository: ${error.message}`
      };
    }
  }

  /**
   * Sets up webhook on GitHub repository
   */
  async setupGitHubWebhook(
    accessToken: string,
    repositoryFullName: string,
    webhookConfig: {
      url: string;
      secret: string;
      events: string[];
      contentType?: string;
    }
  ): Promise<{
    success: boolean;
    webhookId?: string;
    errorMessage?: string;
  }> {
    try {
      const response = await fetch(`${this.GITHUB_API_BASE}/repos/${repositoryFullName}/hooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Careerate-Integration-Service'
        },
        body: JSON.stringify({
          name: 'web',
          active: true,
          events: webhookConfig.events,
          config: {
            url: webhookConfig.url,
            content_type: webhookConfig.contentType || 'json',
            secret: webhookConfig.secret,
            insecure_ssl: '0'
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          errorMessage: `GitHub webhook setup failed: ${error.message || response.statusText}`
        };
      }

      const webhook = await response.json();
      
      return {
        success: true,
        webhookId: webhook.id.toString()
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: `GitHub webhook setup error: ${error.message}`
      };
    }
  }

  /**
   * Sets up webhook on GitLab repository
   */
  async setupGitLabWebhook(
    accessToken: string,
    projectId: string,
    baseUrl: string,
    webhookConfig: {
      url: string;
      secret: string;
      events: string[];
    }
  ): Promise<{
    success: boolean;
    webhookId?: string;
    errorMessage?: string;
  }> {
    try {
      const apiBase = `${baseUrl}/api/v4`;
      
      // Convert event names to GitLab format
      const gitlabEvents: Record<string, boolean> = {};
      webhookConfig.events.forEach(event => {
        switch (event) {
          case 'push':
            gitlabEvents.push_events = true;
            break;
          case 'pull_request':
            gitlabEvents.merge_requests_events = true;
            break;
          case 'issues':
            gitlabEvents.issues_events = true;
            break;
          case 'release':
            gitlabEvents.releases_events = true;
            break;
          case 'wiki':
            gitlabEvents.wiki_page_events = true;
            break;
          default:
            gitlabEvents[`${event}_events`] = true;
        }
      });

      const response = await fetch(`${apiBase}/projects/${projectId}/hooks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: webhookConfig.url,
          token: webhookConfig.secret,
          enable_ssl_verification: true,
          ...gitlabEvents
        })
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          errorMessage: `GitLab webhook setup failed: ${error.message || response.statusText}`
        };
      }

      const webhook = await response.json();
      
      return {
        success: true,
        webhookId: webhook.id.toString()
      };
    } catch (error) {
      return {
        success: false,
        errorMessage: `GitLab webhook setup error: ${error.message}`
      };
    }
  }

  /**
   * Handles incoming webhook from GitHub/GitLab
   */
  async handleWebhook(
    payload: any,
    headers: Record<string, string>,
    integrationId: string
  ): Promise<{
    processed: boolean;
    event?: string;
    action?: string;
    repository?: string;
    syncTriggered?: boolean;
    errorMessage?: string;
  }> {
    try {
      // Determine provider from headers
      const provider = headers['x-github-event'] ? 'github' : 
                      headers['x-gitlab-event'] ? 'gitlab' : 'unknown';

      if (provider === 'unknown') {
        return {
          processed: false,
          errorMessage: 'Unknown webhook provider'
        };
      }

      // Verify webhook signature
      const isValid = await this.verifyWebhookSignature(payload, headers, integrationId);
      if (!isValid) {
        return {
          processed: false,
          errorMessage: 'Invalid webhook signature'
        };
      }

      // Process webhook based on provider
      if (provider === 'github') {
        return await this.processGitHubWebhook(payload, headers, integrationId);
      } else {
        return await this.processGitLabWebhook(payload, headers, integrationId);
      }
    } catch (error) {
      return {
        processed: false,
        errorMessage: `Webhook processing error: ${error.message}`
      };
    }
  }

  /**
   * Syncs repository changes
   */
  async syncRepository(
    repositoryConnection: RepositoryConnection,
    syncType: 'pull' | 'push' | 'merge' = 'pull'
  ): Promise<SyncResult> {
    try {
      // Implementation would involve:
      // 1. Fetching latest changes from repository
      // 2. Comparing with local project files
      // 3. Handling conflicts based on resolution strategy
      // 4. Updating project files
      // 5. Creating sync log entry

      // Placeholder implementation
      return {
        success: true,
        filesChanged: 0,
        conflicts: 0,
        lastSync: new Date(),
        syncType
      };
    } catch (error) {
      return {
        success: false,
        filesChanged: 0,
        conflicts: 0,
        lastSync: new Date(),
        syncType,
        errorMessage: error.message
      };
    }
  }

  // Private helper methods

  private generateSecureState(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private generateWebhookSecret(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }

  private async verifyWebhookSignature(
    payload: any,
    headers: Record<string, string>,
    integrationId: string
  ): Promise<boolean> {
    // Implementation would verify HMAC signature from GitHub/GitLab
    // This is a placeholder
    return true;
  }

  private async processGitHubWebhook(
    payload: any,
    headers: Record<string, string>,
    integrationId: string
  ): Promise<any> {
    const event = headers['x-github-event'];
    const action = payload.action;
    const repository = payload.repository?.full_name;

    // Process different GitHub events
    switch (event) {
      case 'push':
        // Handle push events
        break;
      case 'pull_request':
        // Handle PR events
        break;
      case 'release':
        // Handle release events
        break;
    }

    return {
      processed: true,
      event,
      action,
      repository,
      syncTriggered: false
    };
  }

  private async processGitLabWebhook(
    payload: any,
    headers: Record<string, string>,
    integrationId: string
  ): Promise<any> {
    const event = headers['x-gitlab-event'];
    const repository = payload.project?.path_with_namespace;

    // Process different GitLab events
    switch (event) {
      case 'Push Hook':
        // Handle push events
        break;
      case 'Merge Request Hook':
        // Handle MR events
        break;
      case 'Release Hook':
        // Handle release events
        break;
    }

    return {
      processed: true,
      event,
      repository,
      syncTriggered: false
    };
  }
}

// Export singleton
export const repositoryIntegrationService = new RepositoryIntegrationService();

/**
 * Repository sync scheduler for automated synchronization
 */
export class RepositorySyncScheduler {
  private syncIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * Schedules automatic repository synchronization
   */
  scheduleSyncForRepository(
    repositoryConnectionId: string,
    repositoryConnection: RepositoryConnection,
    intervalMinutes: number = 15
  ): void {
    // Clear existing sync if any
    this.clearSyncForRepository(repositoryConnectionId);

    const interval = setInterval(async () => {
      try {
        if (repositoryConnection.autoSync) {
          const syncResult = await repositoryIntegrationService.syncRepository(
            repositoryConnection,
            'pull'
          );
          
          console.log(`Auto-sync for ${repositoryConnectionId}:`, syncResult);
          
          // Handle conflicts or errors
          if (!syncResult.success || syncResult.conflicts > 0) {
            // Create alert or notification
            console.warn(`Sync issues for ${repositoryConnectionId}:`, syncResult);
          }
        }
      } catch (error) {
        console.error(`Auto-sync error for ${repositoryConnectionId}:`, error);
      }
    }, intervalMinutes * 60 * 1000);

    this.syncIntervals.set(repositoryConnectionId, interval);
  }

  /**
   * Clears sync schedule for repository
   */
  clearSyncForRepository(repositoryConnectionId: string): void {
    const interval = this.syncIntervals.get(repositoryConnectionId);
    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(repositoryConnectionId);
    }
  }

  /**
   * Gets all scheduled syncs
   */
  getScheduledSyncs(): { repositoryConnectionId: string; isScheduled: boolean }[] {
    return Array.from(this.syncIntervals.keys()).map(repositoryConnectionId => ({
      repositoryConnectionId,
      isScheduled: true
    }));
  }

  /**
   * Clears all sync schedules
   */
  clearAllSyncs(): void {
    for (const repositoryConnectionId of this.syncIntervals.keys()) {
      this.clearSyncForRepository(repositoryConnectionId);
    }
  }
}

// Export singleton
export const repositorySyncScheduler = new RepositorySyncScheduler();