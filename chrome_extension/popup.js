// DOM Elements
const trackingStatusEl = document.getElementById('trackingStatus');
const trackingToggleEl = document.getElementById('trackingToggle');
const syncDataEl = document.getElementById('syncData');
const openDashboardEl = document.getElementById('openDashboard');

const CAREERATE_DASHBOARD_URL = 'http://localhost:5173/dashboard'; // Replace with actual deployed URL later

// Load initial state from storage
function loadState() {
    chrome.storage.local.get(['isTrackingEnabled'], (result) => {
        const isEnabled = result.isTrackingEnabled === undefined ? true : result.isTrackingEnabled;
        trackingToggleEl.checked = isEnabled;
        updateStatusText(isEnabled);
    });
}

function updateStatusText(isEnabled) {
    trackingStatusEl.textContent = isEnabled ? 'Active' : 'Paused';
    trackingStatusEl.style.color = isEnabled ? '#28a745' : '#dc3545'; // Green for active, red for paused
}

// Event Listeners
trackingToggleEl.addEventListener('change', (event) => {
    const isEnabled = event.target.checked;
    chrome.storage.local.set({ isTrackingEnabled: isEnabled }, () => {
        updateStatusText(isEnabled);
        // Send a message to background script if needed to immediately start/stop
        chrome.runtime.sendMessage({ type: 'TOGGLE_TRACKING', enabled: isEnabled });
        console.log(`Tracking ${isEnabled ? 'enabled' : 'disabled'}`);
    });
});

syncDataEl.addEventListener('click', () => {
    syncDataEl.textContent = 'Syncing...';
    syncDataEl.disabled = true;
    chrome.runtime.sendMessage({ type: 'MANUAL_SYNC' }, (response) => {
        console.log('Manual sync response:', response);
        syncDataEl.textContent = 'Sync Data Now';
        syncDataEl.disabled = false;
        if (response && response.success) {
            // Maybe show a temporary success message
        } else {
            // Maybe show an error
        }
    });
});

openDashboardEl.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: CAREERATE_DASHBOARD_URL });
});

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
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
    
    userInitial.textContent = userInfo.userInfo.name?.[0]?.toUpperCase() || 'U';
    userName.textContent = userInfo.userInfo.name || userInfo.userInfo.email?.split('@')[0] || 'Guest';
  }

  // Get stats
  const stats = await chrome.storage.local.get(['toolsFound', 'insights']);
  document.querySelector('.stat-value:nth-child(1)').textContent = stats.toolsFound || '0';
  document.querySelector('.stat-value:nth-child(2)').textContent = stats.insights || '0';

  // Button event listeners
  document.getElementById('analyzePage').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'analyzePage' });
  });

  document.getElementById('viewInsights').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://careerate.com/dashboard' });
  });

  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://careerate.com/dashboard' });
  });

  document.getElementById('settings').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'updateStats') {
      document.querySelector('.stat-value:nth-child(1)').textContent = message.toolsFound || '0';
      document.querySelector('.stat-value:nth-child(2)').textContent = message.insights || '0';
    }
  });
}); 