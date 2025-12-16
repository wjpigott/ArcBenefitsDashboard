# Infrastructure as Code - Deployment Guide

This guide provides complete Infrastructure as Code (IaC) deployment for the Arc Benefits Dashboard to Azure Static Web Apps.

## 📁 Infrastructure Files

```
infrastructure/
├── main.bicep                    # Bicep template (main IaC definition)
├── main.parameters.json          # Parameters file (customize your deployment)
├── Deploy-Infrastructure.ps1     # PowerShell deployment script
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI** - [Install](https://aka.ms/installazurecliwindows)
   ```powershell
   az --version
   ```

2. **GitHub Personal Access Token (PAT)**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`
   - Copy the token (starts with `ghp_`)

3. **Azure Subscription**
   - Contributor access to create resources

### One-Command Deployment

```powershell
cd infrastructure

.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits" `
  -GitHubPAT "ghp_YOUR_GITHUB_TOKEN_HERE"
```

That's it! The script will:
- ✅ Create resource group
- ✅ Deploy Static Web App
- ✅ Configure GitHub Actions integration
- ✅ Output the deployment URL
- ✅ Provide next steps

---

## 📋 Detailed Deployment Options

### Option 1: Using PowerShell Script (Recommended)

**Basic deployment:**
```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits" `
  -GitHubPAT "ghp_xxxxxxxxxxxx"
```

**Custom location:**
```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits-prod" `
  -Location "westus2" `
  -StaticWebAppName "arc-dashboard-prod" `
  -GitHubPAT "ghp_xxxxxxxxxxxx"
```

**With pre-configured Azure AD:**
```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits" `
  -AzureClientId "YOUR-CLIENT-ID" `
  -AzureTenantId "YOUR-TENANT-ID" `
  -GitHubPAT "ghp_xxxxxxxxxxxx"
```

**Standard SKU (for enterprise features):**
```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits-enterprise" `
  -SkuName "Standard" `
  -GitHubPAT "ghp_xxxxxxxxxxxx"
```

---

### Option 2: Using Azure CLI Directly

**Step-by-step deployment:**

```powershell
# 1. Login to Azure
az login

# 2. Set subscription (if you have multiple)
az account set --subscription "YOUR-SUBSCRIPTION-NAME"

# 3. Create resource group
az group create `
  --name "rg-arc-benefits" `
  --location "eastus2" `
  --tags "Application=Arc-Benefits-Dashboard" "ManagedBy=IaC"

# 4. Deploy Bicep template
az deployment group create `
  --name "arc-benefits-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters staticWebAppName="arc-benefits-dashboard" `
  --parameters location="eastus2" `
  --parameters sku="Free" `
  --parameters repositoryUrl="https://github.com/wjpigott/ArcBenefitsDashboard" `
  --parameters repositoryBranch="main" `
  --parameters repositoryToken="YOUR-GITHUB-PAT"

# 5. Get the deployment URL
az staticwebapp show `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --query "defaultHostname" -o tsv
```

---

### Option 3: Using Bicep with Parameters File

**1. Customize parameters file:**

Edit `main.parameters.json`:
```json
{
  "parameters": {
    "staticWebAppName": {
      "value": "your-custom-name"
    },
    "location": {
      "value": "westus2"
    },
    "azureClientId": {
      "value": "YOUR-CLIENT-ID"
    },
    "azureTenantId": {
      "value": "YOUR-TENANT-ID"
    }
  }
}
```

**2. Deploy with parameters:**
```powershell
az deployment group create `
  --name "arc-benefits-deployment" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters "@main.parameters.json" `
  --parameters repositoryToken="YOUR-GITHUB-PAT"
```

---

## 🔐 Secure Token Management

### Option 1: Azure Key Vault (Recommended for Production)

**Store GitHub PAT in Key Vault:**
```powershell
# Create Key Vault
az keyvault create `
  --name "kv-arc-benefits" `
  --resource-group "rg-arc-benefits" `
  --location "eastus2"

# Store GitHub PAT
az keyvault secret set `
  --vault-name "kv-arc-benefits" `
  --name "github-pat-token" `
  --value "ghp_xxxxxxxxxxxx"

# Deploy using Key Vault reference
az deployment group create `
  --name "arc-benefits-deployment" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters "@main.parameters.json"
```

Update `main.parameters.json`:
```json
{
  "repositoryToken": {
    "reference": {
      "keyVault": {
        "id": "/subscriptions/YOUR_SUB/resourceGroups/rg-arc-benefits/providers/Microsoft.KeyVault/vaults/kv-arc-benefits"
      },
      "secretName": "github-pat-token"
    }
  }
}
```

---

### Option 2: Environment Variable

```powershell
$env:GITHUB_PAT = "ghp_xxxxxxxxxxxx"

.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits" `
  -GitHubPAT $env:GITHUB_PAT
```

---

## 📊 Deployment Outputs

After successful deployment, you'll receive:

```
Deployment Summary
=====================================

