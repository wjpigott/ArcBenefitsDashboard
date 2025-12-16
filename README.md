# Arc Software Assurance Benefits Dashboard

A simple, interactive dashboard to help organizations track and maximize their Windows Software Assurance benefits. This tool visualizes available benefits, identifies unused opportunities, and calculates potential savings.

## 🎯 Purpose

Many organizations with Software Assurance (SA) subscriptions don't fully utilize all the benefits they're paying for. This dashboard helps:

- **Visualize** all available SA benefits in one place
- **Identify** unused benefits that could save money or improve operations
- **Track** which benefits are actively being used
- **Calculate** potential cost savings from unused benefits
- **Discover** free benefits included with SA that many organizations overlook

## ✨ Features

### Dashboard Overview
- **Real-time Statistics**: See total benefits, unused benefits, active benefits, and potential savings at a glance
- **Visual Indicators**: Color-coded cards show benefit status (active/unused) and type (free/paid)
- **Filtering**: Filter benefits by category (security, deployment, free benefits) and status (active/unused)

### Benefit Categories
- **Security & Compliance**: Security updates and compliance features for Arc-enabled servers
- **Deployment & Management**: Deployment tools and management capabilities
- **Free Benefits**: Benefits included at no additional cost

### Interactive Features
- **Toggle Benefits**: Mark benefits as active or inactive
- **Recommendations**: Get personalized suggestions for high-value unused benefits
- **Export Reports**: Generate JSON reports of your current benefit usage
- **Detailed Views**: View comprehensive information about each benefit

## 🚀 Getting Started

### Deployment Options

**Choose your deployment method:**

1. **Local Development** (Quick start, localhost)
   - Follow the setup instructions below
   - Perfect for testing and development
   - Runs on http://localhost:8080/

2. **Azure Static Web Apps** (Cloud hosting, production-ready)
   - 🌐 Deploy to Azure for team-wide access
   - 🔄 Automatic CI/CD from GitHub
   - 💰 Free tier available
   - 🔒 HTTPS and custom domains included
   - 📋 **See [infrastructure/README.md](infrastructure/README.md) for complete step-by-step deployment guide**

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari)
- **Azure CLI** - Required for automated setup script
  - Download: https://aka.ms/installazurecliwindows (Windows)
  - Download: https://docs.microsoft.com/cli/azure/install-azure-cli (Mac/Linux)
- Azure AD App Registration (created automatically by setup script, or manually)
- Reader role on Azure subscriptions you want to query (assigned after app creation)

### Quick Setup with Azure

#### Option 1: Automated Setup (Recommended)

**Prerequisites:** Azure CLI must be installed first
- Windows: https://aka.ms/installazurecliwindows
- Mac/Linux: https://docs.microsoft.com/cli/azure/install-azure-cli

Use the provided PowerShell script to automatically configure your Azure AD app registration:

```powershell
# Run the setup script
.\Setup-AzureApp.ps1

# Or with custom app name and redirect URI
.\Setup-AzureApp.ps1 -AppName "My-Arc-Dashboard" -RedirectUri "https://yourdomain.com/"

# Or update an existing app
.\Setup-AzureApp.ps1 -UseExistingApp -ExistingAppId "your-app-id-here"
```

The script will:
1. ✅ Create or update an Azure AD app registration
2. ✅ Configure the redirect URI (for local development and/or Azure Static Web Apps)
3. ✅ Add required API permissions:
   - Microsoft Graph: `User.Read`, `Directory.Read.All`
   - Azure Service Management: `user_impersonation`
4. ✅ Attempt to grant admin consent (if you have permissions)
5. ✅ Generate `config.js` with your Client ID and Tenant ID
6. ✅ Display your credentials for deployment

**After running the script:**
- For local testing: Use `.\Start-Server.ps1` 
- For Azure deployment: Update `config.js` if needed, then deploy using instructions in `infrastructure/README.md`
- **Note**: The script creates `config.js` locally - this file is now committed to the repo for easier deployment

#### Option 2: Manual Setup

If you prefer to set up the Azure AD app manually:

