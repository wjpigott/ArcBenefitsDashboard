# SQL Server Arc Setup Guide

## Overview

The v2 Azure Arc Benefits Dashboard includes three SQL Server Arc capabilities:

1. **SQL Server Best Practices Assessment** - Automated configuration scanning
2. **SQL Server Performance Dashboard** - Query performance and resource monitoring
3. **SQL Server Inventory & Configuration** - License tracking and version management

---

## Prerequisites

### 1. Azure Arc-enabled SQL Server

Your SQL Server instances must be Arc-enabled and registered in Azure as `microsoft.azurearcdata/sqlserverinstances` resources.

**How to Arc-enable SQL Server:**

```powershell
# Install the Azure Connected Machine agent (if not already installed)
# Then install the SQL Server extension

# Example: Install SQL Server extension via Azure CLI
az connectedmachine extension create `
  --machine-name "MyServer" `
  --resource-group "MyResourceGroup" `
  --name "WindowsAgent.SqlServer" `
  --type "WindowsAgent.SqlServer" `
  --publisher "Microsoft.AzureData" `
  --settings '{"SqlManagement":{"IsEnabled":true}}'
```

**Verify SQL Server Arc registration:**

```bash
# Check if SQL instances are registered
az resource list --resource-type "Microsoft.AzureArcData/sqlServerInstances" --output table
```

---

## Data Collection Details

### 1. SQL Server Best Practices Assessment

**Resource Type:** `microsoft.azurearcdata/sqlserverinstances`  
**Detection Method:** Checks for `properties.assessmentSettings` on SQL Server instances

**How to Enable BPA:**

1. Navigate to Azure Portal → SQL Server - Azure Arc resource
2. Select **Best practices assessment** from the left menu
3. Click **Configure** and select a Log Analytics workspace
4. Set assessment schedule (recommended: weekly)

**Azure CLI Method:**

```bash
# Enable BPA via REST API or Azure Portal
# Currently requires portal configuration
```

**Query Logic:**
- The workbook queries `microsoft.azurearcdata/sqlserverinstances`
- Checks if `properties.assessmentSettings` is configured
- Shows ✅ Configured if BPA settings exist, ❌ Not Configured otherwise

**Cost Savings Calculation:**
- **Parameter:** `SqlBpaCost` (default: $75)
- **Formula:** Unconfigured SQL instances × $75
- **Rationale:** Manual BPA reviews take 2-4 hours per server per quarter

---

### 2. SQL Server Performance Dashboard

**Resource Type:** `microsoft.azurearcdata/sqlserverinstances` joined with `microsoft.hybridcompute/machines/extensions`  
**Detection Method:** Checks for Azure Monitor Agent (AMA) extension on the hosting Arc-enabled server

**Required Extensions:**
- `AzureMonitorWindowsAgent` (for Windows)
- `AzureMonitorLinuxAgent` (for Linux)

**How to Enable Performance Monitoring:**

1. **Install Azure Monitor Agent on the Arc-enabled server:**

```powershell
# Via Azure Portal
# Navigate to Arc-enabled server → Extensions → Add
# Select "Azure Monitor Agent"

# Via Azure CLI
az connectedmachine extension create `
  --machine-name "MyServer" `
  --resource-group "MyResourceGroup" `
  --name "AzureMonitorWindowsAgent" `
  --type "AzureMonitorWindowsAgent" `
  --publisher "Microsoft.Azure.Monitor"
