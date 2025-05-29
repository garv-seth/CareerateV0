/**
 * Enhanced Chrome Extension Background Service Worker
 * Careerate AI Career Acceleration Platform
 * 
 * Features:
 * - AI-powered activity pattern detection
 * - Privacy-first data collection
 * - Real-time recommendation synchronization
 * - Advanced workflow analysis
 * - Secure communication with backend
 */

// Configuration
const CONFIG = {
  API_BASE_URL: 'https://api.gocareerate.com/api/v1',
  LOCAL_API_URL: 'http://localhost:8000/api/v1',
  SYNC_INTERVAL: 300000, // 5 minutes
  BATCH_SIZE: 50,
  MAX_STORAGE_ITEMS: 1000,
  PRIVACY_MODE: true,
  DEBUG: false
};

// Activity tracking state
let activityTracker = {
  currentSession: null,
  activityBuffer: [],
  lastSyncTime: 0,
  isTracking: false,
  currentTab: null,
  productivityScore: 0.5
};

// AI-powered activity detection patterns
const ACTIVITY_PATTERNS = {
  writing: {
    keywords: ['document', 'editor', 'write', 'compose', 'draft', 'blog', 'article'],
    domains: ['docs.google.com', 'notion.so', 'medium.com', 'wordpress.com'],
    indicators: ['textarea', 'contenteditable', 'editor']
  },
  coding: {
    keywords: ['github', 'gitlab', 'code', 'programming', 'development', 'ide'],
    domains: ['github.com', 'gitlab.com', 'codepen.io', 'codesandbox.io', 'replit.com'],
    indicators: ['code', 'pre', 'monaco-editor']
  },
  research: {
    keywords: ['research', 'study', 'learn', 'documentation', 'wiki', 'search'],
    domains: ['wikipedia.org', 'stackoverflow.com', 'scholar.google.com'],
    indicators: ['search', 'article', 'documentation']
  },
  design: {
    keywords: ['design', 'creative', 'graphics', 'ui', 'ux', 'prototype'],
    domains: ['figma.com', 'canva.com', 'dribbble.com', 'behance.net'],
    indicators: ['canvas', 'svg', 'design-tool']
  },
  communication: {
    keywords: ['email', 'chat', 'meeting', 'call', 'message', 'slack'],
    domains: ['gmail.com', 'outlook.com', 'slack.com', 'zoom.us', 'teams.microsoft.com'],
    indicators: ['message', 'chat', 'email']
  },
  productivity: {
    keywords: ['task', 'project', 'manage', 'plan', 'organize', 'calendar'],
    domains: ['trello.com', 'asana.com', 'calendar.google.com', 'todoist.com'],
    indicators: ['task', 'calendar', 'project']
  }
};

// AI tool detection patterns
const AI_TOOLS_PATTERNS = {
  'gpt': ['openai.com', 'chat.openai.com', 'chatgpt'],
  'claude': ['anthropic.com', 'claude.ai'],
  'copilot': ['github.com/copilot', 'copilot'],
  'midjourney': ['midjourney.com', 'discord.com/channels'],
  'notion-ai': ['notion.so'],
  'grammarly': ['grammarly.com', 'app.grammarly.com'],
  'jasper': ['jasper.ai', 'app.jasper.ai'],
  'copy-ai': ['copy.ai']
};

