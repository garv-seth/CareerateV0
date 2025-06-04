import { CareerateExtensionSettings, defaultSettings, ChromeMessage, GetSettingsRequest, GetSettingsResponse, SettingsUpdatedMessage } from '@/types';

let currentSettings: CareerateExtensionSettings = { ...defaultSettings };

// Load initial settings
chrome.storage.local.get(defaultSettings, (data) => {
  currentSettings = data as CareerateExtensionSettings;
  console.log('Careerate Extension: Background script loaded settings:', currentSettings);
});

// Listen for settings changes from storage (e.g., changed by options page)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    let settingsChanged = false;
    for (const key in changes) {
      if (key in currentSettings) {
        (currentSettings as any)[key] = (changes as any)[key].newValue;
        settingsChanged = true;
      }
    }
    if (settingsChanged) {
      console.log('Careerate Extension: Settings updated in background:', currentSettings);
      // Optionally, notify content scripts if they need to react immediately
      // chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      //   if (tabs[0]?.id) {
      //     chrome.tabs.sendMessage(tabs[0].id, { type: 'SETTINGS_UPDATED_TO_CONTENT', payload: currentSettings });
      //   }
      // });
    }
  }
});

// Listen for messages from other parts of the extension (popup, content scripts)
chrome.runtime.onMessage.addListener((message: ChromeMessage, sender, sendResponse) => {
  console.log('Careerate Extension: Background received message:', message, 'from', sender);

  if (message.type === 'GET_SETTINGS_REQUEST') {
    const response: GetSettingsResponse = {
      type: 'GET_SETTINGS_RESPONSE',
      payload: currentSettings,
    };
    sendResponse(response);
    return true; // Indicates that the response will be sent asynchronously (or synchronously)
  }
  
  if (message.type === 'SETTINGS_UPDATED') {
    // This message comes from options page after it saves settings
    // We re-fetch from storage as the single source of truth, though options sends payload
    chrome.storage.local.get(defaultSettings, (data) => {
        currentSettings = data as CareerateExtensionSettings;
        console.log('Careerate Extension: Settings re-fetched after SETTINGS_UPDATED message:', currentSettings);
    });
    // No sendResponse needed for this specific message type from options
  }

  // Add more message handlers here as needed
  // e.g., for submitting activity data from content script

  // if (message.type === 'SUBMIT_ACTIVITY_REQUEST') {
  //   const activityData = (message as SubmitActivityRequest).payload;
  //   console.log('Activity data received:', activityData);
  //   // TODO: Send to backend API
  //   sendResponse({ status: 'Activity received' });
  // }

  // Keep the message channel open for asynchronous `sendResponse` if you have handlers that are async
  // but for synchronous ones or no response, it's not strictly needed to return true.
  // However, it's a good practice if any part of your listener might be async.
   return true; 
});

chrome.runtime.onInstalled.addListener((details) => {
  console.log('Careerate Extension: Installed or Updated', details);
  // Perform any first-time setup or migration if needed
  // e.g. ensure default settings are in storage
  chrome.storage.local.get(defaultSettings, (data) => {
    chrome.storage.local.set({ ...defaultSettings, ...data });
  });
  if (details.reason === 'install') {
    chrome.runtime.openOptionsPage(); // Open options page on first install
  }
});

console.log('Careerate Extension: Background service worker started.'); 