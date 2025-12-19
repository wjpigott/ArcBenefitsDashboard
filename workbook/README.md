# Azure Arc Benefits Dashboard v2

This folder contains an Azure Workbook template that provides a native Azure Portal experience for tracking both **Azure Arc-enabled server** and **SQL Server Arc** benefits.

## Version History

- **v2.0 (Current)**: Includes SQL Server Arc capabilities, cost toggle, improved UI with radio button navigation, and collapsible notes sections
- **v1.0 (Archived)**: Original Windows Arc-only version available as `arc-benefits-workbook-v1-archive.json` and git tag `v1.0`

## Features

### Core Capabilities
- 📊 Subscription filtering
- 🔍 **Windows Arc server** detection across 10 capabilities
- 🗄️ **SQL Server Arc** tracking across 3 capabilities (BPA, Performance, Inventory)
- 📈 Configured vs. Unconfigured server counts
- 💰 Optional cost analysis with customizable rates (toggle on/off)
- 📋 Clean radio button navigation (Windows Arc Benefits vs SQL Arc Benefits)
- 🎨 Visual status indicators
- ⚙️ Easy cost editing via parameters at top of workbook
- 📋 Collapsible notes sections under each tab with benefit analysis and labor cost formulas

### Windows Arc Capabilities (10 tabs)
1. Update Manager
2. Microsoft Defender for Cloud
3. Inventory & Tracking
4. Guest Configuration
5. Best Practice Assessment
6. Resource Tagging
7. Monitoring & Insights
8. Windows Admin Center
9. Hotpatching (WS2025)
10. Overview

### SQL Server Arc Capabilities (4 tabs)
1. Best Practices Assessment
2. Performance Dashboard
3. Inventory & Configuration
4. Overview

Each capability tab includes a **Notes** section (collapsible) that provides:
- **What it provides**: Key benefits and value propositions
- **If not used**: Consequences and manual labor implications
- **Labor cost formula**: Calculation methodology for estimating savings

These notes help you understand the operational and financial impact of each Arc capability.

## What's New in v2.0

- ✅ **SQL Server Arc support** - 3 new tabs for SQL-specific capabilities
- ✅ **Cost toggle** - Show/hide cost analysis and PotentialSavings column
- ✅ **Improved navigation** - Clean radio buttons instead of nested tabs
- ✅ **Collapsible notes** - All 12 notes sections collapse by default to save space
- ✅ **Optimized layout** - Controls consolidated into single row at top

<img width="1131" height="730" alt="image" src="https://github.com/user-attachments/assets/2dd48e30-e968-4a6b-9b8a-c9654b7bbe53" />


## Prerequisites

### For Windows Arc Features
- Azure Arc-enabled servers registered in your subscription
- "Reader" role on subscriptions you want to monitor
- Azure Resource Graph access (enabled by default)

### For SQL Server Arc Features (Optional)

1. **SQL Server Arc Registration**
   - SQL Server instances registered as `microsoft.azurearcdata/sqlserverinstances` resources
   - `WindowsAgent.SqlServer` extension installed on Arc-enabled servers with SQL

2. **Best Practices Assessment**
   - Configure BPA in Azure Portal for each SQL Server Arc resource
   - Requires Log Analytics workspace

3. **Performance Monitoring**
   - Azure Monitor Agent installed on Arc-enabled servers hosting SQL
   - Data Collection Rules (DCRs) with SQL performance counters configured

4. **Inventory (Automatic)**
   - No additional configuration needed beyond Arc registration

## Installation

### Option 1: Import via Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure Workbooks" or navigate to Monitor → Workbooks
3. Click "New" or "Empty Workbook"
4. Click the Advanced Editor button (</> icon in toolbar)
5. Delete all content in the editor
6. Copy and paste the entire contents of ***`arc-benefits-workbook.json`***
7. Click "Apply"
8. Click "Save" and choose:
   - **Title**: Arc Benefits Dashboard v2
   - **Subscription**: Your subscription
   - **Resource Group**: Choose or create one
   - **Location**: Your region
9. Click "Apply"

### Option 2: Deploy via PowerShell Script

```powershell
.\Deploy-Workbook.ps1 -ResourceGroup "YourResourceGroup" -Location "eastus"
```

## Usage

1. **Open the Workbook**
   - Go to Azure Portal → Monitor → Workbooks → My workbooks
   - Open "Arc Benefits Dashboard v2"

