// =====================================================
// Multi-Cloud Provider Abstraction Layer Types
// =====================================================

export type CloudProviderType = 'aws' | 'azure' | 'gcp' | 'digitalocean' | 'linode';

export interface CloudCredentials {
  type: 'api-key' | 'service-account' | 'access-token' | 'certificate';
  credentials: Record<string, any>;
  region?: string;
  projectId?: string; // for GCP
  subscriptionId?: string; // for Azure
}

export interface CloudResource {
  id: string;
  name: string;
  type: string;
  status: 'creating' | 'running' | 'stopped' | 'terminated' | 'error';
  provider: CloudProviderType;
  region: string;
  createdAt: Date;
  metadata: Record<string, any>;
  tags: Record<string, string>;
  cost?: {
    daily: number;
    monthly: number;
    currency: string;
  };
}

// =====================================================
// Compute Service Interfaces
// =====================================================

export interface ComputeInstance extends CloudResource {
  instanceType: string;
  cpu: number;
  memory: number; // GB
  storage: number; // GB
  network: {
    publicIp?: string;
    privateIp?: string;
    securityGroups: string[];
  };
  operatingSystem: string;
  state: 'pending' | 'running' | 'stopping' | 'stopped' | 'terminated';
}

export interface ComputeSpec {
  instanceType: string;
  cpu: number;
  memory: number;
  storage: number;
  operatingSystem: 'ubuntu-20.04' | 'ubuntu-22.04' | 'windows-server-2022' | 'amazon-linux-2';
  securityGroups?: string[];
  tags?: Record<string, string>;
  userData?: string; // initialization script
}

export interface IComputeService {
  // Instance Management
  createInstance(spec: ComputeSpec): Promise<ComputeInstance>;
  getInstance(instanceId: string): Promise<ComputeInstance | null>;
  listInstances(filters?: Record<string, any>): Promise<ComputeInstance[]>;
  startInstance(instanceId: string): Promise<boolean>;
  stopInstance(instanceId: string): Promise<boolean>;
  terminateInstance(instanceId: string): Promise<boolean>;
  resizeInstance(instanceId: string, newSpec: Partial<ComputeSpec>): Promise<ComputeInstance>;
  
  // Monitoring
  getInstanceMetrics(instanceId: string, startTime: Date, endTime: Date): Promise<ResourceMetrics>;
  getInstanceLogs(instanceId: string, startTime?: Date, endTime?: Date): Promise<string[]>;
}

// =====================================================
// Storage Service Interfaces
// =====================================================

export interface StorageBucket extends CloudResource {
  bucketName: string;
  region: string;
  isPublic: boolean;
  encryption: {
    enabled: boolean;
    type?: string;
    keyId?: string;
  };
  versioning: boolean;
  lifecycle: {
    enabled: boolean;
    rules: any[];
  };
  size: number; // bytes
  objectCount: number;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  contentType: string;
  etag: string;
  metadata: Record<string, string>;
}

export interface IStorageService {
  // Bucket Management
  createBucket(name: string, region: string, options?: any): Promise<StorageBucket>;
  getBucket(bucketName: string): Promise<StorageBucket | null>;
  listBuckets(): Promise<StorageBucket[]>;
  deleteBucket(bucketName: string): Promise<boolean>;
  
  // Object Management
  uploadObject(bucketName: string, key: string, data: Buffer | string, metadata?: Record<string, string>): Promise<string>;
  downloadObject(bucketName: string, key: string): Promise<Buffer>;
  getObjectMetadata(bucketName: string, key: string): Promise<StorageObject | null>;
  listObjects(bucketName: string, prefix?: string, maxKeys?: number): Promise<StorageObject[]>;
  deleteObject(bucketName: string, key: string): Promise<boolean>;
  
  // Access Management
  getSignedUrl(bucketName: string, key: string, operation: 'read' | 'write', expiresIn: number): Promise<string>;
  setBucketPolicy(bucketName: string, policy: any): Promise<boolean>;
}

// =====================================================
// Database Service Interfaces
// =====================================================

export interface DatabaseInstance extends CloudResource {
  engine: 'postgresql' | 'mysql' | 'mariadb' | 'sqlserver' | 'oracle';
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number; // GB
  storageType: 'gp2' | 'gp3' | 'io1' | 'io2';
  multiAZ: boolean;
  endpoint: {
    host: string;
    port: number;
  };
  backup: {
    enabled: boolean;
    retentionPeriod: number;
    window?: string;
  };
  maintenance: {
    window?: string;
  };
  encryption: {
    enabled: boolean;
    keyId?: string;
  };
}

