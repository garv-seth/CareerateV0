import {
  ConfidentialClientApplication,
  Configuration,
  AuthenticationResult,
  ClientCredentialRequest,
} from '@azure/msal-node';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { AzureSecretsManager } from './AzureSecretsManager';

export interface B2CConfig {
  tenantId: string;
  tenantName: string;
  clientId: string;
  clientSecret: string;
  policyName: string;
  redirectUri: string;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

export class AzureB2CAuth {
  private secretsManager: AzureSecretsManager;
  private msalClient: ConfidentialClientApplication | null = null;
  private config: B2CConfig | null = null;
  private jwtSecret: string | null = null;
  private jwtRefreshSecret: string | null = null;

  constructor(secretsManager: AzureSecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize(): Promise<void> {
    try {
      // Get B2C configuration from Azure Key Vault with fallback handling
      const results = await Promise.allSettled([
        this.secretsManager.getSecret('B2C_TENANT_NAME'),
        this.secretsManager.getSecret('B2C_CLIENT_ID'),
        this.secretsManager.getSecret('MICROSOFT_PROVIDER_AUTHENTICATION_SECRET'),
        this.secretsManager.getSecret('B2C_SIGNUP_SIGNIN_POLICY_NAME'),
        this.secretsManager.getSecret('JWT_SECRET'),
        this.secretsManager.getSecret('JWT_REFRESH_SECRET')
      ]);

      const [
        tenantName,
        clientId,
        clientSecret,
        policyName,
        jwtSecret,
        jwtRefreshSecret
      ] = results.map(result => 
        result.status === 'fulfilled' ? result.value : null
      );

      // Check if we have the minimum required secrets
      if (!tenantName || !clientId || !clientSecret || !jwtSecret) {
        throw new Error('Missing required B2C configuration. Please provide B2C_TENANT_NAME, B2C_CLIENT_ID, MICROSOFT_PROVIDER_AUTHENTICATION_SECRET, and JWT_SECRET environment variables.');
      }

      this.config = {
        tenantId: 'bd436098-a352-4d8e-b029-849de3e6c5af', // From your Azure tenant
        tenantName: tenantName as string,
        clientId: clientId as string,
        clientSecret: clientSecret as string,
        policyName: (policyName as string) || 'B2C_1_signup_signin',
        redirectUri: process.env.REDIRECT_URI || 'http://localhost:5000/api/auth/callback'
      };

      this.jwtSecret = jwtSecret;
      this.jwtRefreshSecret = jwtRefreshSecret || jwtSecret;

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
    } catch (error) {
      console.error('❌ Azure B2C initialization failed:', error);
      throw error;
    }
  }

  // Generate login URL for user authentication
  async getAuthorizationUrl(state: string): Promise<string> {
    if (!this.msalClient || !this.config) {
      throw new Error('Azure B2C not initialized');
    }

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
    if (!this.msalClient || !this.config) {
      throw new Error('Azure B2C not initialized');
    }

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
      throw error;
    }
  }

  // Exchange Azure token for JWT
  async exchangeTokenForJWT(azureToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.jwtSecret) {
      throw new Error('JWT secret not configured');
    }

    try {
      // Get user info from Azure token
      const userInfo = await this.getUserInfoFromToken(azureToken);
      
      // Get user permissions (this would typically come from your database)
      const permissions = await this.getUserPermissions(userInfo.id);
      
      // Generate JWT access token
      const accessToken = jwt.sign(
        {
          sub: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          permissions,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        },
        this.jwtSecret
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        {
          sub: userInfo.id,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
        },
        this.jwtRefreshSecret || this.jwtSecret
      );

      return { accessToken, refreshToken };
    } catch (error) {
      throw error;
    }
  }

  // Get user info from Azure token
  private async getUserInfoFromToken(accessToken: string): Promise<UserInfo> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      return {
        id: response.data.id,
        email: response.data.mail || response.data.userPrincipalName,
        name: response.data.displayName,
        permissions: [], // Will be populated by getUserPermissions
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user permissions (implement based on your business logic)
  private async getUserPermissions(userId: string): Promise<string[]> {
    // Default permissions for all users
    const defaultPermissions = ['read:profile', 'read:workspace'];
    
    // Check if user is admin (this would typically come from your database)
    const isAdmin = await this.checkIfUserIsAdmin(userId);
    
    if (isAdmin) {
      return [...defaultPermissions, 'admin:all', 'write:workspace', 'delete:workspace'];
    }

    return defaultPermissions;
  }

  private async checkIfUserIsAdmin(userId: string): Promise<boolean> {
    // Implement your admin check logic here
    // This could check a database, Azure AD groups, etc.
    return false;
  }

  // Verify JWT token
  verifyToken(token: string): any {
    if (!this.jwtSecret) {
      throw new Error('JWT secret not configured');
    }
    return jwt.verify(token, this.jwtSecret);
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    if (!this.jwtRefreshSecret || !this.jwtSecret) {
      throw new Error('JWT secrets not configured');
    }

    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get fresh user permissions
      const permissions = await this.getUserPermissions(decoded.sub);

      // Generate new access token
      const accessToken = jwt.sign(
        {
          sub: decoded.sub,
          permissions,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour
        },
        this.jwtSecret
      );

      return { accessToken };
    } catch (error) {
      throw error;
    }
  }

  // Logout user
  async logout(userId?: string): Promise<void> {
    // Implement logout logic (e.g., blacklist tokens, clear sessions)
    console.log(`User ${userId} logged out`);
  }

  // Utility methods
  getAuthorizationHeader(token: string): string {
    return `Bearer ${token}`;
  }

  extractTokenFromHeader(authHeader: string): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}