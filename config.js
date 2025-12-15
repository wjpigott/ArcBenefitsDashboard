// Azure Configuration
// Set these values to enable direct user login without manual configuration

const AZURE_CONFIG = {
    // Set CLIENT_ID and TENANT_ID for production deployment
    // Leave empty for demo/development mode where users enter their own
    CLIENT_ID: 'b4dbada1-2d7c-417e-bb3d-11996b0fb037',
    TENANT_ID: '7da854e2-6115-4de1-bf5a-9e7af4fc3c98',
    
    // Set to true to skip the configuration modal and go straight to sign-in
    AUTO_INIT: true
};

// Instructions for production deployment:
// 1. Create an Azure AD App Registration (single-tenant)
// 2. Set Redirect URI: http://your-domain/ or http://localhost:8080/
// 3. Grant API permissions:
//    - Microsoft Graph: User.Read, Directory.Read.All
//    - Azure Service Management: user_impersonation
// 4. Assign the app "Reader" role on Azure subscriptions
// 5. Copy Application (client) ID and Directory (tenant) ID above
// 6. Set AUTO_INIT to true
