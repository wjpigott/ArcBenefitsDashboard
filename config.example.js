// Azure Configuration Template
// Copy this file to config.js and fill in your Azure AD App Registration details

window.AZURE_CONFIG = {
    // Azure AD App Registration Client ID
    // Get this from Azure Portal > App Registrations > Your App > Overview
    CLIENT_ID: '',
    
    // Azure AD Tenant ID (Directory ID)
    // Get this from Azure Portal > Azure Active Directory > Overview
    // Use 'common' for multi-tenant, or your specific tenant ID for single-tenant
    TENANT_ID: '',
    
    // Set to true to skip the configuration modal and go straight to sign-in
    // Set to false to show the configuration modal where users can enter their own values
    AUTO_INIT: false
};

// Instructions for setup:
// 1. Create an Azure AD App Registration (single-tenant recommended)
// 2. Set Redirect URI to match where you host this app (e.g., http://localhost:8080/)
// 3. Grant API permissions:
//    - Microsoft Graph: User.Read, Directory.Read.All
//    - Azure Service Management: user_impersonation
// 4. Assign the app "Reader" role on Azure subscriptions you want to query
// 5. Copy this file to config.js and fill in CLIENT_ID and TENANT_ID
// 6. Set AUTO_INIT to true if you want automatic login, false for manual configuration
