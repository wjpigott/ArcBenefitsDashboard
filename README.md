# Azure Arc Benefits Dashboard

Track and maximize your Azure Arc-enabled server and SQL Server Arc benefits with comprehensive visibility into configured services and potential cost savings.

## 🚀 Quick Start - Azure Workbook (Recommended)

The **Azure Workbook** is the easiest and most powerful way to deploy this dashboard. It provides a native Azure Portal experience with real-time data and requires no hosting or authentication setup.

### Why Choose the Workbook?

✅ **Zero Infrastructure** - No hosting, no servers, no web apps  
✅ **Native Portal Experience** - Integrated directly into Azure Monitor  
✅ **Real-Time Data** - Live queries against Azure Resource Graph  
✅ **Built-in Security** - Uses Azure Portal authentication  
✅ **Rich Features** - Windows Arc + SQL Server Arc tracking, cost analysis toggle, collapsible notes  
✅ **Easy Deployment** - Import JSON file in 2 minutes  

**📋 Get started with the workbook:** [workbook/README.md](workbook/README.md)
<img width="1495" height="773" alt="image" src="https://github.com/user-attachments/assets/b5b1c489-3c57-476d-88ab-f0ef68a41e8a" />

---

## 📊 Alternative: Static Web App

If you prefer a standalone web application with custom branding and offline capabilities, you can deploy the static web app version.

### When to Use the Web App:
- Need custom branding or styling
- Want offline/localhost development
- Prefer traditional web hosting over Azure Portal
- Need localStorage persistence for user settings

**📋 See web app deployment guide:** [webapp/README.md](webapp/README.md)

<img width="1033" height="834" alt="image" src="https://github.com/user-attachments/assets/25c04036-5452-4c20-bb18-51cb807214fe" />

---

## 🎯 Purpose

Many organizations with Azure Arc don't fully utilize all the capabilities they're paying for. This dashboard helps:

- **Visualize** all available Arc benefits in one place (Windows + SQL Server)
- **Identify** unconfigured capabilities that could save money or improve operations
- **Track** which services are actively configured across your environment
- **Calculate** potential labor cost savings from unused capabilities
- **Monitor** compliance and best practices adoption

## ✨ Key Features

### Workbook Features (v2.0)
- **Windows Arc Capabilities** - 10 services (Update Manager, Defender, Monitoring, etc.)
- **SQL Server Arc Capabilities** - 4 services (Defender for Cloud, BPA, Performance, Inventory)
- **Friendly OS Names** - Display "Windows Server 2025" instead of "10.0.26100" across all service tabs
- **SQL Host Type Detection** - Automatically determines Virtual Machine vs Physical Machine infrastructure
- **Accurate Tag Counting** - Fixed tag count display in Resource Tagging view
- **Cost Analysis Toggle** - Show/hide cost calculations and PotentialSavings column
- **Radio Button Navigation** - Clean switching between Windows and SQL views
- **Collapsible Notes** - Detailed benefit descriptions collapsed by default
- **Real-time Queries** - Live data from Azure Resource Graph with security assessments
- **Export to Excel** - All tables (summary and detail views) support Excel export

### Web App Features
- **Interactive Dashboard** - Visual cards with status indicators
- **Filtering** - By category, status, and benefit type
- **Custom Branding** - Full control over styling and layout
- **localStorage** - Persistent user settings
- **Offline Support** - Works without internet connection


### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari)
- **Azure CLI** - Required for automated setup script
  - Download: https://aka.ms/installazurecliwindows (Windows)
  - Download: https://docs.microsoft.com/cli/azure/install-azure-cli (Mac/Linux)
- Azure AD App Registration (created automatically by setup script, or manually)
- Reader role on Azure subscriptions you want to query (assigned after app creation)

### Quick Setup with Azure

#### Option 1: Automated Setup (Recommended)## 📁 Repository Structure

