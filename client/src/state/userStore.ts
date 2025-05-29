import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  workDomain: string;
  goals: string[];
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    difficultyPreference: 'beginner' | 'intermediate' | 'advanced';
    autoSync: boolean;
    privacy: {
      shareData: boolean;
      trackingEnabled: boolean;
      anonymousAnalytics: boolean;
    };
  };
  subscription?: {
    plan: 'free' | 'pro' | 'enterprise';
    features: string[];
    expiresAt?: string;
  };
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
}

interface ActivityStats {
  weeklyStats: {
    toolsExplored: number;
    hoursLearned: number;
    skillsGained: number;
  };
  productivityScore: number;
  lastActivitySync: number | null;
}

interface UserState {
  // Authentication
  isAuthenticated: boolean;
  isLoading: boolean;
  auth: AuthState;
  
  // User Profile
  user: UserProfile | null;
  
  // Activity & Progress
  activityStats: ActivityStats;
  
  // Extension Connection
  extensionConnected: boolean;
  lastExtensionSync: number | null;
  
  // Actions
  setAuth: (authData: { user: UserProfile; auth: AuthState }) => void;
  updateAuth: (auth: Partial<AuthState>) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updatePreference: (key: string, value: any) => void;
  updateActivityStats: (stats: Partial<ActivityStats>) => void;
  setExtensionStatus: (connected: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => void;
  
  // Computed getters
  isTokenValid: () => boolean;
  shouldRefreshToken: () => boolean;
  getAuthHeaders: () => Record<string, string>;
}

const initialActivityStats: ActivityStats = {
  weeklyStats: {
    toolsExplored: 0,
    hoursLearned: 0,
    skillsGained: 0
  },
  productivityScore: 0.5,
  lastActivitySync: null
};

const initialAuth: AuthState = {
  accessToken: null,
  refreshToken: null,
  tokenExpiry: null
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      auth: initialAuth,
      user: null,
      activityStats: initialActivityStats,
      extensionConnected: false,
      lastExtensionSync: null,
      
      // Authentication actions
      setAuth: (authData) => {
        set({
          isAuthenticated: true,
          isLoading: false,
          auth: authData.auth,
          user: authData.user
        });
      },
      
      updateAuth: (authUpdate) => {
        set((state) => ({
          auth: {
            ...state.auth,
            ...authUpdate
          }
        }));
      },
      
      updateProfile: (profileUpdate) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            ...profileUpdate
          } : null
        }));
      },
      
      updatePreference: (key, value) => {
        set((state) => ({
          user: state.user ? {
            ...state.user,
            preferences: {
              ...state.user.preferences,
              [key]: value
            }
          } : null
        }));
      },
      
      updateActivityStats: (statsUpdate) => {
        set((state) => ({
          activityStats: {
            ...state.activityStats,
            ...statsUpdate
          }
        }));
      },
      
      setExtensionStatus: (connected) => {
        set({
          extensionConnected: connected,
          lastExtensionSync: connected ? Date.now() : null
        });
      },
      
      setLoading: (loading) => {
        set({ isLoading: loading });
      },
      
      clearAuth: () => {
        set({
          isAuthenticated: false,
          isLoading: false,
          auth: initialAuth,
          user: null,
          activityStats: initialActivityStats,
          extensionConnected: false,
          lastExtensionSync: null
        });
      },
      
      // Computed functions
      isTokenValid: () => {
        const state = get();
        const { accessToken, tokenExpiry } = state.auth;
        
        if (!accessToken || !tokenExpiry) return false;
        
        // Check if token expires in the next 5 minutes
        return Date.now() < (tokenExpiry - 5 * 60 * 1000);
      },
      
      shouldRefreshToken: () => {
        const state = get();
        const { accessToken, refreshToken, tokenExpiry } = state.auth;
        
        if (!accessToken || !refreshToken || !tokenExpiry) return false;
        
        // Refresh if token expires in the next 10 minutes
        return Date.now() >= (tokenExpiry - 10 * 60 * 1000);
      },
      
      getAuthHeaders: (): Record<string, string> => {
        const state = get();
        const { accessToken } = state.auth;
        
        if (!accessToken) {
          return {};
        }
        
        return {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        };
      }
    }),
    {
      name: 'careerate-user-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields for security
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        activityStats: state.activityStats,
        extensionConnected: state.extensionConnected,
        lastExtensionSync: state.lastExtensionSync,
        // Don't persist tokens in localStorage for security
        auth: {
          accessToken: null,
          refreshToken: null,
          tokenExpiry: null
        }
      })
    }
  )
);

