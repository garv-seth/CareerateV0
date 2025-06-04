import { CareerateExtensionSettings, defaultSettings } from '@/types';

document.addEventListener('DOMContentLoaded', () => {
  const trackingStatusEl = document.getElementById('trackingStatus');
  const monitoringModeEl = document.getElementById('monitoringMode');
  const openOptionsButton = document.getElementById('openOptionsPage');

  // Load settings and update UI
  chrome.storage.local.get(defaultSettings, (data) => {
    const settings = data as CareerateExtensionSettings;
    updatePopupUI(settings);
  });

  // Listen for changes in storage to keep popup updated
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      // Check if any of our specific settings changed
      if (Object.keys(changes).some(key => key in defaultSettings)) {
        chrome.storage.local.get(defaultSettings, (data) => {
          const updatedSettings = data as CareerateExtensionSettings;
          updatePopupUI(updatedSettings);
        });
      }
    }
  });

  if (openOptionsButton) {
    openOptionsButton.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }

  function updatePopupUI(settings: CareerateExtensionSettings) {
    if (trackingStatusEl) {
      if (settings.isTrackingEnabled) {
        trackingStatusEl.textContent = 'Enabled';
        trackingStatusEl.className = 'enabled';
      } else {
        trackingStatusEl.textContent = 'Disabled';
        trackingStatusEl.className = 'disabled';
      }
    }
    if (monitoringModeEl) {
      if (settings.isTrackingEnabled) {
        monitoringModeEl.textContent = settings.monitoringLevel === 'enhanced' ? 'Enhanced' : 'Standard';
        if (settings.monitoringLevel === 'enhanced' && !settings.screenshotConsentGiven) {
            monitoringModeEl.textContent += ' (No Screenshots)';
        }
      } else {
        monitoringModeEl.textContent = '-';
      }
    }
  }
}); 