```

2. **Create Data Collection Rule (DCR) for SQL Server:**

```json
{
  "properties": {
    "dataSources": {
      "performanceCounters": [
        {
          "name": "sqlPerformanceCounters",
          "streams": ["Microsoft-Perf"],
          "samplingFrequencyInSeconds": 60,
          "counterSpecifiers": [
            "\\SQLServer:General Statistics\\User Connections",
            "\\SQLServer:SQL Statistics\\Batch Requests/sec",
            "\\SQLServer:SQL Statistics\\SQL Compilations/sec",
            "\\SQLServer:Databases(*)\\Transactions/sec",
            "\\SQLServer:Buffer Manager\\Page life expectancy",
            "\\SQLServer:Memory Manager\\Total Server Memory (KB)"
          ]
        }
      ]
    },
    "destinations": {
      "logAnalytics": [
        {
          "workspaceResourceId": "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.OperationalInsights/workspaces/{workspace}",
          "name": "sqlWorkspace"
        }
      ]
    },
    "dataFlows": [
      {
        "streams": ["Microsoft-Perf"],
        "destinations": ["sqlWorkspace"]
      }
    ]
  }
}
```

3. **Associate DCR with Arc-enabled servers:**

```bash
az monitor data-collection rule association create `
  --name "sqlPerfMonitoring" `
  --rule-id "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.Insights/dataCollectionRules/{dcr}" `
  --resource "subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.HybridCompute/machines/{server}"
```

**Query Logic:**
- Queries `microsoft.azurearcdata/sqlserverinstances`
- Extracts `machineId` from `properties.containerResourceId`
- Left joins with `microsoft.hybridcompute/machines/extensions`
- Checks for AzureMonitorWindowsAgent or AzureMonitorLinuxAgent extensions

**Cost Savings Calculation:**
- **Parameter:** `SqlPerformanceCost` (default: $50)
- **Formula:** Unconfigured SQL instances × $50
- **Rationale:** 1-2 hours per performance investigation per server per month

---

### 3. SQL Server Inventory & Configuration

**Resource Type:** `microsoft.azurearcdata/sqlserverinstances`  
**Detection Method:** All Arc-enabled SQL instances are automatically discovered

**Properties Tracked:**

| Property | Description | Query Field |
|----------|-------------|-------------|
| `properties.version` | SQL Server version (e.g., "15.0.4298.1") | `sqlVersion` |
| `properties.edition` | SQL edition (e.g., "Standard", "Enterprise") | `sqlEdition` |
| `properties.licenseType` | License model (e.g., "PAID", "Free", "LicenseOnly") | `licenseType` |
| `properties.vCore` | Number of virtual cores | `vCores` |
| `properties.patchLevel` | Current patch level | `patchLevel` |
| `properties.instanceName` | SQL instance name | `instanceName` |
| `properties.hostType` | Host type (e.g., "Physical", "Virtual") | `hostType` |

**How Data is Collected:**

SQL Server Arc extension automatically collects inventory data every hour. No additional configuration needed beyond Arc-enabling the SQL instance.

**Verify Data Collection:**

```bash
# Check SQL instance properties
az resource show `
  --ids "/subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.AzureArcData/sqlServerInstances/{instance}" `
  --query "properties"
```

**Query Logic:**
- Queries all `microsoft.azurearcdata/sqlserverinstances`
- Extracts version, edition, license type, vCores, patch level
- Displays comprehensive inventory table

**Cost Savings Calculation:**
- **Parameter:** `SqlInventoryCost` (default: $40)
- **Formula:** Total SQL instances × $40
- **Rationale:** 30-60 minutes per server per quarter for manual inventory

---

## Testing the Queries

### Test in Azure Resource Graph Explorer

1. Navigate to Azure Portal → **Resource Graph Explorer**

2. **Test SQL Server BPA Query:**

```kusto
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| extend 
    serverName = tostring(properties.containerResourceId),
    sqlVersion = tostring(properties.version),
    sqlEdition = tostring(properties.edition),
    hasBPA = isnotnull(properties.assessmentSettings)
| extend ConfigurationStatus = iff(hasBPA == true, "✅ Configured", "❌ Not Configured")
| project 
    SQLInstanceName = name,
    ResourceGroup = resourceGroup,
    Subscription = subscriptionId,
    SQLVersion = sqlVersion,
    SQLEdition = sqlEdition,
    BPAStatus = ConfigurationStatus,
    Location = location
| order by BPAStatus desc, SQLInstanceName asc
```

3. **Test SQL Performance Monitoring Query:**

