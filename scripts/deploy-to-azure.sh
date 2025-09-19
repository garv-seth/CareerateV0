#!/bin/bash

# Deploy Careerate to Azure Container Apps
echo "🚀 Deploying Careerate to Azure Container Apps..."

# Set variables
RESOURCE_GROUP="Careerate"
CONTAINER_APP_NAME="careerate-web"
ACR_NAME="careerateacr"
IMAGE_NAME="careerate:latest"

# Check if logged in to Azure
echo "📋 Checking Azure login status..."
az account show > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Build and push image if Docker is available
if command -v docker &> /dev/null && docker info &> /dev/null; then
    echo "🐳 Building Docker image..."
    docker build -t $ACR_NAME.azurecr.io/$IMAGE_NAME .
    
    echo "📤 Pushing to Azure Container Registry..."
    az acr login --name $ACR_NAME
    docker push $ACR_NAME.azurecr.io/$IMAGE_NAME
else
    echo "⚠️  Docker not available, using existing image..."
fi

# Update container app with new configuration
echo "🔄 Updating Container App..."
az containerapp update \
    --name $CONTAINER_APP_NAME \
    --resource-group $RESOURCE_GROUP \
    --image $ACR_NAME.azurecr.io/$IMAGE_NAME \
    --set-env-vars \
        AZURE_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-CLIENT-ID/latest)" \
        AZURE_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-CLIENT-SECRET/latest)" \
        AZURE_TENANT_ID="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/AZURE-TENANT-ID/latest)" \
        SESSION_SECRET="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/SESSION-SECRET/latest)" \
        DATABASE_URL="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/DATABASE-URL/latest)" \
        OPENAI_API_KEY="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/OPENAI-API-KEY/latest)" \
        GITHUB_CLIENT_ID="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/GITHUB-CLIENT-ID/latest)" \
        GITHUB_CLIENT_SECRET="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/GITHUB-CLIENT-SECRET/latest)" \
        STRIPE_SECRET_KEY="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/STRIPE-SECRET-KEY/latest)" \
        STRIPE_WEBHOOK_SECRET="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/STRIPE-WEBHOOK-SECRET/latest)" \
        SENDGRID_API_KEY="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/SENDGRID-API-KEY/latest)" \
        TWILIO_ACCOUNT_SID="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/TWILIO-ACCOUNT-SID/latest)" \
        TWILIO_AUTH_TOKEN="@Microsoft.KeyVault(SecretUri=https://careeeratesecretsvault.vault.azure.net/secrets/TWILIO-AUTH-TOKEN/latest)" \
        BASE_URL="https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io" \
        NODE_ENV="production" \
        PORT="5000" \
        WEBSITES_PORT="5000"

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Application URL: https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io"
    
    # Wait for deployment to be ready
    echo "⏳ Waiting for deployment to be ready..."
    sleep 30
    
    # Test the deployment
    echo "🧪 Testing deployment..."
    curl -f https://careerate-web.politetree-6f564ad5.westus2.azurecontainerapps.io/api/health || echo "⚠️  Health check failed"
    
    echo "🎉 Deployment complete!"
else
    echo "❌ Deployment failed!"
    exit 1
fi
