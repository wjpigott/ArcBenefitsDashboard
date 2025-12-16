#Requires -Version 5.1
<#
.SYNOPSIS
    Grants Reader role to the Azure AD app registration on subscriptions.

.DESCRIPTION
    This script helps assign the Reader role to your Azure AD app registration
    on one or more Azure subscriptions. This is required for the dashboard to
    query Azure Arc-enabled servers.

.PARAMETER AppId
    The Application (Client) ID of your Azure AD app registration.
    If not provided, will read from config.js.

.PARAMETER SubscriptionId
    Optional. A specific subscription ID to grant access to.
    If not provided, will prompt for interactive selection.

.PARAMETER AllSubscriptions
    Optional. Grant Reader role on all subscriptions the current user has access to.

.EXAMPLE
    .\Grant-ReaderRole.ps1
    # Interactive mode - prompts for app ID and subscription selection

.EXAMPLE
    .\Grant-ReaderRole.ps1 -AllSubscriptions
    # Grants Reader role on all accessible subscriptions

.EXAMPLE
    .\Grant-ReaderRole.ps1 -SubscriptionId "12345678-1234-1234-1234-123456789012"
    # Grants Reader role on a specific subscription
#>

[CmdletBinding(DefaultParameterSetName = 'Interactive')]
param(
    [Parameter(Mandatory = $false)]
    [string]$AppId,

    [Parameter(Mandatory = $false, ParameterSetName = 'Specific')]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false, ParameterSetName = 'All')]
    [switch]$AllSubscriptions
)

$ErrorActionPreference = 'Stop'

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = 'White'
    )
    Write-Host $Message -ForegroundColor $Color
}

function Get-AppIdFromConfig {
    $configPath = Join-Path $PSScriptRoot "config.js"
    if (Test-Path $configPath) {
        $content = Get-Content $configPath -Raw
        if ($content -match "CLIENT_ID:\s*['""]([^'""]+)['""]") {
            return $matches[1]
        }
    }
    return $null
}

function Get-AppServicePrincipal {
    param([string]$AppId)
    
    Write-ColorOutput "Looking up service principal for app $AppId..." "Cyan"
    $spId = az ad sp show --id $AppId --query id -o tsv 2>$null
    
    if (-not $spId) {
        Write-ColorOutput "Service principal not found. Creating one..." "Yellow"
        $spId = az ad sp create --id $AppId --query id -o tsv
        Start-Sleep -Seconds 5  # Wait for replication
    }
    
    return $spId
}

function Grant-SubscriptionReader {
    param(
        [string]$ServicePrincipalId,
        [string]$SubscriptionId,
        [string]$SubscriptionName
    )
    
    Write-ColorOutput "`nProcessing subscription: $SubscriptionName ($SubscriptionId)" "Cyan"
    
    # Check if role assignment already exists
    $existing = az role assignment list --assignee $ServicePrincipalId --scope "/subscriptions/$SubscriptionId" --role "Reader" --query "[0].id" -o tsv 2>$null
    
    if ($existing) {
        Write-ColorOutput "  Success - Reader role already assigned" "Green"
        return $true
    }
    
    try {
        az role assignment create --assignee $ServicePrincipalId --role "Reader" --scope "/subscriptions/$SubscriptionId" --output none
        Write-ColorOutput "  Success - Reader role granted successfully" "Green"
        return $true
    }
    catch {
        Write-ColorOutput "  Failed - Could not grant Reader role: $_" "Red"
        return $false
    }
}

# Main script
Write-ColorOutput "`n===============================================================" "Cyan"
Write-ColorOutput "  Azure Arc Benefits Dashboard - RBAC Role Assignment" "Cyan"
Write-ColorOutput "===============================================================`n" "Cyan"

