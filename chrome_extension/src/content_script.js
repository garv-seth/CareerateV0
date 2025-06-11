// This script runs on the pages the user visits.

// Function to detect the context of the current page
function detectPageContext() {
  const { hostname, pathname } = window.location;

  // GitHub Detection
  if (hostname.includes('github.com')) {
    if (pathname.includes('/pull/')) {
      return { tool: 'GitHub', context: 'Pull Request', details: { pr: pathname.split('/pull/')[1] } };
    }
    if (pathname.includes('/issues/')) {
      return { tool: 'GitHub', context: 'Issue', details: { issue: pathname.split('/issues/')[1] } };
    }
    return { tool: 'GitHub', context: 'Repository', details: { repo: pathname.substring(1) } };
  }

  // AWS Console Detection
  if (hostname.includes('.console.aws.amazon.com')) {
    const service = pathname.split('/')[1] || 'home';
    return { tool: 'AWS Console', context: 'Service', details: { service } };
  }
  
  // Kubernetes Dashboard (Heuristic)
  if (document.title.toLowerCase().includes('kubernetes dashboard')) {
      return { tool: 'Kubernetes', context: 'Dashboard', details: {} };
  }

  // Grafana Detection
  if (document.querySelector('div[ng-app="grafana"]')) {
      return { tool: 'Grafana', context: 'Dashboard', details: { path: pathname } };
  }

  // Default
  return { tool: 'Unknown', context: 'General', details: { title: document.title } };
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContext') {
    const context = detectPageContext();
    sendResponse(context);
  }
}); 