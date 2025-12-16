# Azure Static Web Apps Deployment Guide

This guide will help you deploy the Arc Benefits Dashboard to Azure Static Web Apps for cloud hosting.

## Prerequisites

- Azure subscription
- Azure CLI installed (`az --version`)
- GitHub account (for CI/CD)
- Existing Azure AD app registration (or create a new one)

## Deployment Options

### Option 1: Deploy via Azure Portal (Easiest)

1. **Create Static Web App**
   - Go to [Azure Portal](https://portal.azure.com)
   - Click "Create a resource" → Search for "Static Web Apps"
   - Click "Create"

2. **Configure Basic Settings**
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or use existing
   - **Name**: `arc-benefits-dashboard` (or your preferred name)
   - **Plan type**: Free (or Standard for enterprise features)
   - **Region**: Choose closest to your users
   - **Source**: GitHub
   - **Organization**: Your GitHub account
   - **Repository**: ArcBenefitsDashboard
   - **Branch**: main

3. **Build Configuration**
   - **Build Presets**: Custom
   - **App location**: `/` (root)
   - **Api location**: _(leave empty)_
   - **Output location**: `/` (root)

4. **Review + Create**
   - Click "Review + create"
   - Click "Create"
   - Wait for deployment (2-3 minutes)

5. **Get Your URL**
   - Once deployed, go to the resource
   - Copy the URL (e.g., `https://happy-sky-123abc.azurestaticapps.net`)

---

### Option 2: Deploy via Azure CLI

```powershell
# Login to Azure
az login

# Set variables
$resourceGroup = "rg-arc-benefits"
$location = "eastus2"
$appName = "arc-benefits-dashboard"
$githubToken = "YOUR_GITHUB_PAT_TOKEN"  # Create at https://github.com/settings/tokens

# Create resource group
az group create --name $resourceGroup --location $location

# Create Static Web App
az staticwebapp create `
  --name $appName `
  --resource-group $resourceGroup `
  --source https://github.com/YOUR_USERNAME/ArcBenefitsDashboard `
  --branch main `
  --app-location "/" `
  --output-location "/" `
  --login-with-github

# Get the URL
az staticwebapp show --name $appName --resource-group $resourceGroup --query "defaultHostname" -o tsv
```

---

## Post-Deployment Configuration

### Step 1: Update Azure AD App Registration

1. **Add New Redirect URI**
   - Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App Registrations
   - Select your app: `Arc-Benefits-Dashboard`
   - Go to "Authentication"
   - Under "Single-page application" → Add URI
   - Enter: `https://YOUR-STATIC-WEB-APP-URL/`
   - Click "Save"

   Or use Azure CLI:
   ```powershell
   $staticWebAppUrl = "https://YOUR-APP.azurestaticapps.net/"
   $appObjectId = (az ad app show --id YOUR-CLIENT-ID --query id -o tsv)
   
   # Get current SPA URIs
   $currentUris = (az ad app show --id YOUR-CLIENT-ID --query "spa.redirectUris" -o json | ConvertFrom-Json)
   $newUris = $currentUris + @($staticWebAppUrl)
   
   # Update with new URI
   $body = @{spa=@{redirectUris=$newUris}} | ConvertTo-Json
   $body | Out-File -FilePath "$env:TEMP\app-update.json" -Encoding UTF8
   az rest --method PATCH --uri "https://graph.microsoft.com/v1.0/applications/$appObjectId" --body "@$env:TEMP\app-update.json"
   Remove-Item "$env:TEMP\app-update.json"
   ```

### Step 2: Configure Application Settings (Optional)

If you want to pre-configure the app for your organization:

1. **Go to Static Web App** in Azure Portal
2. **Configuration** → **Application settings**
3. **Add** these settings:
   - Name: `AZURE_CLIENT_ID`, Value: `YOUR-CLIENT-ID`
   - Name: `AZURE_TENANT_ID`, Value: `YOUR-TENANT-ID`

4. **Update config.js** to read from environment:
   ```javascript
   window.AZURE_CONFIG = {
       CLIENT_ID: '${AZURE_CLIENT_ID}' || 'YOUR-CLIENT-ID',
       TENANT_ID: '${AZURE_TENANT_ID}' || 'YOUR-TENANT-ID',
       AUTO_INIT: true
   };
   ```

---

## Testing

1. **Open your Static Web App URL** in a browser
2. **Click "Connect to Azure"**
3. **Sign in** with your Azure AD credentials
4. **Verify** Arc server data loads correctly

---

## Monitoring & Management

### View Deployment Logs
```powershell
az staticwebapp show --name arc-benefits-dashboard --resource-group rg-arc-benefits
```

### View Application Insights (if enabled)
- Go to Azure Portal → Your Static Web App → Application Insights
- View requests, failures, and performance metrics

### Update Deployment
- Simply push to GitHub → Automatic deployment via GitHub Actions
- Or manually trigger: Repository → Actions → Re-run workflow

---

## Custom Domain (Optional)

1. **Go to Static Web App** → Custom domains
2. **Add custom domain**: `benefits.yourdomain.com`
3. **Add DNS records** as shown
4. **Update Azure AD redirect URI** to include custom domain

---

## Troubleshooting

### Issue: "Failed to sign in: invalid_request"
- **Solution**: Verify redirect URI in Azure AD matches Static Web App URL exactly (including trailing slash)

### Issue: "No Arc servers found"
- **Solution**: Ensure app has Reader role on Azure subscriptions
- **Solution**: Grant admin consent for API permissions

### Issue: GitHub Actions deployment fails
- **Solution**: Check GitHub Actions logs in your repository
- **Solution**: Verify GitHub token has correct permissions

---

## Cost Estimate

- **Free Tier**: 
  - 100 GB bandwidth/month
  - 0.5 GB storage
  - Perfect for internal dashboards
  - **Cost**: $0/month

- **Standard Tier**:
  - Unlimited bandwidth
  - Private endpoints support
  - Custom authentication
  - **Cost**: ~$9/month

---

## Security Best Practices

1. ✅ Keep Azure AD app registration up to date
2. ✅ Regularly review API permissions
3. ✅ Enable Application Insights for monitoring
4. ✅ Use custom domain with SSL (automatic)
5. ✅ Restrict to your tenant users only (via Azure AD)

---

## Rollback

If you need to rollback:
```powershell
# Delete the Static Web App
az staticwebapp delete --name arc-benefits-dashboard --resource-group rg-arc-benefits
```

The local version will continue working normally.

---

## Next Steps

After deployment:
- [ ] Update README.md with deployment URL
- [ ] Share URL with your team
- [ ] Configure Application Insights
- [ ] Set up alerts for failures
- [ ] Consider custom domain

---

For more information, visit: https://docs.microsoft.com/azure/static-web-apps/
