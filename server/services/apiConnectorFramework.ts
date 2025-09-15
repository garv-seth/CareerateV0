import { encryptionService, secretsManager } from './encryptionService';
import { integrationService } from './integrationService';
import { 
  type ApiConnection,
  type InsertApiConnection,
  type Integration,
  type IntegrationSecret
} from '@shared/schema';

export interface ApiConnectorConfig {
  name: string;
  baseUrl: string;
  version?: string;
  authenticationType: 'api-key' | 'bearer' | 'oauth' | 'basic' | 'custom';
  authenticationConfig: Record<string, any>;
  defaultHeaders?: Record<string, string>;
  rateLimits?: {
    requestsPerMinute?: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
    burstLimit?: number;
  };
  retryConfig?: {
    maxRetries: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
  };
  healthCheckConfig?: {
    endpoint: string;
    method: string;
    expectedStatus: number;
    timeout: number;
  };
}

export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: any;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  responseTime: number;
  errorMessage?: string;
  rateLimitInfo?: {
    remaining: number;
    reset: number;
    limit: number;
  };
}

export interface ConnectorMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  rateLimitHits: number;
  lastRequestTime: Date;
  uptime: number; // percentage
}

/**
 * Base API Connector class that all service-specific connectors extend
 */
export abstract class BaseApiConnector {
  protected config: ApiConnectorConfig;
  protected secrets: Map<string, string> = new Map();
  protected metrics: ConnectorMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    rateLimitHits: 0,
    lastRequestTime: new Date(),
    uptime: 100
  };

  constructor(config: ApiConnectorConfig) {
    this.config = config;
  }

  /**
   * Initialize connector with secrets
   */
  async initialize(secrets: Record<string, string>): Promise<void> {
    for (const [key, value] of Object.entries(secrets)) {
      this.secrets.set(key, value);
    }
    await this.onInitialize();
  }

  /**
   * Override this method for connector-specific initialization
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation - override in subclasses
  }

  /**
   * Make API request with built-in retry, rate limiting, and error handling
   */
  async makeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = Date.now();
    let lastError: Error;

    const retryConfig = this.config.retryConfig || {
      maxRetries: 3,
      backoffMultiplier: 2,
      maxBackoffMs: 30000
    };

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const response = await this.executeRequest<T>(request);
        
        // Update metrics on success
        this.updateMetrics(true, Date.now() - startTime);
        
        return response;
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors (4xx client errors except 429)
        if (error.status && error.status >= 400 && error.status < 500 && error.status !== 429) {
          break;
        }

        // Calculate backoff delay
        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            Math.pow(retryConfig.backoffMultiplier, attempt) * 1000,
            retryConfig.maxBackoffMs
          );
          await this.delay(delay);
        }
      }
    }

    // Update metrics on failure
    this.updateMetrics(false, Date.now() - startTime);

    // Return error response
    return {
      success: false,
      status: lastError.status || 0,
      statusText: lastError.statusText || 'Request Failed',
      headers: {},
      responseTime: Date.now() - startTime,
      errorMessage: lastError.message
    };
  }

  /**
   * Execute the actual HTTP request
   */
  protected async executeRequest<T = any>(request: ApiRequest): Promise<ApiResponse<T>> {
    const url = this.buildUrl(request.endpoint, request.params);
    const headers = await this.buildHeaders(request.headers);
    const timeout = request.timeout || 30000;

    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      signal: AbortSignal.timeout(timeout)
    };

    if (request.data && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
      fetchOptions.body = JSON.stringify(request.data);
      headers['Content-Type'] = 'application/json';
    }

    const startTime = Date.now();
    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Parse response data
    let data: T | undefined;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      try {
        data = await response.json();
      } catch (error) {
        console.warn('Failed to parse JSON response:', error);
      }
    } else if (contentType?.includes('text/')) {
      data = await response.text() as any;
    }

    // Extract rate limit info
    const rateLimitInfo = this.extractRateLimitInfo(response.headers);

    // Track rate limit hits
    if (response.status === 429) {
      this.metrics.rateLimitHits++;
    }

    const apiResponse: ApiResponse<T> = {
      success: response.ok,
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseTime,
      rateLimitInfo
    };

    if (!response.ok) {
      apiResponse.errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      throw Object.assign(new Error(apiResponse.errorMessage), { 
        status: response.status, 
        statusText: response.statusText,
        response: apiResponse 
      });
    }

    return apiResponse;
  }

  /**
   * Test connection to the API
   */
  async testConnection(): Promise<{
    success: boolean;
    responseTime: number;
    errorMessage?: string;
    details?: any;
  }> {
    try {
      const healthCheck = this.config.healthCheckConfig;
      if (!healthCheck) {
        // Default health check - just test authentication
        return await this.defaultHealthCheck();
      }

      const startTime = Date.now();
      const response = await this.makeRequest({
        method: healthCheck.method as any,
        endpoint: healthCheck.endpoint,
        timeout: healthCheck.timeout
      });

      return {
        success: response.status === healthCheck.expectedStatus,
        responseTime: response.responseTime,
        details: response.data,
        errorMessage: response.success ? undefined : response.errorMessage
      };
    } catch (error) {
      return {
        success: false,
        responseTime: 0,
        errorMessage: error.message
      };
    }
  }

  /**
   * Get connector metrics
   */
  getMetrics(): ConnectorMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      rateLimitHits: 0,
      lastRequestTime: new Date(),
      uptime: 100
    };
  }

  // Abstract methods to be implemented by subclasses
  abstract getServiceInfo(): {
    name: string;
    description: string;
    version: string;
    documentation: string;
    supportedFeatures: string[];
  };

  // Protected helper methods
  protected buildUrl(endpoint: string, params?: Record<string, any>): string {
    let url = `${this.config.baseUrl}${endpoint}`;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const paramString = searchParams.toString();
      if (paramString) {
        url += `?${paramString}`;
      }
    }

    return url;
  }

  protected async buildHeaders(customHeaders?: Record<string, string>): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'User-Agent': 'Careerate-Integration-Service/1.0',
      ...this.config.defaultHeaders,
      ...customHeaders
    };

    // Add authentication headers based on type
    switch (this.config.authenticationType) {
      case 'api-key':
        await this.addApiKeyAuth(headers);
        break;
      case 'bearer':
        await this.addBearerAuth(headers);
        break;
      case 'basic':
        await this.addBasicAuth(headers);
        break;
      case 'oauth':
        await this.addOAuthAuth(headers);
        break;
      case 'custom':
        await this.addCustomAuth(headers);
        break;
    }

    return headers;
  }

  protected async addApiKeyAuth(headers: Record<string, string>): Promise<void> {
    const apiKey = this.secrets.get('api_key');
    if (apiKey) {
      const keyHeader = this.config.authenticationConfig?.keyHeader || 'X-API-Key';
      headers[keyHeader] = apiKey;
    }
  }

  protected async addBearerAuth(headers: Record<string, string>): Promise<void> {
    const token = this.secrets.get('access_token') || this.secrets.get('bearer_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  protected async addBasicAuth(headers: Record<string, string>): Promise<void> {
    const username = this.secrets.get('username');
    const password = this.secrets.get('password');
    if (username && password) {
      const credentials = Buffer.from(`${username}:${password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
  }

  protected async addOAuthAuth(headers: Record<string, string>): Promise<void> {
    const accessToken = this.secrets.get('access_token');
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  }

  protected abstract addCustomAuth(headers: Record<string, string>): Promise<void>;

  protected abstract defaultHealthCheck(): Promise<{
    success: boolean;
    responseTime: number;
    errorMessage?: string;
    details?: any;
  }>;

  protected extractRateLimitInfo(headers: Headers): {
    remaining: number;
    reset: number;
    limit: number;
  } | undefined {
    // Default implementation - override for service-specific headers
    const remaining = headers.get('x-ratelimit-remaining') || headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-ratelimit-reset') || headers.get('x-rate-limit-reset');
    const limit = headers.get('x-ratelimit-limit') || headers.get('x-rate-limit-limit');

    if (remaining && reset && limit) {
      return {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        limit: parseInt(limit, 10)
      };
    }

    return undefined;
  }

  private updateMetrics(success: boolean, responseTime: number): void {
    this.metrics.totalRequests++;
    this.metrics.lastRequestTime = new Date();
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;

    // Update uptime
    this.metrics.uptime = (this.metrics.successfulRequests / this.metrics.totalRequests) * 100;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Stripe API Connector
 */
export class StripeConnector extends BaseApiConnector {
  constructor() {
    super({
      name: 'Stripe',
      baseUrl: 'https://api.stripe.com/v1',
      authenticationType: 'bearer',
      authenticationConfig: {},
      defaultHeaders: {
        'Stripe-Version': '2023-10-16'
      },
      rateLimits: {
        requestsPerSecond: 25,
        requestsPerMinute: 1000
      },
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 10000
      },
      healthCheckConfig: {
        endpoint: '/account',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000
      }
    });
  }

  getServiceInfo() {
    return {
      name: 'Stripe',
      description: 'Payment processing and financial services',
      version: '2023-10-16',
      documentation: 'https://stripe.com/docs/api',
      supportedFeatures: [
        'Payment Processing',
        'Subscription Management',
        'Customer Management',
        'Invoice Generation',
        'Webhook Events',
        'Marketplace Operations'
      ]
    };
  }

  protected async addCustomAuth(): Promise<void> {
    // Not needed for Stripe - uses bearer auth
  }

  protected async defaultHealthCheck() {
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '/account'
    });

    return {
      success: response.success,
      responseTime: response.responseTime,
      details: response.data,
      errorMessage: response.errorMessage
    };
  }

  // Stripe-specific methods
  async createPaymentIntent(amount: number, currency: string = 'usd', metadata?: any) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/payment_intents',
      data: {
        amount,
        currency,
        metadata
      }
    });
  }

  async getCustomer(customerId: string) {
    return this.makeRequest({
      method: 'GET',
      endpoint: `/customers/${customerId}`
    });
  }

  async createSubscription(customerId: string, priceId: string) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/subscriptions',
      data: {
        customer: customerId,
        items: [{ price: priceId }]
      }
    });
  }
}

/**
 * Twilio API Connector
 */
export class TwilioConnector extends BaseApiConnector {
  constructor() {
    super({
      name: 'Twilio',
      baseUrl: 'https://api.twilio.com/2010-04-01',
      authenticationType: 'basic',
      authenticationConfig: {},
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 100
      },
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 30000
      }
    });
  }

  protected async onInitialize(): Promise<void> {
    // Set account SID as username for basic auth
    const accountSid = this.secrets.get('account_sid');
    if (accountSid) {
      this.secrets.set('username', accountSid);
      this.config.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}`;
    }
  }

  getServiceInfo() {
    return {
      name: 'Twilio',
      description: 'Communication platform for SMS, voice, and video',
      version: '2010-04-01',
      documentation: 'https://www.twilio.com/docs/usage/api',
      supportedFeatures: [
        'SMS Messaging',
        'Voice Calls',
        'Video Calls',
        'WhatsApp Messaging',
        'Email',
        'Phone Number Management',
        'Call Recording'
      ]
    };
  }

  protected async addCustomAuth(): Promise<void> {
    // Not needed for Twilio - uses basic auth
  }

  protected async defaultHealthCheck() {
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '.json'
    });

    return {
      success: response.success,
      responseTime: response.responseTime,
      details: response.data,
      errorMessage: response.errorMessage
    };
  }

  // Twilio-specific methods
  async sendSMS(to: string, from: string, body: string) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/Messages.json',
      data: {
        To: to,
        From: from,
        Body: body
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  async makeCall(to: string, from: string, url: string) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/Calls.json',
      data: {
        To: to,
        From: from,
        Url: url
      }
    });
  }
}

