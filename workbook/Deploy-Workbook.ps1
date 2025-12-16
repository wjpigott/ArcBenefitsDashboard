# Deploy Azure Workbook for Arc Benefits Dashboard
# This script deploys the workbook to an Azure Resource Group

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$WorkbookName = "Arc-Benefits-Dashboard"
)

Write-Host "🚀 Deploying Arc Benefits Dashboard Workbook..." -ForegroundColor Cyan
Write-Host ""

# Check if logged in to Azure
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "🔐 Please sign in to Azure..." -ForegroundColor Yellow
    az login
    $account = az account show | ConvertFrom-Json
}

Write-Host "✅ Signed in as: $($account.user.name)" -ForegroundColor Green
Write-Host "📂 Subscription: $($account.name)" -ForegroundColor Cyan
Write-Host ""

# Check if resource group exists
Write-Host "🔍 Checking resource group..." -ForegroundColor Cyan
$rg = az group show --name $ResourceGroup 2>$null | ConvertFrom-Json

if (-not $rg) {
    Write-Host "📁 Creating resource group: $ResourceGroup" -ForegroundColor Yellow
    az group create --name $ResourceGroup --location $Location | Out-Null
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group exists" -ForegroundColor Green
}

Write-Host ""

# Read the workbook JSON
$workbookPath = Join-Path $PSScriptRoot "arc-benefits-workbook.json"
if (-not (Test-Path $workbookPath)) {
    Write-Host "❌ Workbook template not found: $workbookPath" -ForegroundColor Red
    exit 1
}

Write-Host "📖 Reading workbook template..." -ForegroundColor Cyan
$workbookContent = Get-Content $workbookPath -Raw

# Generate a unique workbook ID
$workbookId = [Guid]::NewGuid().ToString()

# Create deployment template
$deploymentTemplate = @{
    '$schema' = "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#"
    contentVersion = "1.0.0.0"
    parameters = @{}
    resources = @(
        @{
            type = "microsoft.insights/workbooks"
            apiVersion = "2022-04-01"
            name = $workbookId
            location = $Location
            kind = "shared"
            properties = @{
                displayName = $WorkbookName
                serializedData = $workbookContent
                version = "1.0"
                sourceId = "Azure Monitor"
                category = "Arc"
            }
        }
    )
}

# Save deployment template to temp file
$tempTemplate = [System.IO.Path]::GetTempFileName() + ".json"
$deploymentTemplate | ConvertTo-Json -Depth 100 | Set-Content $tempTemplate

Write-Host "🚀 Deploying workbook..." -ForegroundColor Yellow

try {
    $deployment = az deployment group create `
        --resource-group $ResourceGroup `
        --template-file $tempTemplate `
        --output json | ConvertFrom-Json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "✅ Workbook Deployed Successfully!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Details:" -ForegroundColor Cyan
        Write-Host "  Name: $WorkbookName" -ForegroundColor White
        Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor White
        Write-Host "  Location: $Location" -ForegroundColor White
        Write-Host "  Workbook ID: $workbookId" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Open in Portal:" -ForegroundColor Cyan
        
        # Get subscription ID
        $subId = $account.id
        
        # Construct portal URL
        $portalUrl = "https://portal.azure.com/#@$($account.homeTenantId)/resource/subscriptions/$subId/resourceGroups/$ResourceGroup/providers/microsoft.insights/workbooks/$workbookId"
        Write-Host "  $portalUrl" -ForegroundColor Gray
        Write-Host ""
        Write-Host "💡 Tip: You can also find it in:" -ForegroundColor Yellow
        Write-Host "  Azure Portal → Monitor → Workbooks → My workbooks" -ForegroundColor Gray
        Write-Host ""
    } else {
        throw "Deployment failed"
    }
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clean up temp file
    Remove-Item $tempTemplate -ErrorAction SilentlyContinue
}

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open the workbook in Azure Portal" -ForegroundColor White
Write-Host "  2. Select your subscription(s) from the dropdown" -ForegroundColor White
Write-Host "  3. Review Arc capabilities and server details" -ForegroundColor White
Write-Host "  4. Share with your team using Portal permissions" -ForegroundColor White
Write-Host ""
