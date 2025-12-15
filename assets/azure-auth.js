// Azure Authentication and Data Service
// Handles Azure AD login and data retrieval

// Global function to get custom cost rates
function getCustomCostRates() {
    const defaultRates = {
        'arc-001': 400,
        'arc-002': 300,
        'arc-003': 350,
        'arc-004': 250,
        'arc-006': 200,
        'arc-007': 450,
        'arc-008': 275,
        'arc-009': 150,
        'arc-010': 125,
        'arc-011': 225
    };
    
    const customRates = localStorage.getItem('customCostRates');
    if (customRates) {
        try {
            return { ...defaultRates, ...JSON.parse(customRates) };
        } catch (e) {
            console.error('Failed to parse custom rates:', e);
            return defaultRates;
        }
    }
    return defaultRates;
}

class AzureService {
    constructor() {
        this.msalConfig = {
            auth: {
                clientId: '', // Will be set from config
                authority: '', // Will be set from config (tenant-specific or common)
                redirectUri: window.location.origin + window.location.pathname
            },
            cache: {
                cacheLocation: 'localStorage',
                storeAuthStateInCookie: false
            }
        };

        this.loginRequest = {
            scopes: [
                'User.Read',
                'Directory.Read.All',
                'https://management.azure.com/user_impersonation'
            ]
        };

        this.msalInstance = null;
        this.account = null;
    }

    // Initialize MSAL
    async initialize(clientId, tenantId = 'common') {
        if (!clientId) {
            throw new Error('Azure AD Client ID is required');
        }

        this.msalConfig.auth.clientId = clientId;
        this.msalConfig.auth.authority = `https://login.microsoftonline.com/${tenantId}`;
        
        console.log('Initializing with authority:', this.msalConfig.auth.authority);
        
        // Load MSAL library dynamically
        try {
            await this.loadMSAL();
            console.log('MSAL library loaded successfully');
        } catch (error) {
            console.error('Failed to load MSAL library:', error);
            throw new Error('Failed to load Microsoft Authentication Library. Check your internet connection.');
        }
        
        if (!window.msal) {
            throw new Error('MSAL library not available');
        }
        
        try {
            this.msalInstance = new msal.PublicClientApplication(this.msalConfig);
            await this.msalInstance.initialize();
            console.log('MSAL instance initialized');
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
            throw new Error('Failed to initialize authentication: ' + error.message);
        }
        
        // Handle redirect response
        const response = await this.msalInstance.handleRedirectPromise();
        if (response) {
            this.account = response.account;
        } else {
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                this.account = accounts[0];
            }
        }