/**
 * SendGrid API Connector
 */
export class SendGridConnector extends BaseApiConnector {
  constructor() {
    super({
      name: 'SendGrid',
      baseUrl: 'https://api.sendgrid.com/v3',
      authenticationType: 'bearer',
      authenticationConfig: {},
      rateLimits: {
        requestsPerSecond: 10,
        requestsPerMinute: 600
      },
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 30000
      },
      healthCheckConfig: {
        endpoint: '/user/account',
        method: 'GET',
        expectedStatus: 200,
        timeout: 10000
      }
    });
  }

  getServiceInfo() {
    return {
      name: 'SendGrid',
      description: 'Email delivery and marketing platform',
      version: 'v3',
      documentation: 'https://docs.sendgrid.com/api-reference',
      supportedFeatures: [
        'Email Sending',
        'Email Templates',
        'Contact Management',
        'Marketing Campaigns',
        'Email Analytics',
        'Webhook Events',
        'Spam Testing'
      ]
    };
  }

  protected async addCustomAuth(): Promise<void> {
    // Not needed for SendGrid - uses bearer auth
  }

  protected async defaultHealthCheck() {
    const response = await this.makeRequest({
      method: 'GET',
      endpoint: '/user/account'
    });

    return {
      success: response.success,
      responseTime: response.responseTime,
      details: response.data,
      errorMessage: response.errorMessage
    };
  }

  // SendGrid-specific methods
  async sendEmail(to: string[], subject: string, content: string, from?: string) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/mail/send',
      data: {
        personalizations: [{
          to: to.map(email => ({ email }))
        }],
        from: { email: from || 'noreply@example.com' },
        subject,
        content: [{
          type: 'text/html',
          value: content
        }]
      }
    });
  }

  async getEmailStats(startDate: string, endDate?: string) {
    const params: any = { start_date: startDate };
    if (endDate) params.end_date = endDate;

    return this.makeRequest({
      method: 'GET',
      endpoint: '/stats',
      params
    });
  }
}

