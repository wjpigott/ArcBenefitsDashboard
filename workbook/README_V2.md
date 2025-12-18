# Arc Benefits Dashboard v2 - SQL Server Arc Edition

## Overview

Version 2 of the Arc Benefits Dashboard extends the original workbook with **SQL Server Arc capabilities**, allowing you to track and optimize three additional areas:

1. **SQL Server Best Practices Assessment** - Automated configuration scanning
2. **SQL Server Performance Dashboard** - Query performance and resource monitoring  
3. **SQL Server Inventory & Configuration** - License tracking and version management

## What's New in v2

### New Cost Parameters

Three new labor cost parameters have been added:

| Parameter | Default Value | Purpose |
|-----------|---------------|---------|
| SQL Server BPA | $75 | Cost of manual best practice reviews per server per quarter |
| SQL Performance Dashboard | $50 | Cost of manual performance troubleshooting per server per month |
| SQL Inventory & Config | $40 | Cost of manual inventory tracking per server per quarter |

### New Navigation Tabs

Three new tabs appear after the existing Arc-enabled server capabilities:

- **SQL Server BPA** - Shows which SQL instances have Best Practices Assessment configured
- **SQL Performance** - Shows which SQL instances have performance monitoring via Azure Monitor
- **SQL Inventory** - Shows all SQL Server instances with version, edition, license, and configuration details

### Updated Title

The workbook title now reads:
> **Azure Arc Benefits Dashboard v2**  
> Track and maximize your Azure Arc-enabled server capabilities across subscriptions, including SQL Server Arc functionality.

## File Comparison

| Feature | v1 (arc-benefits-workbook.json) | v2 (arc-benefits-workbook-v2.json) |
|---------|----------------------------------|-------------------------------------|
| Arc-enabled Server Capabilities | ✅ 10 capabilities | ✅ 10 capabilities (unchanged) |
| SQL Server Arc Capabilities | ❌ None | ✅ 3 new capabilities |
| Cost Parameters | 10 | 13 (+3 SQL) |
| Navigation Tabs | 11 | 14 (+3 SQL) |
| Total Lines | ~1,110 | ~1,400 |

## When to Use v1 vs v2

### Use v1 (arc-benefits-workbook.json) if:
- You only have Arc-enabled **servers** (no SQL Server Arc)
- You want a simpler workbook with fewer tabs
- You're in production and don't want to introduce new features yet

### Use v2 (arc-benefits-workbook-v2.json) if:
- You have **SQL Server instances** registered in Azure Arc
- You want comprehensive visibility across both server and SQL capabilities
- You're ready to track SQL Server Best Practices, Performance, and Inventory

## Prerequisites for SQL Server Arc Features

The SQL Server Arc tabs require:

1. **SQL Server Arc Registration**
   - SQL Server instances must be registered as `microsoft.azurearcdata/sqlserverinstances` resources
   - Install `WindowsAgent.SqlServer` extension on Arc-enabled servers with SQL

2. **Best Practices Assessment**
   - Configure BPA in Azure Portal for each SQL Server Arc resource
   - Requires Log Analytics workspace

3. **Performance Monitoring**
   - Install Azure Monitor Agent on Arc-enabled servers hosting SQL
   - Create Data Collection Rules (DCRs) with SQL performance counters
   - Associate DCRs with Arc-enabled servers

4. **Inventory (Automatic)**
   - No additional configuration needed beyond Arc registration
   - SQL Server Arc extension automatically collects inventory data

📖 See [SQL_SERVER_ARC_SETUP.md](../SQL_SERVER_ARC_SETUP.md) for detailed setup instructions.

## Deployment

### Deploy v2 Workbook

```powershell
# Using existing deployment script
.\workbook\Deploy-Workbook.ps1 -WorkbookFilePath ".\workbook\arc-benefits-workbook-v2.json"
```

### Deploy Both Versions Side-by-Side

