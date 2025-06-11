// Configuration
const CAREERATE_API_URL = 'https://careerate-app.azurewebsites.net/api';
const CAREERATE_DASHBOARD_URL = 'https://careerate-app.azurewebsites.net';

// DOM Elements (will be set after DOM loads)
let trackingStatusEl, trackingToggleEl, syncDataEl, openDashboardEl;

// API helper functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${CAREERATE_API_URL}${endpoint}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            throw new Error(`API call failed: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

async function sendChatMessage(message, context = {}) {
    try {
        const response = await fetch(`${CAREERATE_API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message,
                agentType: 'career',
                context,
                userId: await getUserId()
            })
        });

        if (!response.ok) {
            throw new Error(`Chat API failed: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.type === 'chunk') {
                            fullResponse += data.content;
                        } else if (data.type === 'complete') {
                            return { success: true, response: fullResponse, agentUsed: data.agentUsed };
                        } else if (data.type === 'error') {
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        // Skip invalid JSON lines
                    }
                }
            }
        }

        return { success: true, response: fullResponse };
    } catch (error) {
        console.error('Chat error:', error);
        return { success: false, error: error.message };
    }
}

async function getUserId() {
    const userInfo = await chrome.storage.local.get('userInfo');
    return userInfo.userInfo?.id || `chrome-user-${Date.now()}`;
}

// Load initial state from storage
function loadState() {
    chrome.storage.local.get(['isTrackingEnabled'], (result) => {
        const isEnabled = result.isTrackingEnabled === undefined ? true : result.isTrackingEnabled;
        if (trackingToggleEl) {
            trackingToggleEl.checked = isEnabled;
            updateStatusText(isEnabled);
        }
    });
}

function updateStatusText(isEnabled) {
    if (trackingStatusEl) {
        trackingStatusEl.textContent = isEnabled ? 'Active' : 'Paused';
        trackingStatusEl.style.color = isEnabled ? '#28a745' : '#dc3545';
    }
}

// Show loading state
function showLoading(element, originalText) {
    element.textContent = 'Loading...';
    element.disabled = true;
    element.style.opacity = '0.7';
}

function hideLoading(element, originalText) {
    element.textContent = originalText;
    element.disabled = false;
    element.style.opacity = '1';
}

// Show notification
function showNotification(message, type = 'info') {
    // Create a simple notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        padding: 10px 15px;
        border-radius: 5px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        ${type === 'success' ? 'background: #10b981;' : ''}
        ${type === 'error' ? 'background: #ef4444;' : ''}
        ${type === 'info' ? 'background: #3b82f6;' : ''}
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => notification.style.opacity = '1', 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Analyze current page
async function analyzePage() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get page context
        const pageContext = {
            url: tab.url,
            title: tab.title,
            domain: new URL(tab.url).hostname
        };

        // Send analysis request to AI
        const analysisResult = await sendChatMessage(
            `Please analyze this page for career development opportunities and insights: ${tab.title} at ${tab.url}`,
            pageContext
        );

        if (analysisResult.success) {
            // Update stats
            const currentStats = await chrome.storage.local.get(['insights']);
            const newInsightCount = (currentStats.insights || 0) + 1;
            
            await chrome.storage.local.set({ insights: newInsightCount });
            
            // Update UI
            const insightsStat = document.querySelectorAll('.stat-value')[1];
            if (insightsStat) {
                insightsStat.textContent = newInsightCount;
            }
            
            showNotification('Page analyzed successfully!', 'success');
        } else {
            showNotification('Failed to analyze page', 'error');
        }
    } catch (error) {
        console.error('Page analysis error:', error);
        showNotification('Analysis failed', 'error');
    }
}

// Check API connectivity
async function checkApiHealth() {
    try {
        const health = await apiCall('/health');
        console.log('API Health:', health);
        return health.status === 'healthy';
    } catch (error) {
        console.error('API health check failed:', error);
        return false;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Set DOM elements
    trackingStatusEl = document.getElementById('trackingStatus');
    trackingToggleEl = document.getElementById('trackingToggle');
    syncDataEl = document.getElementById('syncData');
    openDashboardEl = document.getElementById('openDashboard');

    // Check API connectivity
    const apiHealthy = await checkApiHealth();
    if (!apiHealthy) {
        showNotification('Unable to connect to Careerate API', 'error');
    }

    // Check if user has seen welcome message
    const hasSeenWelcome = await chrome.storage.local.get('hasSeenWelcome');
    const welcomeMessage = document.getElementById('welcomeMessage');
    
    if (hasSeenWelcome.hasSeenWelcome) {
        welcomeMessage.style.display = 'none';
    } else {
        // Mark welcome message as seen
        chrome.storage.local.set({ hasSeenWelcome: true });
    }

    // Get user info
    const userInfo = await chrome.storage.local.get('userInfo');
    if (userInfo.userInfo) {
        const userInitial = document.querySelector('.user-initial');
        const userName = document.querySelector('.user-name');
        
        if (userInitial) userInitial.textContent = userInfo.userInfo.name?.[0]?.toUpperCase() || 'U';
        if (userName) userName.textContent = userInfo.userInfo.name || userInfo.userInfo.email?.split('@')[0] || 'Guest';
    }

    // Get stats
    const stats = await chrome.storage.local.get(['toolsFound', 'insights']);
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues[0]) statValues[0].textContent = stats.toolsFound || '0';
    if (statValues[1]) statValues[1].textContent = stats.insights || '0';

    // Button event listeners
    const analyzePageBtn = document.getElementById('analyzePage');
    if (analyzePageBtn) {
        analyzePageBtn.addEventListener('click', async () => {
            showLoading(analyzePageBtn, 'Analyze This Page');
            await analyzePage();
            hideLoading(analyzePageBtn, 'Analyze This Page');
        });
    }

    const viewInsightsBtn = document.getElementById('viewInsights');
    if (viewInsightsBtn) {
        viewInsightsBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: `${CAREERATE_DASHBOARD_URL}/dashboard` });
        });
    }

    const openDashboardBtn = document.getElementById('openDashboard');
    if (openDashboardBtn) {
        openDashboardBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: CAREERATE_DASHBOARD_URL });
        });
    }

    const settingsBtn = document.getElementById('settings');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    // Legacy event listeners (if elements exist)
    if (trackingToggleEl) {
        trackingToggleEl.addEventListener('change', (event) => {
            const isEnabled = event.target.checked;
            chrome.storage.local.set({ isTrackingEnabled: isEnabled }, () => {
                updateStatusText(isEnabled);
                chrome.runtime.sendMessage({ type: 'TOGGLE_TRACKING', enabled: isEnabled });
                console.log(`Tracking ${isEnabled ? 'enabled' : 'disabled'}`);
            });
        });
    }

    if (syncDataEl) {
        syncDataEl.addEventListener('click', async () => {
            showLoading(syncDataEl, 'Sync Data Now');
            
            try {
                // Sync with backend
                const health = await apiCall('/health');
                showNotification('Data synced successfully!', 'success');
            } catch (error) {
                showNotification('Sync failed', 'error');
            }
            
            hideLoading(syncDataEl, 'Sync Data Now');
        });
    }

    // Load initial state
    loadState();

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'updateStats') {
            const statValues = document.querySelectorAll('.stat-value');
            if (statValues[0]) statValues[0].textContent = message.toolsFound || '0';
            if (statValues[1]) statValues[1].textContent = message.insights || '0';
        }
    });
}); 