class AdvancedActivityTracker {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.activityBuffer = [];
    this.currentContext = {};
    this.privacyFilter = new PrivacyFilter();
    this.patternAnalyzer = new PatternAnalyzer();
    this.apiClient = new APIClient();
  }

  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async startTracking() {
    console.log('🚀 Starting enhanced activity tracking...');
    activityTracker.isTracking = true;
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Start periodic sync
    this.startPeriodicSync();
    
    // Initialize user context
    await this.initializeUserContext();
  }

  setupEventListeners() {
    // Tab activation
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      await this.handleTabChange(activeInfo.tabId);
    });

    // Tab updates
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        await this.handleTabChange(tabId);
      }
    });

    // Window focus changes
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        const [activeTab] = await chrome.tabs.query({ active: true, windowId });
        if (activeTab) {
          await this.handleTabChange(activeTab.id);
        }
      }
    });

    // Alarm for periodic tasks
    chrome.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === 'syncData') {
        this.syncActivityData();
      } else if (alarm.name === 'analyzePatterns') {
        this.analyzeUserPatterns();
      }
    });
  }

  async handleTabChange(tabId) {
    try {
      const tab = await chrome.tabs.get(tabId);
      if (!tab.url || tab.url.startsWith('chrome://')) return;

      // End previous activity if exists
      if (activityTracker.currentSession) {
        await this.endActivity();
      }

      // Start new activity
      await this.startActivity(tab);
      
    } catch (error) {
      console.error('Error handling tab change:', error);
    }
  }

  async startActivity(tab) {
    const activityType = this.detectActivityType(tab);
    const aiTools = this.detectAITools(tab);
    
    const activity = {
      sessionId: this.sessionId,
      tabId: tab.id,
      url: this.privacyFilter.sanitizeUrl(tab.url),
      domain: this.getDomain(tab.url),
      title: this.privacyFilter.sanitizeTitle(tab.title),
      activityType,
      aiToolsDetected: aiTools,
      startTime: Date.now(),
      context: await this.getPageContext(tab)
    };

    activityTracker.currentSession = activity;
    activityTracker.currentTab = tab;
    
    console.log('📊 Activity started:', activityType, 'on', activity.domain);
  }

  async endActivity() {
    if (!activityTracker.currentSession) return;

    const duration = Date.now() - activityTracker.currentSession.startTime;
    
    // Only track activities longer than 10 seconds
    if (duration < 10000) return;

    const completedActivity = {
      ...activityTracker.currentSession,
      endTime: Date.now(),
      duration,
      productivityScore: this.calculateProductivityScore(duration, activityTracker.currentSession.activityType)
    };

    // Add to buffer
    this.activityBuffer.push(completedActivity);
    
    // Store locally
    await this.storeActivityLocally(completedActivity);
    
    // Update productivity score
    this.updateProductivityScore(completedActivity);
    
    console.log('✅ Activity completed:', completedActivity.activityType, `(${Math.round(duration/1000)}s)`);
    
    activityTracker.currentSession = null;
  }

  detectActivityType(tab) {
    const url = tab.url.toLowerCase();
    const title = tab.title.toLowerCase();
    const domain = this.getDomain(tab.url);

    // Check domain patterns first
    for (const [activityType, pattern] of Object.entries(ACTIVITY_PATTERNS)) {
      if (pattern.domains.some(d => domain.includes(d))) {
        return activityType;
      }
    }

    // Check keyword patterns
    for (const [activityType, pattern] of Object.entries(ACTIVITY_PATTERNS)) {
      const hasKeyword = pattern.keywords.some(keyword => 
        url.includes(keyword) || title.includes(keyword)
      );
      if (hasKeyword) {
        return activityType;
      }
    }

    // Default categorization
    if (domain.includes('google.com') && url.includes('search')) {
      return 'research';
    }
    
    return 'browsing';
  }

  detectAITools(tab) {
    const url = tab.url.toLowerCase();
    const domain = this.getDomain(tab.url);
    const detectedTools = [];

    for (const [toolName, patterns] of Object.entries(AI_TOOLS_PATTERNS)) {
      const isDetected = patterns.some(pattern => 
        url.includes(pattern) || domain.includes(pattern)
      );
      
      if (isDetected) {
        detectedTools.push(toolName);
      }
    }

    return detectedTools;
  }

  async getPageContext(tab) {
    try {
      // Inject content script to get page context
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: this.extractPageContext
      });
      
      return this.privacyFilter.sanitizeContext(result.result || {});
    } catch (error) {
      console.warn('Could not extract page context:', error);
      return {};
    }
  }

  extractPageContext() {
    // This function runs in the page context
    const context = {
      hasTextEditor: !!(document.querySelector('textarea, [contenteditable="true"]')),
      hasCodeEditor: !!(document.querySelector('pre code, .monaco-editor, .ace_editor')),
      hasCanvas: !!(document.querySelector('canvas')),
      formCount: document.querySelectorAll('form').length,
      linkCount: document.querySelectorAll('a').length,
      wordCount: document.body.innerText.split(/\s+/).length,
      hasVideoCall: !!(document.querySelector('[class*="video"], [class*="camera"], [class*="call"]')),
      toolIndicators: []
    };

    // Detect specific tool indicators
    const toolSelectors = {
      'notion': '[data-block-id], .notion-page-content',
      'figma': '.figma_view, [class*="figma"]',
      'github': '.repository-content, .file-navigation',
      'docs': '.docs-texteventtarget-iframe, [role="textbox"]',
      'slack': '[data-qa="message_input"], .c-message_list'
    };

    for (const [tool, selector] of Object.entries(toolSelectors)) {
      if (document.querySelector(selector)) {
        context.toolIndicators.push(tool);
      }
    }

    return context;
  }

  calculateProductivityScore(duration, activityType) {
    // Base scores for different activity types
    const baseScores = {
      coding: 0.9,
      writing: 0.8,
      design: 0.85,
      research: 0.7,
      productivity: 0.75,
      communication: 0.6,
      browsing: 0.4
    };

    let score = baseScores[activityType] || 0.5;
    
    // Adjust based on duration (longer focused sessions are more productive)
    const durationMinutes = duration / (1000 * 60);
    if (durationMinutes > 30) {
      score += 0.1;
    } else if (durationMinutes < 2) {
      score -= 0.2;
    }

    return Math.max(0, Math.min(1, score));
  }

  updateProductivityScore(activity) {
    // Exponential moving average
    const alpha = 0.1;
    activityTracker.productivityScore = 
      alpha * activity.productivityScore + 
      (1 - alpha) * activityTracker.productivityScore;
  }

  async storeActivityLocally(activity) {
    try {
      const result = await chrome.storage.local.get(['activities']);
      const activities = result.activities || [];
      
      activities.push(activity);
      
      // Limit stored activities
      if (activities.length > CONFIG.MAX_STORAGE_ITEMS) {
        activities.splice(0, activities.length - CONFIG.MAX_STORAGE_ITEMS);
      }
      
      await chrome.storage.local.set({ activities });
    } catch (error) {
      console.error('Error storing activity locally:', error);
    }
  }

  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }

  startPeriodicSync() {
    // Create alarms for periodic tasks
    chrome.alarms.create('syncData', { periodInMinutes: 5 });
    chrome.alarms.create('analyzePatterns', { periodInMinutes: 30 });
  }

  async syncActivityData() {
    if (this.activityBuffer.length === 0) return;

    try {
      const userData = await this.getUserData();
      if (!userData) return;

      const batchData = {
        userId: userData.id,
        activities: this.activityBuffer.splice(0, CONFIG.BATCH_SIZE),
        currentProductivityScore: activityTracker.productivityScore,
        sessionMetadata: {
          sessionId: this.sessionId,
          startTime: this.startTime,
          userAgent: navigator.userAgent,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      const success = await this.apiClient.syncActivities(batchData);
      
      if (success) {
        console.log('✅ Activity data synced successfully');
        activityTracker.lastSyncTime = Date.now();
        
        // Get fresh recommendations
        await this.fetchRecommendations(userData.id);
      } else {
        // Re-add failed activities to buffer
        this.activityBuffer.unshift(...batchData.activities);
      }
      
    } catch (error) {
      console.error('Error syncing activity data:', error);
    }
  }

  async fetchRecommendations(userId) {
    try {
      const recommendations = await this.apiClient.getRecommendations(userId);
      
      if (recommendations && recommendations.length > 0) {
        // Store recommendations locally
        await chrome.storage.local.set({ 
          recommendations,
          lastRecommendationUpdate: Date.now()
        });
        
        // Show notification for new recommendations
        this.showRecommendationNotification(recommendations.length);
        
        console.log(`📋 Received ${recommendations.length} new recommendations`);
      }
      
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    }
  }

  showRecommendationNotification(count) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'New AI Tool Recommendations',
      message: `${count} personalized recommendations available based on your workflow!`
    });
  }

  async analyzeUserPatterns() {
    try {
      const result = await chrome.storage.local.get(['activities']);
      const activities = result.activities || [];
      
      if (activities.length < 10) return; // Need sufficient data
      
      const patterns = this.patternAnalyzer.analyzePatterns(activities);
      
      await chrome.storage.local.set({ 
        userPatterns: patterns,
        lastPatternAnalysis: Date.now()
      });
      
      console.log('🧠 User patterns analyzed:', patterns);
      
    } catch (error) {
      console.error('Error analyzing patterns:', error);
    }
  }

  async getUserData() {
    try {
      const result = await chrome.storage.local.get(['userData']);
      return result.userData;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async initializeUserContext() {
    try {
      // Check if user is authenticated
      const userData = await this.getUserData();
      
      if (!userData) {
        // Show onboarding notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Welcome to Careerate',
          message: 'Click the extension icon to get started with AI tool recommendations!'
        });
      } else {
        console.log('👤 User authenticated:', userData.email);
        
        // Fetch initial recommendations
        await this.fetchRecommendations(userData.id);
      }
      
    } catch (error) {
      console.error('Error initializing user context:', error);
    }
  }
}

