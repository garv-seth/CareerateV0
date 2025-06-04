import { CareerateExtensionSettings, ChromeMessage, GetSettingsResponse } from '@/types';

let currentSettings: CareerateExtensionSettings | null = null;
let isSettingsLoaded = false;

function main() {
  console.log('Careerate Extension: Content script injected and running.');

  // Request settings from the background script
  const requestMessage: ChromeMessage = { type: 'GET_SETTINGS_REQUEST' };
  chrome.runtime.sendMessage(requestMessage, (response: GetSettingsResponse) => {
    if (chrome.runtime.lastError) {
      console.error('Careerate Extension: Error getting settings:', chrome.runtime.lastError.message);
      isSettingsLoaded = true; // Mark as loaded to prevent retry loops, even on error
      return;
    }
    
    if (response && response.type === 'GET_SETTINGS_RESPONSE') {
      currentSettings = response.payload;
      isSettingsLoaded = true;
      console.log('Careerate Extension: Content script received settings:', currentSettings);
      initializeMonitoring(currentSettings);
    } else {
      console.error('Careerate Extension: Invalid response from background for settings request.', response);
      isSettingsLoaded = true; // Mark as loaded to prevent retry loops
    }
  });

  // Fallback timeout in case background script doesn't respond (e.g., during extension update)
  setTimeout(() => {
    if (!isSettingsLoaded) {
        console.warn('Careerate Extension: Background script did not respond with settings in time. Monitoring might be disabled or use defaults.');
        // Optionally, try to load from local storage if background is completely unresponsive,
        // but background should be the source of truth for settings consistency.
    }
  }, 2000);
}

function initializeMonitoring(settings: CareerateExtensionSettings) {
  if (!settings.isTrackingEnabled) {
    console.log('Careerate Extension: Tracking is disabled by user settings. No monitoring will occur.');
    return;
  }

  console.log(`Careerate Extension: Initializing ${settings.monitoringLevel} monitoring.`);

  if (settings.monitoringLevel === 'standard') {
    // Implement Standard Monitoring Logic (Phase 2)
    console.log('Careerate Extension: Standard monitoring logic to be implemented.');
    // - Active tab domain/title
    // - Time on domain
    // - Inferred tools (basic)
  } else if (settings.monitoringLevel === 'enhanced') {
    if (settings.screenshotConsentGiven) {
      // Implement Enhanced Monitoring with Screenshots (Phase 2)
      console.log('Careerate Extension: Enhanced monitoring WITH SCREENSHOTS to be implemented.');
    } else {
      // Implement Enhanced Monitoring (non-screenshot parts, or falls back to standard if no other enhanced features)
      console.log('Careerate Extension: Enhanced monitoring (NO screenshots) to be implemented. Currently like Standard.');
    }
  }
  // TODO (Phase 2): Add actual event listeners for activity based on settings (e.g., onfocus, onblur, tab changes via background messages)
}

// Ensure the script runs after the DOM is somewhat ready, though for URL/title it might not matter much.
// For actual content interaction, DOMContentLoaded or window.load would be more critical.
if (document.readyState === "loading") {  // or "interactive" or "complete"
    document.addEventListener("DOMContentLoaded", main);
} else {  // `DOMContentLoaded` has already fired
    main();
} 