```kusto
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| extend machineId = tolower(tostring(properties.containerResourceId))
| join kind=leftouter (
    resources
    | where type == "microsoft.hybridcompute/machines/extensions"
    | where properties.type contains "AzureMonitorWindowsAgent" or properties.type contains "AzureMonitorLinuxAgent"
    | extend machineId = tolower(substring(id, 0, indexof(id, '/extensions/')))
    | summarize hasMonitoring = any(true) by machineId
) on machineId
| extend ConfigurationStatus = iff(hasMonitoring == true, "✅ Configured", "❌ Not Configured")
| project 
    SQLInstanceName = name,
    ResourceGroup = resourceGroup,
    Subscription = subscriptionId,
    SQLVersion = tostring(properties.version),
    SQLEdition = tostring(properties.edition),
    MonitoringStatus = ConfigurationStatus,
    Location = location
| order by MonitoringStatus desc, SQLInstanceName asc
```

4. **Test SQL Inventory Query:**

```kusto
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| extend 
    sqlVersion = tostring(properties.version),
    sqlEdition = tostring(properties.edition),
    licenseType = tostring(properties.licenseType),
    vCores = toint(properties.vCore),
    patchLevel = tostring(properties.patchLevel),
    instanceName = tostring(properties.instanceName),
    hostType = tostring(properties.hostType)
| project 
    SQLInstanceName = name,
    ResourceGroup = resourceGroup,
    Subscription = subscriptionId,
    SQLVersion = sqlVersion,
    SQLEdition = sqlEdition,
    LicenseType = licenseType,
    vCores = vCores,
    PatchLevel = patchLevel,
    HostType = hostType,
    Location = location
| order by SQLInstanceName asc
```

---

## Deployment to Azure Portal

### Option 1: Deploy via ARM Template (Recommended)

Use the existing deployment scripts but update the workbook name:

```powershell
# Deploy v2 workbook
.\workbook\Deploy-Workbook.ps1 -WorkbookFilePath ".\workbook\arc-benefits-workbook-v2.json"
```

### Option 2: Manual Import

1. Navigate to Azure Portal → **Monitor** → **Workbooks**
2. Click **+ New**
3. Click **Advanced Editor** (</> icon)
4. Paste contents of `arc-benefits-workbook-v2.json`
5. Click **Apply**
6. **Save** the workbook with name: "Arc Benefits Dashboard v2"

---

## Troubleshooting

### No SQL Server instances showing up

**Check if SQL Server Arc extension is installed:**

```powershell
az connectedmachine extension list `
  --machine-name "MyServer" `
  --resource-group "MyResourceGroup" `
  --query "[?contains(name, 'SqlServer')]"
```

**Verify SQL Server instances are registered:**

```bash
az resource list --resource-type "Microsoft.AzureArcData/sqlServerInstances" --output table
```

### BPA shows "Not Configured" for all instances

- BPA requires manual configuration in Azure Portal
- Navigate to each SQL Server Arc resource → Best practices assessment
- Configure Log Analytics workspace and schedule

### Performance monitoring shows "Not Configured"

- Verify Azure Monitor Agent is installed on the Arc-enabled **server** (not just SQL)
- Check Data Collection Rule (DCR) is associated with the server
- Verify DCR includes SQL performance counters

---

## Next Steps

1. **Arc-enable your SQL Servers** (if not already done)
2. **Test queries** in Resource Graph Explorer
3. **Configure BPA** for SQL instances
4. **Deploy Azure Monitor Agent** and DCRs for performance monitoring
5. **Deploy v2 workbook** to Azure Portal
6. **Validate data** appears in all three SQL tabs

---

## Additional Resources

- [SQL Server enabled by Azure Arc](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/overview)
- [Configure Best Practices Assessment](https://learn.microsoft.com/en-us/sql/sql-server/azure-arc/assess)
- [Monitor SQL Server with Azure Monitor](https://learn.microsoft.com/en-us/azure/azure-monitor/insights/sql-insights-overview)
- [Azure Resource Graph Query Language](https://learn.microsoft.com/en-us/azure/governance/resource-graph/concepts/query-language)

---

<small>This is sample code provided for demonstration purposes. Modify according to your organization's requirements and security policies.</small>