export interface DatabaseSpec {
  engine: 'postgresql' | 'mysql' | 'mariadb' | 'sqlserver';
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  storageType?: 'gp2' | 'gp3' | 'io1' | 'io2';
  databaseName: string;
  username: string;
  password: string;
  multiAZ?: boolean;
  backupRetentionPeriod?: number;
  encryptionEnabled?: boolean;
  tags?: Record<string, string>;
}

export interface IDatabaseService {
  // Instance Management
  createDatabase(spec: DatabaseSpec): Promise<DatabaseInstance>;
  getDatabase(instanceId: string): Promise<DatabaseInstance | null>;
  listDatabases(filters?: Record<string, any>): Promise<DatabaseInstance[]>;
  deleteDatabase(instanceId: string): Promise<boolean>;
  
  // Operations
  createSnapshot(instanceId: string, snapshotId: string): Promise<string>;
  restoreFromSnapshot(snapshotId: string, newInstanceId: string): Promise<DatabaseInstance>;
  modifyDatabase(instanceId: string, modifications: Partial<DatabaseSpec>): Promise<DatabaseInstance>;
  
  // Monitoring
  getDatabaseMetrics(instanceId: string, startTime: Date, endTime: Date): Promise<ResourceMetrics>;
  getDatabaseLogs(instanceId: string, logType: string, startTime?: Date): Promise<string[]>;
}

// =====================================================
// Container Service Interfaces
// =====================================================

export interface ContainerService extends CloudResource {
  serviceName: string;
  cluster: string;
  taskDefinition: string;
  desiredCount: number;
  runningCount: number;
  pendingCount: number;
  image: string;
  cpu: number;
  memory: number;
  ports: {
    containerPort: number;
    protocol: 'tcp' | 'udp';
    loadBalancer?: {
      enabled: boolean;
      port?: number;
    };
  }[];
  environment: Record<string, string>;
  autoScaling: {
    enabled: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    targetCpu?: number;
    targetMemory?: number;
  };
}

export interface ContainerSpec {
  serviceName: string;
  image: string;
  cpu: number; // CPU units
  memory: number; // MB
  ports?: {
    containerPort: number;
    protocol?: 'tcp' | 'udp';
  }[];
  environment?: Record<string, string>;
  command?: string[];
  entrypoint?: string[];
  desiredCount?: number;
  tags?: Record<string, string>;
}

export interface IContainerService {
  // Service Management
  createService(spec: ContainerSpec): Promise<ContainerService>;
  getService(serviceId: string): Promise<ContainerService | null>;
  listServices(cluster?: string): Promise<ContainerService[]>;
  updateService(serviceId: string, spec: Partial<ContainerSpec>): Promise<ContainerService>;
  deleteService(serviceId: string): Promise<boolean>;
  
  // Scaling
  scaleService(serviceId: string, desiredCount: number): Promise<boolean>;
  enableAutoScaling(serviceId: string, config: any): Promise<boolean>;
  
  // Monitoring
  getServiceLogs(serviceId: string, startTime?: Date, endTime?: Date): Promise<string[]>;
  getServiceMetrics(serviceId: string, startTime: Date, endTime: Date): Promise<ResourceMetrics>;
}

// =====================================================
// Function Service Interfaces (Serverless)
// =====================================================

export interface CloudFunction extends CloudResource {
  functionName: string;
  runtime: string;
  handler: string;
  codeSize: number;
  timeout: number;
  memory: number;
  environment: Record<string, string>;
  triggers: {
    type: 'http' | 'schedule' | 'storage' | 'database';
    config: any;
  }[];
  lastModified: Date;
  invocations: {
    total: number;
    errors: number;
    duration: number; // avg ms
  };
}

export interface FunctionSpec {
  functionName: string;
  runtime: 'nodejs18' | 'python39' | 'python310' | 'java11' | 'dotnet6' | 'go119';
  handler: string;
  code: Buffer | string; // zip file or source code
  timeout?: number; // seconds
  memory?: number; // MB
  environment?: Record<string, string>;
  tags?: Record<string, string>;
}

export interface IFunctionService {
  // Function Management
  createFunction(spec: FunctionSpec): Promise<CloudFunction>;
  getFunction(functionName: string): Promise<CloudFunction | null>;
  listFunctions(): Promise<CloudFunction[]>;
  updateFunction(functionName: string, spec: Partial<FunctionSpec>): Promise<CloudFunction>;
  deleteFunction(functionName: string): Promise<boolean>;
  
  // Execution
  invokeFunction(functionName: string, payload?: any, async?: boolean): Promise<any>;
  
