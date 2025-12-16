// Azure Static Web App - Infrastructure as Code (Bicep)
// Deploy Arc Benefits Dashboard to Azure Static Web Apps

@description('Name of the Static Web App')
param staticWebAppName string = 'arc-benefits-dashboard'

@description('Location for the Static Web App')
@allowed([
  'westus2'
  'eastus2'
  'westeurope'
  'centralus'
  'eastasia'
  'southeastasia'
])
param location string = 'eastus2'

@description('SKU for the Static Web App')
@allowed([
  'Free'
  'Standard'
])
param sku string = 'Free'

@description('GitHub repository URL')
param repositoryUrl string = 'https://github.com/wjpigott/ArcBenefitsDashboard'

@description('GitHub branch to deploy from')
param repositoryBranch string = 'main'

@description('GitHub Personal Access Token for deployment')
@secure()
param repositoryToken string

@description('Azure AD Client ID for the dashboard')
param azureClientId string = ''

@description('Azure AD Tenant ID')
param azureTenantId string = ''

@description('Tags to apply to resources')
param tags object = {
  Environment: 'Production'
  Application: 'Arc-Benefits-Dashboard'
  ManagedBy: 'Bicep-IaC'
}

// Static Web App Resource
resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: tags
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    repositoryUrl: repositoryUrl
    branch: repositoryBranch
    repositoryToken: repositoryToken
    buildProperties: {
      appLocation: '/'
      apiLocation: ''
      outputLocation: '/'
    }
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
    provider: 'GitHub'
  }
}

// Application Settings (Optional - for pre-configured deployment)
resource staticWebAppSettings 'Microsoft.Web/staticSites/config@2023-01-01' = if (!empty(azureClientId) && !empty(azureTenantId)) {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    AZURE_CLIENT_ID: azureClientId
    AZURE_TENANT_ID: azureTenantId
  }
}

// Outputs
@description('Default hostname of the Static Web App')
output defaultHostname string = staticWebApp.properties.defaultHostname

@description('Static Web App Resource ID')
output staticWebAppId string = staticWebApp.id

@description('Static Web App URL')
output appUrl string = 'https://${staticWebApp.properties.defaultHostname}'

@description('Deployment token for GitHub Actions (use carefully)')
output deploymentToken string = staticWebApp.listSecrets().properties.apiKey