/**
 * Slack API Connector
 */
export class SlackConnector extends BaseApiConnector {
  constructor() {
    super({
      name: 'Slack',
      baseUrl: 'https://slack.com/api',
      authenticationType: 'bearer',
      authenticationConfig: {},
      rateLimits: {
        requestsPerMinute: 100
      },
      retryConfig: {
        maxRetries: 3,
        backoffMultiplier: 2,
        maxBackoffMs: 30000
      },
      healthCheckConfig: {
        endpoint: '/auth.test',
        method: 'POST',
        expectedStatus: 200,
        timeout: 10000
      }
    });
  }

  getServiceInfo() {
    return {
      name: 'Slack',
      description: 'Team communication and collaboration platform',
      version: 'Web API',
      documentation: 'https://api.slack.com/web',
      supportedFeatures: [
        'Message Sending',
        'Channel Management',
        'User Management',
        'File Sharing',
        'Workflow Automation',
        'App Installation',
        'Event Subscriptions'
      ]
    };
  }

  protected async addCustomAuth(): Promise<void> {
    // Not needed for Slack - uses bearer auth
  }

  protected async defaultHealthCheck() {
    const response = await this.makeRequest({
      method: 'POST',
      endpoint: '/auth.test'
    });

    return {
      success: response.success && response.data?.ok,
      responseTime: response.responseTime,
      details: response.data,
      errorMessage: response.errorMessage || (!response.data?.ok ? response.data?.error : undefined)
    };
  }