You can deploy both v1 and v2 workbooks simultaneously:

```powershell
# Deploy v1 (original)
.\workbook\Deploy-Workbook.ps1 -WorkbookFilePath ".\workbook\arc-benefits-workbook.json"

# Deploy v2 (SQL Server Arc edition)
.\workbook\Deploy-Workbook.ps1 -WorkbookFilePath ".\workbook\arc-benefits-workbook-v2.json"
```

They will appear as separate workbooks in Azure Monitor:
- "Arc Benefits Dashboard" (v1)
- "Arc Benefits Dashboard v2" (v2)

## Testing the SQL Server Queries

Before deploying, test the SQL queries in **Azure Resource Graph Explorer**:

```kusto
// Test: Do you have any SQL Server Arc instances?
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| summarize count()
```

If count is 0, you need to Arc-enable your SQL Servers first.

📖 See [SQL_SERVER_ARC_SETUP.md](../SQL_SERVER_ARC_SETUP.md) for complete testing instructions.

## Migrating from v1 to v2

If you're currently using v1 and want to upgrade:

### Option 1: Side-by-Side (Recommended)
- Keep v1 deployed for production use
- Deploy v2 as a new workbook for evaluation
- Test SQL queries return expected data
- Switch users to v2 once validated

### Option 2: Replace v1
- Export any customizations from your v1 workbook
- Deploy v2 with the same workbook name (will overwrite)
- Re-apply customizations if needed

**Note:** Cost parameter values are **not preserved** during upgrades. Document your custom values before replacing.

## Customization

Both versions support the same customization points:

- **Cost Parameters:** Edit values to match your organization's labor rates
- **Subscriptions Filter:** Multi-select which subscriptions to include
- **Queries:** Modify KQL queries to add/remove columns or filtering

## Version Control

This repository maintains both versions on separate branches:

- `main` branch: Contains v1 (arc-benefits-workbook.json)
- `v2-sql-server-arc` branch: Contains both v1 and v2 workbooks

To get v2:

```powershell
git checkout v2-sql-server-arc
```

## Troubleshooting

### SQL Server tabs show "No data"

**Cause:** No SQL Server instances registered in Azure Arc

**Solution:**
1. Verify SQL Server Arc extension is installed:
   ```bash
   az connectedmachine extension list --machine-name "MyServer" --resource-group "MyRG"
   ```
2. Check for SQL instances:
   ```bash
   az resource list --resource-type "Microsoft.AzureArcData/sqlServerInstances"
   ```
3. If empty, follow [SQL Server Arc setup guide](../SQL_SERVER_ARC_SETUP.md)

### BPA shows all servers as "Not Configured"

**Cause:** BPA requires manual configuration per SQL instance

**Solution:** 
1. Navigate to Azure Portal → SQL Server - Azure Arc resource
2. Select "Best practices assessment"
3. Click "Configure" and complete setup

### Performance monitoring shows "Not Configured"

**Cause:** Azure Monitor Agent not installed or no DCR associated

**Solution:**
1. Install Azure Monitor Agent on Arc-enabled server (not just SQL instance)
2. Create Data Collection Rule with SQL performance counters
3. Associate DCR with the Arc-enabled server

## Support

For issues specific to SQL Server Arc setup, see [SQL_SERVER_ARC_SETUP.md](../SQL_SERVER_ARC_SETUP.md).

For general workbook issues, see the main [README.md](../README.md).

---

## License & Disclaimer

This project is provided as sample code. The workbook queries Azure Resource Graph for Arc-enabled resources. No data is sent outside your Azure environment.

<small>This is sample code provided for demonstration purposes. Microsoft provides this sample code "as is" without warranty of any kind, either expressed or implied. Use at your own risk. Always test in a non-production environment first.</small>

---

**GitHub Repository:** [ArcBenefitsDashboard](https://github.com/wjpigott/ArcBenefitsDashboard)
