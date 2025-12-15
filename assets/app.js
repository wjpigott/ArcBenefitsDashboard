// Arc Software Assurance Benefits Dashboard
// Main application logic

let benefitsData = [];
let filteredData = [];
let azureBenefitsData = [];
let allSubscriptions = [];
let selectedSubscriptions = ['all'];
let currentDataSource = 'azure'; // 'sample' or 'azure'
let currentTab = 'arc'; // 'arc' or 'other'

// Arc-related keywords for filtering - focus on Arc-enabled services
const arcKeywords = ['arc-enabled', 'arc enabled', 'update manager', 'inventory', 'change tracking', 'guest configuration', 'best practice', 'compliance', 'connected machine', 'hybrid benefit'];

// Show savings calculation breakdown
function showSavingsBreakdown() {
    const benefits = currentDataSource === 'azure' ? azureBenefitsData : allBenefits;
    const inactiveBenefits = benefits.filter(b => !b.isActive);
    
    if (inactiveBenefits.length === 0) {
        const modal = document.getElementById('savingsModal');
        const content = document.getElementById('savingsBreakdownContent');
        content.innerHTML = `
            <div class="savings-breakdown-intro">
                <p style="text-align: center; font-size: 1.2rem; margin: 20px 0;">
                    ✅ <strong>Excellent!</strong> All benefits are currently active.
                </p>
                <p style="text-align: center; color: #6c757d;">No potential savings to calculate.</p>
            </div>
        `;
        modal.style.display = 'block';
        return;
    }
    
    const perServerRates = {
        'arc-001': 400,  // Update Manager
        'arc-002': 300,  // Change Tracking
        'arc-003': 350,  // Guest Configuration
        'arc-004': 250,  // Best Practice Assessment
        'arc-006': 200,  // Monitoring
        'arc-007': 450,  // Defender
        'arc-008': 275   // Automated Config
    };
    
    let html = '<div class="savings-breakdown-intro">Based on unconfigured servers for each benefit:</div>';
    
    let total = 0;
    inactiveBenefits.forEach(benefit => {
        const value = benefit.estimatedValue || 0;
        const rate = perServerRates[benefit.id] || 0;
        const unconfigured = benefit.unconfiguredServers?.length || 0;
        
        if (value > 0) {
            html += `
                <div class="savings-item">
                    <div class="savings-item-header">
                        <div class="savings-item-name">${benefit.name}</div>
                        <div class="savings-item-value">$${value.toLocaleString()}</div>
                    </div>
                    <div class="savings-item-calculation">
                        <span>${unconfigured} unconfigured servers</span>
                        <span class="multiply">×</span>
                        <span>$${rate.toLocaleString()}/server/year</span>
                    </div>
                </div>
            `;
            total += value;
        }
    });
    
    html += `
        <div class="savings-total">
            <div class="savings-total-label">Total Potential Annual Savings</div>
            <div class="savings-total-amount">$${total.toLocaleString()}</div>
        </div>
        <div class="savings-note">
            <strong>💡 Note:</strong>
            These values represent estimated annual cost savings or risk reduction per server when these features are enabled. 
            Actual savings may vary based on your organization's specific configuration and usage patterns.
        </div>
    `;
    
    document.getElementById('savingsBreakdownContent').innerHTML = html;
    document.getElementById('savingsModal').style.display = 'block';
}

// Close savings modal
function closeSavingsModal(event) {
    if (!event || event.target.id === 'savingsModal') {
        document.getElementById('savingsModal').style.display = 'none';
    }
}

// Check for pre-configured Azure settings
const preConfigured = window.AZURE_CONFIG && window.AZURE_CONFIG.CLIENT_ID && window.AZURE_CONFIG.TENANT_ID;
let azureClientId = preConfigured ? window.AZURE_CONFIG.CLIENT_ID : (localStorage.getItem('azureClientId') || '');
let azureTenantId = preConfigured ? window.AZURE_CONFIG.TENANT_ID : (localStorage.getItem('azureTenantId') || '');

// Create Azure service instance
window.azureService = new AzureService();

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    updateRedirectUri();
    
    // Initialize Azure and wait for it to complete
    await initializeAzure();
    
    // Now check authentication status
    if (window.azureService.isAuthenticated()) {
        console.log('User already authenticated - switching to Azure data');
        await switchDataSource('azure');
    } else if (preConfigured && window.AZURE_CONFIG.AUTO_INIT) {
        // Load sample data initially while user decides to sign in
        console.log('Not authenticated but auto-init enabled - loading sample data');
        loadBenefitsData();
        setTimeout(() => {
            if (confirm('Sign in to Azure to view live benefits data?')) {
                handleAuth();
            }
        }, 500);
    } else {
        // Not authenticated, load sample data
        console.log('User not authenticated - loading sample data');
        currentDataSource = 'sample';
        loadBenefitsData();
    }
});

