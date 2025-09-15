import {
  IMultiCloudManager,
  ICloudProvider,
  CloudProviderType,
  CloudCredentials,
  MultiCloudResource,
  CloudResource
} from './types';
import { CloudProviderFactory } from './CloudProviderFactory';

/**
 * Multi-cloud manager for coordinating operations across multiple cloud providers
 * Provides unified interface for cross-cloud resource management, cost optimization,
 * and intelligent provider selection
 */
export class MultiCloudManager implements IMultiCloudManager {
  private providers: Map<string, ICloudProvider> = new Map();
  private factory: CloudProviderFactory;
  private resourceMapping: Map<string, MultiCloudResource> = new Map();

  constructor() {
    this.factory = CloudProviderFactory.getInstance();
  }

  /**
   * Add a cloud provider to the multi-cloud manager
   */
  async addProvider(type: CloudProviderType, credentials: CloudCredentials, alias?: string): Promise<string> {
    try {
      const provider = await this.factory.createProvider(type, credentials);
      const providerId = alias || `${type}-${Date.now()}`;
      
      this.providers.set(providerId, provider);
      
      console.log(`Successfully added ${type} provider with ID: ${providerId}`);
      return providerId;
    } catch (error) {
      throw new Error(`Failed to add ${type} provider: ${error.message}`);
    }
  }

  /**
   * Remove a cloud provider from the multi-cloud manager
   */
  async removeProvider(providerId: string): Promise<boolean> {
    try {
      if (!this.providers.has(providerId)) {
        throw new Error(`Provider ${providerId} not found`);
      }

      // Check if provider has active resources
      const activeResources = await this.getProviderResources(providerId);
      if (activeResources.length > 0) {
        console.warn(`Provider ${providerId} has ${activeResources.length} active resources`);
        // In production, you might want to prevent removal or offer migration options
      }

      this.providers.delete(providerId);
      
      // Clean up any resource mappings for this provider
      this.cleanupProviderResourceMappings(providerId);
      
      console.log(`Successfully removed provider: ${providerId}`);
      return true;
    } catch (error) {
      console.error(`Failed to remove provider ${providerId}:`, error);
      return false;
    }
  }

  /**
   * List all registered cloud providers
   */
  async listProviders(): Promise<{ id: string; type: CloudProviderType; alias?: string; status: string }[]> {
    const providerList = [];
    
    for (const [id, provider] of this.providers.entries()) {
      try {
        // Test provider connectivity
        const regions = await provider.getAvailableRegions();
        const status = regions && regions.length > 0 ? 'active' : 'inactive';
        
        providerList.push({
          id,
          type: provider.type,
          alias: id.includes('-') ? id.split('-')[0] : undefined,
          status
        });
      } catch (error) {
        providerList.push({
          id,
          type: provider.type,
          alias: id.includes('-') ? id.split('-')[0] : undefined,
          status: 'error'
        });
      }
    }
    
    return providerList;
  }

  /**
   * Deploy a resource to multiple cloud providers for redundancy
   */
  async deployToMultipleProviders(spec: any, providerIds: string[]): Promise<MultiCloudResource> {
    const resourceId = `multi-${this.generateId()}`;
    const deploymentResults = [];
    
    // Deploy to each specified provider
    for (const providerId of providerIds) {
      try {
        const provider = this.providers.get(providerId);
        if (!provider) {
          throw new Error(`Provider ${providerId} not found`);
        }

        const resource = await this.deployToProvider(provider, spec);
        deploymentResults.push({
          provider: provider.type,
          resourceId: resource.id,
          region: resource.region,
          status: resource.status,
          isPrimary: deploymentResults.length === 0 // First deployment is primary
        });
      } catch (error) {
        console.error(`Failed to deploy to provider ${providerId}:`, error);
        deploymentResults.push({
          provider: this.getProviderType(providerId),
          resourceId: '',
          region: '',
          status: 'failed',
          isPrimary: false
        });
      }
    }

    const multiCloudResource: MultiCloudResource = {
      id: resourceId,
      name: spec.name || `Multi-cloud Resource ${resourceId}`,
      type: spec.type || 'compute',
      providers: deploymentResults,
      syncStatus: 'synced',
      lastSync: new Date(),
      configuration: spec,
      tags: spec.tags || {}
    };

    this.resourceMapping.set(resourceId, multiCloudResource);
    
    return multiCloudResource;
  }

