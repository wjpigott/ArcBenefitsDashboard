# Azure Setup Guide

This guide will help you configure Azure AD authentication so the dashboard can connect to your Azure subscriptions and pull live data.

## Prerequisites

- An Azure subscription with appropriate permissions
- Azure AD Global Administrator or Application Administrator role (for app registration)
- Access to Azure Portal

## Step-by-Step Setup

### Step 1: Register an Azure AD Application

1. **Sign in to Azure Portal**
   - Go to [https://portal.azure.com](https://portal.azure.com)
   - Sign in with your organizational account

2. **Navigate to Azure Active Directory**
   - In the left sidebar, click "Azure Active Directory"
   - Or use the search bar to find "Azure Active Directory"

3. **Register a New Application**
   - Click "App registrations" in the left menu
   - Click "+ New registration" at the top
   
4. **Configure Registration**
   - **Name**: `Arc SA Benefits Dashboard` (or any name you prefer)
   - **Supported account types**: Select one of:
     - "Accounts in this organizational directory only" (Single tenant - recommended)
     - "Accounts in any organizational directory" (Multi-tenant)
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: Copy the URL shown in the dashboard config modal
       - Example: `file:///c:/repos/Arc/sa-benefits-dashboard/index.html`
       - Or: `http://localhost:8080/` (if you're using a local web server)
   - Click "Register"

### Step 2: Copy the Application (Client) ID

1. On the app registration overview page, you'll see:
   - **Application (client) ID** - This is what you need!
   - **Directory (tenant) ID**
   - **Object ID**

2. **Copy the Application (client) ID**
   - It looks like: `12345678-1234-1234-1234-123456789abc`
   - Click the copy icon next to it

3. **Save this ID** - you'll paste it into the dashboard

### Step 3: Configure API Permissions

1. In your app registration, click "API permissions" in the left menu

2. **Add Microsoft Graph Permissions**
   - Click "+ Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add these permissions:
     - `User.Read` (should already be there)
     - `Directory.Read.All`
   - Click "Add permissions"

3. **Add Azure Management Permissions**
   - Click "+ Add a permission" again
   - Select "APIs my organization uses"
   - Search for "Azure Service Management"
   - Select "Azure Service Management"
   - Select "Delegated permissions"
   - Check `user_impersonation`
   - Click "Add permissions"

4. **Grant Admin Consent** (Optional but recommended)
   - Click "Grant admin consent for [Your Organization]"
   - Click "Yes" to confirm
   - This prevents users from seeing a consent prompt

### Step 4: Configure Authentication

1. In your app registration, click "Authentication" in the left menu

2. **Verify Redirect URIs**
   - Ensure your redirect URI is listed under "Single-page application"
   - If using a file:// URL, make sure it matches exactly
   - If hosting on a web server, use http://localhost:PORT or your domain

3. **Implicit grant and hybrid flows** (Should be off by default)
   - Leave both checkboxes unchecked (modern MSAL doesn't need these)

4. **Allow public client flows**
   - Set to "No" (default)

5. Click "Save"

### Step 5: Configure the Dashboard

1. **Open the Dashboard**
   - Open `index.html` in your browser

2. **Click "Connect to Azure"**
   - A configuration modal will appear

3. **Paste Your Client ID**
   - Paste the Application (client) ID you copied in Step 2
   - Click "Save & Connect"

4. **Sign In**
   - Click "Connect to Azure" again
   - A popup will appear asking you to sign in
   - Sign in with your Azure credentials
   - If you didn't grant admin consent, you'll need to consent to the permissions

5. **Select Data Source**
   - Toggle to "Live Azure Data"
   - The dashboard will load data from your subscriptions

## Permissions Summary

The dashboard requests these permissions:

| Permission | API | Purpose |
|------------|-----|---------|
| `User.Read` | Microsoft Graph | Read your profile information |
| `Directory.Read.All` | Microsoft Graph | Read license information from your tenant |
| `user_impersonation` | Azure Service Management | Access Azure subscriptions and resources |

## Troubleshooting

### Issue: "Failed to sign in"
- **Solution**: Verify the Client ID is correct
- **Solution**: Check that redirect URI in Azure AD matches the dashboard URL exactly

### Issue: "Consent required"
- **Solution**: Have an admin grant consent in Azure AD
- **Or**: Each user can consent individually when signing in

### Issue: "No subscriptions found"
- **Solution**: Ensure your account has access to at least one Azure subscription
- **Solution**: Check that you have Reader role or higher on the subscription

### Issue: "Failed to fetch VMs"
- **Solution**: Ensure you have permissions to read resources in the subscription
- **Solution**: The subscription might not have any VMs deployed

### Issue: Using file:// protocol
- **Note**: Some browsers have restrictions with file:// URLs
- **Solution**: Use a local web server instead:
  ```powershell
  # Using Python
  python -m http.server 8080
  
  # Using Node.js (if you have http-server installed)
  npx http-server -p 8080
  
  # Then open: http://localhost:8080
  ```

## Security Notes

- The Client ID is not sensitive and can be shared
- No client secret is required for a SPA application
- Tokens are stored in the browser's localStorage
- Sign out clears all tokens from the browser

## Alternative: Using Azure CLI for Testing

If you want to test Azure connectivity without setting up app registration:

```powershell
# Install Azure CLI if not already installed
# https://aka.ms/installazurecli

# Sign in
az login

# List subscriptions
az account list --output table

# Get VMs with AHB
az vm list --query "[?licenseType=='Windows_Server' || licenseType=='Windows_Client']" --output table
```

## Next Steps

Once connected, the dashboard will:
- ✅ Show all your Azure subscriptions
- ✅ Display VMs using Azure Hybrid Benefit
- ✅ Show Windows 365 Cloud PCs (if any)
- ✅ Display license information from Microsoft 365
- ✅ Calculate potential savings from unused benefits

## Support

For more information:
- [Azure AD App Registration Docs](https://docs.microsoft.com/azure/active-directory/develop/quickstart-register-app)
- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure Hybrid Benefit](https://azure.microsoft.com/pricing/hybrid-benefit/)