# Get App ID
if (-not $AppId) {
    $AppId = Get-AppIdFromConfig
    if ($AppId) {
        Write-ColorOutput "Using Application ID from config.js: $AppId" "Green"
        $confirm = Read-Host "Is this correct? (Y/n)"
        if ($confirm -eq 'n' -or $confirm -eq 'N') {
            $AppId = Read-Host "Enter the Application (Client) ID"
        }
    }
    else {
        $AppId = Read-Host "Enter the Application (Client) ID"
    }
}

# Validate Azure CLI login
Write-ColorOutput "`nValidating Azure CLI authentication..." "Cyan"
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-ColorOutput "Not logged in to Azure CLI. Please run 'az login' first." "Red"
    exit 1
}
Write-ColorOutput "Success - Logged in as: $($account.user.name)" "Green"

# Get service principal
$spId = Get-AppServicePrincipal -AppId $AppId
Write-ColorOutput "Success - Service Principal ID: $spId" "Green"

# Get subscriptions
Write-ColorOutput "`nRetrieving accessible subscriptions..." "Cyan"
$subscriptions = az account list --query "[].{id:id, name:name, state:state}" -o json | ConvertFrom-Json
$activeSubscriptions = $subscriptions | Where-Object { $_.state -eq "Enabled" }

if ($activeSubscriptions.Count -eq 0) {
    Write-ColorOutput "No enabled subscriptions found." "Red"
    exit 1
}

Write-ColorOutput "Found $($activeSubscriptions.Count) enabled subscription(s)" "Green"

# Determine which subscriptions to process
$subscriptionsToProcess = @()

if ($AllSubscriptions) {
    Write-ColorOutput "`nGranting Reader role on ALL subscriptions..." "Yellow"
    $subscriptionsToProcess = $activeSubscriptions
}
elseif ($SubscriptionId) {
    $sub = $activeSubscriptions | Where-Object { $_.id -eq $SubscriptionId }
    if (-not $sub) {
        Write-ColorOutput "Subscription $SubscriptionId not found or not enabled." "Red"
        exit 1
    }
    $subscriptionsToProcess = @($sub)
}
else {
    # Interactive mode
    Write-ColorOutput "`nAvailable subscriptions:" "Cyan"
    Write-ColorOutput "  [0] All subscriptions" "White"
    for ($i = 0; $i -lt $activeSubscriptions.Count; $i++) {
        Write-ColorOutput "  [$($i + 1)] $($activeSubscriptions[$i].name) ($($activeSubscriptions[$i].id))" "White"
    }
    
    $selection = Read-Host "`nEnter selection (0 for all, or comma-separated numbers)"
    
    if ($selection -eq "0") {
        $subscriptionsToProcess = $activeSubscriptions
    }
    else {
        $indices = $selection -split ',' | ForEach-Object { [int]$_.Trim() - 1 }
        $subscriptionsToProcess = $indices | ForEach-Object { $activeSubscriptions[$_] } | Where-Object { $_ -ne $null }
    }
}

if ($subscriptionsToProcess.Count -eq 0) {
    Write-ColorOutput "No subscriptions selected." "Red"
    exit 1
}

# Process subscriptions
Write-ColorOutput "`n===============================================================" "Cyan"
Write-ColorOutput "  Granting Reader Role on $($subscriptionsToProcess.Count) subscription(s)" "Cyan"
Write-ColorOutput "===============================================================" "Cyan"

$successCount = 0
$failCount = 0

foreach ($sub in $subscriptionsToProcess) {
    $result = Grant-SubscriptionReader -ServicePrincipalId $spId -SubscriptionId $sub.id -SubscriptionName $sub.name
    if ($result) {
        $successCount++
    }
    else {
        $failCount++
    }
}

# Summary
Write-ColorOutput "`n===============================================================" "Cyan"
Write-ColorOutput "  Summary" "Cyan"
Write-ColorOutput "===============================================================" "Cyan"
Write-ColorOutput "Success: $successCount" "Green"
if ($failCount -gt 0) {
    Write-ColorOutput "Failed: $failCount" "Red"
}
Write-ColorOutput "`nThe app registration can now query Azure Arc resources on the assigned subscriptions." "Green"
Write-ColorOutput ""
