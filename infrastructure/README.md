# Infrastructure as Code - Deployment Guide

This guide provides complete Infrastructure as Code (IaC) deployment for the Arc Benefits Dashboard to Azure Static Web Apps.

## 📁 Infrastructure Files

```
infrastructure/
├── main.bicep                    # Bicep template (main IaC definition)
├── main.parameters.json          # Parameters file (customize your deployment)
└── README.md                     # This file
```

## 🚀 Quick Start

### Prerequisites

1. **Azure CLI** - [Install](https://aka.ms/installazurecliwindows)
   ```powershell
   az --version
   ```

2. **Azure AD App Registration**
   - Run `Setup-AzureApp.ps1` first (from repository root)
   - This creates the Azure AD app and generates `config.js`

3. **GitHub Personal Access Token (PAT)**
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scopes: **`repo`**, **`workflow`**, **`admin:repo_hook`**
   - Copy the token (starts with `ghp_`)
   - ⚠️ Save it securely - you won't see it again!

4. **Azure Subscription**
   - Contributor access to create resources

### Step-by-Step Deployment

**1. Setup Azure AD App (if not already done):**
```powershell
cd ..
.\Setup-AzureApp.ps1
```

**2. Note your credentials from `config.js`:**
- Client ID
- Tenant ID

**3. Deploy to Azure:**
```powershell
cd infrastructure

# Create resource group
az group create `
  --name "rg-arc-benefits" `
  --location "eastus2" `
  --tags "Application=Arc-Benefits-Dashboard" "ManagedBy=IaC"

# Deploy Static Web App with Bicep
az deployment group create `
  --name "arc-benefits-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters `
    staticWebAppName="arc-benefits-dashboard" `
    location="eastus2" `
    sku="Free" `
    repositoryUrl="https://github.com/YOUR-USERNAME/ArcBenefitsDashboard" `
    repositoryBranch="main" `
    repositoryToken="YOUR-GITHUB-PAT" `
    azureClientId="YOUR-CLIENT-ID" `
    azureTenantId="YOUR-TENANT-ID"
```

**4. Update Azure AD redirect URI:**
```powershell
# Get the Static Web App URL from deployment output
$appUrl = "https://YOUR-STATIC-WEB-APP-URL.azurestaticapps.net/"

# Add it to your Azure AD app
$appObjectId = (az ad app show --id YOUR-CLIENT-ID --query id -o tsv)
$currentUris = (az ad app show --id YOUR-CLIENT-ID --query 'spa.redirectUris' -o json | ConvertFrom-Json)
$newUris = $currentUris + @($appUrl)
$body = @{spa=@{redirectUris=$newUris}} | ConvertTo-Json
$body | Out-File -FilePath "$env:TEMP\app-update.json" -Encoding UTF8
az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" --body "@$env:TEMP\app-update.json"
Remove-Item "$env:TEMP\app-update.json"
```

**5. Grant RBAC permissions:**
```powershell
cd ..
.\Grant-ReaderRole.ps1 -AllSubscriptions
```

That's it! Your deployment is complete.

---

## 📋 Customization Options

### Different Locations

Deploy to a different Azure region:
```powershell
az deployment group create `
  --name "arc-benefits-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters `
    staticWebAppName="arc-benefits-dashboard" `
    location="westus2" `
    sku="Free" `
    repositoryUrl="https://github.com/YOUR-USERNAME/ArcBenefitsDashboard" `
    repositoryBranch="main" `
    repositoryToken="YOUR-GITHUB-PAT" `
    azureClientId="YOUR-CLIENT-ID" `
    azureTenantId="YOUR-TENANT-ID"
```

### Standard SKU (Enterprise Features)

Deploy with Standard SKU for custom domains, staging environments, and higher limits:
```powershell
az deployment group create `
  --name "arc-benefits-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters `
    staticWebAppName="arc-benefits-dashboard" `
    location="eastus2" `
    sku="Standard" `
    repositoryUrl="https://github.com/YOUR-USERNAME/ArcBenefitsDashboard" `
    repositoryBranch="main" `
    repositoryToken="YOUR-GITHUB-PAT" `
    azureClientId="YOUR-CLIENT-ID" `
    azureTenantId="YOUR-TENANT-ID"
```

### Using Parameters File

Edit `main.parameters.json` with your values:
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentParameters.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "staticWebAppName": {
      "value": "your-custom-name"
    },
    "location": {
      "value": "eastus2"
    },
    "sku": {
      "value": "Free"
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

Then deploy:
```powershell
az deployment group create `
  --name "arc-benefits-deployment-$(Get-Date -Format 'yyyyMMdd-HHmmss')" `
  --resource-group "rg-arc-benefits" `
  --template-file "main.bicep" `
  --parameters "@main.parameters.json" `
  --parameters repositoryToken="YOUR-GITHUB-PAT"
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