// Load benefits data from JSON file
async function loadBenefitsData() {
    try {
        const response = await fetch('data/benefits.json');
        benefitsData = await response.json();
        filteredData = [...benefitsData];
        updateDashboard();
    } catch (error) {
        console.error('Error loading benefits data:', error);
        showError('Unable to load benefits data. Please check the data file.');
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('subscriptionFilter').addEventListener('change', handleSubscriptionChange);
    document.getElementById('categoryFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
}

// Update the entire dashboard
function updateDashboard() {
    updateStats();
    renderBenefits();
}

// Update statistics cards
function updateStats() {
    // Filter by current tab
    const tabFilteredData = benefitsData.filter(benefit => {
        const isArcBenefit = isArcRelated(benefit);
        return (currentTab === 'arc' && isArcBenefit) || (currentTab === 'other' && !isArcBenefit);
    });
    
    const total = tabFilteredData.length;
    const unused = tabFilteredData.filter(b => !b.isActive).length;
    const active = tabFilteredData.filter(b => b.isActive).length;
    const savings = tabFilteredData
        .filter(b => !b.isActive)
        .reduce((sum, b) => sum + (b.estimatedValue || 0), 0);

    document.getElementById('totalBenefits').textContent = total;
    document.getElementById('unusedBenefits').textContent = unused;
    document.getElementById('activeBenefits').textContent = active;
    document.getElementById('potentialSavings').textContent = `$${savings.toLocaleString()}`;
}

// Render benefits list
function renderBenefits() {
    const container = document.getElementById('benefitsList');
    container.innerHTML = '';

    // Add table header
    const header = document.createElement('div');
    header.className = 'table-header';
    header.innerHTML = `
        <div class="table-row header-row">
            <div class="col-expand"></div>
            <div class="col-count-num">Configured</div>
            <div class="col-service">Service</div>
            <div class="col-status">Status</div>
            <div class="col-resources">Total Resources</div>
        </div>
    `;
    container.appendChild(header);

    filteredData.forEach(benefit => {
        const card = createBenefitCard(benefit);
        container.appendChild(card);
    });

    if (filteredData.length === 0) {
        container.innerHTML = '<p class="no-results">No benefits match your filters.</p>';
    }
}

// Render free benefits in the right column
function renderFreeBenefits() {
    const container = document.getElementById('freeBenefitsList');
    container.innerHTML = '';

    // Filter by current tab
    const tabFilteredBenefits = benefitsData.filter(benefit => {
        const isArcBenefit = isArcRelated(benefit);
        return (currentTab === 'arc' && isArcBenefit) || (currentTab === 'other' && !isArcBenefit);
    });
    
    const freeBenefits = tabFilteredBenefits.filter(b => b.category === 'free' || b.isFree);
    
    freeBenefits.forEach(benefit => {
        const card = createFreeBenefitCard(benefit);
        container.appendChild(card);
    });

    if (freeBenefits.length === 0) {
        container.innerHTML = '<p class="no-results">No free benefits available in this category.</p>';
    }
}

// Create a benefit card element
function createBenefitCard(benefit) {
    const card = document.createElement('div');
    card.className = `benefit-row`;
    
    // Determine status icon based on usage percentage or active state
    let statusIcon, statusClass, configuredCount, totalCount;
    if (benefit.usage) {
        const percentage = benefit.usage.percentage || 0;
        const active = benefit.usage.active || 0;
        
        // Green only if 100% configured, yellow if some configured, red if none
        if (percentage === 100) {
            statusIcon = '●';
            statusClass = 'status-enabled';
        } else if (active > 0) {
            statusIcon = '●';
            statusClass = 'status-partial';
        } else {
            statusIcon = '●';
            statusClass = 'status-disabled';
        }
        configuredCount = active > 0 ? 'Yes' : 'No';
        totalCount = benefit.usage.total;
    } else {
        statusIcon = '\u25cf';
        statusClass = benefit.isActive ? 'status-enabled' : 'status-disabled';
        configuredCount = benefit.isActive ? 'Yes' : 'No';
        totalCount = '1';
    }

    card.innerHTML = `
        <div class="table-row" data-benefit-id="${benefit.id}">
            <div class="col-expand">
                <button class="expand-btn" onclick="toggleDetails(event, '${benefit.id}')" title="View details">▶</button>
            </div>
            <div class="col-count-num">${configuredCount}</div>
            <div class="col-service">${benefit.name}</div>
            <div class="col-status">
                <span class="status-dot ${statusClass}">${statusIcon}</span>
            </div>
            <div class="col-resources">${totalCount}</div>
        </div>
    `;
    
    return card;
}

// Create a free benefit card element
function createFreeBenefitCard(benefit) {
    const card = document.createElement('div');
    card.className = 'free-benefit-card';
    
    const statusIcon = benefit.isActive ? '✓' : '○';
    
    card.innerHTML = `
        <div class="free-benefit-header">
            <span class="status-icon">${statusIcon}</span>
            <h4>${benefit.name}</h4>
        </div>
        <p class="free-benefit-description">${benefit.description}</p>
        <button class="btn-activate" onclick="activateFreeBenefit('${benefit.id}')">
            ${benefit.isActive ? 'Already Using' : 'Start Using'}
        </button>
    `;
    
    return card;
}

// Apply filters
function applyFilters() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;

    filteredData = benefitsData.filter(benefit => {
        // Tab filter - Arc vs Other
        const isArcBenefit = isArcRelated(benefit);
        const matchesTab = (currentTab === 'arc' && isArcBenefit) || (currentTab === 'other' && !isArcBenefit);
        
        const matchesCategory = categoryFilter === 'all' || benefit.category === categoryFilter || (categoryFilter === 'free' && benefit.isFree);
        const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'unused' && !benefit.isActive) ||
                            (statusFilter === 'active' && benefit.isActive);
        
        return matchesTab && matchesCategory && matchesStatus;
    });

    renderBenefits();
}