1. **Create an Azure AD App Registration**
   - Go to [Azure Portal](https://portal.azure.com) → Azure Active Directory → App Registrations
   - Click "New registration"
   - Name: "Arc-Benefits-Dashboard" (or your preferred name)
   - Supported account types: "Accounts in this organizational directory only"
   - Redirect URI: Web → `http://localhost:8080/` (or your hosting URL)

2. **Configure API Permissions**
   - In your app registration, go to "API permissions"
   - Add these delegated permissions:
     - **Microsoft Graph**:
       - `User.Read` - Sign in and read user profile
       - `Directory.Read.All` - Read directory data
     - **Azure Service Management**:
       - `user_impersonation` - Access Azure Resource Manager
   - Click "Grant admin consent" (requires admin privileges)
   
   **Note:** If you don't have admin privileges, you may need to use Azure AD Privileged Identity Management (PIM) to elevate your access temporarily to grant consent. Navigate to the API permissions page and click "Grant admin consent for [Your Organization]".

   <img width="2590" height="1397" alt="image" src="https://github.com/user-attachments/assets/2f29872b-365e-4527-92c7-e149d980c0ec" />


4. **Note your credentials**
   - Copy the "Application (client) ID" from the Overview page
   - Copy the "Directory (tenant) ID" from the Overview page

### Step 3: Grant Reader Role on Subscriptions

After creating your Azure AD app, you need to grant it Reader permissions on your Azure subscriptions so it can query Arc-enabled servers.

#### Option A: Automated Script (Recommended)

Use the provided PowerShell script to grant Reader role on all or selected subscriptions:

```powershell
# Grant on ALL subscriptions you have access to
.\Grant-ReaderRole.ps1 -AllSubscriptions

# Interactive mode - select specific subscriptions
.\Grant-ReaderRole.ps1

# Grant on a specific subscription
.\Grant-ReaderRole.ps1 -SubscriptionId "12345678-1234-1234-1234-123456789012"
```

The script will:
- ✅ Read your App ID from `config.js` (or prompt for it)
- ✅ Create a service principal if needed
- ✅ Show all your enabled subscriptions
- ✅ Let you select which subscriptions to grant access to
- ✅ Skip subscriptions that already have the role assigned
- ✅ Provide a summary of successful and failed assignments

**For organizations with many subscriptions (100+)**, use `-AllSubscriptions` to automate the process.

#### Option B: Manual Assignment

If you prefer to assign roles manually:

1. Go to [Azure Portal](https://portal.azure.com) → Subscriptions
2. Select a subscription
3. Click "Access control (IAM)"
4. Click "Add" → "Add role assignment"
5. Select "Reader" role
6. Search for your app registration by name
7. Click "Save"
8. Repeat for each subscription

**Note:** The Reader role is read-only and allows the app to query Arc server inventory without making any changes.

### Installation

1. **Clone or download** this repository to your local machine
   ```bash
   git clone https://github.com/wjpigott/ArcBenefitsDashboard.git
   cd ArcBenefitsDashboard
   ```

2. **Configure Azure AD credentials**
   
   **Option A: Using Setup-AzureApp.ps1 (Automated)**
   ```powershell
   # This creates Azure AD app AND generates config.js
   .\Setup-AzureApp.ps1
   ```
   The script automatically creates `config.js` with your credentials. Done! ✅

   **Option B: Manual Configuration**
   ```bash
   # Copy the example config file
   cp config.example.js config.js
   ```
   
   Then edit `config.js` with your Azure AD app details:
   ```javascript
   window.AZURE_CONFIG = {
       CLIENT_ID: 'your-client-id-here',
       TENANT_ID: 'your-tenant-id-here',
       AUTO_INIT: true
   };
   ```

3. **Start a local web server**
   ```powershell
   # Using Python (if installed)
   python -m http.server 8080
   
   # Or using PowerShell (included Start-Server.ps1)
   .\Start-Server.ps1
   
   # Or using Node.js http-server
   npx http-server -p 8080
   ```

5. **Open your browser** to `http://localhost:8080/`

6. **Sign in** with your Azure AD credentials

That's it! The dashboard will connect to your Azure tenant and display live Arc server data.

### Project Structure
```
sa-benefits-dashboard/
├── index.html              # Main dashboard page
├── config.example.js       # Azure configuration template
├── config.js               # Your Azure credentials (not in git)
├── Setup-AzureApp.ps1      # Automated Azure AD app setup script
├── assets/
│   ├── app.js             # Dashboard functionality
│   ├── azure-auth.js      # Azure authentication & data queries
│   └── styles.css         # Dashboard styling
├── data/
│   └── benefits.json      # Benefits definitions
└── README.md              # This file
```

## 📊 Customizing Your Data

The dashboard connects to live Azure data by default, but you can customize the cost values and benefit definitions.

### Customize Cost Values

1. Click on the **Potential Savings** card in the dashboard
2. Click **⚙️ Customize Cost Values** button at the bottom of the modal
3. Adjust the per-server annual cost for each service:
   - Update Manager: Default $400/server/year
   - Defender for Cloud: Default $450/server/year
   - Guest Configuration: Default $350/server/year
   - And more...
4. Click **Save Custom Costs** - values are stored in browser localStorage

### Customize Benefits Definitions

To modify the benefits tracked by the dashboard:

### Customize Benefits Definitions

To modify the benefits tracked by the dashboard:

1. **Edit** `data/benefits.json`
2. **Add, modify, or remove** benefits based on your requirements
3. **Update** service names and descriptions
4. **Refresh** the dashboard to see your changes

Note: The dashboard queries live Azure Arc server data, so configured/unconfigured status is determined automatically.

### Data Format
Each benefit in `benefits.json` follows this structure:

```json
{
  "id": "unique-id",
  "name": "Benefit Name",
  "description": "Brief description",
  "category": "free|training|deployment|security",
  "isFree": true|false,
  "isActive": true|false,
  "estimatedValue": 5000,
  "details": "Detailed information",
  "activationSteps": "How to activate this benefit"
}
```

## 💡 Use Cases

### For IT Leadership
- Identify cost-saving opportunities
- Justify SA renewal decisions
- Plan training and support strategies
- Present ROI to stakeholders

### For IT Operations
- Discover deployment rights that could simplify infrastructure
- Find free tools and services already available
- Plan migration strategies using SA benefits

### For Compliance Teams
- Track security update coverage
- Document disaster recovery capabilities
- Ensure proper license utilization

## 🔄 Iteration Plan

This is a starter kit designed to grow with your needs. Future enhancements could include:

### Phase 2 - Data Integration
- [ ] Connect to Microsoft Volume Licensing Service Center API
- [ ] Automatic benefit eligibility checking
- [ ] Real-time license inventory

### Phase 3 - Advanced Analytics
- [ ] Historical usage tracking
- [ ] ROI calculations and trending
- [ ] Predictive recommendations

### Phase 4 - Collaboration
- [ ] Multi-user support
- [ ] Approval workflows for benefit activation
- [ ] Notification system for expiring benefits

### Phase 5 - Reporting
- [ ] PDF report generation
- [ ] Executive dashboards
- [ ] Integration with Power BI

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: MSAL.js 2.x for Azure authentication
- **Azure Resource Graph**: KQL queries for Arc server data
- **JSON**: Benefits definitions and data storage

### Azure Integration
- **MSAL.js 2.38.1**: Browser-based Azure AD authentication
- **Azure Resource Graph API**: Queries Arc-enabled servers across subscriptions
- **KQL Queries**: Analyzes extensions, configurations, and compliance
- **Real-time Data**: Live status for Update Manager, Defender, Guest Config, etc.

### Browser Compatibility
- Chrome/Edge (latest) - Recommended
- Firefox (latest)
- Safari (latest)
- IE11 not supported

### Performance
- Lightweight: < 150KB total (excluding Azure libraries)
- Fast loading with CDN-hosted MSAL library
- Efficient KQL queries with proper filtering

## 🔧 Troubleshooting

### Authentication Issues

**Problem**: "Failed to initialize authentication"
- **Solution**: Verify `config.js` has correct `CLIENT_ID` and `TENANT_ID`
- **Solution**: Check redirect URI matches your hosting URL exactly
- **Solution**: Ensure you're accessing via the configured redirect URI (e.g., `http://localhost:8080/`)

**Problem**: "Consent required" or permission errors
- **Solution**: Admin must grant consent in Azure Portal → App Registration → API Permissions
- **Solution**: Or run: `az ad app permission admin-consent --id <your-app-id>`
- **Solution**: If you don't have admin privileges, use Azure AD Privileged Identity Management (PIM) to temporarily elevate your access:
  1. Go to Azure Portal → Azure AD Privileged Identity Management
  2. Activate the required admin role (e.g., Cloud Application Administrator or Global Administrator)
  3. Navigate to App Registrations → Your App → API Permissions
  4. Click "Grant admin consent for [Your Organization]"
  5. Verify all permissions show "Granted for [Your Organization]" in the Status column

### Data Not Loading

**Problem**: "No Arc servers found" but you have Arc servers
- **Solution**: Ensure the app has "Reader" role on your subscriptions
- **Solution**: Check subscription filter - try selecting specific subscriptions
- **Solution**: Verify Arc servers are in selected subscriptions

**Problem**: Benefits showing 0 configured when servers are configured
- **Solution**: Check Azure Resource Graph permissions (Directory.Read.All)
- **Solution**: Verify extensions are properly installed on Arc servers
- **Solution**: Click Refresh Data icon to reload

### Script Execution Issues

**Problem**: PowerShell script won't run
- **Solution**: Run PowerShell as Administrator
- **Solution**: Set execution policy: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- **Solution**: Ensure Azure CLI is installed: `az --version`

**Problem**: Azure CLI authentication fails
- **Solution**: Run `az login` manually first
- **Solution**: Clear Azure CLI cache: `az account clear`
- **Solution**: Try `az login --use-device-code` for MFA accounts

## 🤝 Contributing

This is a starter project designed to be customized. Feel free to:
- Modify the UI to match your organization's branding
- Add new benefit categories
- Integrate with your existing systems
- Enhance the recommendation engine

## 📝 Sample Benefits Included

The dashboard tracks 11 Azure Arc-enabled server capabilities:

**Security & Compliance:**
- Update Manager (Patch Management)
- Microsoft Defender for Cloud
- Guest Configuration (Compliance)
- Best Practice Assessment
- Resource Tagging

**Deployment & Management:**
- Inventory & Change Tracking
- Monitoring & Insights (Azure Monitor)
- Automated Machine Configuration
- Windows Admin Center Extension
- Hotpatching (Windows Server 2025)

All benefits show:
- Number of servers configured vs. not configured
- Percentage completion status
- Estimated annual savings for unconfigured servers
- Detailed server-by-server breakdown
- Subscription information per server

## 📞 Support

For questions about:
- **Azure Arc**: Visit [Azure Arc documentation](https://learn.microsoft.com/azure/azure-arc/)
- **This dashboard**: Open an issue in the GitHub repository
- **Azure AD setup**: Contact your Azure administrator

## 🎓 Learning Resources

- [Azure Arc-enabled servers](https://learn.microsoft.com/azure/azure-arc/servers/overview)
- [Azure Resource Graph](https://learn.microsoft.com/azure/governance/resource-graph/)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure Update Manager](https://learn.microsoft.com/azure/update-manager/overview)
- [Microsoft Defender for Cloud](https://learn.microsoft.com/azure/defender-for-cloud/)

## 🔐 Security Notes

- The app uses delegated permissions - users can only see data they have access to
- Authentication tokens are stored in browser localStorage
- Recommend using single-tenant app registration for production
- For production deployments, each organization should create their own Azure AD app
- Update `config.js` with your own Client ID and Tenant ID after running `Setup-AzureApp.ps1`

## 📦 Repository Structure

```
ArcBenefitsDashboard/
├── index.html                  # Main dashboard HTML
├── assets/
│   ├── app.js                 # Dashboard logic and Azure integration
│   ├── azure-auth.js          # Azure AD authentication
│   └── styles.css             # Dashboard styling
├── config.js                  # Azure AD app configuration (update with your IDs)
├── config.example.js          # Template for config.js
├── Setup-AzureApp.ps1         # Automated Azure AD setup script
├── Start-Server.ps1           # Local web server for testing
├── infrastructure/            # Infrastructure as Code for Azure deployment
│   ├── main.bicep            # Bicep template for Static Web App
│   ├── main.parameters.json  # Deployment parameters
│   ├── Deploy-Infrastructure.ps1  # Deployment automation script
│   └── README.md             # Complete IaC deployment guide
├── .github/workflows/         # GitHub Actions for CI/CD
│   └── azure-static-web-apps.yml
└── generate-config.js         # Config generation script (optional)
```

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Live Demo**: https://mango-bush-0a0ab4f0f.3.azurestaticapps.net
**Built for**: Microsoft Arc Teams
