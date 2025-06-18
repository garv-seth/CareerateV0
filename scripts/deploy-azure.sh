#!/bin/bash

# Careerate Azure Deployment Script
set -e

echo "🚀 Starting Careerate deployment to Azure..."

# Configuration
RESOURCE_GROUP="Careerate"
LOCATION="westus2"
APP_NAME="Careerate-adaa"
STORAGE_ACCOUNT="careeratestorage"
COSMOS_ACCOUNT="careeratedb"
KEY_VAULT="CareeerateSecretsVault"

# Check if logged in to Azure
echo "Checking Azure login status..."
if ! az account show &>/dev/null; then
    echo "Please login to Azure:"
    az login
fi

# Build the application
echo "Building application..."
pnpm install --frozen-lockfile
pnpm run build

# Build Docker images
echo "Building Docker images..."
docker build -t careerate-api:latest ./apps/api
docker build -t careerate-web:latest ./apps/web

# Tag and push to Azure Container Registry
echo "Pushing images to Azure Container Registry..."
az acr login --name $STORAGE_ACCOUNT

docker tag careerate-api:latest $STORAGE_ACCOUNT.azurecr.io/careerate-api:latest
docker tag careerate-web:latest $STORAGE_ACCOUNT.azurecr.io/careerate-web:latest

docker push $STORAGE_ACCOUNT.azurecr.io/careerate-api:latest
docker push $STORAGE_ACCOUNT.azurecr.io/careerate-web:latest

# Update App Service with new images
echo "Updating App Service..."
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --multicontainer-config-type compose \
  --multicontainer-config-file docker-compose.yml

# Update environment variables from Key Vault
echo "Updating environment variables..."
SECRETS=$(az keyvault secret list --vault-name $KEY_VAULT --query "[].name" -o tsv)

for SECRET in $SECRETS; do
    VALUE=$(az keyvault secret show --vault-name $KEY_VAULT --name $SECRET --query "value" -o tsv)
    az webapp config appsettings set \
      --name $APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --settings "$SECRET=$VALUE" \
      --slot-settings
done

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Restart the app
echo "Restarting application..."
az webapp restart --name $APP_NAME --resource-group $RESOURCE_GROUP

echo "✅ Deployment complete!"
echo "🌐 Application URL: https://$APP_NAME.azurewebsites.net" 