#!/bin/bash

# Azure Deployment Script for Careerate Platform
set -e

echo "🚀 Starting Azure deployment for Careerate Platform..."

# Configuration
RESOURCE_GROUP="careerate-rg"
APP_NAME="careerate-app"
LOCATION="eastus"
SKU="B1"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install Azure CLI first."
    exit 1
fi

# Login check
echo "🔐 Checking Azure login status..."
if ! az account show &> /dev/null; then
    echo "Please login to Azure first:"
    az login
fi

# Create resource group if it doesn't exist
echo "📦 Creating resource group: $RESOURCE_GROUP"
az group create --name $RESOURCE_GROUP --location $LOCATION

# Deploy infrastructure using ARM template
echo "🏗️  Deploying Azure infrastructure..."
az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file azure-deploy.json \
    --parameters appName=$APP_NAME location=$LOCATION sku=$SKU

# Build the application
echo "🔨 Building application..."
npm ci
cd frontend && npm ci && npm run build
cd ../backend && npm ci && npm run build

# Copy frontend build to backend public directory
echo "📋 Preparing deployment package..."
cp -r ../frontend/dist/* public/

# Create deployment package
zip -r careerate-deployment.zip . -x "node_modules/*" "src/*" "*.ts" "*.tsx" ".git/*"

# Deploy to Azure App Service
echo "🌐 Deploying to Azure App Service..."
az webapp deployment source config-zip \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src careerate-deployment.zip

# Configure app settings
echo "⚙️  Configuring app settings..."
az webapp config appsettings set \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --settings \
        NODE_ENV=production \
        PORT=8080 \
        CORS_ORIGIN=https://$APP_NAME.azurewebsites.net

# Get the app URL
APP_URL=$(az webapp show --resource-group $RESOURCE_GROUP --name $APP_NAME --query defaultHostName -o tsv)

echo "✅ Deployment complete!"
echo "🌍 Your app is available at: https://$APP_URL"
echo "📊 Monitor your app: https://portal.azure.com"

# Cleanup
rm -f careerate-deployment.zip

echo "🎉 Azure deployment finished successfully!"