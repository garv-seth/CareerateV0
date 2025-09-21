#!/bin/bash

# Deploy Careerate to Azure Container Apps
echo "🚀 Deploying Careerate to Azure Container Apps..."

# Set variables
RESOURCE_GROUP="Careerate"
CONTAINER_APP_NAME="careerate-web"
ACR_NAME="careerateacr"
IMAGE_NAME="careerate-app:v0.0.12" # Increment version

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

# 1) Pull actual secret values from Key Vault and define/refresh Container App secrets
echo "🔐 Pulling secrets from Key Vault and updating Container App..."
KV_NAME="careeeratesecretsvault"
sanitize() { echo -n "$1" | tr -d '\r\n'; }
AZ_TENANT_ID=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name AZURE-TENANT-ID --query value -o tsv)")
AZ_CLIENT_ID=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name AZURE-CLIENT-ID --query value -o tsv)")
AZ_CLIENT_SECRET=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name AZURE-CLIENT-SECRET --query value -o tsv)")
SESSION_SECRET=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name SESSION-SECRET --query value -o tsv)")
DATABASE_URL=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name DATABASE-URL --query value -o tsv)")
OPENAI_API_KEY=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name OPENAI-API-KEY --query value -o tsv)")
GITHUB_CLIENT_ID=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name GITHUB-CLIENT-ID --query value -o tsv)")
GITHUB_CLIENT_SECRET=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name GITHUB-CLIENT-SECRET --query value -o tsv)")
STRIPE_SECRET_KEY=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name STRIPE-SECRET-KEY --query value -o tsv)")
STRIPE_WEBHOOK_SECRET=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name STRIPE-WEBHOOK-SECRET --query value -o tsv)")
SENDGRID_API_KEY=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name SENDGRID-API-KEY --query value -o tsv)")
TWILIO_ACCOUNT_SID=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name TWILIO-ACCOUNT-SID --query value -o tsv)")
TWILIO_AUTH_TOKEN=$(sanitize "$(az keyvault secret show --vault-name $KV_NAME --name TWILIO-AUTH-TOKEN --query value -o tsv)")

az containerapp secret set \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --secrets \
    azure-client-id=$AZ_CLIENT_ID \
    azure-client-secret=$AZ_CLIENT_SECRET \
    azure-tenant-id=$AZ_TENANT_ID \
    session-secret=$SESSION_SECRET \
    database-url=$DATABASE_URL \
    openai-api-key=$OPENAI_API_KEY \
    github-client-id=$GITHUB_CLIENT_ID \
    github-client-secret=$GITHUB_CLIENT_SECRET \
    stripe-secret-key=$STRIPE_SECRET_KEY \
    stripe-webhook-secret=$STRIPE_WEBHOOK_SECRET \
    sendgrid-api-key=$SENDGRID_API_KEY \
    twilio-account-sid=$TWILIO_ACCOUNT_SID \
    twilio-auth-token=$TWILIO_AUTH_TOKEN || { echo "❌ Failed setting secrets"; exit 1; }

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
    GITHUB_REDIRECT_URI=https://gocareerate.com/api/callback/github \
    STRIPE_SECRET_KEY=secretref:stripe-secret-key \
    STRIPE_WEBHOOK_SECRET=secretref:stripe-webhook-secret \
    SENDGRID_API_KEY=secretref:sendgrid-api-key \
    TWILIO_ACCOUNT_SID=secretref:twilio-account-sid \
    TWILIO_AUTH_TOKEN=secretref:twilio-auth-token \
    BASE_URL=https://gocareerate.com \
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