// Check if a benefit is Arc-related
function isArcRelated(benefit) {
    const searchText = `${benefit.name} ${benefit.description} ${benefit.details || ''}`.toLowerCase();
    return arcKeywords.some(keyword => searchText.includes(keyword));
}

// Switch between Arc and Other tabs
function switchTab(tab) {
    currentTab = tab;
    
    // Update tab buttons
    document.getElementById('arcTab').classList.toggle('active', tab === 'arc');
    document.getElementById('otherTab').classList.toggle('active', tab === 'other');
    
    // Update stats and display
    updateDashboard();
    applyFilters();
}

// Toggle benefit status
function toggleBenefit(benefitId) {
    const benefit = benefitsData.find(b => b.id === benefitId);
    if (benefit) {
        benefit.isActive = !benefit.isActive;
        updateDashboard();
        applyFilters();
    }
}

// Activate a free benefit
function activateFreeBenefit(benefitId) {
    const benefit = benefitsData.find(b => b.id === benefitId);
    if (benefit && !benefit.isActive) {
        benefit.isActive = true;
        updateDashboard();
        applyFilters();
        alert(`Activated: ${benefit.name}\n\nNext steps: ${benefit.activationSteps || 'Contact your administrator to complete setup.'}`);
    }
}

// Show unused benefits
function showUnusedBenefits() {
    document.getElementById('statusFilter').value = 'unused';
    applyFilters();
}

// Show benefit details
function showBenefitDetails(benefitId) {
    const benefit = benefitsData.find(b => b.id === benefitId);
    if (benefit) {
        alert(`${benefit.name}\n\n${benefit.description}\n\nCategory: ${benefit.category}\nStatus: ${benefit.isActive ? 'Active' : 'Unused'}\nEstimated Value: $${benefit.estimatedValue || 0}\n\n${benefit.details || 'No additional details available.'}`);
    }
}

// Show recommendations modal
function showRecommendations() {
    const unusedBenefits = benefitsData.filter(b => !b.isActive);
    const modal = document.getElementById('recommendationsModal');
    const content = document.getElementById('recommendationsContent');
    
    if (unusedBenefits.length === 0) {
        content.innerHTML = '<p>Great job! You\'re using all available benefits.</p>';
    } else {
        const highValue = unusedBenefits
            .sort((a, b) => (b.estimatedValue || 0) - (a.estimatedValue || 0))
            .slice(0, 5);
        
        content.innerHTML = `
            <p>Based on your current usage, we recommend activating these high-value benefits:</p>
            <ul class="recommendations-list">
                ${highValue.map(b => `
                    <li>
                        <strong>${b.name}</strong> - Est. Value: $${b.estimatedValue || 0}
                        <br><small>${b.description}</small>
                        <br><button class="btn-small" onclick="activateAndClose('${b.id}')">Activate Now</button>
                    </li>
                `).join('')}
            </ul>
        `;
    }
    
    modal.style.display = 'block';
}

