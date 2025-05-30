console.log("CareerateV0 Content Script Loaded");

// Placeholder for ActivityDetector
class ActivityDetector {
    constructor() {
        console.log("ActivityDetector initialized");
        this.startTime = Date.now();
    }

    getCurrentActivity() {
        // Placeholder logic: Determine activity based on URL or page content
        let activityType = "browsing";
        if (document.title.toLowerCase().includes("code") || document.title.toLowerCase().includes("develop")) {
            activityType = "coding";
        } else if (document.title.toLowerCase().includes("docs") || document.title.toLowerCase().includes("reference")) {
            activityType = "research";
        }
        return activityType;
    }

    getSessionDuration() {
        // Placeholder: Time since detector was initialized
        return Math.round((Date.now() - this.startTime) / 1000); // in seconds
    }
}

// Placeholder for ToolDetector
class ToolDetector {
    constructor() {
        console.log("ToolDetector initialized");
    }

    getDetectedTools() {
        // Placeholder logic: Detect tools based on page content or known URLs
        const detected = [];
        if (window.location.hostname.includes("github.com")) {
            detected.push("GitHub");
        }
        if (window.location.hostname.includes("stackoverflow.com")) {
            detected.push("Stack Overflow");
        }
        // Add more sophisticated tool detection here
        return detected;
    }
}

class ContentScript {
  constructor() {
    this.activityDetector = new ActivityDetector();
    this.toolDetector = new ToolDetector();
    console.log("ContentScript main class initialized");
    this.init();
  }
  
  detectAndSendActivity() {
    const activity = {
      type: this.activityDetector.getCurrentActivity(),
      tools: this.toolDetector.getDetectedTools(),
      duration: this.activityDetector.getSessionDuration(),
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    console.log("CareerateV0: Detected activity:", activity);
    chrome.runtime.sendMessage({ action: 'trackActivity', data: activity }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("CareerateV0: Error sending message from content script:", chrome.runtime.lastError.message);
        } else {
            console.log("CareerateV0: Message sent from content script, response:", response);
        }
    });
  }

  init() {
    // Send activity once when the script loads (e.g., on page load/navigation)
    this.detectAndSendActivity();

    // Optionally, set up a MutationObserver or other listeners to detect dynamic changes
    // For MVP, a single detection on load might be sufficient.
    // Example: Re-detect on significant DOM changes (simplified)
    // const observer = new MutationObserver(() => {
    //   console.log("CareerateV0: DOM changed, re-detecting activity (throttled).");
    //   // Add throttling if using this to avoid spamming messages
    //   this.detectAndSendActivity(); 
    // });
    // observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Initialize the content script logic only if not already initialized
if (typeof window.careerateContentScript === 'undefined') {
    window.careerateContentScript = new ContentScript();
} else {
    console.log("CareerateV0: Content script already initialized for this page.");
}

// Heartbeat to confirm script is running
console.log("CareerateV0 Content Script execution finished. Listening for events if any."); 