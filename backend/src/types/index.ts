export interface CareerateConfig {
  port: number;
  environment: 'development' | 'production' | 'test';
  azure: {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    policyName: string;
  };
  database: {
    mongodb: string;
    postgresql: string;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
    };
    anthropic: {
      apiKey: string;
      model: string;
    };
  };
  security: {
    jwtSecret: string;
    sessionSecret: string;
  };
}

export interface AgentMessage {
  id: string;
  type: 'user' | 'agent' | 'system';
  content: string;
  metadata: {
    agentType?: string;
    userId: string;
    timestamp: number;
    context?: Record<string, any>;
  };
}

export interface UserSession {
  id: string;
  userId: string;
  workspaceId: string;
  isActive: boolean;
  lastActivity: number;
  context: Record<string, any>;
}

export interface AgentContext {
  sessionId: string;
  userId: string;
  workspaceId: string;
  currentTool?: string;
  cloudProvider?: string;
  repository?: string;
  browserContext?: Record<string, any>;
  sharedMemory?: Record<string, any>;
}

export interface AgentResponse {
  success: boolean;
  response: string;
  metadata: {
    agentType: string;
    executionTime: number;
    tokensUsed?: number;
    toolsUsed?: string[];
    confidence?: number;
  };
  context?: Record<string, any>;
}

export interface WorkspaceState {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  participants: string[];
  settings: {
    isPublic: boolean;
    allowGuestAccess: boolean;
    maxParticipants: number;
  };
  sharedContext: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'guest';
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: boolean;
  };
  subscription: {
    tier: 'free' | 'pro' | 'enterprise';
    expiresAt?: Date;
  };
  createdAt: Date;
  lastLogin: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  settings: {
    isPrivate: boolean;
    defaultWorkspaceSettings: Partial<WorkspaceState['settings']>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  role: 'admin' | 'member' | 'viewer';
  joinedAt: Date;
}

export interface AnalyticsData {
  userId: string;
  teamId?: string;
  workspaceId?: string;
  event: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface AgentPerformanceMetrics {
  agentType: string;
  totalRequests: number;
  successRate: number;
  averageResponseTime: number;
  averageTokenUsage: number;
  errorRate: number;
  lastUsed: Date;
  metrics: {
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  };
}

export interface MCPServerInfo {
  id: string;
  name: string;
  url: string;
  type: 'local' | 'remote';
  capabilities: string[];
  status: 'active' | 'inactive' | 'error';
  lastHealthCheck: Date;
  responseTime?: number;
}

export interface AuthTokenPayload {
  sub: string; // user ID
  email: string;
  name: string;
  role: string;
  iat: number;
  exp: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    timestamp: Date;
    requestId: string;
    executionTime: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface WebSocketEvent {
  type: string;
  data: any;
  timestamp: number;
  userId?: string;
  workspaceId?: string;
}

// Agent-specific types

export interface TerraformRequest {
  action: 'validate' | 'plan' | 'apply' | 'destroy' | 'format';
  configuration: string;
  variables?: Record<string, any>;
  workingDirectory?: string;
}

export interface TerraformResponse {
  success: boolean;
  output: string;
  plan?: any;
  errors?: string[];
  warnings?: string[];
}

export interface KubernetesRequest {
  action: 'apply' | 'delete' | 'get' | 'describe' | 'logs' | 'validate';
  manifest?: string;
  namespace?: string;
  resourceType?: string;
  resourceName?: string;
}

export interface KubernetesResponse {
  success: boolean;
  output: string;
  resources?: any[];
  errors?: string[];
}

export interface AWSRequest {
  action: 'describe' | 'create' | 'delete' | 'list' | 'update';
  service: string;
  operation: string;
  parameters: Record<string, any>;
  region?: string;
}

export interface AWSResponse {
  success: boolean;
  data: any;
  errors?: string[];
  metadata: {
    requestId: string;
    service: string;
    operation: string;
    executionTime: number;
  };
}

export interface MonitoringRequest {
  action: 'query' | 'alert' | 'dashboard';
  query?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
  alertRule?: any;
  dashboardConfig?: any;
}

export interface MonitoringResponse {
  success: boolean;
  data: any;
  metrics?: any[];
  alerts?: any[];
}

// Chrome Extension types

export interface ExtensionContext {
  url: string;
  title: string;
  domain: string;
  timestamp: Date;
  userAgent: string;
  cookies?: Record<string, string>;
  localStorage?: Record<string, string>;
  sessionStorage?: Record<string, string>;
}

export interface ExtensionMessage {
  type: 'context' | 'error' | 'request';
  data: any;
  tabId?: number;
  frameId?: number;
}

export interface PrivacySettings {
  collectBrowsingData: boolean;
  collectFormData: boolean;
  collectCookies: boolean;
  collectLocalStorage: boolean;
  shareWithTeam: boolean;
  retentionDays: number;
}

// VSCode Extension types

export interface VSCodeContext {
  workspaceFolder?: string;
  activeFile?: string;
  selectedText?: string;
  language?: string;
  gitRepository?: string;
  openFiles?: string[];
}

export interface VSCodeRequest {
  command: string;
  context: VSCodeContext;
  parameters: Record<string, any>;
}

export interface VSCodeResponse {
  success: boolean;
  content: string;
  actions?: Array<{
    type: 'insert' | 'replace' | 'append';
    position?: number;
    content: string;
  }>;
}

// Error types

export class CareerateError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(message: string, code: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = 'CareerateError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends CareerateError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CareerateError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CareerateError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CareerateError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends CareerateError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends CareerateError {
  constructor(service: string, originalError?: any) {
    super(`External service error: ${service}`, 'EXTERNAL_SERVICE_ERROR', 502, originalError);
    this.name = 'ExternalServiceError';
  }
}