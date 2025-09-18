# Azure Integrations Setup

This document describes the Azure integrations and KeyVault secret management for Careerate's production deployment.

## Overview

Careerate uses Azure Container Apps for hosting and Azure Key Vault for secure secret management. All sensitive configuration values are stored in KeyVault and referenced in the application settings.

## Azure Resources

- **Resource Group**: `Careerate`
- **Key Vault**: `careeeratesecretsvault`
- **Container Apps Environment**: `careerate-agents-env`
- **Container Registry**: `careerateacr`
- **Storage Account**: `careeratestorage`

## Configured Secrets

### Core Azure B2C Authentication
- `AZURE-CLIENT-ID` - Azure B2C Application Client ID
- `AZURE-CLIENT-SECRET` - Azure B2C Application Client Secret
- `AZURE-TENANT-ID` - Azure Tenant ID
- `B2C-TENANT-NAME` - Azure B2C Tenant Name
- `B2C-SIGNUP-SIGNIN-POLICY-NAME` - B2C Sign-up/Sign-in Policy Name
- `SESSION-SECRET` - Session encryption secret

### Database
- `DATABASE-URL` - Neon PostgreSQL connection string

### Git Integration
- `GITHUB-CLIENT-ID` - GitHub OAuth App Client ID
- `GITHUB-CLIENT-SECRET` - GitHub OAuth App Client Secret
- `GITLAB-CLIENT-ID` - GitLab OAuth App Client ID (optional)
- `GITLAB-CLIENT-SECRET` - GitLab OAuth App Client Secret (optional)

### AI Services
- `OPENAI-API-KEY` - OpenAI API Key for AI-powered features

### Payment Processing
- `STRIPE-SECRET-KEY` - Stripe Secret Key for payment processing
- `STRIPE-WEBHOOK-SECRET` - Stripe Webhook Secret for event verification

### Communication Services
- `SENDGRID-API-KEY` - SendGrid API Key for email notifications
- `TWILIO-ACCOUNT-SID` - Twilio Account SID for SMS notifications
- `TWILIO-AUTH-TOKEN` - Twilio Auth Token for SMS notifications

## Environment Configuration

The application uses the KeyVault references format in `arm-appsettings.json`:

```json
{
  "properties": {
    "SECRET_NAME": "@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/SECRET-NAME/latest)"
  }
}
```

## Setting Up Secrets

### Using Scripts

Run one of the provided scripts to interactively set up KeyVault secrets:

**Bash (Linux/macOS/WSL):**
```bash
chmod +x scripts/setup-keyvault-secrets.sh
./scripts/setup-keyvault-secrets.sh
```

**PowerShell (Windows):**
```powershell
.\scripts\setup-keyvault-secrets.ps1
```

### Manual Setup

You can also set secrets manually using Azure CLI:

```bash
# Example: Set OpenAI API Key
az keyvault secret set \
  --vault-name careeeratesecretsvault \
  --name "OPENAI-API-KEY" \
  --value "your-openai-api-key"
```

### Azure Portal

Alternatively, use the Azure Portal:
1. Navigate to the KeyVault in Azure Portal
2. Go to "Secrets" section
3. Click "Generate/Import"
4. Enter the secret name and value

## Application Deployment

After updating secrets, deploy the updated configuration:

```bash
# Build and push to container registry
npm run build
docker build -t careerateacr.azurecr.io/careerate:latest .
docker push careerateacr.azurecr.io/careerate:latest

# Update container app with new configuration
az containerapp update \
  --name careerate-web \
  --resource-group Careerate \
  --set-env-vars @arm-appsettings.json
```

## Service Integration Details

### GitHub Integration
- **Purpose**: Code repository connection, pull request creation
- **Required**: Yes (for Git features)
- **Setup**: Create GitHub OAuth App with appropriate scopes

### GitLab Integration
- **Purpose**: Alternative code repository connection
- **Required**: No (optional for GitLab users)
- **Setup**: Create GitLab OAuth Application

### OpenAI Integration
- **Purpose**: AI-powered code generation, analysis, and recommendations
- **Required**: No (has fallback behavior)
- **Fallback**: Uses "default_key" when not configured

### Stripe Integration
- **Purpose**: Payment processing for subscriptions
- **Required**: No (payment features disabled without it)
- **Setup**: Configure Stripe webhook endpoint

### SendGrid Integration
- **Purpose**: Email notifications and communications
- **Required**: No (email features disabled without it)
- **Setup**: Create SendGrid API key with appropriate permissions

### Twilio Integration
- **Purpose**: SMS notifications
- **Required**: No (SMS features disabled without it)
- **Setup**: Create Twilio account and get credentials

## Security Best Practices

1. **Never commit secrets to source control**
2. **Use KeyVault references in all configuration files**
3. **Rotate secrets regularly**
4. **Use least-privilege access for service accounts**
5. **Monitor KeyVault access logs**

## Troubleshooting

### Common Issues

**Secret not found:**
- Verify the secret exists in KeyVault
- Check the KeyVault reference format
- Ensure the Container App has access to KeyVault

**Authentication failures:**
- Verify B2C configuration matches tenant settings
- Check client ID/secret pairs
- Ensure redirect URLs are correctly configured

**Service integration failures:**
- Check API key validity
- Verify service quotas and limits
- Review service-specific documentation

### Debugging Commands

```bash
# List all secrets in KeyVault
az keyvault secret list --vault-name careeeratesecretsvault

# Get secret value (for debugging)
az keyvault secret show --vault-name careeeratesecretsvault --name "SECRET-NAME"

# Check container app configuration
az containerapp show --name careerate-web --resource-group Careerate
```

## Monitoring

Monitor the application logs and KeyVault access:

1. **Application Insights**: Monitor application performance and errors
2. **KeyVault Diagnostics**: Track secret access patterns
3. **Container App Logs**: Review startup and runtime logs

## Support

For issues with Azure integrations:
1. Check Azure service status
2. Review application logs in Container Apps
3. Verify KeyVault permissions and access
4. Test individual service integrations

---

*Last updated: [Current Date]*
*For more information, see the main [README.md](../README.md) or [CLAUDE.md](../CLAUDE.md)*