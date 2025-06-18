// background.js
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'careerate-help',
      title: 'Ask AIntern Suite about this',
      contexts: ['selection', 'page']
    });
  });
  
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === 'careerate-help') {
      const context = {
        selectedText: info.selectionText,
        pageUrl: tab.url,
        pageTitle: tab.title
      };
      
      // Open Careerate with context
      // In a real app, this would likely open a side panel or a more integrated UI
      // For now, we open a new tab as specified.
      const careereateUrl = `http://localhost:3000/help?context=${encodeURIComponent(JSON.stringify(context))}`;
      chrome.tabs.create({ url: careereateUrl });
    }
  }); 