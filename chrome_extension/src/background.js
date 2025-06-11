// A list of domains where the extension should be active
const RELEVANT_DOMAINS = [
  'github.com',
  'console.aws.amazon.com',
  'portal.azure.com',
  'console.cloud.google.com',
  'grafana.com',
  'app.datadoghq.com',
  'kubernetes.io',
  'stackoverflow.com'
];

// Function to check if a URL is relevant
function isRelevantUrl(url) {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return RELEVANT_DOMAINS.some(domain => hostname.includes(domain));
  } catch (e) {
    return false;
  }
}

// Update the icon state based on the active tab's URL
function updateIcon(tabId, url) {
  if (isRelevantUrl(url)) {
    chrome.action.enable(tabId);
    chrome.action.setIcon({ path: "icons/icon128.png", tabId });
  } else {
    chrome.action.disable(tabId);
    chrome.action.setIcon({ path: "icons/icon-disabled.png", tabId });
  }
}

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateIcon(tabId, tab.url);
  }
});

// Listen for tab activation
chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      updateIcon(tab.id, tab.url);
    }
  });
});

// Initial check when the extension starts
chrome.windows.getAll({ populate: true }, (windows) => {
  windows.forEach(window => {
    window.tabs.forEach(tab => {
      if (tab.active) {
        updateIcon(tab.id, tab.url);
      }
    });
  });
}); 