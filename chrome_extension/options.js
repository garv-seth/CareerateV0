// options.js
document.addEventListener('DOMContentLoaded', () => {
    const userIdInput = document.getElementById('userId');
    const syncIntervalInput = document.getElementById('syncInterval');
    const enableNotificationsInput = document.getElementById('enableNotifications');
    const backendUrlInput = document.getElementById('backendUrl');
    const saveButton = document.getElementById('saveOptions');
    const statusMessage = document.getElementById('statusMessage');

    // Default values
    const DEFAULTS = {
        userId: '',
        syncInterval: 15, // minutes
        enableNotifications: true,
        backendUrl: 'http://localhost:8002/api/v1' // Default for local dev, matches FastAPI service port
    };

    // Load saved options
    function loadOptions() {
        chrome.storage.sync.get(DEFAULTS, (items) => {
            if (chrome.runtime.lastError) {
                statusMessage.textContent = 'Error loading options: ' + chrome.runtime.lastError.message;
                statusMessage.className = 'status-message error';
                return;
            }
            userIdInput.value = items.userId;
            syncIntervalInput.value = items.syncInterval;
            enableNotificationsInput.checked = items.enableNotifications;
            backendUrlInput.value = items.backendUrl;
            console.log('Options loaded:', items);
        });
    }

    // Save options
    function saveOptions() {
        const userId = userIdInput.value.trim();
        const syncInterval = parseInt(syncIntervalInput.value, 10);
        const enableNotifications = enableNotificationsInput.checked;
        const backendUrl = backendUrlInput.value.trim();

        if (!userId) {
            statusMessage.textContent = 'User ID is required.';
            statusMessage.className = 'status-message error';
            userIdInput.focus();
            return;
        }
        if (isNaN(syncInterval) || syncInterval < 5 || syncInterval > 120) {
            statusMessage.textContent = 'Sync interval must be between 5 and 120 minutes.';
            statusMessage.className = 'status-message error';
            syncIntervalInput.focus();
            return;
        }
        if (backendUrl && !isValidHttpUrl(backendUrl)) {
            statusMessage.textContent = 'Backend URL must be a valid HTTP/HTTPS URL.';
            statusMessage.className = 'status-message error';
            backendUrlInput.focus();
            return;
        }

        const optionsToSave = {
            userId: userId,
            syncInterval: syncInterval,
            enableNotifications: enableNotifications,
            backendUrl: backendUrl || DEFAULTS.backendUrl // Save default if empty
        };

        chrome.storage.sync.set(optionsToSave, () => {
            if (chrome.runtime.lastError) {
                statusMessage.textContent = 'Error saving options: ' + chrome.runtime.lastError.message;
                statusMessage.className = 'status-message error';
            } else {
                statusMessage.textContent = 'Options saved successfully!';
                statusMessage.className = 'status-message success';
                console.log('Options saved:', optionsToSave);
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status-message';
                }, 3000);
            }
        });
    }

    // Helper to validate URL
    function isValidHttpUrl(string) {
        let url;
        try {
            url = new URL(string);
        } catch (_) {
            return false;  
        }
        return url.protocol === "http:" || url.protocol === "https:" || string.startsWith("http://localhost");
    }

    saveButton.addEventListener('click', saveOptions);
    loadOptions(); // Load options when the page loads
}); 