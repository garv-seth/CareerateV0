import { DefaultAzureCredential } from '@azure/identity';
import { SecretClient } from '@azure/keyvault-secrets';
import dotenv from 'dotenv';

dotenv.config();

// Key Vault configuration
const keyVaultUrl = 'https://careeeratesecretsvault.vault.azure.net/';

// Create the secret client
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(keyVaultUrl, credential);

// Cache for secrets to avoid repeated calls
const secretCache = new Map<string, string>();

// Mapping of environment variable names to Key Vault secret names
const SECRET_MAPPING = {
  'COSMOSDB_CONNECTION_STRING_CENTRALUS': 'COSMOSDB-CONNECTION-STRING-CE',
  'AZURE_STORAGE_CONNECTION_STRING': 'AZURE-STORAGE-CONNECTION-STRING',
  'B2C_CLIENT_ID': 'B2C-CLIENT-ID',
  'B2C_TENANT_NAME': 'B2C-TENANT-NAME',
  'B2C_SIGNUP_SIGNIN_POLICY_NAME': 'B2C-SIGNUP-SIGNIN-POLICY-NAME',
  'BRAVESEARCH_API_KEY': 'BRAVESEARCH-API-KEY',
  'FIRECRAWL_API_KEY': 'FIRECRAWL-API-KEY',
  'SESSION_SECRET': 'SESSION-SECRET'
};

/**
 * Get a secret value, first checking environment variables, then Key Vault
 */
export async function getSecret(envVarName: string): Promise<string | undefined> {
  // First check if it's already in environment variables (for local dev with .env or Azure App Settings)
  const envValue = process.env[envVarName];
  if (envValue && !envValue.startsWith('@Microsoft.KeyVault')) {
    return envValue;
  }

  // Check cache
  if (secretCache.has(envVarName)) {
    return secretCache.get(envVarName);
  }

  // Get the Key Vault secret name
  const keyVaultSecretName = SECRET_MAPPING[envVarName as keyof typeof SECRET_MAPPING];
  if (!keyVaultSecretName) {
    console.warn(`No Key Vault mapping found for environment variable: ${envVarName}`);
    return undefined;
  }

  try {
    console.log(`Fetching secret ${keyVaultSecretName} from Key Vault for ${envVarName}`);
    const secret = await secretClient.getSecret(keyVaultSecretName);
    const value = secret.value;
    
    if (value) {
      // Cache the value
      secretCache.set(envVarName, value);
      return value;
    }
  } catch (error) {
    console.error(`Failed to fetch secret ${keyVaultSecretName} from Key Vault:`, error);
    
    // In development, provide helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error(`
        Key Vault access failed. For local development, you can either:
        1. Set up Azure CLI authentication: 'az login'
        2. Or add the secret directly to your .env file: ${envVarName}=your_value
      `);
    }
  }

  return undefined;
}

/**
 * Initialize all secrets at startup
 */
export async function initializeSecrets(): Promise<void> {
  console.log('Initializing secrets from Key Vault...');
  
  const secretPromises = Object.keys(SECRET_MAPPING).map(async (envVarName) => {
    try {
      const value = await getSecret(envVarName);
      if (value) {
        // Set the environment variable for the rest of the application
        process.env[envVarName] = value;
        console.log(`✓ Loaded ${envVarName}`);
      } else {
        console.warn(`⚠ Failed to load ${envVarName}`);
      }
    } catch (error) {
      console.error(`✗ Error loading ${envVarName}:`, error);
    }
  });

  await Promise.allSettled(secretPromises);
  console.log('Secret initialization complete.');
}

/**
 * Get a required secret, throwing an error if not found
 */
export async function getRequiredSecret(envVarName: string): Promise<string> {
  const value = await getSecret(envVarName);
  if (!value) {
    throw new Error(`Required secret ${envVarName} not found in environment variables or Key Vault`);
  }
  return value;
} 