#!/bin/bash

# Deploy Careerate to Azure Container Apps
echo "🚀 Deploying Careerate to Azure Container Apps..."

# Set variables
RESOURCE_GROUP="Careerate"
CONTAINER_APP_NAME="careerate-web"
ACR_NAME="careerateacr"
IMAGE_NAME="careerate-app:v0.0.11" # Increment version

# Check if logged in to Azure
echo "📋 Checking Azure login status..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Build image directly in Azure Container Registry
echo "☁️ Building image in Azure Container Registry..."
az acr build --registry $ACR_NAME --image $IMAGE_NAME . || { echo "❌ ACR build failed!"; exit 1; }

# 1) Define/refresh secrets on the Container App from Key Vault
#    This is REQUIRED so that secretref:* env vars resolve correctly.
echo "🔐 Setting Container App secrets from Key Vault..."
az containerapp secret set \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    "azure-client-id=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-CLIENT-ID)" \
    "azure-client-secret=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-CLIENT-SECRET)" \
    "azure-tenant-id=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-TENANT-ID)" \
    "session-secret=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/SESSION-SECRET)" \
    "database-url=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/DATABASE-URL)" \
    "openai-api-key=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/OPENAI-API-KEY)" \
    "github-client-id=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/GITHUB-CLIENT-ID)" \
    "github-client-secret=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/GITHUB-CLIENT-SECRET)" \
    "stripe-secret-key=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/STRIPE-SECRET-KEY)" \
    "stripe-webhook-secret=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/STRIPE-WEBHOOK-SECRET)" \
    "sendgrid-api-key=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/SENDGRID-API-KEY)" \
    "twilio-account-sid=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/TWILIO-ACCOUNT-SID)" \
    "twilio-auth-token=@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/TWILIO-AUTH-TOKEN)" || { echo "❌ Failed setting secrets"; exit 1; }

# 2) Update image and bind env vars to the above secrets using secretref

echo "🔄 Updating Container App image and env vars..."
az containerapp update \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --image $ACR_NAME.azurecr.io/$IMAGE_NAME \
  --set-env-vars \
    AZURE_CLIENT_ID=secretref:azure-client-id \
    AZURE_CLIENT_SECRET=secretref:azure-client-secret \
    AZURE_TENANT_ID=secretref:azure-tenant-id \
    SESSION_SECRET=secretref:session-secret \
    DATABASE_URL=secretref:database-url \
    OPENAI_API_KEY=secretref:openai-api-key \
    GITHUB_CLIENT_ID=secretref:github-client-id \
    GITHUB_CLIENT_SECRET=secretref:github-client-secret \
    STRIPE_SECRET_KEY=secretref:stripe-secret-key \
    STRIPE_WEBHOOK_SECRET=secretref:stripe-webhook-secret \
    SENDGRID_API_KEY=secretref:sendgrid-api-key \
    TWILIO_ACCOUNT_SID=secretref:twilio-account-sid \
    TWILIO_AUTH_TOKEN=secretref:twilio-auth-token \
    BASE_URL=https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io \
    NODE_ENV=production \
    PORT=5000 \
    WEBSITES_PORT=5000 || { echo "❌ Container App update failed"; exit 1; }

# Route all traffic to newest revision
echo "⏳ Waiting for new revision..."
sleep 30
LATEST_REVISION=$(az containerapp revision list -n $CONTAINER_APP_NAME -g $RESOURCE_GROUP --query "[?properties.createdTime] | sort_by(@, &properties.createdTime) | [-1].name" -o tsv)
if [ -z "$LATEST_REVISION" ]; then
  echo "⚠️ Could not determine the latest revision name."
  exit 1
fi

echo "➡️ Routing 100% traffic to $LATEST_REVISION"
az containerapp ingress traffic set -n $CONTAINER_APP_NAME -g $RESOURCE_GROUP --revision-weight $LATEST_REVISION=100 || { echo "❌ Failed to route traffic"; exit 1; }

echo "✅ Deployment complete! Visit: https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io"
