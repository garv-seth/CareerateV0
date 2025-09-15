import { 
  ICloudProvider, 
  CloudProviderType, 
  CloudCredentials, 
  CloudResource,
  IComputeService,
  IStorageService,
  IDatabaseService,
  IContainerService,
  IFunctionService,
  IMonitoringService
} from '../types';

export abstract class BaseProvider implements ICloudProvider {
  protected credentials: CloudCredentials;
  protected authenticated: boolean = false;
  protected serviceCache: Map<string, any> = new Map();

  constructor(
    public readonly type: CloudProviderType,
    public readonly name: string,
    public readonly regions: string[],
    credentials: CloudCredentials
  ) {
    this.credentials = credentials;
  }

  // Abstract methods that must be implemented by each provider
  abstract authenticate(credentials: CloudCredentials): Promise<boolean>;
  abstract validateCredentials(credentials: CloudCredentials): Promise<boolean>;
  abstract getComputeService(region: string): IComputeService;
  abstract getStorageService(region: string): IStorageService;
  abstract getDatabaseService(region: string): IDatabaseService;
  abstract getContainerService(region: string): IContainerService;
  abstract getFunctionService(region: string): IFunctionService;
  abstract getMonitoringService(region: string): IMonitoringService;
  abstract getAvailableRegions(): Promise<string[]>;
  abstract getAvailableInstanceTypes(region: string): Promise<any[]>;

  // Common implementations that can be used by all providers
  async getEstimatedCosts(resources: any[], region: string): Promise<any> {
    // Base implementation - can be overridden by specific providers
    const costs = {
      total: 0,
      breakdown: {},
      currency: 'USD',
      period: 'monthly'
    };

    for (const resource of resources) {
      const resourceCost = await this.calculateResourceCost(resource, region);
      costs.total += resourceCost.amount;
      costs.breakdown[resource.type] = (costs.breakdown[resource.type] || 0) + resourceCost.amount;
    }

    return costs;
  }

  async listAllResources(region?: string): Promise<CloudResource[]> {
    const allResources: CloudResource[] = [];
    const regionsToQuery = region ? [region] : this.regions.slice(0, 5); // Limit to 5 regions for performance

    for (const reg of regionsToQuery) {
      try {
        // Get compute instances
        const computeService = this.getComputeService(reg);
        const instances = await computeService.listInstances();
        allResources.push(...instances);

        // Get storage buckets
        const storageService = this.getStorageService(reg);
        const buckets = await storageService.listBuckets();
        allResources.push(...buckets);

        // Get databases
        const databaseService = this.getDatabaseService(reg);
        const databases = await databaseService.listDatabases();
        allResources.push(...databases);

        // Get container services
        const containerService = this.getContainerService(reg);
        const containers = await containerService.listServices();
        allResources.push(...containers);

        // Get functions
        const functionService = this.getFunctionService(reg);
        const functions = await functionService.listFunctions();
        allResources.push(...functions);
      } catch (error) {
        console.error(`Error listing resources in region ${reg}:`, error);
        // Continue with other regions even if one fails
      }
    }

    return allResources;
  }

  async getResourceById(resourceId: string): Promise<CloudResource | null> {
    // This is a basic implementation - providers should override with more efficient lookups
    const allResources = await this.listAllResources();
    return allResources.find(resource => resource.id === resourceId) || null;
  }

  abstract tagResource(resourceId: string, tags: Record<string, string>): Promise<boolean>;

  // Protected helper methods
  protected getCachedService<T>(key: string, factory: () => T): T {
    if (!this.serviceCache.has(key)) {
      this.serviceCache.set(key, factory());
    }
    return this.serviceCache.get(key) as T;
  }

  protected async calculateResourceCost(resource: any, region: string): Promise<{ amount: number; currency: string }> {
    // Base cost calculation - providers should implement specific pricing logic
    let baseCost = 0;

    switch (resource.type) {
      case 'compute':
        baseCost = this.calculateComputeCost(resource);
        break;
      case 'storage':
        baseCost = this.calculateStorageCost(resource);
        break;
      case 'database':
        baseCost = this.calculateDatabaseCost(resource);
        break;
      case 'container':
        baseCost = this.calculateContainerCost(resource);
        break;
      case 'function':
        baseCost = this.calculateFunctionCost(resource);
        break;
      default:
        baseCost = 0;
    }

    // Apply regional pricing multipliers
    const regionalMultiplier = this.getRegionalCostMultiplier(region);
    
    return {
      amount: baseCost * regionalMultiplier,
      currency: 'USD'
    };
  }

  protected calculateComputeCost(resource: any): number {
    // Basic compute cost calculation
    const cpuCost = resource.cpu * 0.0464; // $0.0464 per vCPU hour
    const memoryCost = resource.memory * 0.00515; // $0.00515 per GB hour
    const storageCost = resource.storage * 0.10 / 30 / 24; // $0.10 per GB month
    
    return (cpuCost + memoryCost + storageCost) * 24 * 30; // Monthly cost
  }

  protected calculateStorageCost(resource: any): number {
    // Basic storage cost calculation
    const storageCost = resource.size / (1024 * 1024 * 1024) * 0.023; // $0.023 per GB month
    const requestCost = resource.requests * 0.0004 / 1000; // $0.0004 per 1K requests
    
    return storageCost + requestCost;
  }

  protected calculateDatabaseCost(resource: any): number {
    // Basic database cost calculation
    const instanceCost = this.calculateComputeCost(resource);
    const storageCost = resource.allocatedStorage * 0.115; // $0.115 per GB month
    const backupCost = resource.backupStorage * 0.095; // $0.095 per GB month
    
    return instanceCost + storageCost + backupCost;
  }

  protected calculateContainerCost(resource: any): number {
    // Basic container cost calculation
    const cpuCost = resource.cpu * 0.04048 * 24 * 30; // Per vCPU month
    const memoryCost = resource.memory / 1024 * 0.004445 * 24 * 30; // Per GB month
    
    return cpuCost + memoryCost;
  }

  protected calculateFunctionCost(resource: any): number {
    // Basic function cost calculation
    const requestCost = resource.invocations * 0.0000002; // $0.0000002 per request
    const computeCost = resource.duration * resource.memory / 1024 * 0.0000166667; // GB-seconds
    
    return requestCost + computeCost;
  }

  protected getRegionalCostMultiplier(region: string): number {
    // Regional cost multipliers - providers should override with actual data
    const multipliers: Record<string, number> = {
      'us-east-1': 1.0,
      'us-west-2': 1.0,
      'eu-west-1': 1.1,
      'ap-southeast-1': 1.15,
      'ap-northeast-1': 1.2,
      // Add more regions as needed
    };
    
    return multipliers[region] || 1.0;
  }

  protected formatError(error: any, context: string): Error {
    const message = `${this.name} ${context}: ${error.message || error}`;
    const formattedError = new Error(message);
    formattedError.stack = error.stack;
    return formattedError;
  }

  protected validateRegion(region: string): void {
    if (!this.regions.includes(region)) {
      throw new Error(`Region ${region} is not supported by ${this.name}. Supported regions: ${this.regions.join(', ')}`);
    }
  }

  protected ensureAuthenticated(): void {
    if (!this.authenticated) {
      throw new Error(`${this.name} provider is not authenticated. Please authenticate first.`);
    }
  }
}