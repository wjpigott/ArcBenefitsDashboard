# Azure Arc Benefits Dashboard - Azure Workbook

This folder contains an Azure Workbook template that provides a native Azure Portal experience for tracking Arc server benefits.

## Features

- 📊 Subscription filtering
- 🔍 Arc server detection across 9 Arc capabilities
- 📈 Configured vs. Unconfigured server counts
- 💰 Calculated savings with customizable cost rates
- 📋 Tab-based navigation with detailed drill-down views
- 🎨 Visual status indicators
- ⚙️ Easy cost editing via parameters at top of workbook

## What's Included vs. Static Web App

### ✅ Included in Workbook
- Subscription filtering with dropdown
- All Arc server KQL queries
- Service status detection (Update Manager, Defender, etc.)
- Server-by-server breakdown tables
- Calculated savings with cost formulas
- Summary statistics

### ❌ Not Available in Workbook
- localStorage persistence
- Custom modals and detailed UI
- Some advanced styling/branding

<img width="1366" height="687" alt="image" src="https://github.com/user-attachments/assets/bb2f5f30-b2a6-4ea2-93d5-b684cafab4d6" />


## Installation

### Option 1: Import via Azure Portal (Recommended)

1. Go to [Azure Portal](https://portal.azure.com)
2. Search for "Azure Workbooks" or navigate to Monitor → Workbooks
3. Click "New" or "Empty Workbook"
4. Click the Advanced Editor button (</> icon in toolbar)
5. Delete all content in the editor
6. Copy and paste the entire contents of `arc-benefits-workbook.json`
7. Click "Apply"
8. Click "Save" and choose:
   - **Title**: Arc Benefits Dashboard
   - **Subscription**: Your subscription
   - **Resource Group**: Choose or create one
   - **Location**: Your region
9. Click "Apply"

### Option 2: Deploy via ARM Template

```powershell
# Deploy the workbook template
$resourceGroup = "YourResourceGroup"
$location = "eastus"
$workbookName = "Arc-Benefits-Dashboard"

az deployment group create `
  --resource-group $resourceGroup `
  --template-file workbook-deployment.json `
  --parameters workbookName=$workbookName location=$location
```

### Option 3: Deploy via PowerShell Script

```powershell
.\Deploy-Workbook.ps1 -ResourceGroup "YourResourceGroup" -Location "eastus"
```

## Usage

1. **Open the Workbook**
   - Go to Azure Portal → Monitor → Workbooks → My workbooks
   - Open "Arc Benefits Dashboard"

2. **Select Subscription(s)**
   - Use the Subscription dropdown at the top to filter
   - Default is "All Subscriptions"

3. **View Benefits Summary**
   - See total servers, configured servers, and potential savings
   - Each benefit shows a status indicator

4. **Expand Server Details**
   - Click the ▶ arrow next to each benefit to see all servers
   - View which servers are configured vs. unconfigured

5. **Review Calculations**
   - Savings are calculated using fixed per-server/year rates
   - Formulas are transparent in the KQL queries

## Cost Rates (Customizable)

These are the default annual per-server cost/risk values used in calculations:

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

To change these values, see the "Modify Cost Values" section below.

## Customization

### Modify Cost Values

**Easy Method (Recommended):**
1. Open the workbook
2. Click "Edit" mode at the top
3. Scroll to the top and you'll see cost parameters (DefenderCost, UpdateManagerCost, etc.)
4. Edit the values directly in the parameter fields
5. Click "Done Editing" and "Save"

**Advanced Method:**
1. Open the workbook
2. Click "Edit" mode
3. Click "Advanced Editor" (</> icon)
4. Find the cost parameters section near the top (around lines 15-70)
5. Modify the "value" field for each cost parameter
6. Click "Apply", "Done Editing", and "Save"

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

### No Data Showing

- **Check Permissions**: Ensure you have "Reader" role on subscriptions
- **Verify Arc Servers**: Confirm you have Arc-enabled servers in selected subscriptions
- **API Permissions**: The workbook uses Azure Resource Graph - ensure it's available

### Query Timeout

- **Too Many Subscriptions**: Try filtering to specific subscriptions
- **Large Environments**: Workbooks have timeout limits (~2 minutes)
- **Solution**: Break into multiple workbooks by subscription or region

### Missing Servers

- **Subscription Filter**: Check that the right subscriptions are selected
- **Resource Types**: Ensure servers are type `microsoft.hybridcompute/machines`
- **Extensions**: Some detection relies on extension installation

## Differences from Static Web App

| Feature | Static Web App | Azure Workbook |
|---------|---------------|----------------|
| Custom Costs | ✅ Modal UI | ✅ Parameters |
| Expandable Rows | ✅ Beautiful UI | ✅ Tab navigation |
| Modal Details | ✅ Rich modals | ✅ Detail tabs |
| Authentication | MSAL.js | Azure Portal auth |
| Hosting | Static Web Apps | Native Portal |
| Sharing | URL | Portal permissions |
| Customization | Full control | KQL + Parameters |
| Cost | Free tier | Free |

## Support

- **Workbook Documentation**: https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-overview
- **KQL Reference**: https://learn.microsoft.com/azure/data-explorer/kusto/query/
- **Resource Graph**: https://learn.microsoft.com/azure/governance/resource-graph/

## Files

- `arc-benefits-workbook.json` - The workbook template
- `workbook-deployment.json` - ARM template for deployment
- `Deploy-Workbook.ps1` - PowerShell deployment script
- `README.md` - This file
