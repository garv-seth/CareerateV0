// Careerate Backend Configuration Template
// Copy these environment variables to your Azure App Service Configuration

module.exports = {
  // Application Configuration
  NODE_ENV: 'production',
  PORT: process.env.PORT || 8080,

  // CORS Configuration  
  CORS_ORIGIN: 'https://careerate-app.azurewebsites.net,http://localhost:3000',

  // Security Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'careerate-session-secret-2024',
  JWT_SECRET: process.env.JWT_SECRET || 'careerate-jwt-secret-2024',

  // Azure B2C Configuration
  AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
  AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
  AZURE_TENANT_ID: process.env.AZURE_TENANT_ID,
  AZURE_B2C_POLICY: process.env.AZURE_B2C_POLICY,

  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_HOST: process.env.POSTGRES_HOST,
  POSTGRES_DB: process.env.POSTGRES_DB,
  POSTGRES_USER: process.env.POSTGRES_USER,
  POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD,
  POSTGRES_PORT: process.env.POSTGRES_PORT || 5432,

  // AI Service Configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,

  // Azure Key Vault Configuration
  AZURE_KEY_VAULT_URL: process.env.AZURE_KEY_VAULT_URL,
  AZURE_KEY_VAULT_CLIENT_ID: process.env.AZURE_KEY_VAULT_CLIENT_ID,
  AZURE_KEY_VAULT_CLIENT_SECRET: process.env.AZURE_KEY_VAULT_CLIENT_SECRET,
  AZURE_KEY_VAULT_TENANT_ID: process.env.AZURE_KEY_VAULT_TENANT_ID,

  // Application Insights
  APPINSIGHTS_INSTRUMENTATIONKEY: process.env.APPINSIGHTS_INSTRUMENTATIONKEY,

  // Chrome Extension Configuration
  CHROME_EXTENSION_ID: process.env.CHROME_EXTENSION_ID || 'careerate-chrome-ext',
  EXTENSION_API_KEY: process.env.EXTENSION_API_KEY || 'careerate-ext-2024'
};

/*
AZURE APP SERVICE ENVIRONMENT VARIABLES TO SET:

Application Settings:
- NODE_ENV=production
- PORT=8080
- CORS_ORIGIN=https://careerate-app.azurewebsites.net
- SESSION_SECRET=<your-session-secret>
- JWT_SECRET=<your-jwt-secret>
- AZURE_CLIENT_ID=<from-key-vault>
- AZURE_CLIENT_SECRET=<from-key-vault>
- AZURE_TENANT_ID=<from-key-vault>
- DATABASE_URL=<from-key-vault>
- OPENAI_API_KEY=<from-key-vault>
- ANTHROPIC_API_KEY=<from-key-vault>
- AZURE_KEY_VAULT_URL=<your-key-vault-url>
- AZURE_KEY_VAULT_CLIENT_ID=<your-key-vault-client-id>
- AZURE_KEY_VAULT_CLIENT_SECRET=<your-key-vault-client-secret>
- AZURE_KEY_VAULT_TENANT_ID=<your-key-vault-tenant-id>

Startup Command:
bash startup.sh
*/ 