```
ArcBenefitsDashboard/
├── README.md                  # This file - project overview
├── workbook/                  # Azure Workbook (Recommended)
│   ├── arc-benefits-workbook.json              # Primary workbook (v2 with SQL Arc)
│   ├── arc-benefits-workbook-v1-archive.json   # Original Windows Arc only version
│   ├── Deploy-Workbook.ps1                     # Azure CLI deployment script
│   ├── Deploy-Workbook-AzPowerShell.ps1       # Azure PowerShell deployment script
│   └── README.md                               # Complete workbook documentation
├── webapp/                    # Static Web App (Alternative)
│   ├── index.html            # Main dashboard HTML
│   ├── assets/               # JS and CSS files
│   ├── data/                 # Benefits definitions
│   ├── Setup-AzureApp.ps1    # Azure AD app setup
│   ├── Grant-ReaderRole.ps1  # Subscription permissions
│   ├── Start-Server.ps1      # Local development server
│   ├── AZURE_SETUP.md        # Azure AD setup guide
│   ├── AZURE_DEPLOYMENT.md   # Deployment instructions
│   ├── DEPLOYMENT_GUIDE.md   # Complete setup guide
│   └── README.md             # Web app documentation (coming soon)
└── infrastructure/            # Infrastructure as Code
    ├── main.bicep            # Bicep template for Azure resources
    ├── main.parameters.json  # Deployment parameters
    ├── Deploy-Infrastructure.ps1  # Deployment automation
    └── README.md             # IaC deployment guide
```

## 🎓 Learning Resources

- [Azure Arc-enabled servers](https://learn.microsoft.com/azure/azure-arc/servers/overview)
- [SQL Server enabled by Azure Arc](https://learn.microsoft.com/sql/sql-server/azure-arc/overview)
- [Azure Resource Graph](https://learn.microsoft.com/azure/governance/resource-graph/)
- [Azure Workbooks](https://learn.microsoft.com/azure/azure-monitor/visualize/workbooks-overview)
- [Azure Update Manager](https://learn.microsoft.com/azure/update-manager/overview)
- [Microsoft Defender for Cloud](https://learn.microsoft.com/azure/defender-for-cloud/)

## 🤝 Contributing

This project is designed to be customized and extended. Feel free to:
- Modify the workbook queries to track additional capabilities
- Enhance the web app UI with custom branding
- Add new deployment options or integration points
- Share your improvements via pull requests

## 📞 Support

- **Azure Arc Questions**: [Azure Arc documentation](https://learn.microsoft.com/azure/azure-arc/)
- **Workbook Issues**: See [workbook/README.md](workbook/README.md)
- **Web App Issues**: See [webapp/README.md](webapp/README.md)
- **General Questions**: Open an issue in this repository

---

**Version**: 2.0.2  
**Last Updated**: February 2026  
**Repository**: [github.com/wjpigott/ArcBenefitsDashboard](https://github.com/wjpigott/ArcBenefitsDashboard)

---

<small>

## Disclaimer

Sample code and proofs of concept are provided for the purpose of illustration only and are not intended to be used in a production environment.

THE SAMPLE CODE AND PROOFS OF CONCEPT ARE PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A PARTICULAR PURPOSE. We grant you a nonexclusive, royalty-free right to use and modify the sample code and to reproduce and distribute the object code form of the sample code, provided that you agree: (i) to not use Microsoft's name, logo, or trademarks to market your software product in which the sample code is embedded; (ii) to include a valid copyright notice on your software product in which the sample code is embedded; (iii) to provide on behalf of and for the benefit of your subcontractors a disclaimer of warranties, exclusion of liability for indirect and consequential damages and a reasonable limitation of liability; and (iv) to indemnify, hold harmless, and defend Microsoft, its affiliates and suppliers from and against any third party claims or lawsuits, including attorneys' fees, that arise or result from the use or distribution of the sample code.

</small>
