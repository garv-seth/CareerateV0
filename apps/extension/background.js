// background.js - Careerate AIntern Suite

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
  // Main context menu
  chrome.contextMenus.create({
    id: 'careerate-help',
    title: 'Ask AIntern Suite about this',
    contexts: ['selection', 'page']
  });

  // Sub-menu items for specific actions
  chrome.contextMenus.create({
    id: 'careerate-debug',
    title: 'Debug with AIntern Suite',
    contexts: ['selection'],
    parentId: 'careerate-help'
  });

  chrome.contextMenus.create({
    id: 'careerate-deploy',
    title: 'Deploy with AIntern Suite',
    contexts: ['selection'],
    parentId: 'careerate-help'
  });

  chrome.contextMenus.create({
    id: 'careerate-incident',
    title: 'Report Incident',
    contexts: ['page'],
    parentId: 'careerate-help'
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId.startsWith('careerate-')) {
    // Get page context from content script
    chrome.tabs.sendMessage(tab.id, { action: 'collectContext' }, (response) => {
      const context = {
        selectedText: info.selectionText,
        pageUrl: tab.url,
        pageTitle: tab.title,
        pageContext: response?.context,
        action: info.menuItemId
      };
      
      // Determine URL based on environment
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://app.careerate.ai' 
        : 'http://localhost:3000';
      
      // Open Careerate with context
      const careereateUrl = `${baseUrl}/help?context=${encodeURIComponent(JSON.stringify(context))}`;
      chrome.tabs.create({ url: careereateUrl });
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'errorDetected') {
    // Show notification about detected error
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon.png',
      title: 'DevOps Error Detected',
      message: 'Careerate detected an error on this page. Click to get help.',
      buttons: [{ title: 'Get Help' }, { title: 'Dismiss' }]
    });
    
    // Store error context
    chrome.storage.local.set({ 
      lastError: {
        context: request.context,
        tabId: sender.tab.id,
        timestamp: Date.now()
      }
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "Get Help" button
    chrome.storage.local.get('lastError', (data) => {
      if (data.lastError) {
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? 'https://app.careerate.ai' 
          : 'http://localhost:3000';
        const careereateUrl = `${baseUrl}/help?context=${encodeURIComponent(JSON.stringify(data.lastError.context))}`;
        chrome.tabs.create({ url: careereateUrl });
      }
    });
  }
}); 