// Azure Key Vault Secret Names Mapping
export const SECRETS_CONFIG = {
  // Authentication Secrets
  AUTH: {
    B2C_CLIENT_ID: 'B2C_CLIENT_ID',
    B2C_TENANT_NAME: 'B2C_TENANT_NAME',
    B2C_SIGNUP_SIGNIN_POLICY_NAME: 'B2C_SIGNUP_SIGNIN_POLICY_NAME',
    MICROSOFT_PROVIDER_AUTHENTICATION_SECRET: 'MICROSOFT_PROVIDER_AUTHENTICATION_SECRET',
    JWT_SECRET: 'JWT_SECRET',
    JWT_REFRESH_SECRET: 'JWT_REFRESH_SECRET',
    SESSION_SECRET: 'SESSION_SECRET'
  },

  // AI Provider Secrets
  AI_PROVIDERS: {
    OPENAI_API_KEY: 'OPENAI_API_KEY',
    ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
    AZURE_OPENAI_API_KEY: 'AZURE_OPENAI_API_KEY', // If using Azure OpenAI
    AZURE_OPENAI_ENDPOINT: 'AZURE_OPENAI_ENDPOINT'
  },

  // External Service Secrets
  EXTERNAL_SERVICES: {
    BRAVESEARCH_API_KEY: 'BRAVESEARCH_API_KEY',
    FIRECRAWL_API_KEY: 'FIRECRAWL_API_KEY',
    GITHUB_TOKEN: 'GITHUB_TOKEN',
    GITLAB_TOKEN: 'GITLAB_TOKEN',
    SLACK_BOT_TOKEN: 'SLACK_BOT_TOKEN',
    PAGERDUTY_API_KEY: 'PAGERDUTY_API_KEY',
    STRIPE_API_KEY: 'STRIPE_API_KEY',
    SENDGRID_API_KEY: 'SENDGRID_API_KEY'
  },

  // Cloud Provider Secrets
  CLOUD_PROVIDERS: {
    AWS_ACCESS_KEY_ID: 'AWS_ACCESS_KEY_ID',
    AWS_SECRET_ACCESS_KEY: 'AWS_SECRET_ACCESS_KEY',
    AWS_REGION: 'AWS_REGION',
    AZURE_SUBSCRIPTION_ID: 'AZURE_SUBSCRIPTION_ID',
    AZURE_CLIENT_ID: 'AZURE_CLIENT_ID',
    AZURE_CLIENT_SECRET: 'AZURE_CLIENT_SECRET',
    GCP_PROJECT_ID: 'GCP_PROJECT_ID',
    GCP_SERVICE_ACCOUNT_KEY: 'GCP_SERVICE_ACCOUNT_KEY'
  },

  // Database Connection Strings
  DATABASES: {
    MONGODB_CONNECTION_STRING: 'COSMOSDB_CONNECTION_STRING_CENTRALUS',
    POSTGRES_CONNECTION_STRING: 'POSTGRES_CONNECTION_STRING',
    REDIS_CONNECTION_STRING: 'REDIS_CONNECTION_STRING',
    AZURE_STORAGE_CONNECTION_STRING: 'AZURE_STORAGE_CONNECTION_STRING'
  },

  // Monitoring & Analytics
  MONITORING: {
    DATADOG_API_KEY: 'DATADOG_API_KEY',
    NEWRELIC_LICENSE_KEY: 'NEWRELIC_LICENSE_KEY',
    PROMETHEUS_ENDPOINT: 'PROMETHEUS_ENDPOINT',
    GRAFANA_API_KEY: 'GRAFANA_API_KEY',
    SENTRY_DSN: 'SENTRY_DSN'
  },

  // Container & Orchestration
  CONTAINER: {
    DOCKER_REGISTRY_URL: 'DOCKER_REGISTRY_URL',
    DOCKER_REGISTRY_USERNAME: 'DOCKER_REGISTRY_USERNAME',
    DOCKER_REGISTRY_PASSWORD: 'DOCKER_REGISTRY_PASSWORD',
    KUBERNETES_CLUSTER_ENDPOINT: 'KUBERNETES_CLUSTER_ENDPOINT',
    KUBERNETES_SERVICE_ACCOUNT_TOKEN: 'KUBERNETES_SERVICE_ACCOUNT_TOKEN'
  }
};

// Environment Variables (from Azure App Service)
export const ENV_VARS = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  WEBSITE_AUTH_AAD_ALLOWED_TENANTS: process.env.WEBSITE_AUTH_AAD_ALLOWED_TENANTS || ''
};

// Azure Resources Configuration
export const AZURE_RESOURCES = {
  KEY_VAULT_URL: process.env.AZURE_KEY_VAULT_URL || 'https://careeeratesecretsvault.vault.azure.net',
  STORAGE_ACCOUNT: 'careeratestorage',
  COSMOSDB_ACCOUNT: 'careeratedb',
  COSMOSDB_MONGODB_ACCOUNT: 'careeratemongodb',
  APP_SERVICE_NAME: 'Careerate',
  APP_SERVICE_PLAN: 'careerate-asp',
  MANAGED_IDENTITY: 'Careerate-adaa',
  B2C_TENANT: 'careerate.onmicrosoft.com',
  OPENAI_INSTANCE: 'CareerateAIStack'
};

// Additional secrets needed (to be added to Azure Key Vault)
export const REQUIRED_SECRETS = [
  'TERRAFORM_CLOUD_TOKEN',
  'HELM_REGISTRY_PASSWORD',
  'JIRA_API_TOKEN',
  'CONFLUENCE_API_TOKEN',
  'ELASTIC_CLOUD_ID',
  'ELASTIC_API_KEY',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'WEBSOCKET_SECRET',
  'ENCRYPTION_KEY'
];

// Secret validation helper
export function validateSecrets(secrets: Record<string, string>): string[] {
  const missingSecrets: string[] = [];
  
  // Check all required secrets
  Object.values(SECRETS_CONFIG).forEach(category => {
    Object.values(category).forEach(secretName => {
      if (!secrets[secretName as string]) {
        missingSecrets.push(secretName as string);
      }
    });
  });
  
  return missingSecrets;
} 