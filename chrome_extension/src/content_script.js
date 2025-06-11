// This script runs on the pages the user visits.

console.log('Careerate AI Content Script Loaded.');

// Function to extract relevant content from the page
const extractPageContent = () => {
  const title = document.title;
  const h1 = document.querySelector('h1')?.innerText;
  const description = document.querySelector('meta[name="description"]')?.content;

  // In a real scenario, this would be much more sophisticated,
  // potentially extracting main articles, code blocks, form fields, etc.
  return {
    title,
    h1,
    description,
    url: window.location.href,
  };
};

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received in content script:', request);

  if (request.action === 'extractPageContent') {
    const content = extractPageContent();
    sendResponse(content);
  }

  // Example for future use: performing an action on the page
  if (request.action === 'fillForm') {
    // const element = document.querySelector(request.selector);
    // if (element) element.value = request.value;
    sendResponse({ status: 'Action completed' });
  }

  return true; // Keep the message channel open for asynchronous response
}); 