// Auth helper functions
export const authHelpers = {
  /**
   * Initialize user session from secure storage or Azure MSAL
   */
  async initializeSession(): Promise<boolean> {
    try {
      // This would integrate with Azure MSAL or other auth provider
      const storedAuth = sessionStorage.getItem('auth_tokens');
      
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        const store = useUserStore.getState();
        
        // Validate token
        if (authData.tokenExpiry && Date.now() < authData.tokenExpiry) {
          store.updateAuth(authData);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing session:', error);
      return false;
    }
  },
  
  /**
   * Store auth tokens securely
   */
  storeAuthTokens(auth: AuthState): void {
    try {
      // Store tokens in sessionStorage (more secure than localStorage)
      sessionStorage.setItem('auth_tokens', JSON.stringify(auth));
      
      // Update Zustand store
      const store = useUserStore.getState();
      store.updateAuth(auth);
    } catch (error) {
      console.error('Error storing auth tokens:', error);
    }
  },
  
  /**
   * Clear auth tokens from all storage
   */
  clearAuthTokens(): void {
    try {
      sessionStorage.removeItem('auth_tokens');
      localStorage.removeItem('msal.interaction.status');
      localStorage.removeItem('msal.request.state');
      
      const store = useUserStore.getState();
      store.clearAuth();
    } catch (error) {
      console.error('Error clearing auth tokens:', error);
    }
  },
  
  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    try {
      const store = useUserStore.getState();
      const { refreshToken } = store.auth;
      
      if (!refreshToken) return false;
      
      // This would call your refresh token endpoint
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
      
      if (response.ok) {
        const newAuth = await response.json();
        authHelpers.storeAuthTokens(newAuth);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  },
  
  /**
   * Check and auto-refresh token if needed
   */
  async ensureValidToken(): Promise<boolean> {
    const store = useUserStore.getState();
    
    if (store.isTokenValid()) {
      return true;
    }
    
    if (store.shouldRefreshToken()) {
      return await authHelpers.refreshAccessToken();
    }
    
    return false;
  }
};

// Activity sync helpers
export const activityHelpers = {
  /**
   * Sync activity stats from API
   */
  async syncActivityStats(userId: string): Promise<void> {
    try {
      const store = useUserStore.getState();
      const headers = store.getAuthHeaders();
      
      const response = await fetch(`/api/v1/activity/stats/${userId}`, {
        headers
      });
      
      if (response.ok) {
        const stats = await response.json();
        store.updateActivityStats({
          weeklyStats: {
            toolsExplored: stats.ai_tools_usage ? Object.keys(stats.ai_tools_usage).length : 0,
            hoursLearned: Math.round(stats.total_time_spent / (1000 * 60 * 60)),
            skillsGained: stats.focus_sessions_count || 0
          },
          productivityScore: stats.average_productivity_score || 0.5,
          lastActivitySync: Date.now()
        });
      }
    } catch (error) {
      console.error('Error syncing activity stats:', error);
    }
  },
  
  /**
   * Check Chrome extension connection
   */
  async checkExtensionConnection(): Promise<boolean> {
    try {
      // Try to communicate with Chrome extension
      if (typeof window !== 'undefined' && (window as any).chrome?.runtime) {
        return new Promise((resolve) => {
          (window as any).chrome.runtime.sendMessage(
            process.env.REACT_APP_CHROME_EXTENSION_ID,
            { action: 'ping' },
            (response: any) => {
              const connected = !!response && !(window as any).chrome.runtime.lastError;
              const store = useUserStore.getState();
              store.setExtensionStatus(connected);
              resolve(connected);
            }
          );
          
          // Timeout after 1 second
          setTimeout(() => {
            const store = useUserStore.getState();
            store.setExtensionStatus(false);
            resolve(false);
          }, 1000);
        });
      }
      
      return false;
    } catch (error) {
      console.error('Error checking extension connection:', error);
      const store = useUserStore.getState();
      store.setExtensionStatus(false);
      return false;
    }
  }
};

// Export types for use in components
export type { UserProfile, AuthState, ActivityStats }; 