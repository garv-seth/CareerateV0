import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import chalk from 'chalk';

export class AzureSecretsManager {
  private secretClient: SecretClient | null = null;
  private cache: Map<string, { value: string; expiry: number }> = new Map();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  async initialize(): Promise<void> {
    try {
      const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
      
      if (!keyVaultUrl) {
        console.warn(chalk.yellow('⚠️  Azure Key Vault URL not provided, using environment variables'));
        return;
      }

      const credential = new DefaultAzureCredential();
      this.secretClient = new SecretClient(keyVaultUrl, credential);

      // Test connection
      // const testSecret = await this.secretClient.getSecret('test-connection');
      console.log(chalk.green('✅ Azure Key Vault connected successfully'));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Azure Key Vault connection failed, falling back to env vars:'), (error as Error)?.message || 'Unknown error');
      this.secretClient = null;
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
        // First, attempt to fetch the **hyphen-case** version (Key Vault naming convention)
        const hyphenCaseName = secretName.replace(/_/g, '-');
        try {
          const secret = await this.secretClient.getSecret(hyphenCaseName);
          secretValue = secret.value || '';
          console.log(chalk.green(`✅ Retrieved secret '${hyphenCaseName}' from Key Vault`));
        } catch (primaryError) {
          // Fallback: try original underscore name in Key Vault
          try {
            const secret = await this.secretClient.getSecret(secretName);
            secretValue = secret.value || '';
            console.log(chalk.green(`✅ Retrieved secret '${secretName}' from Key Vault (fallback)`));
          } catch (secondaryError) {
            // Final fallback to environment variables (App Service settings)
            console.warn(chalk.yellow(`⚠️  Failed to get '${hyphenCaseName}' or '${secretName}' from Key Vault, trying env vars`));
            secretValue = this.getFromEnvironment(secretName);
          }
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
      console.error(chalk.red(`❌ Failed to retrieve secret '${secretName}':`, error));
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

    console.log(chalk.blue(`📝 Using environment variable '${envVar}' for secret '${secretName}'`));
    return value;
  }

  clearCache(): void {
    this.cache.clear();
    console.log(chalk.blue('🧹 Secrets cache cleared'));
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}