// Activate benefit and close modal
function activateAndClose(benefitId) {
    toggleBenefit(benefitId);
    closeModal();
}

// Close modal
function closeModal() {
    document.getElementById('recommendationsModal').style.display = 'none';
}

// Export report
function exportReport() {
    const report = {
        generatedDate: new Date().toISOString(),
        summary: {
            total: benefitsData.length,
            active: benefitsData.filter(b => b.isActive).length,
            unused: benefitsData.filter(b => !b.isActive).length,
            potentialSavings: benefitsData.filter(b => !b.isActive).reduce((sum, b) => sum + (b.estimatedValue || 0), 0)
        },
        benefits: benefitsData
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sa-benefits-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Refresh data
function refreshData() {
    loadBenefitsData();
    alert('Data refreshed successfully!');
}

// Show error message
function showError(message) {
    const benefitsList = document.getElementById('benefitsList');
    benefitsList.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}

// ============ Azure Integration Functions ============

// Initialize Azure service
async function initializeAzure() {
    if (azureClientId) {
        try {
            console.log('Initializing Azure with client ID:', azureClientId);
            console.log('Tenant ID:', azureTenantId || 'common');
            const isAuth = await window.azureService.initialize(azureClientId, azureTenantId || 'common');
            updateAuthUI(isAuth);
            if (isAuth) {
                console.log('Already authenticated');
            }
        } catch (error) {
            console.error('Azure initialization failed:', error);
            alert('Azure initialization failed: ' + error.message + '\n\nClick "Connect to Azure" to reconfigure.');
            updateAuthUI(false);
        }
    } else {
        console.log('No client ID configured');
    }
}

// Handle authentication button click
async function handleAuth() {
    console.log('handleAuth called');
    console.log('azureClientId:', azureClientId);
    console.log('azureService:', window.azureService);
    
    // If not pre-configured and no client ID, show config modal
    if (!azureClientId) {
        console.log('No client ID, showing config modal');
        showConfigModal();
        return;
    }

    if (window.azureService.isAuthenticated()) {
        try {
            await window.azureService.signOut();
            updateAuthUI(false);
            alert('Signed out successfully');
        } catch (error) {
            console.error('Sign out failed:', error);
            alert('Sign out failed: ' + error.message);
        }
    } else {
        try {
            console.log('Attempting sign in...');
            await window.azureService.signIn();
            updateAuthUI(true);
            
            // Automatically switch to Azure data
            await switchDataSource('azure');
        } catch (error) {
            console.error('Sign in failed:', error);
            alert('Failed to sign in: ' + error.message + '\n\nClick "Reset Configuration" to try again.');
        }
    }
}

// Update authentication UI
function updateAuthUI(isAuthenticated) {
    const statusIndicator = document.querySelector('.status-indicator');
    const statusText = document.querySelector('.status-text');
    const authButton = document.getElementById('authButton');

    if (isAuthenticated) {
        const account = window.azureService.getAccount();
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = `Connected: ${account.username}`;
        authButton.textContent = '🚪 Sign Out';
        authButton.className = 'auth-btn signout';
    } else {
        statusIndicator.className = 'status-indicator offline';
        statusText.textContent = 'Not Connected';
        authButton.textContent = '🔑 Connect to Azure';
        authButton.className = 'auth-btn';
    }
}

// Switch data source
async function switchDataSource(source) {
    console.log('switchDataSource called with:', source);
    currentDataSource = source;
    
    if (source === 'azure') {
        console.log('Checking if authenticated...');
        if (!window.azureService.isAuthenticated()) {
            console.log('Not authenticated - cannot switch to Azure data');
            alert('Please sign in to Azure first');
            currentDataSource = 'sample';
            return;
        }
        
        console.log('Authenticated - loading Azure data');
        try {
            showLoading(true);
            await loadAzureBenefitsData();
            benefitsData = [...azureBenefitsData];
            filteredData = [...benefitsData];
            updateDashboard();
            showLoading(false);
        } catch (error) {
            console.error('Failed to load Azure data:', error);
            alert('Failed to load Azure data. Switching back to sample data.');
            currentDataSource = 'sample';
            await loadBenefitsData();
            showLoading(false);
        }
    } else {
        console.log('Loading sample data');
        await loadBenefitsData();
    }
}

// Switch to sample data from link
function switchToSampleData() {
    currentDataSource = 'sample';
    loadBenefitsData();
}

// Toggle details view
function toggleDetails(event, benefitId) {
    event.stopPropagation();
    const benefit = benefitsData.find(b => b.id === benefitId);
    if (!benefit) return;
    
    const row = event.target.closest('.benefit-row');
    const existingDetails = row.nextElementSibling;
    const expandBtn = event.target;
    
    // If details already shown, collapse it
    if (existingDetails && existingDetails.classList.contains('details-row')) {
        existingDetails.remove();
        expandBtn.textContent = '▶';
        expandBtn.classList.remove('expanded');
        return;
    }
    
    // Collapse any other open details
    document.querySelectorAll('.details-row').forEach(dr => dr.remove());
    document.querySelectorAll('.expand-btn').forEach(btn => {
        btn.textContent = '▶';
        btn.classList.remove('expanded');
    });
    
    // Create and show details row
    const detailsRow = document.createElement('div');
    detailsRow.className = 'benefit-row details-row';
    
    let html = `
        <div class="details-content-inline">
    `;
    
    // Create server details table if usage data is available
    if (benefit.usage && benefit.usage.total > 0) {
        html += `
            <div class="details-table-container">
                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Server Name</th>
                            <th>Configured</th>
                            <th>Subscription</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        const subscription = allSubscriptions.length > 0 ? allSubscriptions[0].displayName : 'N/A';
        const subscriptionId = allSubscriptions.length > 0 ? allSubscriptions[0].subscriptionId : '';
        const configuredServers = benefit.configuredServers || [];
        const unconfiguredServers = benefit.unconfiguredServers || [];
        
        // Show configured servers first
        configuredServers.forEach(serverName => {
            html += `
                <tr>
                    <td>${serverName}</td>
                    <td class="status-yes">Yes</td>
                    <td title="${subscriptionId}">${subscription}</td>
                </tr>
            `;
        });
        
        // Show unconfigured servers
        unconfiguredServers.forEach(serverName => {
            html += `
                <tr>
                    <td>${serverName}</td>
                    <td class="status-no">No</td>
                    <td title="${subscriptionId}">${subscription}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
                <div class="details-summary">
                    <strong>Total:</strong> ${benefit.usage.total} servers | 
                    <strong>Configured:</strong> ${benefit.usage.active} | 
                    <strong>Not Configured:</strong> ${unconfiguredServers.length}
                </div>
            </div>
        `;
    } else {
        // Fallback for items without usage data
        html += `
            <div class="details-info">
                <p><strong>Description:</strong> ${benefit.description || 'No description available'}</p>
                <p><strong>Status:</strong> ${benefit.isActive ? 'Active' : 'Not Configured'}</p>
        `;
        
        if (allSubscriptions && allSubscriptions.length > 0) {
            html += `<p><strong>Subscription:</strong> ${allSubscriptions[0].displayName} (${allSubscriptions[0].subscriptionId})</p>`;
        }
        
        html += `</div>`;
    }
    
    html += `
        </div>
    `;
    
    detailsRow.innerHTML = html;
    row.parentNode.insertBefore(detailsRow, row.nextSibling);
    
    // Update button state
    expandBtn.textContent = '▼';
    expandBtn.classList.add('expanded');
}

// Load benefits data from Azure
async function loadAzureBenefitsData() {
    try {
        console.log('Loading Azure benefits data...');
        const azureData = await window.azureService.getAzureBenefitsData();
        console.log('Azure data received:', azureData);
        console.log('Arc services data:', azureData.arcServices);
        
        // Store subscriptions
        allSubscriptions = azureData.subscriptions || [];
        populateSubscriptionFilter();
        
        // Map Arc services data to benefits
        if (azureData.arcServices) {
            console.log('Mapping Arc services to benefits...');
            azureBenefitsData = window.azureService.mapAzureDataToBenefits(azureData);
            console.log('Mapped benefits:', azureBenefitsData);
        } else {
            console.warn('No Arc services data returned from Azure!');
            // Fallback to sample data if no Arc data
            azureBenefitsData = [];
        }
        
        // Load sample data to merge non-Arc benefits
        const sampleResponse = await fetch('data/benefits.json');
        const sampleData = await sampleResponse.json();
        
        // Get IDs from Azure mapped data
        const azureMappedIds = azureBenefitsData.map(b => b.id);
        
        // Only add benefits from sample data that weren't provided by Azure
        const additionalBenefits = sampleData.filter(b => !azureMappedIds.includes(b.id));
        
        // Azure data takes precedence
        azureBenefitsData = [...azureBenefitsData, ...additionalBenefits];
        
        console.log('Final benefits data:', azureBenefitsData.length, 'benefits');
        console.log('Azure mapped:', azureMappedIds.length, 'Sample added:', additionalBenefits.length);
    } catch (error) {
        console.error('Error loading Azure benefits data:', error);
        throw error;
    }
}

// Populate subscription dropdown
function populateSubscriptionFilter() {
    const select = document.getElementById('subscriptionFilter');
    select.innerHTML = '<option value="all">All Subscriptions</option>';
    
    allSubscriptions.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub.subscriptionId;
        option.textContent = `${sub.displayName} (${sub.subscriptionId.substring(0, 8)}...)`;
        select.appendChild(option);
    });
    
    // Show subscription selector
    document.getElementById('subscriptionSelector').style.display = 'flex';
}

// Handle subscription selection change
async function handleSubscriptionChange(e) {
    const value = e.target.value;
    selectedSubscriptions = value === 'all' ? allSubscriptions.map(s => s.subscriptionId) : [value];
    
    showLoading(true);
    await loadAzureBenefitsData();
    benefitsData = [...azureBenefitsData];
    filteredData = [...benefitsData];
    updateDashboard();
    showLoading(false);
}

// Show/hide loading indicator
function showLoading(show) {
    if (show) {
        const overlay = document.createElement('div');
        overlay.id = 'loadingOverlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading Azure data...</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.remove();
        }
    }
}

// Show config modal
function showConfigModal() {
    console.log('showConfigModal called');
    
    // If pre-configured, don't allow changes
    if (preConfigured) {
        alert('This dashboard is pre-configured for your organization.\n\nClick "Connect to Azure" to sign in with your credentials.');
        return;
    }
    
    const modal = document.getElementById('configModal');
    console.log('modal element:', modal);
    document.getElementById('clientIdInput').value = azureClientId;
    document.getElementById('tenantIdInput').value = azureTenantId;
    modal.style.display = 'block';
    console.log('modal display set to block');
}

// Close config modal
function closeConfigModal() {
    document.getElementById('configModal').style.display = 'none';
}

// Save Azure configuration
async function saveConfig() {
    const clientId = document.getElementById('clientIdInput').value.trim();
    const tenantId = document.getElementById('tenantIdInput').value.trim();
    
    if (!clientId) {
        alert('Please enter a valid Client ID');
        return;
    }
    
    // Validate GUID format
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(clientId)) {
        alert('Invalid Client ID format. Please enter a valid GUID.');
        return;
    }
    
    if (tenantId && !guidRegex.test(tenantId)) {
        alert('Invalid Tenant ID format. Please enter a valid GUID or leave empty for multi-tenant.');
        return;
    }
    
    azureClientId = clientId;
    azureTenantId = tenantId;
    localStorage.setItem('azureClientId', clientId);
    localStorage.setItem('azureTenantId', tenantId);
    closeConfigModal();
    
    try {
        await window.azureService.initialize(clientId, tenantId || 'common');
        alert('Configuration saved!\n\nNow click "Connect to Azure" to sign in with your username and password.');
    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Configuration saved, but initialization failed: ' + error.message);
    }
}

// Reset configuration
function resetConfig() {
    if (confirm('This will clear your Azure configuration and reload the page. Continue?')) {
        localStorage.removeItem('azureClientId');
        localStorage.removeItem('azureTenantId');
        location.reload();
    }
}

// Update redirect URI in modal
function updateRedirectUri() {
    const redirectUri = window.location.origin + window.location.pathname;
    const uriElement = document.getElementById('redirectUri');
    if (uriElement) {
        uriElement.textContent = redirectUri;
    }
}

// Show error message
function showError(message) {
    const benefitsList = document.getElementById('benefitsList');
    benefitsList.innerHTML = `<div class="error-message">⚠️ ${message}</div>`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('recommendationsModal');
    const configModal = document.getElementById('configModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
    if (event.target === configModal) {
        configModal.style.display = 'none';
    }
}