class PrivacyFilter {
  sanitizeUrl(url) {
    if (!url) return '';
    
    try {
      const urlObj = new URL(url);
      
      // Remove sensitive parameters
      const sensitiveParams = ['token', 'key', 'password', 'email', 'user', 'id'];
      sensitiveParams.forEach(param => urlObj.searchParams.delete(param));
      
      // Only keep domain and path for certain sites
      const safeDomains = ['github.com', 'stackoverflow.com', 'docs.google.com'];
      
      if (safeDomains.some(domain => urlObj.hostname.includes(domain))) {
        return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
      }
      
      // For other sites, just return domain
      return `${urlObj.protocol}//${urlObj.hostname}`;
      
    } catch {
      return '';
    }
  }

  sanitizeTitle(title) {
    if (!title) return '';
    
    // Remove potential personal information
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email pattern
      /\b\d{4}-\d{4}-\d{4}-\d{4}\b/ // Credit card pattern
    ];
    
    let sanitized = title;
    sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    });
    
    // Limit length
    return sanitized.substring(0, 100);
  }

  sanitizeContext(context) {
    // Remove potentially sensitive context information
    const safe = { ...context };
    
    // Remove specific content, keep only structural information
    delete safe.textContent;
    delete safe.formData;
    delete safe.personalInfo;
    
    return safe;
  }
}

