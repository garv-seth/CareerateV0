document.addEventListener('DOMContentLoaded', () => {
    const pageReadingCheckbox = document.getElementById('allow-page-reading');
    const formFillingCheckbox = document.getElementById('allow-form-filling');
    const clickingCheckbox = document.getElementById('allow-clicking');
    const saveButton = document.getElementById('save-button');
    const statusMessage = document.getElementById('status-message');

    // Define default settings
    const defaultPermissions = {
        allowPageReading: true,
        allowFormFilling: false,
        allowClicking: false
    };

    // Load saved settings and update the UI
    const loadSettings = () => {
        chrome.storage.sync.get(defaultPermissions, (items) => {
            if (pageReadingCheckbox) pageReadingCheckbox.checked = items.allowPageReading;
            if (formFillingCheckbox) formFillingCheckbox.checked = items.allowFormFilling;
            if (clickingCheckbox) clickingCheckbox.checked = items.allowClicking;
        });
    };

    // Save settings to chrome.storage
    const saveSettings = () => {
        const newPermissions = {
            allowPageReading: pageReadingCheckbox.checked,
            allowFormFilling: formFillingCheckbox.checked,
            allowClicking: clickingCheckbox.checked
        };

        chrome.storage.sync.set(newPermissions, () => {
            if (statusMessage) {
                statusMessage.textContent = 'Settings saved!';
                setTimeout(() => {
                    statusMessage.textContent = '';
                }, 2000);
            }
        });
    };

    // Add event listeners
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }

    // Initial load
    loadSettings();
}); 