// Privacy Manager for Chrome Extension
export interface DataClassification {
  type: 'safe' | 'sensitive' | 'secret';
  confidence: number;
  reason: string;
}

export interface UserSettings {
  enableContextCollection: boolean;
  autoSendContext: boolean;
  allowedDomains: string[];
  privacyLevel: 'strict' | 'balanced' | 'minimal';
  dataRetentionHours: number;
}

export class PrivacyManager {
  private sensitivePatterns: RegExp[] = [
    // API Keys and tokens
    /api[_-]?key/i,
    /access[_-]?token/i,
    /secret[_-]?key/i,
    /bearer\s+[a-zA-Z0-9\-._~+/]+=*/i,
    
    // Passwords
    /password/i,
    /passwd/i,
    /pwd/i,
    
    // Personal information
    /\b[\w\.-]+@[\w\.-]+\.\w+\b/, // Email addresses
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
    /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit cards
    
    // Network information
    /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, // IP addresses (private)
    
    // Database connections
    /connection[_-]?string/i,
    /database[_-]?url/i,
    
    // Cloud credentials
    /aws[_-]?access[_-]?key/i,
    /aws[_-]?secret/i,
    /azure[_-]?key/i,
    /gcp[_-]?key/i,
  ];

  private safeErrorPatterns: RegExp[] = [
    // Build/compilation errors
    /error\s*:\s*cannot find module/i,
    /syntax error/i,
    /compilation failed/i,
    /build failed/i,
    
    // Terraform errors
    /terraform.*error/i,
    /plan failed/i,
    /apply failed/i,
    
    // Kubernetes errors
    /pod.*failed/i,
    /deployment.*failed/i,
    /service.*not found/i,
    
    // HTTP errors
    /404.*not found/i,
    /500.*internal server error/i,
    /connection refused/i,
    /timeout/i,
  ];

  private userSettings: UserSettings | null = null;

  constructor() {
    this.loadUserSettings();
  }

  private async loadUserSettings(): Promise<void> {
    try {
      const result = await chrome.storage.local.get('userSettings');
      this.userSettings = result.userSettings || this.getDefaultSettings();
    } catch (error) {
      console.error('Failed to load user settings:', error);
      this.userSettings = this.getDefaultSettings();
    }
  }

  private getDefaultSettings(): UserSettings {
    return {
      enableContextCollection: false,
      autoSendContext: false,
      allowedDomains: [],
      privacyLevel: 'strict',
      dataRetentionHours: 1,
    };
  }

  async isDataSafeToCollect(data: any, userSettings?: UserSettings): Promise<boolean> {
    const settings = userSettings || this.userSettings || this.getDefaultSettings();
    
    if (!settings.enableContextCollection) {
      return false;
    }

    // Check if domain is allowed
    const currentDomain = window.location.hostname;
    if (settings.allowedDomains.length > 0 && !settings.allowedDomains.includes(currentDomain)) {
      return false;
    }

    // Classify the data
    const classification = this.classifyData(data);
    
    // Apply privacy level rules
    switch (settings.privacyLevel) {
      case 'strict':
        return classification.type === 'safe' && classification.confidence > 0.9;
      case 'balanced':
        return classification.type !== 'secret' && classification.confidence > 0.7;
      case 'minimal':
        return classification.type !== 'secret';
      default:
        return false;
    }
  }