2. **Select Resource Type**
   - Use radio buttons at top to switch between:
     - **Windows Arc Benefits** - Server capabilities (Update Manager, Defender, etc.)
     - **SQL Arc Benefits** - SQL Server capabilities (BPA, Performance, Inventory)

3. **Enable Cost Analysis (Optional)**
   - Toggle "Show Cost Analysis" at the top
   - This reveals cost parameters and adds PotentialSavings column to overview
   - Disabled by default for cleaner view

4. **Select Subscription(s)**
   - Use the Subscription dropdown at the top to filter
   - Default is "All Subscriptions"

5. **Customize Cost Rates (if enabled)**
   - Edit cost parameters shown when cost analysis is enabled
   - Values represent annual cost per server

6. **View Benefits Summary**
   - Overview tab shows total servers, configured servers, and potential savings (if cost analysis enabled)
   - Each benefit shows a status indicator

7. **Navigate Capability Tabs**
   - Click tabs below the overview to see detailed breakdowns
   - Each tab shows server-by-server configuration status

8. **Expand Notes Sections**
   - Each capability tab has a collapsible Notes section
   - Click to expand and see benefit details, impact, and cost formulas

## Cost Parameters (Customizable)

When cost analysis is enabled, these default annual per-server values are used:

### Windows Arc Capabilities

| Service | Default Cost/Server/Year |
|---------|-------------------------|
| Defender for Cloud | $450 |
| Update Manager | $400 |
| Guest Configuration | $350 |
| Inventory & Tracking | $300 |
| Best Practice Assessment | $250 |
| Hotpatching (WS2025) | $225 |
| Monitoring & Insights | $200 |
| Resource Tagging | $150 |
| Windows Admin Center | $125 |

### SQL Server Arc Capabilities

| Service | Default Cost/Server/Year |
|---------|-------------------------|
| Best Practices Assessment | $75 (per quarter) |
| Performance Dashboard | $50 (per month) |
| Inventory & Configuration | $40 (per quarter) |

To change these values, see the "Modify Cost Values" section below.

## Customization

### Modify Cost Values

**Easy Method (Recommended):**
1. Open the workbook
2. Click "Edit" mode at the top
3. Enable "Show Cost Analysis" toggle
4. You'll see cost parameters at the top (DefenderCost, UpdateManagerCost, SqlBpaCost, etc.)
5. Edit the values directly in the parameter fields
6. Click "Done Editing" and "Save"

**Advanced Method:**
1. Open the workbook
2. Click "Edit" mode
3. Click "Advanced Editor" (</> icon)
4. Find the cost parameters section (search for "DefenderCost", "SqlBpaCost", etc.)
5. Modify the "value" field for each cost parameter
6. Click "Apply", "Done Editing", and "Save"

### Testing SQL Server Queries

Before deploying, test the SQL queries in **Azure Resource Graph Explorer**:

```kusto
// Test: Do you have any SQL Server Arc instances?
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| summarize count()
```

If count is 0, you need to Arc-enable your SQL Servers first.

```kusto
// Test: Which SQL instances have BPA enabled?
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| extend BpaEnabled = properties.migration.assessment.enabled
| project name, resourceGroup, BpaEnabled
```

```kusto
// Test: Which SQL instances have performance monitoring?
resources
| where type == "microsoft.azurearcdata/sqlserverinstances"
| extend PerformanceEnabled = properties.monitoring.enabled
| project name, resourceGroup, PerformanceEnabled
```

### Add More Benefits

1. Edit mode → Advanced Editor
2. Copy an existing query step
3. Modify the KQL to detect your new benefit
4. Add a new grid visualization
5. Save the workbook

### Change Styling

1. Edit mode
2. Click on any visualization
3. Use the Settings panel to change:
   - Colors
   - Column widths
   - Sort order
   - Filters

## Migrating from v1 to v2

If you deployed the original v1 workbook:

### Option 1: Side-by-Side Deployment (Recommended)
- Keep v1 deployed for existing users
- Deploy v2 as a new workbook with different name
- Test SQL queries return expected data
- Transition users to v2 when ready

### Option 2: Replace v1
- Use `arc-benefits-workbook-v1-archive.json` if you need to rollback
- Deploy v2 using same workbook name (will replace v1)
- Note: Cost parameter values are **not preserved** - document custom values before upgrading

### v1 Archive Location
The original v1 workbook is preserved as:
- **File**: `arc-benefits-workbook-v1-archive.json`
- **Git Tag**: `v1.0`

## Sharing the Workbook

### Share with Specific Users

1. Open the workbook
2. Click "Share" icon
3. Add users or groups with "Reader" access

### Share Link