  protected extractRateLimitInfo(headers: Headers) {
    // Slack uses different rate limit headers
    const remaining = headers.get('x-rate-limit-remaining');
    const reset = headers.get('x-rate-limit-reset');
    const limit = headers.get('x-rate-limit-limit');

    if (remaining && reset && limit) {
      return {
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        limit: parseInt(limit, 10)
      };
    }

    return undefined;
  }

  // Slack-specific methods
  async postMessage(channel: string, text: string, attachments?: any[]) {
    return this.makeRequest({
      method: 'POST',
      endpoint: '/chat.postMessage',
      data: {
        channel,
        text,
        attachments
      }
    });
  }

  async getChannelList() {
    return this.makeRequest({
      method: 'GET',
      endpoint: '/conversations.list'
    });
  }
}

/**
 * API Connector Factory
 */
export class ApiConnectorFactory {
  private static connectors = new Map<string, typeof BaseApiConnector>([
    ['stripe', StripeConnector],
    ['twilio', TwilioConnector],
    ['sendgrid', SendGridConnector],
    ['slack', SlackConnector]
  ]);

  /**
   * Creates an API connector instance
   */
  static async createConnector(
    service: string,
    secrets: Record<string, string>
  ): Promise<BaseApiConnector> {
    const ConnectorClass = this.connectors.get(service.toLowerCase());
    
    if (!ConnectorClass) {
      throw new Error(`Connector not found for service: ${service}`);
    }

    const connector = new ConnectorClass();
    await connector.initialize(secrets);
    
    return connector;
  }

