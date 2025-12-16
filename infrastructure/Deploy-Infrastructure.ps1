#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Arc Benefits Dashboard to Azure Static Web Apps using Infrastructure as Code

.DESCRIPTION
    This script deploys the Arc Benefits Dashboard using Azure CLI and Bicep templates.
    It creates all necessary Azure resources and configures the deployment pipeline.

.PARAMETER ResourceGroupName
    Name of the Azure Resource Group (will be created if it doesn't exist)

.PARAMETER Location
    Azure region for deployment (default: eastus2)

.PARAMETER StaticWebAppName
    Name of the Static Web App resource (default: arc-benefits-dashboard)

.PARAMETER SkuName
    SKU tier - Free or Standard (default: Free)

.PARAMETER GitHubPAT
    GitHub Personal Access Token for deployment (required)

.PARAMETER AzureClientId
    Azure AD Client ID for pre-configuration (optional)

.PARAMETER AzureTenantId
    Azure AD Tenant ID for pre-configuration (optional)

.EXAMPLE
    .\Deploy-Infrastructure.ps1 -ResourceGroupName "rg-arc-benefits" -GitHubPAT "ghp_xxxxx"

.EXAMPLE
    .\Deploy-Infrastructure.ps1 -ResourceGroupName "rg-arc-benefits" -Location "westus2" -SkuName "Standard" -GitHubPAT "ghp_xxxxx"

.NOTES
    Author: Arc Benefits Dashboard Team
    Requires: Azure CLI, GitHub PAT with repo permissions
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$ResourceGroupName,

    [Parameter(Mandatory = $false)]
    [ValidateSet('westus2', 'eastus2', 'westeurope', 'centralus', 'eastasia', 'southeastasia')]
    [string]$Location = 'eastus2',

    [Parameter(Mandatory = $false)]
    [string]$StaticWebAppName = 'arc-benefits-dashboard',

    [Parameter(Mandatory = $false)]
    [ValidateSet('Free', 'Standard')]
    [string]$SkuName = 'Free',

    [Parameter(Mandatory = $true)]
    [string]$GitHubPAT,

    [Parameter(Mandatory = $false)]
    [string]$AzureClientId = '',

    [Parameter(Mandatory = $false)]
    [string]$AzureTenantId = ''
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InfraDir = $ScriptDir

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Arc Benefits Dashboard - IaC Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "→ Checking prerequisites..." -ForegroundColor Yellow
$azCliInstalled = Get-Command az -ErrorAction SilentlyContinue
if (-not $azCliInstalled) {
    Write-Host "✗ Azure CLI is not installed!" -ForegroundColor Red
    Write-Host "  Install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Azure CLI installed" -ForegroundColor Green

# Check if logged in to Azure
Write-Host "→ Checking Azure login status..." -ForegroundColor Yellow
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "→ Please sign in to Azure..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}
Write-Host "✓ Signed in as: $($account.user.name)" -ForegroundColor Green
Write-Host "✓ Subscription: $($account.name)" -ForegroundColor Green
Write-Host "✓ Tenant: $($account.tenantId)" -ForegroundColor Green
Write-Host ""

# Create or verify resource group
Write-Host "→ Creating/verifying resource group: $ResourceGroupName..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroupName
if ($rgExists -eq 'false') {
    Write-Host "  Creating new resource group..." -ForegroundColor Cyan
    az group create --name $ResourceGroupName --location $Location --tags "Application=Arc-Benefits-Dashboard" "ManagedBy=IaC" | Out-Null
    Write-Host "✓ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✓ Resource group already exists" -ForegroundColor Green
}
Write-Host ""

# Deploy Bicep template
Write-Host "→ Deploying infrastructure using Bicep..." -ForegroundColor Yellow
Write-Host "  Resource Group: $ResourceGroupName" -ForegroundColor Cyan
Write-Host "  Location: $Location" -ForegroundColor Cyan
Write-Host "  Static Web App: $StaticWebAppName" -ForegroundColor Cyan
Write-Host "  SKU: $SkuName" -ForegroundColor Cyan
Write-Host ""

$deploymentName = "arc-benefits-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

try {
    $deployment = az deployment group create `
        --name $deploymentName `
        --resource-group $ResourceGroupName `
        --template-file "$InfraDir\main.bicep" `
        --parameters staticWebAppName=$StaticWebAppName `
        --parameters location=$Location `
        --parameters sku=$SkuName `
        --parameters repositoryUrl="https://github.com/wjpigott/ArcBenefitsDashboard" `
        --parameters repositoryBranch="main" `
        --parameters repositoryToken=$GitHubPAT `
        --parameters azureClientId=$AzureClientId `
        --parameters azureTenantId=$AzureTenantId `
        --output json | ConvertFrom-Json

    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed"
    }

    Write-Host "✓ Deployment completed successfully!" -ForegroundColor Green
    Write-Host ""

    # Extract outputs
    $appUrl = $deployment.properties.outputs.appUrl.value
    $defaultHostname = $deployment.properties.outputs.defaultHostname.value
    $deploymentToken = $deployment.properties.outputs.deploymentToken.value

    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "Deployment Summary" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ Static Web App URL:" -ForegroundColor Cyan
    Write-Host "  $appUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Default Hostname:" -ForegroundColor Cyan
    Write-Host "  $defaultHostname" -ForegroundColor White
    Write-Host ""
    Write-Host "✓ Resource Group:" -ForegroundColor Cyan
    Write-Host "  $ResourceGroupName" -ForegroundColor White
    Write-Host ""

    # Save deployment token to GitHub secret (if gh CLI is available)
    $ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
    if ($ghInstalled) {
        Write-Host "→ Updating GitHub secret with deployment token..." -ForegroundColor Yellow
        try {
            $env:GH_TOKEN = $GitHubPAT
            gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body $deploymentToken --repo wjpigott/ArcBenefitsDashboard
            Write-Host "✓ GitHub secret updated" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Could not update GitHub secret automatically" -ForegroundColor Yellow
            Write-Host "  Manually add this secret to GitHub:" -ForegroundColor Cyan
            Write-Host "  Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
            Write-Host "  Value: (deployment token - stored securely)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠ GitHub CLI not found - skipping automatic secret update" -ForegroundColor Yellow
        Write-Host "  Install from: https://cli.github.com/" -ForegroundColor Cyan
        Write-Host "  Or manually add GitHub secret:" -ForegroundColor Cyan
        Write-Host "  Name: AZURE_STATIC_WEB_APPS_API_TOKEN" -ForegroundColor White
    }
    Write-Host ""

    # Next steps
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Next Steps" -ForegroundColor Cyan
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Update Azure AD App Registration:" -ForegroundColor Yellow
    Write-Host "   • Add redirect URI: $appUrl" -ForegroundColor White
    Write-Host "   • Use command:" -ForegroundColor White
    Write-Host "     az ad app update --id YOUR-CLIENT-ID --set spa.redirectUris+='$appUrl'" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Grant API permissions (if not done):" -ForegroundColor Yellow
    Write-Host "   • Navigate to Azure Portal → App Registrations" -ForegroundColor White
    Write-Host "   • Grant admin consent for API permissions" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Assign Reader role to app:" -ForegroundColor Yellow
    Write-Host "   • Go to Subscriptions → Access control (IAM)" -ForegroundColor White
    Write-Host "   • Add 'Reader' role to your app registration" -ForegroundColor White
    Write-Host ""
    Write-Host "4. Test the deployment:" -ForegroundColor Yellow
    Write-Host "   • Open: $appUrl" -ForegroundColor White
    Write-Host "   • Sign in with Azure AD" -ForegroundColor White
    Write-Host "   • Verify Arc server data loads" -ForegroundColor White
    Write-Host ""
    Write-Host "5. Monitor GitHub Actions:" -ForegroundColor Yellow
    Write-Host "   • https://github.com/wjpigott/ArcBenefitsDashboard/actions" -ForegroundColor White
    Write-Host ""

    Write-Host "✓ Deployment complete!" -ForegroundColor Green
    Write-Host ""

} catch {
    Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "View deployment logs:" -ForegroundColor Yellow
    Write-Host "az deployment group show --name $deploymentName --resource-group $ResourceGroupName" -ForegroundColor Gray
    exit 1
}
