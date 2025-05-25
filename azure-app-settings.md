# Azure Web App Application Settings Configuration

Based on your Key Vault setup at `https://careeeratesecretsvault.vault.azure.net/`, here are the exact Application Settings you need to configure in your Azure Web App:

## Required Application Settings

Go to your Azure Web App "Careerate" > Configuration > Application settings and add these:

| Name | Value |
|------|-------|
| `COSMOSDB_CONNECTION_STRING_CENTRALUS` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=COSMOSDB-CONNECTION-STRING-CE)` |
| `AZURE_STORAGE_CONNECTION_STRING` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=AZURE-STORAGE-CONNECTION-STRING)` |
| `B2C_CLIENT_ID` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=B2C-CLIENT-ID)` |
| `B2C_TENANT_NAME` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=B2C-TENANT-NAME)` |
| `B2C_SIGNUP_SIGNIN_POLICY_NAME` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=B2C-SIGNUP-SIGNIN-POLICY-NAME)` |
| `BRAVESEARCH_API_KEY` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=BRAVESEARCH-API-KEY)` |
| `FIRECRAWL_API_KEY` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=FIRECRAWL-API-KEY)` |
| `SESSION_SECRET` | `@Microsoft.KeyVault(VaultName=careeeratesecretsvault;SecretName=SESSION-SECRET)` |
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `https://careerate-b0a7fqbzhckbebs.westus-01.azurewebsites.net` |

## Prerequisites

1. **Managed Identity**: Ensure your Web App has System-assigned managed identity enabled
   - Go to your Web App > Identity > System assigned > Status: On

2. **Key Vault Access Policy**: Grant your Web App access to the Key Vault
   - Go to your Key Vault > Access policies
   - Add access policy with "Get" permission for secrets
   - Select your Web App's managed identity as the principal

## Notes

- The `CORS_ORIGIN` is hardcoded in the application but can be overridden by this environment variable
- All other secrets will be fetched from Key Vault automatically
- The application will fall back to direct environment variables if Key Vault access fails 