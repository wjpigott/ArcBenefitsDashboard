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
- **Filtering**: Filter benefits by category (free items, training, deployment, security) and status (active/unused)

### Benefit Categories
- **Free Items**: Benefits included at no additional cost with SA
- **Training & Support**: Learning resources and technical support options
- **Deployment Rights**: Licensing flexibility and deployment capabilities
- **Security & Compliance**: Security updates and compliance features

### Interactive Features
- **Toggle Benefits**: Mark benefits as active or inactive
- **Recommendations**: Get personalized suggestions for high-value unused benefits
- **Export Reports**: Generate JSON reports of your current benefit usage
- **Detailed Views**: View comprehensive information about each benefit

### Free Benefits Sidebar
A dedicated section highlighting free benefits that many organizations don't realize they have access to, including:
- Windows 365 Cloud PC Access
- Azure Hybrid Benefit
- Extended Security Updates (ESU)
- Home Use Program
- Disaster Recovery Rights
- Windows Autopatch
- And more!

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari)
- Azure AD App Registration (for live Azure data)
- Azure CLI (for automated setup script)
- Reader role on Azure subscriptions you want to query

### Quick Setup with Azure

#### Option 1: Automated Setup (Recommended)

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
2. ✅ Configure the redirect URI
3. ✅ Add required API permissions:
   - Microsoft Graph: `User.Read`, `Directory.Read.All`
   - Azure Service Management: `user_impersonation`
4. ✅ Attempt to grant admin consent (if you have permissions)
5. ✅ Provide you with Client ID and Tenant ID values

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

3. **Note your credentials**
   - Copy the "Application (client) ID" from the Overview page
   - Copy the "Directory (tenant) ID" from the Overview page

4. **Assign Azure RBAC Role**
   - Go to your Azure Subscriptions
   - Select "Access control (IAM)"
   - Add role assignment: "Reader" role to your app registration
   - This allows the app to query Arc server data

### Installation

1. **Clone or download** this repository to your local machine
   ```bash
   git clone https://github.com/wjpigott/ArcBenefitsDashboard.git
   cd ArcBenefitsDashboard
   ```

2. **Configure Azure credentials**
   ```bash
   # Copy the example config file
   cp config.example.js config.js
   ```

3. **Edit `config.js`** with your Azure AD app details:
   ```javascript
   const AZURE_CONFIG = {
       CLIENT_ID: 'your-client-id-here',
       TENANT_ID: 'your-tenant-id-here',
       AUTO_INIT: true
   };
   ```

4. **Start a local web server**
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

- `config.js` containing your Azure credentials is excluded from git via `.gitignore`
- Never commit `config.js` to version control
- Use `config.example.js` as a template for others
- The app uses delegated permissions - users can only see data they have access to
- Authentication tokens are stored in browser localStorage
- Recommend using single-tenant app registration for production

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Built for**: Microsoft Arc Teams
