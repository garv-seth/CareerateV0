import { CareerateExtensionSettings, defaultSettings } from '@/types';

document.addEventListener('DOMContentLoaded', () => {
  const masterToggle = document.getElementById('masterToggle') as HTMLInputElement;
  const monitoringOptionsSection = document.getElementById('monitoringOptionsSection') as HTMLElement;
  
  const standardMonitoringRadio = document.getElementById('standardMonitoring') as HTMLInputElement;
  const enhancedMonitoringRadio = document.getElementById('enhancedMonitoring') as HTMLInputElement;
  
  const screenshotConsentSection = document.getElementById('screenshotConsentSection') as HTMLElement;
  const screenshotConsentToggle = document.getElementById('screenshotConsent') as HTMLInputElement;
  const enhancedDescriptionNoConsent = document.getElementById('enhancedDescriptionNoConsent') as HTMLElement;

  const statusMessage = document.getElementById('statusMessage') as HTMLElement;

  // Load settings and update UI
  chrome.storage.local.get(defaultSettings, (data) => {
    const settings = data as CareerateExtensionSettings;
    masterToggle.checked = settings.isTrackingEnabled;
    
    if (settings.monitoringLevel === 'standard') {
      standardMonitoringRadio.checked = true;
    } else {
      enhancedMonitoringRadio.checked = true;
    }
    screenshotConsentToggle.checked = settings.screenshotConsentGiven;

    updateVisibility();
  });

  // Event Listeners
  masterToggle.addEventListener('change', () => {
    saveSettings();
    updateVisibility();
  });

  standardMonitoringRadio.addEventListener('change', saveSettings);
  enhancedMonitoringRadio.addEventListener('change', () => {
    saveSettings();
    updateVisibility(); // Also update visibility for consent section
  });

  screenshotConsentToggle.addEventListener('change', () => {
    // If user unchecks consent while enhanced is selected, revert enhanced to standard?
    // For now, just save. The backend/content script will ultimately respect this flag.
    saveSettings();
  });

  function updateVisibility() {
    if (masterToggle.checked) {
      monitoringOptionsSection.style.display = 'block';
    } else {
      monitoringOptionsSection.style.display = 'none';
    }

    if (enhancedMonitoringRadio.checked && masterToggle.checked) {
      screenshotConsentSection.style.display = 'block';
      enhancedDescriptionNoConsent.style.display = 'none';
    } else {
      screenshotConsentSection.style.display = 'none';
      enhancedDescriptionNoConsent.style.display = 'block';
    }
  }

  function saveSettings() {
    const settings: CareerateExtensionSettings = {
      isTrackingEnabled: masterToggle.checked,
      monitoringLevel: enhancedMonitoringRadio.checked ? 'enhanced' : 'standard',
      screenshotConsentGiven: screenshotConsentToggle.checked,
      // Add other settings as needed, ensure they have defaults in defaultSettings
    };

    chrome.storage.local.set(settings, () => {
      if (chrome.runtime.lastError) {
        statusMessage.textContent = 'Error saving settings.';
        statusMessage.style.color = 'red';
      } else {
        statusMessage.textContent = 'Settings saved successfully!';
        statusMessage.style.color = 'var(--accent)'; // Use CSS variable
        setTimeout(() => { statusMessage.textContent = ''; }, 3000);
      }
      // Send a message to background script if settings change significantly
      chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED", settings });
    });
    updateVisibility(); // Ensure UI is consistent after save
  }
}); 