1. Save the workbook
2. Share the Azure Portal URL:
   ```
   https://portal.azure.com/#view/Microsoft_Azure_Monitoring/WorkbooksViewBlade/workbookId/<workbook-resource-id>
   ```

### Make Available to Organization

1. Save in a shared Resource Group
2. Grant "Workbook Reader" role to users/groups
3. Or publish as a Template Workbook for reuse

## Troubleshooting

### No Data Showing (Windows Arc)

- **Check Permissions**: Ensure you have "Reader" role on subscriptions
- **Verify Arc Servers**: Confirm you have Arc-enabled servers in selected subscriptions
- **API Permissions**: The workbook uses Azure Resource Graph - ensure it's available

### SQL Server Tabs Show "No Data"

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
3. Register SQL Servers with Azure Arc if needed

### BPA Shows All Servers as "Not Configured"

**Cause:** BPA requires manual configuration per SQL instance

**Solution:** 
1. Navigate to Azure Portal → SQL Server - Azure Arc resource
2. Select "Best practices assessment"
3. Click "Configure" and complete setup

### Performance Monitoring Shows "Not Configured"

**Cause:** Azure Monitor Agent not installed or no DCR associated

**Solution:**
1. Install Azure Monitor Agent on Arc-enabled server (not just SQL instance)
2. Create Data Collection Rule with SQL performance counters
3. Associate DCR with the Arc-enabled server

### Cost Analysis Not Showing

**Cause:** Cost toggle is disabled by default

**Solution:** Enable the "Show Cost Analysis" toggle at the top of the workbook

### Query Timeout

- **Too Many Subscriptions**: Try filtering to specific subscriptions
- **Large Environments**: Workbooks have timeout limits (~2 minutes)
- **Solution**: Break into multiple workbooks by subscription or region

### Missing Servers

- **Subscription Filter**: Check that the right subscriptions are selected
- **Resource Types**: Ensure servers are type `microsoft.hybridcompute/machines`
- **Extensions**: Some detection relies on extension installation

## What's Included vs. Static Web App

| Feature | Static Web App | Azure Workbook |
|---------|---------------|----------------|
| Custom Costs | ✅ Modal UI | ✅ Toggle + Parameters |
| Windows Arc | ✅ 10 capabilities | ✅ 10 capabilities |
| SQL Server Arc | ❌ Not included | ✅ 3 capabilities |
| Expandable Rows | ✅ Beautiful UI | ✅ Tab navigation |
| Modal Details | ✅ Rich modals | ✅ Detail tabs + collapsible notes |
| Authentication | MSAL.js | Azure Portal auth |
| Hosting | Static Web Apps | Native Portal |
| Sharing | URL | Portal permissions |
| Customization | Full control | KQL + Parameters |
| Cost | Free tier | Free |

## Files

- `arc-benefits-workbook.json` - **Current v2 workbook** (Windows Arc + SQL Arc)
- `arc-benefits-workbook-v1-archive.json` - Original Windows Arc-only version
- `Deploy-Workbook-AzPowerShell.ps1` - Azure PowerShell deployment script
- `Deploy-Workbook.ps1` - PowerShell deployment script
- `README.md` - This file

## Support

- **Workbook Documentation**: https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-overview
- **KQL Reference**: https://learn.microsoft.com/azure/data-explorer/kusto/query/
- **Resource Graph**: https://learn.microsoft.com/azure/governance/resource-graph/
- **SQL Server Arc**: https://learn.microsoft.com/sql/sql-server/azure-arc/overview

---

**GitHub Repository:** [sa-benefits-dashboard](https://github.com/wjpigott/sa-benefits-dashboard)

---

<small>

## Disclaimer

Sample code and proofs of concept are provided for the purpose of illustration only and are not intended to be used in a production environment.

THE SAMPLE CODE AND PROOFS OF CONCEPT ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE. We grant you a nonexclusive, royalty-free right to use and modify the sample code and to reproduce and distribute the object code form of the sample code, provided that you agree: (i) to not use Microsoft's name, logo, or trademarks to market your software product in which the sample code is embedded; (ii) to include a valid copyright notice on your software product in which the sample code is embedded; (iii) to provide on behalf of and for the benefit of your subcontractors a disclaimer of warranties, exclusion of liability for indirect and consequential damages and a reasonable limitation of liability; and (iv) to indemnify, hold harmless, and defend Microsoft, its affiliates and suppliers from and against any third party claims or lawsuits, including attorneys' fees, that arise or result from the use or distribution of the sample code.

</small>