  // Monitoring
  getFunctionMetrics(functionName: string, startTime: Date, endTime: Date): Promise<ResourceMetrics>;
  getFunctionLogs(functionName: string, startTime?: Date, endTime?: Date): Promise<string[]>;
}

// =====================================================
// Monitoring Service Interfaces
// =====================================================

export interface ResourceMetrics {
  resource: {
    id: string;
    type: string;
    provider: CloudProviderType;
  };
  timeRange: {
    start: Date;
    end: Date;
  };
  metrics: {
    name: string;
    unit: string;
    datapoints: {
      timestamp: Date;
      value: number;
      tags?: Record<string, string>;
    }[];
  }[];
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  condition: {
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    period: number; // minutes
  };
  actions: {
    type: 'email' | 'sms' | 'webhook' | 'auto-scale';
    config: any;
  }[];
  isEnabled: boolean;
  state: 'ok' | 'alarm' | 'insufficient_data';
  lastTriggered?: Date;
}

export interface IMonitoringService {
  // Metrics
  getMetrics(resourceId: string, metricNames: string[], startTime: Date, endTime: Date): Promise<ResourceMetrics>;
  getAvailableMetrics(resourceType: string): Promise<string[]>;
  
  // Alerts
  createAlert(alert: Omit<Alert, 'id' | 'state'>): Promise<Alert>;
  getAlert(alertId: string): Promise<Alert | null>;
  listAlerts(resourceId?: string): Promise<Alert[]>;
  updateAlert(alertId: string, updates: Partial<Alert>): Promise<Alert>;
  deleteAlert(alertId: string): Promise<boolean>;
  
  // Logs
  searchLogs(query: string, startTime: Date, endTime: Date, maxResults?: number): Promise<any[]>;
  createLogGroup(groupName: string): Promise<boolean>;
  deleteLogGroup(groupName: string): Promise<boolean>;
}

// =====================================================
// Main Cloud Provider Interface
// =====================================================

export interface ICloudProvider {
  readonly type: CloudProviderType;
  readonly name: string;
  readonly regions: string[];
  
  // Authentication
  authenticate(credentials: CloudCredentials): Promise<boolean>;
  validateCredentials(credentials: CloudCredentials): Promise<boolean>;
  
  // Service Access
  getComputeService(region: string): IComputeService;
  getStorageService(region: string): IStorageService;
  getDatabaseService(region: string): IDatabaseService;
  getContainerService(region: string): IContainerService;
  getFunctionService(region: string): IFunctionService;
  getMonitoringService(region: string): IMonitoringService;
  
  // Provider-specific operations
  getAvailableRegions(): Promise<string[]>;
  getAvailableInstanceTypes(region: string): Promise<any[]>;
  getEstimatedCosts(resources: any[], region: string): Promise<any>;
  
  // Resource Management
  listAllResources(region?: string): Promise<CloudResource[]>;
  getResourceById(resourceId: string): Promise<CloudResource | null>;
  tagResource(resourceId: string, tags: Record<string, string>): Promise<boolean>;
}

// =====================================================
// Provider Factory Interface
// =====================================================

export interface ICloudProviderFactory {
  createProvider(type: CloudProviderType, credentials: CloudCredentials): Promise<ICloudProvider>;
  getSupportedProviders(): CloudProviderType[];
  validateProviderCredentials(type: CloudProviderType, credentials: CloudCredentials): Promise<boolean>;
}

// =====================================================
// Multi-Cloud Manager Interface
// =====================================================

export interface MultiCloudResource {
  id: string;
  name: string;
  type: string;
  providers: {
    provider: CloudProviderType;
    resourceId: string;
    region: string;
    status: string;
    isPrimary: boolean;
  }[];
  syncStatus: 'synced' | 'drift' | 'error';
  lastSync: Date;
  configuration: any;
  tags: Record<string, string>;
}

export interface IMultiCloudManager {
  // Provider Management
  addProvider(type: CloudProviderType, credentials: CloudCredentials, alias?: string): Promise<string>;
  removeProvider(providerId: string): Promise<boolean>;
  listProviders(): Promise<{ id: string; type: CloudProviderType; alias?: string; status: string }[]>;
  
  // Resource Management
  deployToMultipleProviders(spec: any, providers: string[]): Promise<MultiCloudResource>;
  syncResources(resourceId: string): Promise<boolean>;
  getResourceStatus(resourceId: string): Promise<MultiCloudResource>;
  
  // Cost Management
  getMultiCloudCosts(startDate: Date, endDate: Date): Promise<any>;
  optimizeCosts(resourceId: string): Promise<any>;
  
  // Migration
  migrateResource(resourceId: string, fromProvider: string, toProvider: string): Promise<any>;
}