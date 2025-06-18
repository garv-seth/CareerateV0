// content.js

class ContextCollector {
    constructor() {
        this.sensitivePatterns = [
            /password/i, /api[_-]?key/i, /secret/i, /token/i,
            /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit cards
            /\b[\w\.-]+@[\w\.-]+\.\w+\b/ // Email addresses
        ];
    }
  
    collectPageContext() {
      const url = window.location.href;
      const isDevOpsRelated = this.isDevOpsContext(url);
      
      if (!isDevOpsRelated) return null;
  
      return {
        url,
        title: document.title,
        errorMessages: this.extractErrorMessages(),
        codeSnippets: this.extractCodeSnippets(),
        toolType: this.detectToolType(url),
        timestamp: Date.now()
      };
    }
  
    isDevOpsContext(url) {
      const devOpsPatterns = [
        /github\.com/,
        /console\.aws\.amazon\.com/,
        /console\.cloud\.google\.com/,
        /portal\.azure\.com/,
        /app\.kubernetes\.io/,
        /grafana/,
        /prometheus/,
        /jenkins/,
        /stackoverflow\.com.*devops|kubernetes|terraform|docker/i
      ];
      
      return devOpsPatterns.some(pattern => pattern.test(url));
    }

    containsSensitiveData(text) {
        return this.sensitivePatterns.some(pattern => pattern.test(text));
    }
  
    extractErrorMessages() {
      const errorSelectors = [
        '.error', '.alert-danger', '.error-message',
        '[class*="error"]', '[class*="fail"]'
      ];
      
      const errors = [];
      errorSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
          const text = el.textContent?.trim();
          if (text && !this.containsSensitiveData(text)) {
            errors.push(text);
          }
        });
      });
      
      return errors;
    }

    extractCodeSnippets() {
        const codeSelectors = ['pre', 'code'];
        const snippets = [];
        document.querySelectorAll(codeSelectors.join(',')).forEach(el => {
            const text = el.textContent?.trim();
            if (text && !this.containsSensitiveData(text)) {
                snippets.push(text);
            }
        });
        return snippets;
    }

    detectToolType(url) {
        if (url.includes('github.com')) return 'github';
        if (url.includes('console.aws.amazon.com')) return 'aws';
        if (url.includes('portal.azure.com')) return 'azure';
        if (url.includes('kubernetes.io')) return 'kubernetes';
        if (url.includes('grafana')) return 'grafana';
        return 'unknown';
    }
}

// Initialize and set up message handling
console.log("Careerate AIntern Suite content script loaded.");
const collector = new ContextCollector();

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'collectContext') {
    const context = collector.collectPageContext();
    sendResponse({ context });
  } else if (request.action === 'getSelection') {
    const selection = window.getSelection().toString();
    sendResponse({ selection });
  }
  return true;
});

// Auto-detect and notify about errors
const observeErrors = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        const context = collector.collectPageContext();
        if (context && context.errorMessages.length > 0) {
          chrome.runtime.sendMessage({
            action: 'errorDetected',
            context
          });
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

// Start observing when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', observeErrors);
} else {
  observeErrors();
} 