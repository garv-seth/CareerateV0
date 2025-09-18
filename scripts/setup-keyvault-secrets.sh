#!/bin/bash

# Careerate KeyVault Secrets Management Script
# This script helps set up and manage Azure KeyVault secrets for production deployment

KEYVAULT_NAME="careeeratesecretsvault"
RESOURCE_GROUP="Careerate"

echo "🔐 Careerate KeyVault Secrets Setup"
echo "====================================="
echo ""

# Check if Azure CLI is installed and user is logged in
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

echo "✅ Azure CLI detected and user is logged in"
echo ""

# Function to set a secret in KeyVault
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=${3:-true}

    echo "🔑 Setting up: $secret_name"
    echo "   Description: $secret_description"

    if [ "$is_required" = "true" ]; then
        echo "   ⚠️  Required for production"
    else
        echo "   ℹ️  Optional (has fallback)"
    fi

    read -p "   Enter value for $secret_name (or press Enter to skip): " secret_value

    if [ -n "$secret_value" ]; then
        az keyvault secret set \
            --vault-name "$KEYVAULT_NAME" \
            --name "$secret_name" \
            --value "$secret_value" \
            --output none

        if [ $? -eq 0 ]; then
            echo "   ✅ Secret set successfully"
        else
            echo "   ❌ Failed to set secret"
        fi
    else
        echo "   ⏭️  Skipped"
    fi
    echo ""
}

echo "Setting up secrets for Careerate production deployment..."
echo "Note: Enter actual values when prompted. These will be securely stored in Azure KeyVault."
echo ""

# Core Azure B2C secrets (already exist, but can be updated)
echo "📋 Core Azure B2C Configuration"
echo "These should already be configured, but you can update them if needed:"
echo ""

set_secret "AZURE-CLIENT-ID" "Azure B2C Application Client ID" true
set_secret "AZURE-CLIENT-SECRET" "Azure B2C Application Client Secret" true
set_secret "AZURE-TENANT-ID" "Azure Tenant ID" true
set_secret "B2C-TENANT-NAME" "Azure B2C Tenant Name (e.g., careerate)" true
set_secret "B2C-SIGNUP-SIGNIN-POLICY-NAME" "B2C Sign-up/Sign-in Policy Name" true
set_secret "SESSION-SECRET" "Session encryption secret (generate random 64-char string)" true

echo "📋 Database Configuration"
set_secret "DATABASE-URL" "PostgreSQL connection string (Neon DB)" true

echo "📋 Git Integration"
set_secret "GITHUB-CLIENT-ID" "GitHub OAuth App Client ID" true
set_secret "GITHUB-CLIENT-SECRET" "GitHub OAuth App Client Secret" true
set_secret "GITLAB-CLIENT-ID" "GitLab OAuth App Client ID" false
set_secret "GITLAB-CLIENT-SECRET" "GitLab OAuth App Client Secret" false

echo "📋 AI Services"
set_secret "OPENAI-API-KEY" "OpenAI API Key for AI features" false

echo "📋 Payment Processing"
set_secret "STRIPE-SECRET-KEY" "Stripe Secret Key for payments" false
set_secret "STRIPE-WEBHOOK-SECRET" "Stripe Webhook Secret for event verification" false

echo "📋 Communication Services"
set_secret "SENDGRID-API-KEY" "SendGrid API Key for email notifications" false
set_secret "TWILIO-ACCOUNT-SID" "Twilio Account SID for SMS" false
set_secret "TWILIO-AUTH-TOKEN" "Twilio Auth Token for SMS" false

echo "🎉 KeyVault secrets setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update Azure Container Apps configuration to use the new KeyVault references"
echo "2. Restart the application to pick up the new environment variables"
echo "3. Test the integrations in production"
echo ""
echo "💡 To view all secrets: az keyvault secret list --vault-name $KEYVAULT_NAME"
echo "💡 To update arm-appsettings.json: Use the KeyVault references format"
echo ""