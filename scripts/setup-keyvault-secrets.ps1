# Careerate KeyVault Secrets Management Script (PowerShell)
# This script helps set up and manage Azure KeyVault secrets for production deployment

$KeyVaultName = "careeeratesecretsvault"
$ResourceGroup = "Careerate"

Write-Host "🔐 Careerate KeyVault Secrets Setup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
try {
    az --version | Out-Null
} catch {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
try {
    az account show | Out-Null
    Write-Host "✅ Azure CLI detected and user is logged in" -ForegroundColor Green
} catch {
    Write-Host "❌ Not logged in to Azure. Please run 'az login' first." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Function to set a secret in KeyVault
function Set-KeyVaultSecret {
    param(
        [string]$SecretName,
        [string]$Description,
        [bool]$IsRequired = $true
    )

    Write-Host "🔑 Setting up: $SecretName" -ForegroundColor Yellow
    Write-Host "   Description: $Description" -ForegroundColor Gray

    if ($IsRequired) {
        Write-Host "   ⚠️  Required for production" -ForegroundColor Red
    } else {
        Write-Host "   ℹ️  Optional (has fallback)" -ForegroundColor Blue
    }

    $SecretValue = Read-Host "   Enter value for $SecretName (or press Enter to skip)"

    if ($SecretValue) {
        try {
            az keyvault secret set --vault-name $KeyVaultName --name $SecretName --value $SecretValue --output none
            Write-Host "   ✅ Secret set successfully" -ForegroundColor Green
        } catch {
            Write-Host "   ❌ Failed to set secret" -ForegroundColor Red
        }
    } else {
        Write-Host "   ⏭️  Skipped" -ForegroundColor Gray
    }
    Write-Host ""
}

Write-Host "Setting up secrets for Careerate production deployment..." -ForegroundColor Cyan
Write-Host "Note: Enter actual values when prompted. These will be securely stored in Azure KeyVault." -ForegroundColor Yellow
Write-Host ""

# Core Azure B2C secrets
Write-Host "📋 Core Azure B2C Configuration" -ForegroundColor Magenta
Write-Host "These should already be configured, but you can update them if needed:" -ForegroundColor Gray
Write-Host ""

Set-KeyVaultSecret -SecretName "AZURE-CLIENT-ID" -Description "Azure B2C Application Client ID" -IsRequired $true
Set-KeyVaultSecret -SecretName "AZURE-CLIENT-SECRET" -Description "Azure B2C Application Client Secret" -IsRequired $true
Set-KeyVaultSecret -SecretName "AZURE-TENANT-ID" -Description "Azure Tenant ID" -IsRequired $true
Set-KeyVaultSecret -SecretName "B2C-TENANT-NAME" -Description "Azure B2C Tenant Name (e.g., careerate)" -IsRequired $true
Set-KeyVaultSecret -SecretName "B2C-SIGNUP-SIGNIN-POLICY-NAME" -Description "B2C Sign-up/Sign-in Policy Name" -IsRequired $true
Set-KeyVaultSecret -SecretName "SESSION-SECRET" -Description "Session encryption secret (generate random 64-char string)" -IsRequired $true

Write-Host "📋 Database Configuration" -ForegroundColor Magenta
Set-KeyVaultSecret -SecretName "DATABASE-URL" -Description "PostgreSQL connection string (Neon DB)" -IsRequired $true

Write-Host "📋 Git Integration" -ForegroundColor Magenta
Set-KeyVaultSecret -SecretName "GITHUB-CLIENT-ID" -Description "GitHub OAuth App Client ID" -IsRequired $true
Set-KeyVaultSecret -SecretName "GITHUB-CLIENT-SECRET" -Description "GitHub OAuth App Client Secret" -IsRequired $true
Set-KeyVaultSecret -SecretName "GITLAB-CLIENT-ID" -Description "GitLab OAuth App Client ID" -IsRequired $false
Set-KeyVaultSecret -SecretName "GITLAB-CLIENT-SECRET" -Description "GitLab OAuth App Client Secret" -IsRequired $false

Write-Host "📋 AI Services" -ForegroundColor Magenta
Set-KeyVaultSecret -SecretName "OPENAI-API-KEY" -Description "OpenAI API Key for AI features" -IsRequired $false

Write-Host "📋 Payment Processing" -ForegroundColor Magenta
Set-KeyVaultSecret -SecretName "STRIPE-SECRET-KEY" -Description "Stripe Secret Key for payments" -IsRequired $false
Set-KeyVaultSecret -SecretName "STRIPE-WEBHOOK-SECRET" -Description "Stripe Webhook Secret for event verification" -IsRequired $false

Write-Host "📋 Communication Services" -ForegroundColor Magenta
Set-KeyVaultSecret -SecretName "SENDGRID-API-KEY" -Description "SendGrid API Key for email notifications" -IsRequired $false
Set-KeyVaultSecret -SecretName "TWILIO-ACCOUNT-SID" -Description "Twilio Account SID for SMS" -IsRequired $false
Set-KeyVaultSecret -SecretName "TWILIO-AUTH-TOKEN" -Description "Twilio Auth Token for SMS" -IsRequired $false

Write-Host "🎉 KeyVault secrets setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Update Azure Container Apps configuration to use the new KeyVault references" -ForegroundColor White
Write-Host "2. Restart the application to pick up the new environment variables" -ForegroundColor White
Write-Host "3. Test the integrations in production" -ForegroundColor White
Write-Host ""
Write-Host "💡 To view all secrets: az keyvault secret list --vault-name $KeyVaultName" -ForegroundColor Yellow
Write-Host "💡 To update arm-appsettings.json: Use the KeyVault references format" -ForegroundColor Yellow
Write-Host ""