class PatternAnalyzer {
  analyzePatterns(activities) {
    const patterns = {
      totalActivities: activities.length,
      averageSessionDuration: 0,
      activityDistribution: {},
      productivityTrends: [],
      aiToolUsage: {},
      workingHours: {},
      focusPatterns: {}
    };

    if (activities.length === 0) return patterns;

    // Calculate averages and distributions
    let totalDuration = 0;
    const activityCounts = {};
    const aiToolCounts = {};
    const hourlyActivity = Array(24).fill(0);

    activities.forEach(activity => {
      totalDuration += activity.duration;
      
      // Activity type distribution
      activityCounts[activity.activityType] = (activityCounts[activity.activityType] || 0) + 1;
      
      // AI tool usage
      activity.aiToolsDetected?.forEach(tool => {
        aiToolCounts[tool] = (aiToolCounts[tool] || 0) + 1;
      });
      
      // Working hours analysis
      const hour = new Date(activity.startTime).getHours();
      hourlyActivity[hour]++;
    });

    patterns.averageSessionDuration = totalDuration / activities.length;
    patterns.activityDistribution = activityCounts;
    patterns.aiToolUsage = aiToolCounts;
    
    // Find peak working hours
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    patterns.workingHours = {
      peakHour,
      distribution: hourlyActivity
    };

    // Focus patterns (sessions longer than 20 minutes)
    const focusSessions = activities.filter(a => a.duration > 20 * 60 * 1000);
    patterns.focusPatterns = {
      count: focusSessions.length,
      percentage: (focusSessions.length / activities.length) * 100,
      averageDuration: focusSessions.reduce((sum, a) => sum + a.duration, 0) / (focusSessions.length || 1)
    };

    return patterns;
  }
}

