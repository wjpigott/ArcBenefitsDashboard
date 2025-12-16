# Setup Azure AD App Registration for Arc Benefits Dashboard
# This script creates or updates an Azure AD app registration with the required API permissions

param(
    [Parameter(Mandatory=$false)]
    [string]$AppName = "Arc-Benefits-Dashboard",
    
    [Parameter(Mandatory=$false)]
    [string]$RedirectUri = "http://localhost:8080/",
    
    [Parameter(Mandatory=$false)]
    [switch]$UseExistingApp,
    
    [Parameter(Mandatory=$false)]
    [string]$ExistingAppId
)

# Check if Azure CLI is installed
$azCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCliInstalled) {
    Write-Host "❌ Azure CLI is not installed. Please install it from https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if logged in to Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "🔐 Please sign in to Azure..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Host "✅ Signed in as: $($account.user.name)" -ForegroundColor Green
Write-Host "📂 Tenant: $($account.tenantId)" -ForegroundColor Cyan
Write-Host ""

# Microsoft Graph API IDs
$microsoftGraphAppId = "00000003-0000-0000-c000-000000000000"
$azureServiceManagementAppId = "797f4846-ba00-4fd7-ba43-dac1f8f63013"

# Required permissions
$graphPermissions = @{
    "User.Read" = "e1fe6dd8-ba31-4d61-89e7-88639da4683d"              # User.Read (Delegated)
    "Directory.Read.All" = "06da0dbc-49e2-44d2-8312-53f166ab848a"     # Directory.Read.All (Delegated)
}

$azureManagementPermissions = @{
    "user_impersonation" = "41094075-9dad-400e-a0bd-54e686782033"      # user_impersonation (Delegated)
}

if ($UseExistingApp -and $ExistingAppId) {
    Write-Host "🔍 Using existing app registration: $ExistingAppId" -ForegroundColor Cyan
    $appId = $ExistingAppId
    $app = az ad app show --id $appId 2>$null | ConvertFrom-Json
    
    if (-not $app) {
        Write-Host "❌ Could not find app with ID: $appId" -ForegroundColor Red
        exit 1
    }
} else {
    # Check if app already exists
    Write-Host "🔍 Checking for existing app registration..." -ForegroundColor Cyan
    $existingApps = az ad app list --display-name $AppName | ConvertFrom-Json
    
    if ($existingApps -and $existingApps.Count -gt 0) {
        $app = $existingApps[0]
        $appId = $app.appId
        Write-Host "✅ Found existing app: $AppName ($appId)" -ForegroundColor Green
    } else {
        Write-Host "📝 Creating new app registration: $AppName..." -ForegroundColor Yellow
        $app = az ad app create --display-name $AppName --sign-in-audience AzureADMyOrg | ConvertFrom-Json
        $appId = $app.appId
        Write-Host "✅ Created app: $appId" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🔧 Configuring app registration..." -ForegroundColor Yellow

# Update redirect URI for SPA
Write-Host "  → Setting redirect URI: $RedirectUri" -ForegroundColor Cyan
az ad app update --id $appId --web-redirect-uris $RedirectUri --enable-id-token-issuance true | Out-Null

# Add Microsoft Graph permissions
Write-Host "  → Adding Microsoft Graph API permissions..." -ForegroundColor Cyan
foreach ($permission in $graphPermissions.GetEnumerator()) {
    Write-Host "    • $($permission.Key)" -ForegroundColor Gray
    az ad app permission add --id $appId --api $microsoftGraphAppId --api-permissions "$($permission.Value)=Scope" 2>$null | Out-Null
}

# Add Azure Service Management permissions
Write-Host "  → Adding Azure Service Management API permissions..." -ForegroundColor Cyan
foreach ($permission in $azureManagementPermissions.GetEnumerator()) {
    Write-Host "    • $($permission.Key)" -ForegroundColor Gray
    az ad app permission add --id $appId --api $azureServiceManagementAppId --api-permissions "$($permission.Value)=Scope" 2>$null | Out-Null
}

Write-Host ""
Write-Host "⚠️  IMPORTANT: Admin Consent Required" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "The API permissions have been added but require admin consent." -ForegroundColor White
Write-Host ""
Write-Host "Option 1: Grant admin consent using Azure CLI:" -ForegroundColor Cyan
Write-Host "  az ad app permission admin-consent --id $appId" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Grant admin consent via Azure Portal:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/$appId" -ForegroundColor Gray
Write-Host "  2. Click 'Grant admin consent for <Your Tenant>'" -ForegroundColor Gray
Write-Host ""

# Try to grant admin consent automatically
Write-Host "🔐 Attempting to grant admin consent automatically..." -ForegroundColor Yellow
$consentResult = az ad app permission admin-consent --id $appId 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Admin consent granted successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Could not automatically grant consent. Please use one of the options above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ App Registration Configuration Complete!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Configuration Details:" -ForegroundColor Cyan
Write-Host "  App Name:     $AppName" -ForegroundColor White
Write-Host "  Client ID:    $appId" -ForegroundColor White
Write-Host "  Tenant ID:    $($account.tenantId)" -ForegroundColor White
Write-Host "  Redirect URI: $RedirectUri" -ForegroundColor White
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Copy config.example.js to config.js" -ForegroundColor White
Write-Host "  2. Update config.js with the values above:" -ForegroundColor White
Write-Host "     CLIENT_ID: '$appId'" -ForegroundColor Gray
Write-Host "     TENANT_ID: '$($account.tenantId)'" -ForegroundColor Gray
Write-Host "     AUTO_INIT: true" -ForegroundColor Gray
Write-Host "  3. Assign the app 'Reader' role on your Azure subscriptions" -ForegroundColor White
Write-Host "  4. Start the web server and sign in" -ForegroundColor White
Write-Host ""
Write-Host "🔗 Useful Links:" -ForegroundColor Cyan
Write-Host "  App Registration: https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/$appId" -ForegroundColor Gray
Write-Host "  API Permissions:  https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/CallAnAPI/appId/$appId" -ForegroundColor Gray
Write-Host ""

