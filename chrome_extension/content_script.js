console.log("Careerate Content Script Loaded");

// Listen for messages from the web page (e.g., after user logs in)
window.addEventListener("message", (event) => {
    // We only accept messages from ourselves
    if (event.source !== window) {
        return;
    }

    if (event.data.type && event.data.type === "CAREERATE_SET_USER_ID") {
        console.log("Content script received user ID:", event.data.userId);
        if (event.data.userId) {
            chrome.runtime.sendMessage({ type: "SET_USER_ID", userId: event.data.userId }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Error sending user ID to background:", chrome.runtime.lastError.message);
                } else {
                    console.log("User ID sent to background script. Response:", response);
                }
            });
        }
    }
}, false);

// Optional: Inform the background script that a page related to Careerate is active,
// so it can potentially request user ID if not set (more complex logic)
// chrome.runtime.sendMessage({ type: "CAREERATE_PAGE_ACTIVE" }); 