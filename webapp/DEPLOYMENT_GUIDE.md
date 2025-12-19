# Deployment Guide - Environment Variables Approach

## Overview
This dashboard uses **environment variables** for Azure AD credentials instead of committing them to GitHub. This keeps your credentials secure and allows each user to deploy with their own Azure AD app.

## For New Users - Complete Setup

### Step 1: Create Azure AD App Registration

Run the setup script to create your Azure AD app:

```powershell
.\Setup-AzureApp.ps1
```

This creates:
- Azure AD App Registration
- Required API permissions
- Local `config.js` file with your credentials (for local testing)

**Save the output** - you'll need the Client ID and Tenant ID!

### Step 2: Test Locally

Start the local web server:

```powershell
.\Start-Server.ps1
```

Visit http://localhost:8080 and test the authentication.

### Step 3: Set GitHub Secrets

Add your Azure AD credentials as GitHub Secrets:

**Option A: Using GitHub CLI (recommended)**
```powershell
gh secret set AZURE_CLIENT_ID --body "YOUR-CLIENT-ID-HERE"
gh secret set AZURE_TENANT_ID --body "YOUR-TENANT-ID-HERE"
```

**Option B: Using GitHub Web UI**
1. Go to: https://github.com/YOUR-USERNAME/ArcBenefitsDashboard/settings/secrets/actions
2. Click "New repository secret"
3. Add:
   - Name: `AZURE_CLIENT_ID`, Value: (your client ID)
   - Name: `AZURE_TENANT_ID`, Value: (your tenant ID)

### Step 4: Deploy to Azure Static Web Apps

```powershell
cd infrastructure

.\Deploy-Infrastructure.ps1 `
  -ResourceGroupName "rg-arc-benefits" `
  -GitHubPAT "YOUR-GITHUB-PAT-HERE" `
  -AzureClientId "YOUR-CLIENT-ID" `
  -AzureTenantId "YOUR-TENANT-ID"
```

**Get GitHub PAT:** https://github.com/settings/tokens
- Required scopes: `repo`, `workflow`, `admin:repo_hook`

### Step 5: Update Azure AD Redirect URI

After deployment completes, add the Azure Static Web App URL to your Azure AD app:

```powershell
az ad app update --id YOUR-CLIENT-ID --set spa.redirectUris+='https://YOUR-APP-URL/'
```

---

## How It Works

### Local Development
- `config.js` is created by `Setup-AzureApp.ps1`
- File is in `.gitignore` (never committed)
- Used for local testing with `Start-Server.ps1`

### Azure Deployment
- GitHub Secrets store your credentials securely
- `generate-config.js` runs during build
- Creates `config.js` from environment variables
- File is generated at deployment time (not stored in Git)

### GitHub Actions Workflow
```yaml
- name: Generate config.js from environment variables
  run: node generate-config.js
  env:
    AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
    AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
```

---

## Security Benefits

✅ **No credentials in Git** - Safe for public repos
✅ **Each user has their own app** - No sharing credentials
✅ **Secrets in GitHub Secrets** - Encrypted at rest
✅ **Config generated at build time** - Never committed

---

## Troubleshooting

### "config.js not found" locally
Run `.\Setup-AzureApp.ps1` to create it.

### Authentication fails in Azure
1. Check GitHub Secrets are set correctly
2. Verify Azure AD redirect URI includes your Static Web App URL
3. Check GitHub Actions build logs for errors

### Want to update credentials
1. Update GitHub Secrets with new values
2. Push any change to trigger redeployment
3. Or manually trigger GitHub Actions workflow

---

## For Repository Owner (Current Setup)

Your credentials are now stored as:
- **Local:** `config.js` (in .gitignore, for local testing)
- **GitHub:** Secrets `AZURE_CLIENT_ID` and `AZURE_TENANT_ID`
- **Azure:** App Settings (backup, not actively used)

Client ID: `d99c7d35-1076-4036-814d-6e3ad2fc2d2c`
Tenant ID: `28ad7eb2-0ea4-40b8-99c2-cc6c124035d2`