✓ Static Web App URL:
  https://happy-sky-123abc.azurestaticapps.net

✓ Default Hostname:
  happy-sky-123abc.azurestaticapps.net

✓ Resource Group:
  rg-arc-benefits

✓ Deployment Token:
  (Automatically added to GitHub Secrets)
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Azure AD App Registration

**Add the new redirect URI:**

```powershell
# Get your Static Web App URL
$appUrl = az staticwebapp show `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --query "defaultHostname" -o tsv

# Get app object ID
$appObjectId = az ad app show --id YOUR-CLIENT-ID --query id -o tsv

# Update redirect URIs
$currentUris = az ad app show --id YOUR-CLIENT-ID --query "spa.redirectUris" -o json | ConvertFrom-Json
$newUris = $currentUris + @("https://$appUrl/")

$body = @{spa=@{redirectUris=$newUris}} | ConvertTo-Json
$body | Out-File -FilePath "$env:TEMP\app-update.json" -Encoding UTF8
az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" --body "@$env:TEMP\app-update.json"
Remove-Item "$env:TEMP\app-update.json"
```

---

### 2. Configure GitHub Actions Secret

If not automatically configured:

**Using GitHub CLI:**
```powershell
gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "YOUR-DEPLOYMENT-TOKEN"
```

**Using GitHub Web UI:**
1. Go to: https://github.com/wjpigott/ArcBenefitsDashboard/settings/secrets/actions
2. Click "New repository secret"
3. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
4. Value: (deployment token from output)
5. Click "Add secret"

---

## 🔄 CI/CD Pipeline

GitHub Actions automatically deploys on every push to `main`:

```yaml
# .github/workflows/azure-static-web-apps.yml
on:
  push:
    branches:
      - main
```

**View deployments:**
- https://github.com/wjpigott/ArcBenefitsDashboard/actions

---

## 📈 Monitoring & Management

### View Deployment Status

```powershell
az staticwebapp show `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --output table
```

### Get App Logs

```powershell
az staticwebapp functions `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits"
```

### View Cost

```powershell
az consumption usage list `
  --start-date (Get-Date).AddDays(-30).ToString("yyyy-MM-dd") `
  --end-date (Get-Date).ToString("yyyy-MM-dd") | `
  Where-Object { $_.instanceName -like "*arc-benefits*" }
```

---

## 🗑️ Clean Up Resources

**Delete everything:**
```powershell
az group delete --name "rg-arc-benefits" --yes --no-wait
```

**Delete only Static Web App:**
```powershell
az staticwebapp delete `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --yes
```

---

## 🎯 Environment-Specific Deployments

### Development Environment

```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits-dev" `
  -StaticWebAppName "arc-dashboard-dev" `
  -Location "eastus2" `
  -GitHubPAT $env:GITHUB_PAT
```

### Production Environment

```powershell
.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits-prod" `
  -StaticWebAppName "arc-dashboard-prod" `
  -SkuName "Standard" `
  -Location "westus2" `
  -GitHubPAT $env:GITHUB_PAT
```

---

## 🔍 Troubleshooting

### Deployment fails with "Conflict"

**Issue:** Resource already exists
```powershell
# Delete existing resource
az staticwebapp delete --name "arc-benefits-dashboard" --resource-group "rg-arc-benefits" --yes
# Retry deployment
```

### GitHub Actions not triggering

**Issue:** Missing deployment token
```powershell
# Get deployment token
$token = az staticwebapp secrets list `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --query "properties.apiKey" -o tsv

# Add to GitHub secrets manually
```

### Custom domain not working

**Issue:** DNS not configured
```powershell
# Add custom domain
az staticwebapp hostname set `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --hostname "benefits.yourdomain.com"

# Get DNS records to configure
az staticwebapp hostname show `
  --name "arc-benefits-dashboard" `
  --resource-group "rg-arc-benefits" `
  --hostname "benefits.yourdomain.com"
```

---

## 📚 Additional Resources

- [Azure Static Web Apps Documentation](https://docs.microsoft.com/azure/static-web-apps/)
- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)
- [Azure CLI Reference](https://docs.microsoft.com/cli/azure/)

---

## 💰 Cost Estimate

**Free Tier:**
- Static Web App: $0/month
- 100 GB bandwidth/month
- 0.5 GB storage
- **Total: $0/month**

**Standard Tier:**
- Static Web App: ~$9/month
- Unlimited bandwidth
- Private endpoints
- Custom authentication
- **Total: ~$9/month**

---

## 🎉 Success!

Your Arc Benefits Dashboard is now deployed as Infrastructure as Code!

**What you get:**
- ✅ Fully automated deployments
- ✅ Version-controlled infrastructure
- ✅ Repeatable deployments
- ✅ Multi-environment support
- ✅ GitHub Actions CI/CD
- ✅ Professional Azure hosting

**Next: Start using your dashboard!**
Visit your deployment URL and sign in with Azure AD.
