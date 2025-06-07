import { ConfidentialClientApplication, Configuration, AuthenticationResult } from '@azure/msal-node';
import { AzureSecretsManager } from './AzureSecretsManager';
import jwt from 'jsonwebtoken';
import axios from 'axios';

interface B2CConfig {
  tenantId: string;
  tenantName: string;
  clientId: string;
  clientSecret: string;
  policyName: string;
  redirectUri: string;
}

interface UserInfo {
  id: string;
  email: string;
  name: string;
  permissions: string[];
  organizations?: string[];
}

export class AzureB2CAuth {
  private msalClient!: ConfidentialClientApplication;
  private secretsManager: AzureSecretsManager;
  private config!: B2CConfig;
  private jwtSecret!: string;
  private jwtRefreshSecret!: string;

  constructor(secretsManager: AzureSecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize() {
    // Get B2C configuration from Azure Key Vault
    const [
      tenantName,
      clientId,
      clientSecret,
      policyName,
      jwtSecret,
      jwtRefreshSecret
    ] = await Promise.all([
      this.secretsManager.getSecret('B2C_TENANT_NAME'),
      this.secretsManager.getSecret('B2C_CLIENT_ID'),
      this.secretsManager.getSecret('MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'),
      this.secretsManager.getSecret('B2C_SIGNUP_SIGNIN_POLICY_NAME'),
      this.secretsManager.getSecret('JWT_SECRET'),
      this.secretsManager.getSecret('JWT_REFRESH_SECRET')
    ]);

    this.config = {
      tenantId: 'bd436098-a352-4d8e-b029-849de3e6c5af', // From your Azure tenant
      tenantName,
      clientId,
      clientSecret,
      policyName,
      redirectUri: process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/callback'
    };

    this.jwtSecret = jwtSecret;
    this.jwtRefreshSecret = jwtRefreshSecret;

    // Configure MSAL
    const msalConfig: Configuration = {
      auth: {
        clientId: this.config.clientId,
        authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        clientSecret: this.config.clientSecret,
        knownAuthorities: [`login.microsoftonline.com`]
      },
      system: {
        loggerOptions: {
          loggerCallback(loglevel, message, containsPii) {
            if (!containsPii) {
              console.log(message);
            }
          },
          piiLoggingEnabled: false,
          logLevel: 3, // Info
        }
      }
    };

    this.msalClient = new ConfidentialClientApplication(msalConfig);
    console.log('✅ Azure B2C Authentication initialized');
  }

  // Generate login URL for user authentication
  async getAuthorizationUrl(state: string): Promise<string> {
    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email'],
      redirectUri: this.config.redirectUri,
      state,
      prompt: 'select_account',
      responseMode: 'query' as const,
      // Use the v2.0 endpoint
      authority: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize`
    };

    const authUrl = await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
    return authUrl;
  }

  // Handle the callback from Azure B2C
  async handleCallback(code: string): Promise<AuthenticationResult> {
    const tokenRequest = {
      code,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: this.config.redirectUri,
      clientSecret: this.config.clientSecret,
    };

    try {
      const response = await this.msalClient.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw error;
    }
  }

  // Exchange Azure B2C token for our JWT
  async exchangeTokenForJWT(azureToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the Azure token
      const userInfo = await this.getUserInfoFromToken(azureToken);
      
      // Add agent permissions based on user roles
      const permissions = await this.getUserPermissions(userInfo.id);
      
      // Create our JWT tokens
      const accessToken = jwt.sign(
        {
          userId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          permissions,
          type: 'access'
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      const refreshToken = jwt.sign(
        {
          userId: userInfo.id,
          type: 'refresh'
        },
        this.jwtRefreshSecret,
        { expiresIn: '30d' }
      );

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Get user info from Microsoft Graph
  async getUserInfoFromToken(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return {
        id: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
        name: response.data.displayName,
        permissions: []
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  // Get user permissions for agent capabilities
  async getUserPermissions(userId: string): Promise<string[]> {
    // In production, this would query your database or permission service
    // For now, return default permissions based on user
    const defaultPermissions = [
      'agents:read',
      'agents:chat',
      'workspace:read',
      'workspace:write'
    ];

    // Check if user has elevated permissions (would be from database)
    const isAdmin = process.env.ADMIN_USERS?.includes(userId);
    
    if (isAdmin) {
      return [
        ...defaultPermissions,
        'infrastructure:write',
        'cloud:manage',
        'kubernetes:admin',
        'monitoring:write',
        'alerts:manage',
        'incident:manage',
        'system:admin',
        'repo:write',
        'actions:execute'
      ];
    }

    return defaultPermissions;
  }

  // Verify our JWT token
  verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get user permissions again (they might have changed)
      const permissions = await this.getUserPermissions(decoded.userId);

      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          permissions,
          type: 'access'
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );

      return { accessToken };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  // Logout user (would revoke tokens in production)
  async logout(userId: string): Promise<void> {
    // In production, add token to revocation list
    console.log(`User ${userId} logged out`);
  }

  // Get authorization header
  getAuthorizationHeader(token: string): string {
    return `Bearer ${token}`;
  }

  // Extract token from request header
  extractTokenFromHeader(authHeader?: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
} 