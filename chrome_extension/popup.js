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
document.addEventListener('DOMContentLoaded', loadState); 