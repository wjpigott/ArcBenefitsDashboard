# Deploy Azure Workbook using Azure PowerShell (Az module)
# This avoids the Azure CLI permission issues

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup,
    
    [Parameter(Mandatory=$false)]
    [string]$Location = "eastus",
    
    [Parameter(Mandatory=$false)]
    [string]$WorkbookName = "Arc-Benefits-Dashboard"
)

Write-Host "🚀 Deploying Arc Benefits Dashboard Workbook using Azure PowerShell..." -ForegroundColor Cyan
Write-Host ""

# Check if Az module is installed
if (-not (Get-Module -ListAvailable -Name Az.Resources)) {
    Write-Host "❌ Azure PowerShell (Az module) is not installed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it by running:" -ForegroundColor Yellow
    Write-Host "  Install-Module -Name Az -Repository PSGallery -Force -AllowClobber" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Or use the Portal import method instead (see README.md)" -ForegroundColor Cyan
    exit 1
}

# Import Az modules
Import-Module Az.Accounts -ErrorAction SilentlyContinue
Import-Module Az.Resources -ErrorAction SilentlyContinue

# Check if logged in
$context = Get-AzContext
if (-not $context) {
    Write-Host "🔐 Please sign in to Azure..." -ForegroundColor Yellow
    Connect-AzAccount
    $context = Get-AzContext
}

Write-Host "✅ Signed in as: $($context.Account.Id)" -ForegroundColor Green
Write-Host "📂 Subscription: $($context.Subscription.Name)" -ForegroundColor Cyan
Write-Host ""

# Check if resource group exists
Write-Host "🔍 Checking resource group..." -ForegroundColor Cyan
$rg = Get-AzResourceGroup -Name $ResourceGroup -ErrorAction SilentlyContinue

if (-not $rg) {
    Write-Host "📁 Creating resource group: $ResourceGroup" -ForegroundColor Yellow
    $rg = New-AzResourceGroup -Name $ResourceGroup -Location $Location
    Write-Host "✅ Resource group created" -ForegroundColor Green
} else {
    Write-Host "✅ Resource group exists" -ForegroundColor Green
    $Location = $rg.Location
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

Write-Host "🚀 Deploying workbook..." -ForegroundColor Yellow

try {
    # Create the workbook resource
    $workbook = New-AzResource `
        -ResourceType "microsoft.insights/workbooks" `
        -ResourceName $workbookId `
        -ResourceGroupName $ResourceGroup `
        -Location $Location `
        -Properties @{
            displayName = $WorkbookName
            serializedData = $workbookContent
            version = "1.0"
            sourceId = "Azure Monitor"
            category = "Arc"
        } `
        -Kind "shared" `
        -ApiVersion "2022-04-01" `
        -Force
    
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
    
    # Construct portal URL
    $subId = $context.Subscription.Id
    $tenantId = $context.Tenant.Id
    $portalUrl = "https://portal.azure.com/#@$tenantId/resource/subscriptions/$subId/resourceGroups/$ResourceGroup/providers/microsoft.insights/workbooks/$workbookId"
    Write-Host "  $portalUrl" -ForegroundColor Gray
    Write-Host ""
    Write-Host "💡 Tip: You can also find it in:" -ForegroundColor Yellow
    Write-Host "  Azure Portal → Monitor → Workbooks → My workbooks" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ Deployment failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Alternative: Use the Azure Portal to import manually" -ForegroundColor Yellow
    Write-Host "   See README.md for instructions" -ForegroundColor Gray
    exit 1
}

Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Open the workbook in Azure Portal" -ForegroundColor White
Write-Host "  2. Select your subscription(s) from the dropdown" -ForegroundColor White
Write-Host "  3. Review Arc capabilities and server details" -ForegroundColor White
Write-Host "  4. Share with your team using Portal permissions" -ForegroundColor White
Write-Host ""