  classifyData(data: any): DataClassification {
    const content = this.extractTextContent(data);
    
    // Check for sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(content)) {
        return {
          type: 'secret',
          confidence: 0.95,
          reason: 'Contains sensitive information pattern',
        };
      }
    }

    // Check for personal information
    if (this.containsPersonalInfo(content)) {
      return {
        type: 'sensitive',
        confidence: 0.8,
        reason: 'May contain personal information',
      };
    }

    // Check for internal/proprietary information
    if (this.containsProprietaryInfo(content)) {
      return {
        type: 'sensitive',
        confidence: 0.7,
        reason: 'May contain proprietary information',
      };
    }

    // Default to safe if no sensitive patterns found
    return {
      type: 'safe',
      confidence: 0.8,
      reason: 'No sensitive patterns detected',
    };
  }

  isErrorSafeToShare(errorText: string): boolean {
    // Check if error matches safe patterns
    for (const pattern of this.safeErrorPatterns) {
      if (pattern.test(errorText)) {
        return true;
      }
    }

    // Check for sensitive information in error
    const classification = this.classifyData({ content: errorText });
    return classification.type === 'safe';
  }

  async requestConsentForDataType(dataType: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      // Create consent modal
      const modal = this.createConsentModal(dataType, description, resolve);
      document.body.appendChild(modal);
    });
  }

  private createConsentModal(
    dataType: string, 
    description: string, 
    onResponse: (consent: boolean) => void
  ): HTMLElement {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    modal.innerHTML = `
      <div style="
        background: white;
        border-radius: 8px;
        padding: 24px;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      ">
        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          🔒 Data Collection Consent
        </h3>
        <p style="margin: 0 0 16px 0; color: #6b7280; line-height: 1.5;">
          Careerate would like to collect <strong>${dataType}</strong> data to provide AI assistance.
        </p>
        <p style="margin: 0 0 20px 0; color: #6b7280; line-height: 1.5; font-size: 14px;">
          ${description}
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button id="careerate-deny" style="
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            background: white;
            color: #374151;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">
            Deny
          </button>
          <button id="careerate-allow" style="
            padding: 8px 16px;
            border: none;
            background: #3b82f6;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">
            Allow
          </button>
        </div>
      </div>
    `;

    const allowBtn = modal.querySelector('#careerate-allow') as HTMLButtonElement;
    const denyBtn = modal.querySelector('#careerate-deny') as HTMLButtonElement;

    allowBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      onResponse(true);
    });

    denyBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      onResponse(false);
    });

    return modal;
  }

  filterSensitiveData(data: any): any {
    if (typeof data === 'string') {
      return this.filterSensitiveText(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.filterSensitiveData(item));
    }

    if (typeof data === 'object' && data !== null) {
      const filtered: any = {};
      for (const [key, value] of Object.entries(data)) {
        // Skip sensitive keys
        if (this.isSensitiveKey(key)) {
          filtered[key] = '[REDACTED]';
        } else {
          filtered[key] = this.filterSensitiveData(value);
        }
      }
      return filtered;
    }

    return data;
  }

  private extractTextContent(data: any): string {
    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'object' && data !== null) {
      return JSON.stringify(data);
    }

    return String(data);
  }

  private containsPersonalInfo(content: string): boolean {
    // Check for email patterns
    const emailPattern = /\b[\w\.-]+@[\w\.-]+\.\w+\b/;
    if (emailPattern.test(content)) {
      return true;
    }

    // Check for phone numbers
    const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/;
    if (phonePattern.test(content)) {
      return true;
    }

    // Check for names (basic heuristic)
    const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/;
    if (namePattern.test(content) && content.length < 1000) {
      return true;
    }

    return false;
  }

  private containsProprietaryInfo(content: string): boolean {
    const proprietaryIndicators = [
      'confidential',
      'proprietary',
      'internal only',
      'company secret',
      'do not distribute',
      'private key',
      'internal api',
    ];

    const lowerContent = content.toLowerCase();
    return proprietaryIndicators.some(indicator => lowerContent.includes(indicator));
  }

  private filterSensitiveText(text: string): string {
    let filtered = text;

    // Replace sensitive patterns
    for (const pattern of this.sensitivePatterns) {
      filtered = filtered.replace(pattern, '[REDACTED]');
    }

    // Replace email addresses
    filtered = filtered.replace(/\b[\w\.-]+@[\w\.-]+\.\w+\b/g, '[EMAIL]');

    // Replace potential API keys (long alphanumeric strings)
    filtered = filtered.replace(/[a-zA-Z0-9]{32,}/g, '[KEY]');

    return filtered;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password',
      'secret',
      'key',
      'token',
      'auth',
      'credential',
      'private',
    ];

    const lowerKey = key.toLowerCase();
    return sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));
  }

  async updateUserSettings(newSettings: Partial<UserSettings>): Promise<void> {
    this.userSettings = { ...this.userSettings!, ...newSettings };
    await chrome.storage.local.set({ userSettings: this.userSettings });
  }

  getUserSettings(): UserSettings | null {
    return this.userSettings;
  }

  createDataTransparencyReport(): any {
    return {
      dataCollected: 'Error messages, public code snippets, repository metadata',
      dataNotCollected: 'Passwords, API keys, personal information, private repositories',
      retentionPeriod: this.userSettings?.dataRetentionHours || 1,
      lastUpdated: new Date().toISOString(),
      privacyLevel: this.userSettings?.privacyLevel || 'strict',
    };
  }
} 