  /**
   * Synchronize resource state across all providers
   */
  async syncResources(resourceId: string): Promise<boolean> {
    try {
      const resource = this.resourceMapping.get(resourceId);
      if (!resource) {
        throw new Error(`Multi-cloud resource ${resourceId} not found`);
      }

      let syncSuccessful = true;
      const updatedProviders = [];

      // Check each provider's resource status
      for (const providerInfo of resource.providers) {
        try {
          const provider = this.getProviderByType(providerInfo.provider);
          if (provider) {
            const currentResource = await provider.getResourceById(providerInfo.resourceId);
            if (currentResource) {
              updatedProviders.push({
                ...providerInfo,
                status: currentResource.status
              });
            } else {
              updatedProviders.push({
                ...providerInfo,
                status: 'missing'
              });
              syncSuccessful = false;
            }
          }
        } catch (error) {
          console.error(`Failed to sync provider ${providerInfo.provider}:`, error);
          updatedProviders.push({
            ...providerInfo,
            status: 'error'
          });
          syncSuccessful = false;
        }
      }

      // Update resource with sync results
      resource.providers = updatedProviders;
      resource.syncStatus = syncSuccessful ? 'synced' : 'drift';
      resource.lastSync = new Date();
      
      this.resourceMapping.set(resourceId, resource);
      
      return syncSuccessful;
    } catch (error) {
      console.error(`Failed to sync resources for ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Get multi-cloud resource status
   */
  async getResourceStatus(resourceId: string): Promise<MultiCloudResource> {
    const resource = this.resourceMapping.get(resourceId);
    if (!resource) {
      throw new Error(`Multi-cloud resource ${resourceId} not found`);
    }

    // Refresh resource status
    await this.syncResources(resourceId);
    
    return this.resourceMapping.get(resourceId)!;
  }

  /**
   * Get aggregated costs across all cloud providers
   */
  async getMultiCloudCosts(startDate: Date, endDate: Date): Promise<any> {
    const aggregatedCosts = {
      total: 0,
      currency: 'USD',
      period: {
        start: startDate,
        end: endDate
      },
      providers: {},
      breakdown: {
        compute: 0,
        storage: 0,
        database: 0,
        container: 0,
        function: 0,
        monitoring: 0,
        networking: 0
      }
    };

    // Get costs from each provider
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const resources = await provider.listAllResources();
        const providerCosts = await provider.getEstimatedCosts(resources, provider.regions[0]);
        
        aggregatedCosts.total += providerCosts.total;
        aggregatedCosts.providers[provider.type] = providerCosts;
        
        // Aggregate breakdown by service type
        Object.entries(providerCosts.breakdown).forEach(([service, cost]) => {
          if (aggregatedCosts.breakdown[service] !== undefined) {
            aggregatedCosts.breakdown[service] += cost as number;
          } else {
            aggregatedCosts.breakdown[service] = cost as number;
          }
        });
      } catch (error) {
        console.error(`Failed to get costs for provider ${providerId}:`, error);
      }
    }

    return aggregatedCosts;
  }

  /**
   * Optimize costs across cloud providers
   */
  async optimizeCosts(resourceId: string): Promise<any> {
    const resource = this.resourceMapping.get(resourceId);
    if (!resource) {
      throw new Error(`Multi-cloud resource ${resourceId} not found`);
    }

    const optimizationRecommendations = [];
    
    // Analyze each provider's costs and performance
    for (const providerInfo of resource.providers) {
      try {
        const provider = this.getProviderByType(providerInfo.provider);
        if (provider) {
          const currentResource = await provider.getResourceById(providerInfo.resourceId);
          if (currentResource && currentResource.cost) {
            
            // Analyze cost optimization opportunities
            const recommendations = await this.analyzeProviderCostOptimization(
              provider, 
              currentResource,
              providerInfo
            );
            
            optimizationRecommendations.push({
              provider: providerInfo.provider,
              resourceId: providerInfo.resourceId,
              currentCost: currentResource.cost,
              recommendations
            });
          }
        }
      } catch (error) {
        console.error(`Failed to analyze costs for provider ${providerInfo.provider}:`, error);
      }
    }

    return {
      resourceId,
      optimizationRecommendations,
      totalPotentialSavings: optimizationRecommendations.reduce((sum, rec) => 
        sum + rec.recommendations.reduce((recSum, r) => recSum + (r.potentialSavings || 0), 0), 0
      ),
      analysisDate: new Date()
    };
  }

  /**
   * Migrate a resource from one provider to another
   */
  async migrateResource(resourceId: string, fromProvider: string, toProvider: string): Promise<any> {
    try {
      const sourceProvider = this.providers.get(fromProvider);
      const targetProvider = this.providers.get(toProvider);
      
      if (!sourceProvider || !targetProvider) {
        throw new Error('Source or target provider not found');
      }

      // Get source resource configuration
      const sourceResource = await sourceProvider.getResourceById(resourceId);
      if (!sourceResource) {
        throw new Error(`Resource ${resourceId} not found in source provider`);
      }

      // Create migration plan
      const migrationPlan = {
        migrationId: `migration-${this.generateId()}`,
        sourceProvider: sourceProvider.type,
        targetProvider: targetProvider.type,
        resourceId,
        sourceResource,
        status: 'planning',
        steps: [],
        estimatedDuration: '2-4 hours',
        estimatedCost: 0,
        risks: []
      };

      // Add migration steps based on resource type
      migrationPlan.steps = this.generateMigrationSteps(sourceResource, sourceProvider.type, targetProvider.type);
      
      // Calculate estimated costs
      migrationPlan.estimatedCost = await this.calculateMigrationCost(sourceResource, targetProvider);
      
      // Identify migration risks
      migrationPlan.risks = this.identifyMigrationRisks(sourceResource, sourceProvider.type, targetProvider.type);

      return migrationPlan;
    } catch (error) {
      throw new Error(`Failed to create migration plan: ${error.message}`);
    }
  }

  /**
   * Get intelligent provider recommendations based on workload characteristics
   */
  async getProviderRecommendations(workloadSpec: any): Promise<any> {
    const recommendations = [];
    
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        const capabilities = this.factory.getProviderCapabilities(provider.type);
        const score = this.calculateProviderScore(workloadSpec, capabilities, provider.type);
        
        recommendations.push({
          providerId,
          providerType: provider.type,
          score,
          reasoning: this.generateRecommendationReasoning(workloadSpec, capabilities),
          estimatedCost: await this.estimateWorkloadCost(workloadSpec, provider),
          capabilities
        });
      } catch (error) {
        console.error(`Failed to analyze provider ${providerId}:`, error);
      }
    }

    // Sort by score (highest first)
    recommendations.sort((a, b) => b.score - a.score);
    
    return {
      workloadSpec,
      recommendations,
      topRecommendation: recommendations[0],
      analysisDate: new Date()
    };
  }

  // Private helper methods

  private async deployToProvider(provider: ICloudProvider, spec: any): Promise<CloudResource> {
    const region = spec.region || provider.regions[0];
    
    switch (spec.type) {
      case 'compute':
        const computeService = provider.getComputeService(region);
        return await computeService.createInstance(spec);
      case 'storage':
        const storageService = provider.getStorageService(region);
        return await storageService.createBucket(spec.name, region, spec);
      case 'database':
        const databaseService = provider.getDatabaseService(region);
        return await databaseService.createDatabase(spec);
      default:
        throw new Error(`Unsupported resource type: ${spec.type}`);
    }
  }

  private getProviderType(providerId: string): CloudProviderType {
    const provider = this.providers.get(providerId);
    return provider ? provider.type : 'aws'; // Default fallback
  }

  private getProviderByType(type: CloudProviderType): ICloudProvider | undefined {
    for (const provider of this.providers.values()) {
      if (provider.type === type) {
        return provider;
      }
    }
    return undefined;
  }

  private async getProviderResources(providerId: string): Promise<CloudResource[]> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      return [];
    }
    
    try {
      return await provider.listAllResources();
    } catch (error) {
      console.error(`Failed to get resources for provider ${providerId}:`, error);
      return [];
    }
  }

  private cleanupProviderResourceMappings(providerId: string): void {
    for (const [resourceId, resource] of this.resourceMapping.entries()) {
      resource.providers = resource.providers.filter(p => p.provider !== this.getProviderType(providerId));
      if (resource.providers.length === 0) {
        this.resourceMapping.delete(resourceId);
      } else {
        this.resourceMapping.set(resourceId, resource);
      }
    }
  }

  private async analyzeProviderCostOptimization(provider: ICloudProvider, resource: CloudResource, providerInfo: any): Promise<any[]> {
    const recommendations = [];
    
    // Check for right-sizing opportunities
    if (resource.type === 'compute') {
      recommendations.push({
        type: 'rightsizing',
        description: 'Consider downsizing instance based on actual CPU usage',
        potentialSavings: resource.cost ? resource.cost.monthly * 0.3 : 0,
        confidence: 'medium'
      });
    }
    
    // Check for reserved instance opportunities
    recommendations.push({
      type: 'reserved-instances',
      description: 'Save 30-60% with 1-year reserved instances for stable workloads',
      potentialSavings: resource.cost ? resource.cost.monthly * 0.4 : 0,
      confidence: 'high'
    });
    
    return recommendations;
  }

  private generateMigrationSteps(resource: CloudResource, fromProvider: CloudProviderType, toProvider: CloudProviderType): string[] {
    const steps = [
      '1. Create backup/snapshot of source resource',
      '2. Provision equivalent resource in target provider',
      '3. Configure networking and security groups',
      '4. Migrate data with minimal downtime',
      '5. Update DNS and load balancer configurations',
      '6. Validate functionality and performance',
      '7. Cleanup source resource'
    ];
    
    return steps;
  }

  private async calculateMigrationCost(resource: CloudResource, targetProvider: ICloudProvider): Promise<number> {
    // Simplified migration cost calculation
    const dataMigrationCost = 50; // Base cost for data migration
    const resourceCost = resource.cost ? resource.cost.monthly : 100;
    return dataMigrationCost + (resourceCost * 0.1); // 10% of monthly cost
  }

  private identifyMigrationRisks(resource: CloudResource, fromProvider: CloudProviderType, toProvider: CloudProviderType): string[] {
    const risks = [
      'Potential downtime during data migration',
      'Compatibility issues with provider-specific features',
      'DNS propagation delays',
      'Performance differences between providers'
    ];
    
    return risks;
  }

  private calculateProviderScore(workloadSpec: any, capabilities: any, providerType: CloudProviderType): number {
    let score = 0;
    
    // Base score for provider capabilities
    score += capabilities.regions * 2; // More regions = better
    score += capabilities.services.length * 5; // More services = better
    
    // Workload-specific scoring
    if (workloadSpec.requirements) {
      if (workloadSpec.requirements.compliance) {
        const requiredCompliance = workloadSpec.requirements.compliance;
        const matchingCompliance = capabilities.compliance.filter(c => requiredCompliance.includes(c));
        score += matchingCompliance.length * 10;
      }
      
      if (workloadSpec.requirements.machineLearning && capabilities.features.machineLearning) {
        score += 20;
      }
      
      if (workloadSpec.requirements.kubernetes && capabilities.features.kubernetes) {
        score += 15;
      }
    }
    
    return score;
  }

  private generateRecommendationReasoning(workloadSpec: any, capabilities: any): string[] {
    const reasoning = [];
    
    reasoning.push(`Provider offers ${capabilities.regions} regions globally`);
    reasoning.push(`Supports ${capabilities.services.length} core cloud services`);
    
    if (capabilities.features.autoScaling) {
      reasoning.push('Built-in auto-scaling capabilities');
    }
    
    if (capabilities.pricing.freeTier) {
      reasoning.push('Free tier available for cost optimization');
    }
    
    return reasoning;
  }

  private async estimateWorkloadCost(workloadSpec: any, provider: ICloudProvider): Promise<number> {
    try {
      const region = workloadSpec.region || provider.regions[0];
      const mockResources = this.createMockResourcesFromSpec(workloadSpec);
      const estimate = await provider.getEstimatedCosts(mockResources, region);
      return estimate.total;
    } catch (error) {
      console.error('Failed to estimate workload cost:', error);
      return 0;
    }
  }

  private createMockResourcesFromSpec(workloadSpec: any): any[] {
    const resources = [];
    
    if (workloadSpec.compute) {
      resources.push({
        type: 'compute',
        instanceType: workloadSpec.compute.instanceType || 'medium',
        cpu: workloadSpec.compute.cpu || 2,
        memory: workloadSpec.compute.memory || 4,
        storage: workloadSpec.compute.storage || 20
      });
    }
    
    if (workloadSpec.storage) {
      resources.push({
        type: 'storage',
        size: workloadSpec.storage.size || 100,
        requests: workloadSpec.storage.requests || 1000
      });
    }
    
    return resources;
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}