export interface CareerateExtensionSettings {
  isTrackingEnabled: boolean;
  monitoringLevel: 'standard' | 'enhanced';
  screenshotConsentGiven: boolean;
  userId?: string; // To associate data with a user if logged in via web app
  lastSyncTimestamp?: number;
}

export const defaultSettings: CareerateExtensionSettings = {
  isTrackingEnabled: true,
  monitoringLevel: 'standard',
  screenshotConsentGiven: false,
};

// Define types for messages between components of the extension
export interface ChromeMessage {
  type: string;
  payload?: any;
}

// Example specific message types
export interface SettingsUpdatedMessage extends ChromeMessage {
  type: 'SETTINGS_UPDATED';
  payload: CareerateExtensionSettings;
}

export interface GetSettingsRequest extends ChromeMessage {
  type: 'GET_SETTINGS_REQUEST';
}

export interface GetSettingsResponse extends ChromeMessage {
  type: 'GET_SETTINGS_RESPONSE';
  payload: CareerateExtensionSettings;
}

export interface ActivityData {
  timestamp: number;
  url: string; // full URL of the active tab
  domain: string;
  pageTitle: string;
  activityType: string; // e.g., 'browsing', 'coding', 'reading_docs', 'meeting' (inferred)
  duration?: number; // Optional: duration of focus or activity in seconds
  toolsUsed?: string[]; // e.g., ['VSCode', 'GitHub', 'Figma'] (inferred)
  screenshotUrl?: string; // Optional: path/URL to a stored screenshot if consent given
  userId?: string; // If available
}

export interface SubmitActivityRequest extends ChromeMessage {
    type: 'SUBMIT_ACTIVITY_REQUEST';
    payload: ActivityData;
} 