        return this.isAuthenticated();
    }

    // Load MSAL library from CDN
    loadMSAL() {
        return new Promise((resolve, reject) => {
            if (window.msal) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://alcdn.msauth.net/browser/2.38.1/js/msal-browser.min.js';
            script.crossOrigin = 'anonymous';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.account !== null;
    }

    // Get current account info
    getAccount() {
        return this.account;
    }

    // Sign in
    async signIn() {
        if (!this.msalInstance) {
            throw new Error('Authentication not initialized. Please refresh the page and try again.');
        }
        
        try {
            console.log('Opening login popup...');
            const response = await this.msalInstance.loginPopup(this.loginRequest);
            this.account = response.account;
            console.log('Login successful:', this.account.username);
            return this.account;
        } catch (error) {
            console.error('Login failed:', error);
            if (error.errorCode === 'popup_window_error') {
                throw new Error('Popup was blocked. Please allow popups for this site and try again.');
            }
            throw error;
        }
    }

    // Sign out
    async signOut() {
        const logoutRequest = {
            account: this.account
        };
        await this.msalInstance.logoutPopup(logoutRequest);
        this.account = null;
    }

    // Get access token
    async getAccessToken(scopes) {
        const request = {
            scopes: scopes || this.loginRequest.scopes,
            account: this.account
        };

        try {
            const response = await this.msalInstance.acquireTokenSilent(request);
            return response.accessToken;
        } catch (error) {
            if (error instanceof msal.InteractionRequiredAuthError) {
                const response = await this.msalInstance.acquireTokenPopup(request);
                return response.accessToken;
            }
            throw error;
        }
    }

    // Get Azure subscriptions
    async getSubscriptions() {
        const token = await this.getAccessToken(['https://management.azure.com/user_impersonation']);
        
        const response = await fetch('https://management.azure.com/subscriptions?api-version=2020-01-01', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch subscriptions');
        }

        const data = await response.json();
        return data.value;
    }

    // Check Azure Hybrid Benefit usage
    async getAzureHybridBenefitUsage(subscriptionId) {
        const token = await this.getAccessToken(['https://management.azure.com/user_impersonation']);
        
        const response = await fetch(
            `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2023-03-01`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch VMs');
        }

        const data = await response.json();
        const vms = data.value || [];
        
        // Count VMs using Azure Hybrid Benefit
        const ahbVMs = vms.filter(vm => 
            vm.properties?.licenseType === 'Windows_Server' || 
            vm.properties?.licenseType === 'Windows_Client'
        );

        return {
            total: vms.length,
            usingAHB: ahbVMs.length,
            potentialSavings: (vms.length - ahbVMs.length) * 0.40 // Rough estimate
        };
    }

    // Get license information from Microsoft Graph
    async getLicenses() {
        const token = await this.getAccessToken(['Directory.Read.All']);
        
        const response = await fetch('https://graph.microsoft.com/v1.0/subscribedSkus', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch licenses');
        }

        const data = await response.json();
        return data.value;
    }

    // Get Windows 365 usage
    async getWindows365Usage() {
        try {
            const token = await this.getAccessToken(['Directory.Read.All']);
            const response = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/virtualEndpoint/cloudPCs', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return data.value || [];
            } else if (response.status === 403) {
                console.info('Windows 365 data requires CloudPC.Read.All permission - skipping');
            }
        } catch (error) {
            console.info('Windows 365 data not available - skipping');
        }
        
        return [];
    }

    // Query Azure Resource Graph
    async queryResourceGraph(query, subscriptions) {
        const token = await this.getAccessToken(['https://management.azure.com/user_impersonation']);
        
        const requestBody = {
            query: query,
            subscriptions: subscriptions || []
        };
        
        const response = await fetch(
            'https://management.azure.com/providers/Microsoft.ResourceGraph/resources?api-version=2021-03-01',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );
        
        if (!response.ok) {
            throw new Error('Failed to query Resource Graph');
        }
        
        const data = await response.json();
        return data.data || [];
    }

    // Get Arc-enabled servers and their configuration status
    async getArcServersStatus(subscriptionIds) {
        const query = `
            resources
            | where type == "microsoft.hybridcompute/machines"
            | extend 
                updateManagerEnabled = isnotnull(properties.osProfile.windowsConfiguration.patchSettings.assessmentMode) or isnotnull(properties.osProfile.linuxConfiguration.patchSettings.assessmentMode),
                monitoringEnabled = isnotnull(properties.extensions) and array_length(properties.extensions) > 0,
                guestConfigEnabled = tobool(properties.guestConfiguration.enabled),
                hasHotpatch = tobool(properties.osProfile.windowsConfiguration.patchSettings.enableHotpatching),
                osVersion = tostring(properties.osVersion),
                hasTags = isnotnull(tags) and tostring(tags) != "{}"
            | project 
                id,
                name,
                resourceGroup,
                location,
                osType = tostring(properties.osType),
                osVersion,
                status = tostring(properties.status),
                provisioningState = tostring(properties.provisioningState),
                updateManagerEnabled,
                monitoringEnabled,
                guestConfigEnabled,
                hasHotpatch,
                hasTags,
                tags,
                extensions = properties.extensions,
                lastSeenTime = properties.lastStatusChange
            | order by name asc
`;
        
        return await this.queryResourceGraph(query, subscriptionIds);
    }

    // Get extensions installed on Arc servers
    async getArcServerExtensions(subscriptionIds) {
        const query = `
            resources
            | where type == "microsoft.hybridcompute/machines/extensions"
            | extend 
                machineName = tostring(split(id, '/')[8]),
                extensionType = tostring(properties.type),
                publisher = tostring(properties.publisher),
                provisioningState = tostring(properties.provisioningState)
            | project 
                machineName,
                extensionName = name,
                extensionType,
                publisher,
                provisioningState,
                resourceGroup
            | order by machineName asc
        `;
        
        return await this.queryResourceGraph(query, subscriptionIds);
    }

    // Get Machine Configuration assignments for Arc servers
    async getMachineConfigAssignments(subscriptionIds) {
        const query = `
            guestconfigurationresources
            | where type == "microsoft.guestconfiguration/guestconfigurationassignments"
            | extend 
                machineName = tolower(tostring(split(id, '/')[8]))
            | project 
                machineName,
                assignmentName = name,
                complianceStatus = tostring(properties.complianceStatus),
                assignmentType = tostring(properties.assignmentType)
            | summarize 
                assignmentCount = count(),
                assignments = make_list(assignmentName)
                by machineName
        `;
        
        return await this.queryResourceGraph(query, subscriptionIds);
    }

    // Analyze Arc servers for service usage
    async analyzeArcServices(subscriptionIds) {
        try {
            const [servers, extensions, machineConfigAssignments] = await Promise.all([
                this.getArcServersStatus(subscriptionIds),
                this.getArcServerExtensions(subscriptionIds),
                this.getMachineConfigAssignments(subscriptionIds)
            ]);
            
            // Group extensions by machine
            const extensionsByMachine = new Map();
            extensions.forEach(ext => {
                if (!extensionsByMachine.has(ext.machineName)) {
                    extensionsByMachine.set(ext.machineName, []);
                }
                extensionsByMachine.get(ext.machineName).push(ext);
            });
            
            // Group machine config assignments by machine
            const configsByMachine = new Map();
            machineConfigAssignments.forEach(config => {
                configsByMachine.set(config.machineName, config);
            });
            
            // Analyze service usage
            const analysis = {
                totalServers: servers.length,
                updateManager: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                changeTracking: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                monitoring: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                guestConfiguration: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                defender: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                automatedConfig: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                bestPracticeAssessment: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                tagging: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                windowsAdminCenter: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                },
                hotpatching: {
                    enabled: 0,
                    disabled: 0,
                    enabledServers: [],
                    disabledServers: []
                }
            };
            
            servers.forEach(server => {
                const serverExtensions = extensionsByMachine.get(server.name) || [];
                const serverNameLower = server.name.toLowerCase();
                
                // Check Update Manager (patch settings)
                if (server.updateManagerEnabled) {
                    analysis.updateManager.enabled++;
                    analysis.updateManager.enabledServers.push(server.name);
                } else {
                    analysis.updateManager.disabled++;
                    analysis.updateManager.disabledServers.push(server.name);
                }
                
                // Check Change Tracking & Inventory
                const hasChangeTracking = serverExtensions.some(ext => 
                    ext.extensionType?.includes('ChangeTracking') || 
                    ext.extensionType?.includes('MicrosoftMonitoringAgent')
                );
                if (hasChangeTracking) {
                    analysis.changeTracking.enabled++;
                    analysis.changeTracking.enabledServers.push(server.name);
                } else {
                    analysis.changeTracking.disabled++;
                    analysis.changeTracking.disabledServers.push(server.name);
                }
                
                // Check Monitoring (Azure Monitor Agent or Log Analytics)
                const hasMonitoring = serverExtensions.some(ext => 
                    ext.extensionType?.includes('AzureMonitor') || 
                    ext.extensionType?.includes('LogAnalytics') ||
                    ext.extensionType?.includes('OmsAgent')
                );
                if (hasMonitoring) {
                    analysis.monitoring.enabled++;
                    analysis.monitoring.enabledServers.push(server.name);
                } else {
                    analysis.monitoring.disabled++;
                    analysis.monitoring.disabledServers.push(server.name);
                }
                
                // Check Guest Configuration (via extension presence)
                // Guest Configuration requires the GC extension to be installed
                const hasGuestConfig = serverExtensions.some(ext => 
                    (ext.publisher === 'Microsoft.GuestConfiguration' && 
                     (ext.extensionType === 'ConfigurationForWindows' || ext.extensionType === 'ConfigurationForLinux')) ||
                    ext.extensionName?.toLowerCase().includes('azurepolicyfor')
                );
                if (hasGuestConfig) {
                    analysis.guestConfiguration.enabled++;
                    analysis.guestConfiguration.enabledServers.push(server.name);
                } else {
                    analysis.guestConfiguration.disabled++;
                    analysis.guestConfiguration.disabledServers.push(server.name);
                }
                
                // Check Defender for Cloud
                const hasDefender = serverExtensions.some(ext => 
                    ext.extensionType?.includes('MDE') ||
                    ext.publisher?.includes('Microsoft.Azure.Security')
                );
                if (hasDefender) {
                    analysis.defender.enabled++;
                    analysis.defender.enabledServers.push(server.name);
                } else {
                    analysis.defender.disabled++;
                    analysis.defender.disabledServers.push(server.name);
                }
                
                // Check Automated Machine Configuration (Machine Configuration Assignments)
                // Machine Configuration is enabled when there are configuration assignments (policies, manual, or system-assigned)
                const machineConfig = configsByMachine.get(serverNameLower);
                const hasAutomation = machineConfig && machineConfig.assignmentCount > 0;
                
                if (hasAutomation) {
                    analysis.automatedConfig.enabled++;
                    analysis.automatedConfig.enabledServers.push(server.name);
                } else {
                    analysis.automatedConfig.disabled++;
                    analysis.automatedConfig.disabledServers.push(server.name);
                }
                
                // Check Best Practice Assessment (Windows Server Assessment)
                // Best Practice Assessment uses windowsserverassessment and assessmentplatform extensions
                const hasBestPractice = serverExtensions.some(ext => 
                    ext.extensionType?.toLowerCase() === 'windowsserverassessment' ||
                    ext.extensionType?.toLowerCase() === 'assessmentplatform'
                );
                if (hasBestPractice) {
                    analysis.bestPracticeAssessment.enabled++;
                    analysis.bestPracticeAssessment.enabledServers.push(server.name);
                } else {
                    analysis.bestPracticeAssessment.disabled++;
                    analysis.bestPracticeAssessment.disabledServers.push(server.name);
                }
                
                // Check Resource Tagging
                // Servers should have at least one tag for governance and organization
                if (server.hasTags) {
                    analysis.tagging.enabled++;
                    analysis.tagging.enabledServers.push(server.name);
                } else {
                    analysis.tagging.disabled++;
                    analysis.tagging.disabledServers.push(server.name);
                }
                
                // Check Windows Admin Center extension
                const hasAdminCenter = serverExtensions.some(ext => 
                    ext.extensionType?.toLowerCase().includes('admincenter') ||
                    ext.extensionName?.toLowerCase().includes('admincenter')
                );
                if (hasAdminCenter) {
                    analysis.windowsAdminCenter.enabled++;
                    analysis.windowsAdminCenter.enabledServers.push(server.name);
                } else {
                    analysis.windowsAdminCenter.disabled++;
                    analysis.windowsAdminCenter.disabledServers.push(server.name);
                }
                
                // Check Hotpatching (Windows Server 2025 only)
                const isWS2025 = server.osVersion?.includes('2025') || server.osVersion?.includes('10.0.26100');
                if (isWS2025) {
                    if (server.hasHotpatch) {
                        analysis.hotpatching.enabled++;
                        analysis.hotpatching.enabledServers.push(server.name);
                    } else {
                        analysis.hotpatching.disabled++;
                        analysis.hotpatching.disabledServers.push(server.name);
                    }
                }
                // Note: Non-WS2025 servers are not counted for hotpatching
            });
            
            return analysis;
        } catch (error) {
            console.error('Error analyzing Arc services:', error);
            throw error;
        }
    }

    // Get comprehensive benefits data from Azure
    async getAzureBenefitsData() {
        try {
            const [subscriptions, licenses] = await Promise.all([
                this.getSubscriptions(),
                this.getLicenses()
            ]);

            let arcAnalysis = null;

            if (subscriptions.length > 0) {
                const subscriptionIds = subscriptions.map(s => s.subscriptionId);
                
                // Get Arc services data
                arcAnalysis = await this.analyzeArcServices(subscriptionIds);
            }

            return {
                subscriptions,
                licenses,
                arcServices: arcAnalysis
            };
        } catch (error) {
            console.error('Error fetching Azure benefits data:', error);
            throw error;
        }
    }

    // Map Azure data to benefits format
    mapAzureDataToBenefits(azureData) {
        const benefits = [];
        
        // Get custom cost rates
        const rates = getCustomCostRates();

        // Arc-enabled Services Status
        if (azureData.arcServices) {
            const arc = azureData.arcServices;
            
            // Update Manager
            benefits.push({
                id: 'arc-001',
                name: 'Azure Arc-enabled Servers - Update Manager',
                description: `${arc.updateManager.disabled} of ${arc.totalServers} servers not configured for Update Manager`,
                category: 'security',
                isFree: true,
                isActive: arc.updateManager.enabled > 0,
                estimatedValue: arc.updateManager.disabled * rates['arc-001'],
                details: `${arc.updateManager.enabled} servers have Update Manager enabled. ${arc.updateManager.disabled} servers need configuration.`,
                usage: {
                    active: arc.updateManager.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.updateManager.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.updateManager.disabledServers,
                configuredServers: arc.updateManager.enabledServers
            });
            
            // Change Tracking & Inventory
            benefits.push({
                id: 'arc-002',
                name: 'Azure Arc-enabled Servers - Inventory & Tracking',
                description: `${arc.changeTracking.disabled} of ${arc.totalServers} servers not configured for Change Tracking`,
                category: 'security',
                isFree: true,
                isActive: arc.changeTracking.enabled > 0,
                estimatedValue: arc.changeTracking.disabled * rates['arc-002'],
                details: `${arc.changeTracking.enabled} servers have Change Tracking enabled. ${arc.changeTracking.disabled} servers need configuration.`,
                usage: {
                    active: arc.changeTracking.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.changeTracking.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.changeTracking.disabledServers,
                configuredServers: arc.changeTracking.enabledServers
            });
            
            // Monitoring
            benefits.push({
                id: 'arc-006',
                name: 'Arc-enabled Servers - Monitoring & Insights',
                description: `${arc.monitoring.disabled} of ${arc.totalServers} servers not configured for Azure Monitor`,
                category: 'free',
                isFree: true,
                isActive: arc.monitoring.enabled > 0,
                estimatedValue: arc.monitoring.disabled * rates['arc-006'],
                details: `${arc.monitoring.enabled} servers have Azure Monitor enabled. ${arc.monitoring.disabled} servers need configuration.`,
                usage: {
                    active: arc.monitoring.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.monitoring.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.monitoring.disabledServers,
                configuredServers: arc.monitoring.enabledServers
            });
            
            // Guest Configuration
            benefits.push({
                id: 'arc-003',
                name: 'Azure Arc-enabled Servers - Guest Configuration',
                description: `${arc.guestConfiguration.disabled} of ${arc.totalServers} servers not configured for Guest Configuration`,
                category: 'security',
                isFree: true,
                isActive: arc.guestConfiguration.enabled > 0,
                estimatedValue: arc.guestConfiguration.disabled * rates['arc-003'],
                details: `${arc.guestConfiguration.enabled} servers have Guest Configuration enabled. ${arc.guestConfiguration.disabled} servers need configuration.`,
                usage: {
                    active: arc.guestConfiguration.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.guestConfiguration.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.guestConfiguration.disabledServers,
                configuredServers: arc.guestConfiguration.enabledServers
            });
            
            // Defender for Cloud
            benefits.push({
                id: 'arc-007',
                name: 'Arc-enabled Servers - Microsoft Defender for Cloud',
                description: `${arc.defender.disabled} of ${arc.totalServers} servers not protected by Defender`,
                category: 'security',
                isFree: false,
                isActive: arc.defender.enabled > 0,
                estimatedValue: arc.defender.disabled * rates['arc-007'],
                details: `${arc.defender.enabled} servers have Defender for Cloud enabled. ${arc.defender.disabled} servers need configuration.`,
                usage: {
                    active: arc.defender.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.defender.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.defender.disabledServers,
                configuredServers: arc.defender.enabledServers
            });
            
            // Automated Machine Configuration
            benefits.push({
                id: 'arc-008',
                name: 'Arc-enabled Servers - Automated Machine Configuration',
                description: `${arc.automatedConfig.disabled} of ${arc.totalServers} servers not configured for Automation`,
                category: 'deployment',
                isFree: true,
                isActive: arc.automatedConfig.enabled > 0,
                estimatedValue: arc.automatedConfig.disabled * rates['arc-008'],
                details: `${arc.automatedConfig.enabled} servers have Automated Configuration enabled. ${arc.automatedConfig.disabled} servers need configuration.`,
                usage: {
                    active: arc.automatedConfig.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.automatedConfig.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.automatedConfig.disabledServers,
                configuredServers: arc.automatedConfig.enabledServers
            });
            
            // Best Practice Assessment
            benefits.push({
                id: 'arc-004',
                name: 'Arc-enabled Servers - Best Practice Assessment',
                description: `${arc.bestPracticeAssessment.disabled} of ${arc.totalServers} servers not configured for SQL Assessment`,
                category: 'free',
                isFree: true,
                isActive: arc.bestPracticeAssessment.enabled > 0,
                estimatedValue: arc.bestPracticeAssessment.disabled * rates['arc-004'],
                details: `${arc.bestPracticeAssessment.enabled} servers have SQL Best Practice Assessment enabled. ${arc.bestPracticeAssessment.disabled} servers need configuration.`,
                usage: {
                    active: arc.bestPracticeAssessment.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.bestPracticeAssessment.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.bestPracticeAssessment.disabledServers,
                configuredServers: arc.bestPracticeAssessment.enabledServers
            });
            
            // Resource Tagging
            benefits.push({
                id: 'arc-009',
                name: 'Arc-enabled Servers - Resource Tagging',
                description: `${arc.tagging.disabled} of ${arc.totalServers} servers have no tags`,
                category: 'deployment',
                isFree: true,
                isActive: arc.tagging.enabled > 0,
                estimatedValue: arc.tagging.disabled * rates['arc-009'],
                details: `${arc.tagging.enabled} servers have tags applied. ${arc.tagging.disabled} servers need tags for governance and cost tracking.`,
                usage: {
                    active: arc.tagging.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.tagging.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.tagging.disabledServers,
                configuredServers: arc.tagging.enabledServers
            });
            
            // Windows Admin Center
            benefits.push({
                id: 'arc-010',
                name: 'Arc-enabled Servers - Windows Admin Center',
                description: `${arc.windowsAdminCenter.disabled} of ${arc.totalServers} servers without Admin Center`,
                category: 'deployment',
                isFree: true,
                isActive: arc.windowsAdminCenter.enabled > 0,
                estimatedValue: arc.windowsAdminCenter.disabled * rates['arc-010'],
                details: `${arc.windowsAdminCenter.enabled} servers have Windows Admin Center extension. ${arc.windowsAdminCenter.disabled} servers need the extension for remote management.`,
                usage: {
                    active: arc.windowsAdminCenter.enabled,
                    total: arc.totalServers,
                    percentage: arc.totalServers > 0 ? Math.round((arc.windowsAdminCenter.enabled / arc.totalServers) * 100) : 0
                },
                unconfiguredServers: arc.windowsAdminCenter.disabledServers,
                configuredServers: arc.windowsAdminCenter.enabledServers
            });
            
            // Hotpatching (WS2025 only)
            const ws2025Total = arc.hotpatching.enabled + arc.hotpatching.disabled;
            if (ws2025Total > 0) {
                benefits.push({
                    id: 'arc-011',
                    name: 'Arc-enabled Servers - Hotpatching (WS2025)',
                    description: `${arc.hotpatching.disabled} of ${ws2025Total} Windows Server 2025 servers not using hotpatching`,
                    category: 'free',
                    isFree: true,
                    isActive: arc.hotpatching.enabled > 0,
                    estimatedValue: arc.hotpatching.disabled * rates['arc-011'],
                    details: `${arc.hotpatching.enabled} WS2025 servers have hotpatching enabled. ${arc.hotpatching.disabled} WS2025 servers need hotpatching for rebootless security updates.`,
                    usage: {
                        active: arc.hotpatching.enabled,
                        total: ws2025Total,
                        percentage: ws2025Total > 0 ? Math.round((arc.hotpatching.enabled / ws2025Total) * 100) : 0
                    },
                    unconfiguredServers: arc.hotpatching.disabledServers,
                    configuredServers: arc.hotpatching.enabledServers
                });
            }
        }

        // Process licenses
        if (azureData.licenses) {
            azureData.licenses.forEach(sku => {
                const enabled = sku.consumedUnits || 0;
                const total = sku.prepaidUnits?.enabled || 0;
                
                if (sku.skuPartNumber.includes('WIN') || sku.skuPartNumber.includes('WINDOWS')) {
                    benefits.push({
                        id: `license-${sku.skuId}`,
                        name: sku.skuPartNumber,
                        description: `${enabled} of ${total} licenses in use`,
                        category: 'deployment',
                        isFree: false,
                        isActive: enabled > 0,
                        estimatedValue: 0,
                        details: `License: ${sku.skuPartNumber}`,
                        usage: {
                            active: enabled,
                            total: total,
                            percentage: total > 0 ? Math.round((enabled / total) * 100) : 0
                        }
                    });
                }
            });
        }

        return benefits;
    }
}

// Create global instance
window.azureService = new AzureService();
