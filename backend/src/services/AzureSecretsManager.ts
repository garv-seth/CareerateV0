import { DefaultAzureCredential, ManagedIdentityCredential, ClientSecretCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

export class AzureSecretsManager {
  private secretClient: SecretClient | null = null;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly cacheTTL = 30 * 60 * 1000; // 30 minutes
  private isInitialized = false;
  private refreshInterval: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL || 'https://careeeratesecretsvault.vault.azure.net/';
      
      // Try multiple authentication methods for Azure environments
      let credential;
      
      try {
        // First try Managed Identity (for Azure App Service)
        credential = new ManagedIdentityCredential();
        logger.info('Using Managed Identity credential for Azure Key Vault');
      } catch {
        // Fallback to Service Principal
        if (process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET && process.env.AZURE_TENANT_ID) {
          credential = new ClientSecretCredential(
            process.env.AZURE_TENANT_ID,
            process.env.AZURE_CLIENT_ID,
            process.env.AZURE_CLIENT_SECRET
          );
          logger.info('Using Service Principal credential for Azure Key Vault');
        } else {
          // Final fallback to DefaultAzureCredential
          credential = new DefaultAzureCredential();
          logger.info('Using Default Azure credential for Key Vault');
        }
      }

      this.secretClient = new SecretClient(keyVaultUrl, credential);
      
      // Pre-load critical secrets for the platform
      await this.preloadCriticalSecrets();
      
      // Setup periodic refresh
      this.setupPeriodicRefresh();
      
      this.isInitialized = true;
      logger.info('Azure Key Vault connection established successfully');
    } catch (error) {
      logger.warn('Azure Key Vault connection failed, falling back to environment variables:', error);
      this.secretClient = null;
      this.isInitialized = false;
      
      // Load from environment as fallback
      this.loadFromEnvironment();
    }
  }

  private async preloadCriticalSecrets(): Promise<void> {
    const criticalSecrets = [
      'OPENAI_API_KEY',
      'JWT_SECRET', 
      'JWT_REFRESH_SECRET',
      'SESSION_SECRET',
      'B2C_CLIENT_ID',
      'B2C_TENANT_NAME', 
      'B2C_SIGNUP_SIGNIN_POLICY_NAME',
      'AZURE_STORAGE_CONNECTION_STRING',
      'COSMOSDB_CONNECTION_STRING_CENTRALUS',
      'BRAVESEARCH_API_KEY',
      'FIRECRAWL_API_KEY'
    ];

    for (const secretName of criticalSecrets) {
      try {
        await this.getSecret(secretName);
      } catch (error) {
        logger.warn(`Failed to preload secret ${secretName}:`, error);
      }
    }
    
    logger.info(`Preloaded ${this.cache.size} critical secrets`);
  }

  private loadFromEnvironment(): void {
    const secrets = [
      'OPENAI_API_KEY',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET', 
      'SESSION_SECRET',
      'B2C_CLIENT_ID',
      'B2C_TENANT_NAME',
      'B2C_SIGNUP_SIGNIN_POLICY_NAME',
      'AZURE_STORAGE_CONNECTION_STRING',
      'COSMOSDB_CONNECTION_STRING_CENTRALUS',
      'BRAVESEARCH_API_KEY',
      'FIRECRAWL_API_KEY'
    ];

    let loadedCount = 0;
    for (const secretName of secrets) {
      const value = process.env[secretName];
      if (value) {
        this.cache.set(secretName, {
          value,
          expiry: Date.now() + this.cacheTTL
        });
        loadedCount++;
      }
    }
    
    logger.info(`Loaded ${loadedCount} secrets from environment variables`);
  }

  private setupPeriodicRefresh(): void {
    // Refresh cache every 15 minutes
    this.refreshInterval = setInterval(async () => {
      try {
        await this.refreshCache();
        logger.info('Secrets cache refreshed successfully');
      } catch (error) {
        logger.error('Failed to refresh secrets cache:', error);
      }
    }, 15 * 60 * 1000);
  }

  private async refreshCache(): Promise<void> {
    if (!this.secretClient) return;

    const secretNames = Array.from(this.cache.keys());
    for (const secretName of secretNames) {
      try {
        const keyVaultSecretName = secretName.replace(/_/g, '-');
        const secret = await this.secretClient.getSecret(keyVaultSecretName);
        if (secret.value) {
          this.cache.set(secretName, {
            value: secret.value,
            expiry: Date.now() + this.cacheTTL
          });
        }
      } catch (error) {
        logger.warn(`Failed to refresh secret ${secretName}:`, error);
      }
    }
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      // Check cache first
      const cached = this.cache.get(secretName);
      if (cached && Date.now() < cached.expiry) {
        return cached.value;
      }

      let secretValue: string;

      if (this.secretClient) {
        try {
          // Convert underscore to hyphen for Key Vault secret names
          const keyVaultSecretName = secretName.replace(/_/g, '-');
          const secret = await this.secretClient.getSecret(keyVaultSecretName);
          secretValue = secret.value || '';
          console.log(`✅ Retrieved secret '${keyVaultSecretName}' from Key Vault`);
        } catch (error) {
          console.warn(`⚠️  Failed to get '${secretName}' from Key Vault, trying env vars`);
          secretValue = this.getFromEnvironment(secretName);
        }
      } else {
        secretValue = this.getFromEnvironment(secretName);
      }

      // Cache the secret
      this.cache.set(secretName, {
        value: secretValue,
        expiry: Date.now() + this.cacheTTL
      });

      return secretValue;
    } catch (error) {
      console.error(`❌ Failed to retrieve secret '${secretName}':`, error);
      throw new Error(`Secret '${secretName}' not found`);
    }
  }



  private getFromEnvironment(secretName: string): string {
    // Map secret names to environment variable names
    const envMapping: Record<string, string> = {
      'B2C_CLIENT_ID': 'B2C_CLIENT_ID',
      'B2C_CLIENT_SECRET': 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET',
      'B2C_TENANT_NAME': 'B2C_TENANT_NAME',
      'B2C_SIGNUP_SIGNIN_POLICY_NAME': 'B2C_SIGNUP_SIGNIN_POLICY_NAME',
      'MONGODB_CONNECTION_STRING': 'COSMOSDB_CONNECTION_STRING_CENTRALUS',
      'COSMOSDB_CONNECTION_STRING_CENTRALUS': 'COSMOSDB_CONNECTION_STRING_CENTRALUS',
      'OPENAI_API_KEY': 'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY': 'ANTHROPIC_API_KEY',
      'BRAVESEARCH_API_KEY': 'BRAVESEARCH_API_KEY',
      'FIRECRAWL_API_KEY': 'FIRECRAWL_API_KEY',
      'JWT_SECRET': 'JWT_SECRET',
      'JWT_REFRESH_SECRET': 'JWT_REFRESH_SECRET',
      'SESSION_SECRET': 'SESSION_SECRET',
      'AZURE_STORAGE_CONNECTION_STRING': 'AZURE_STORAGE_CONNECTION_STRING'
    };

    const envVar = envMapping[secretName] || secretName;
    const value = process.env[envVar];

    if (!value) {
      throw new Error(`Environment variable '${envVar}' not found for secret '${secretName}'`);
    }

    console.log(`📝 Using environment variable '${envVar}' for secret '${secretName}'`);
    return value;
  }

  clearCache(): void {
    this.cache.clear();
    console.log('🧹 Secrets cache cleared');
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}