class APIClient {
  constructor() {
    this.baseUrl = CONFIG.DEBUG ? CONFIG.LOCAL_API_URL : CONFIG.API_BASE_URL;
  }

  async syncActivities(data) {
    try {
      const response = await fetch(`${this.baseUrl}/activity/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('API sync error:', error);
      return false;
    }
  }

  async getRecommendations(userId) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.recommendations || [];
      }
      
      return [];
    } catch (error) {
      console.error('API recommendations error:', error);
      return [];
    }
  }

  async submitFeedback(feedbackData) {
    try {
      const response = await fetch(`${this.baseUrl}/recommendations/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      });

      return response.ok;
    } catch (error) {
      console.error('API feedback error:', error);
      return false;
    }
  }
}

// Message handling for popup communication
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  handleMessage(request, sender, sendResponse);
  return true; // Keep channel open for async response
});

async function handleMessage(request, sender, sendResponse) {
  try {
    switch (request.action) {
      case 'getActivityStats':
        const stats = await getActivityStats();
        sendResponse({ success: true, data: stats });
        break;
        
      case 'getRecommendations':
        const recommendations = await getStoredRecommendations();
        sendResponse({ success: true, data: recommendations });
        break;
        
      case 'submitFeedback':
        const success = await submitRecommendationFeedback(request.data);
        sendResponse({ success });
        break;
        
      case 'getUserPatterns':
        const patterns = await getUserPatterns();
        sendResponse({ success: true, data: patterns });
        break;
        
      case 'forceSync':
        await tracker.syncActivityData();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Message handling error:', error);
    sendResponse({ success: false, error: error.message });
  }
}

async function getActivityStats() {
  try {
    const result = await chrome.storage.local.get(['activities']);
    const activities = result.activities || [];
    
    const last24h = activities.filter(a => 
      Date.now() - a.startTime < 24 * 60 * 60 * 1000
    );
    
    return {
      totalSessions: last24h.length,
      totalTime: last24h.reduce((sum, a) => sum + a.duration, 0),
      averageProductivity: activityTracker.productivityScore,
      topActivities: getTopActivities(last24h),
      aiToolsUsed: getAIToolsUsed(last24h)
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    return null;
  }
}

async function getStoredRecommendations() {
  try {
    const result = await chrome.storage.local.get(['recommendations']);
    return result.recommendations || [];
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return [];
  }
}

async function submitRecommendationFeedback(feedbackData) {
  try {
    const apiClient = new APIClient();
    return await apiClient.submitFeedback(feedbackData);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
}

async function getUserPatterns() {
  try {
    const result = await chrome.storage.local.get(['userPatterns']);
    return result.userPatterns || null;
  } catch (error) {
    console.error('Error getting user patterns:', error);
    return null;
  }
}

function getTopActivities(activities) {
  const counts = {};
  activities.forEach(a => {
    counts[a.activityType] = (counts[a.activityType] || 0) + 1;
  });
  
  return Object.entries(counts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));
}

function getAIToolsUsed(activities) {
  const tools = new Set();
  activities.forEach(a => {
    a.aiToolsDetected?.forEach(tool => tools.add(tool));
  });
  return Array.from(tools);
}

// Initialize the enhanced activity tracker
const tracker = new AdvancedActivityTracker();

// Start tracking when extension loads
chrome.runtime.onStartup.addListener(() => {
  tracker.startTracking();
});

chrome.runtime.onInstalled.addListener(() => {
  tracker.startTracking();
});

// Start tracking immediately
tracker.startTracking();

console.log('🎯 Careerate Enhanced Chrome Extension loaded successfully!'); 