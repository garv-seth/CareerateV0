import { PrivacyManager } from '../privacy/privacy-manager.js';
import { ContextCollector } from '../context/context-collector.js';
import { SyncService } from '../services/sync-service.js';

interface ContextData {
  type: 'error' | 'code' | 'documentation' | 'configuration';
  content: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserSettings {
  enableContextCollection: boolean;
  autoSendContext: boolean;
  allowedDomains: string[];
  privacyLevel: 'strict' | 'balanced' | 'minimal';
  dataRetentionHours: number;
}

class CareerateServiceWorker {
  private privacyManager: PrivacyManager;
  private contextCollector: ContextCollector;
  private syncService: SyncService;
  private contextBuffer: ContextData[] = [];
  private userSettings: UserSettings | null = null;

  constructor() {
    this.privacyManager = new PrivacyManager();
    this.contextCollector = new ContextCollector(this.privacyManager);
    this.syncService = new SyncService();
    
    this.setupEventListeners();
    this.loadUserSettings();
  }

  private setupEventListeners() {
    // Handle extension installation and updates
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    
    // Handle messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Handle context menu clicks
    chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this));
    
    // Handle tab updates for context tracking
    chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this));
    
    // Handle storage changes for settings updates
    chrome.storage.onChanged.addListener(this.handleStorageChange.bind(this));
    
    // Periodic cleanup of old context data
    this.setupPeriodicCleanup();
  }

  private async handleInstalled(details: chrome.runtime.InstalledDetails) {
    if (details.reason === 'install') {
      // First-time installation setup
      await this.setupDefaultSettings();
      await this.createContextMenus();
      
      // Open onboarding page
      chrome.tabs.create({
        url: chrome.runtime.getURL('options/onboarding.html')
      });
    }
  }

  private async setupDefaultSettings() {
    const defaultSettings: UserSettings = {
      enableContextCollection: false, // Opt-in by default
      autoSendContext: false,
      allowedDomains: [],
      privacyLevel: 'strict',
      dataRetentionHours: 1, // Very short retention by default
    };

    await chrome.storage.local.set({ userSettings: defaultSettings });
    this.userSettings = defaultSettings;
  }

  private async createContextMenus() {
    await chrome.contextMenus.removeAll();
    
    chrome.contextMenus.create({
      id: 'careerate-help',
      title: 'Ask Careerate AI about this',
      contexts: ['selection', 'page'],
      documentUrlPatterns: [
        'https://github.com/*',
        'https://console.aws.amazon.com/*',
        'https://portal.azure.com/*',
        'https://console.cloud.google.com/*',
        'https://grafana.com/*',
        'https://app.datadoghq.com/*',
        'https://stackoverflow.com/*'
      ]
    });

    chrome.contextMenus.create({
      id: 'careerate-explain',
      title: 'Explain this error with AI',
      contexts: ['selection'],
      documentUrlPatterns: ['<all_urls>']
    });
  }

  private async handleMessage(
    message: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void
  ) {
    try {
      switch (message.type) {
        case 'COLLECT_CONTEXT':
          await this.handleContextCollection(message.data, sender);
          sendResponse({ success: true });
          break;

        case 'GET_AI_HELP':
          const response = await this.getAIHelp(message.data);
          sendResponse(response);
          break;

        case 'UPDATE_SETTINGS':
          await this.updateSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'GET_CONTEXT_BUFFER':
          sendResponse({ contexts: this.contextBuffer });
          break;

        case 'CLEAR_CONTEXT':
          await this.clearContext();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }

    return true; // Keep message channel open for async response
  }

  private async handleContextCollection(data: ContextData, sender: chrome.runtime.MessageSender) {
    if (!this.userSettings?.enableContextCollection) {
      return;
    }

    // Privacy filtering
    if (!await this.privacyManager.isDataSafeToCollect(data, this.userSettings)) {
      console.log('Context collection blocked by privacy filters');
      return;
    }

    // Add source information
    data.source = sender.tab?.url || 'unknown';
    data.timestamp = Date.now();

    // Buffer the context
    this.contextBuffer.push(data);

    // Limit buffer size
    if (this.contextBuffer.length > 50) {
      this.contextBuffer = this.contextBuffer.slice(-25);
    }

    // Auto-sync if enabled
    if (this.userSettings.autoSendContext) {
      await this.syncContextToServer();
    }

    // Store locally for popup access
    await chrome.storage.local.set({
      recentContexts: this.contextBuffer.slice(-10)
    });
  }

  private async handleContextMenu(
    info: chrome.contextMenus.OnClickData,
    tab?: chrome.tabs.Tab
  ) {
    if (!tab?.id) return;

    switch (info.menuItemId) {
      case 'careerate-help':
        await this.openAIChat(info.selectionText || 'Help with current page', tab);
        break;

      case 'careerate-explain':
        if (info.selectionText) {
          await this.explainError(info.selectionText, tab);
        }
        break;
    }
  }

  private async openAIChat(initialMessage: string, tab: chrome.tabs.Tab) {
    // Collect current page context
    const context = await this.contextCollector.collectPageContext(tab.id!);
    
    // Open chat interface
    const chatUrl = `${await this.getCareereateBaseUrl()}/chat?context=${encodeURIComponent(JSON.stringify(context))}&message=${encodeURIComponent(initialMessage)}`;
    
    chrome.tabs.create({ url: chatUrl });
  }

  private async explainError(errorText: string, tab: chrome.tabs.Tab) {
    try {
      const explanation = await this.syncService.getErrorExplanation(errorText, {
        source: tab.url,
        userAgent: navigator.userAgent
      });

      // Show explanation in popup or notification
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF6B35' });

      // Store explanation for popup
      await chrome.storage.local.set({
        lastExplanation: {
          error: errorText,
          explanation,
          timestamp: Date.now()
        }
      });

    } catch (error) {
      console.error('Error explaining:', error);
    }
  }

  private async handleTabUpdate(
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
    tab: chrome.tabs.Tab
  ) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Track DevOps tool usage patterns (anonymized)
      await this.trackToolUsage(tab.url);
      
      // Clear badge when navigating
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }

  private async trackToolUsage(url: string) {
    if (!this.userSettings?.enableContextCollection) return;

    const toolPatterns = {
      github: /github\.com/,
      aws: /console\.aws\.amazon\.com/,
      azure: /portal\.azure\.com/,
      gcp: /console\.cloud\.google\.com/,
      grafana: /grafana/,
      datadog: /datadoghq\.com/,
      kubernetes: /kubernetes/,
      terraform: /terraform/
    };

    for (const [tool, pattern] of Object.entries(toolPatterns)) {
      if (pattern.test(url)) {
        // Anonymous usage tracking
        const usage = await chrome.storage.local.get('toolUsage') || { toolUsage: {} };
        usage.toolUsage[tool] = (usage.toolUsage[tool] || 0) + 1;
        await chrome.storage.local.set(usage);
        break;
      }
    }
  }

  private async handleStorageChange(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.AreaName
  ) {
    if (changes.userSettings && areaName === 'local') {
      this.userSettings = changes.userSettings.newValue;
      
      // Update context menus based on new settings
      if (this.userSettings.enableContextCollection) {
        await this.createContextMenus();
      } else {
        await chrome.contextMenus.removeAll();
      }
    }
  }

  private async loadUserSettings() {
    const stored = await chrome.storage.local.get('userSettings');
    this.userSettings = stored.userSettings || null;
  }

  private async updateSettings(newSettings: Partial<UserSettings>) {
    this.userSettings = { ...this.userSettings!, ...newSettings };
    await chrome.storage.local.set({ userSettings: this.userSettings });
  }

  private async getAIHelp(data: { query: string; context?: any }) {
    try {
      return await this.syncService.getChatResponse(data.query, {
        context: data.context,
        buffer: this.contextBuffer
      });
    } catch (error) {
      console.error('Error getting AI help:', error);
      return { error: 'Failed to get AI assistance' };
    }
  }

  private async syncContextToServer() {
    if (this.contextBuffer.length === 0) return;

    try {
      await this.syncService.syncContext(this.contextBuffer);
      // Clear buffer after successful sync
      this.contextBuffer = [];
    } catch (error) {
      console.error('Failed to sync context:', error);
    }
  }

  private async clearContext() {
    this.contextBuffer = [];
    await chrome.storage.local.remove(['recentContexts', 'lastExplanation']);
    chrome.action.setBadgeText({ text: '' });
  }

  private setupPeriodicCleanup() {
    // Clean up old context data every hour
    setInterval(async () => {
      if (!this.userSettings) return;

      const cutoffTime = Date.now() - (this.userSettings.dataRetentionHours * 60 * 60 * 1000);
      
      this.contextBuffer = this.contextBuffer.filter(
        context => context.timestamp > cutoffTime
      );

      // Clean up stored data too
      const stored = await chrome.storage.local.get('recentContexts');
      if (stored.recentContexts) {
        const filtered = stored.recentContexts.filter(
          (context: ContextData) => context.timestamp > cutoffTime
        );
        await chrome.storage.local.set({ recentContexts: filtered });
      }
    }, 60 * 60 * 1000); // Every hour
  }

  private async getCareereateBaseUrl(): Promise<string> {
    // In production, this would be your deployed URL
    return 'https://careerate.azurewebsites.net';
  }
}

// Initialize the service worker
const serviceWorker = new CareerateServiceWorker();

export default serviceWorker; 