  /**
   * Register a new connector
   */
  static registerConnector(service: string, connectorClass: typeof BaseApiConnector): void {
    this.connectors.set(service.toLowerCase(), connectorClass);
  }

  /**
   * Get list of available connectors
   */
  static getAvailableConnectors(): string[] {
    return Array.from(this.connectors.keys());
  }

  /**
   * Get connector info without creating instance
   */
  static getConnectorInfo(service: string): {
    name: string;
    description: string;
    version: string;
    documentation: string;
    supportedFeatures: string[];
  } | null {
    const ConnectorClass = this.connectors.get(service.toLowerCase());
    if (!ConnectorClass) {
      return null;
    }

    // Create temporary instance to get info
    const tempConnector = new ConnectorClass();
    return tempConnector.getServiceInfo();
  }
}

/**
 * API Connector Manager - Manages multiple connector instances
 */
export class ApiConnectorManager {
  private connectors = new Map<string, BaseApiConnector>();

  /**
   * Initialize connector for integration
   */
  async initializeConnector(
    integrationId: string,
    service: string,
    secrets: Record<string, string>
  ): Promise<{
    success: boolean;
    connector?: BaseApiConnector;
    testResult?: any;
    errorMessage?: string;
  }> {
    try {
      const connector = await ApiConnectorFactory.createConnector(service, secrets);
      
      // Test the connection
      const testResult = await connector.testConnection();
      
      if (testResult.success) {
        this.connectors.set(integrationId, connector);
        return {
          success: true,
          connector,
          testResult
        };
      } else {
        return {
          success: false,
          testResult,
          errorMessage: testResult.errorMessage
        };
      }
    } catch (error) {
      return {
        success: false,
        errorMessage: error.message
      };
    }
  }

  /**
   * Get connector by integration ID
   */
  getConnector(integrationId: string): BaseApiConnector | undefined {
    return this.connectors.get(integrationId);
  }

  /**
   * Remove connector
   */
  removeConnector(integrationId: string): boolean {
    return this.connectors.delete(integrationId);
  }

  /**
   * Get all connector metrics
   */
  getAllMetrics(): Record<string, ConnectorMetrics> {
    const metrics: Record<string, ConnectorMetrics> = {};
    
    this.connectors.forEach((connector, integrationId) => {
      metrics[integrationId] = connector.getMetrics();
    });

    return metrics;
  }

  /**
   * Health check all connectors
   */
  async healthCheckAll(): Promise<Record<string, {
    success: boolean;
    responseTime: number;
    errorMessage?: string;
  }>> {
    const results: Record<string, any> = {};
    
    for (const [integrationId, connector] of this.connectors.entries()) {
      try {
        results[integrationId] = await connector.testConnection();
      } catch (error) {
        results[integrationId] = {
          success: false,
          responseTime: 0,
          errorMessage: error.message
        };
      }
    }

    return results;
  }

  /**
   * Clear all connectors
   */
  clearAll(): void {
    this.connectors.clear();
  }
}

// Export singleton
export const apiConnectorManager = new ApiConnectorManager();