import {
  ICloudProviderFactory,
  ICloudProvider,
  CloudProviderType,
  CloudCredentials
} from './types';
import { AwsProvider } from './providers/aws/AwsProvider';
import { AzureProvider } from './providers/azure/AzureProvider';
import { GcpProvider } from './providers/gcp/GcpProvider';

/**
 * Factory class for creating cloud provider instances
 * Supports AWS, Azure, and GCP with proper authentication and configuration
 */
export class CloudProviderFactory implements ICloudProviderFactory {
  private static instance: CloudProviderFactory;
  private providerCache: Map<string, ICloudProvider> = new Map();

  private constructor() {}

  /**
   * Get singleton instance of the factory
   */
  public static getInstance(): CloudProviderFactory {
    if (!CloudProviderFactory.instance) {
      CloudProviderFactory.instance = new CloudProviderFactory();
    }
    return CloudProviderFactory.instance;
  }

  /**
   * Create a cloud provider instance with authentication
   */
  async createProvider(type: CloudProviderType, credentials: CloudCredentials): Promise<ICloudProvider> {
    const cacheKey = this.getCacheKey(type, credentials);
    
    // Return cached provider if available and still authenticated
    if (this.providerCache.has(cacheKey)) {
      const cachedProvider = this.providerCache.get(cacheKey)!;
      // Validate cached provider is still authenticated
      if (await this.validateProviderConnection(cachedProvider)) {
        return cachedProvider;
      } else {
        // Remove invalid cached provider
        this.providerCache.delete(cacheKey);
      }
    }

    // Create new provider instance
    let provider: ICloudProvider;
    
    switch (type) {
      case 'aws':
        provider = new AwsProvider(credentials);
        break;
      case 'azure':
        provider = new AzureProvider(credentials);
        break;
      case 'gcp':
        provider = new GcpProvider(credentials);
        break;
      default:
        throw new Error(`Unsupported cloud provider type: ${type}`);
    }

    // Authenticate the provider
    const authenticated = await provider.authenticate(credentials);
    if (!authenticated) {
      throw new Error(`Failed to authenticate with ${type} provider`);
    }

    // Cache the authenticated provider
    this.providerCache.set(cacheKey, provider);
    
    return provider;
  }

  /**
   * Get all supported cloud provider types
   */
  getSupportedProviders(): CloudProviderType[] {
    return ['aws', 'azure', 'gcp'];
  }

  /**
   * Validate provider credentials without creating a full provider instance
   */
  async validateProviderCredentials(type: CloudProviderType, credentials: CloudCredentials): Promise<boolean> {
    try {
      let provider: ICloudProvider;
      
      switch (type) {
        case 'aws':
          provider = new AwsProvider(credentials);
          break;
        case 'azure':
          provider = new AzureProvider(credentials);
          break;
        case 'gcp':
          provider = new GcpProvider(credentials);
          break;
        default:
          return false;
      }

      return await provider.validateCredentials(credentials);
    } catch (error) {
      console.error(`Error validating ${type} credentials:`, error);
      return false;
    }
  }

  /**
   * Create multiple providers for multi-cloud operations
   */
  async createMultipleProviders(configs: { type: CloudProviderType; credentials: CloudCredentials; alias?: string }[]): Promise<Map<string, ICloudProvider>> {
    const providers = new Map<string, ICloudProvider>();
    const creationPromises = configs.map(async (config) => {
      try {
        const provider = await this.createProvider(config.type, config.credentials);
        const key = config.alias || config.type;
        providers.set(key, provider);
        return { key, provider, success: true };
      } catch (error) {
        console.error(`Failed to create ${config.type} provider:`, error);
        return { key: config.alias || config.type, provider: null, success: false, error };
      }
    });

    const results = await Promise.allSettled(creationPromises);
    
    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.error(`Provider creation failed for ${configs[index].type}:`, result.reason);
      }
    });

    return providers;
  }

  /**
   * Get provider capabilities for comparison and selection
   */
  getProviderCapabilities(type: CloudProviderType): any {
    const capabilities = {
      aws: {
        regions: 25,
        services: ['compute', 'storage', 'database', 'container', 'function', 'monitoring'],
        features: {
          autoScaling: true,
          loadBalancing: true,
          contentDelivery: true,
          machineLearning: true,
          iot: true,
          blockchain: true,
          quantumComputing: true
        },
        compliance: ['SOC2', 'HIPAA', 'GDPR', 'FedRAMP', 'ISO27001'],
        pricing: {
          model: 'pay-as-you-go',
          freeTier: true,
          reservedInstances: true,
          spotInstances: true
        }
      },
      azure: {
        regions: 20,
        services: ['compute', 'storage', 'database', 'container', 'function', 'monitoring'],
        features: {
          autoScaling: true,
          loadBalancing: true,
          contentDelivery: true,
          machineLearning: true,
          iot: true,
          hybridCloud: true,
          enterpriseIntegration: true
        },
        compliance: ['SOC2', 'HIPAA', 'GDPR', 'FedRAMP', 'ISO27001'],
        pricing: {
          model: 'pay-as-you-go',
          freeTier: true,
          reservedInstances: true,
          hybridBenefit: true
        }
      },
      gcp: {
        regions: 24,
        services: ['compute', 'storage', 'database', 'container', 'function', 'monitoring'],
        features: {
          autoScaling: true,
          loadBalancing: true,
          contentDelivery: true,
          machineLearning: true,
          dataAnalytics: true,
          kubernetes: true,
          sustainableComputing: true
        },
        compliance: ['SOC2', 'HIPAA', 'GDPR', 'ISO27001'],
        pricing: {
          model: 'pay-as-you-go',
          freeTier: true,
          sustainedUseDiscounts: true,
          committedUseContracts: true
        }
      }
    };

    return capabilities[type] || null;
  }

  /**
   * Clear all cached providers (useful for credential rotation)
   */
  clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Remove specific provider from cache
   */
  removeCachedProvider(type: CloudProviderType, credentials: CloudCredentials): void {
    const cacheKey = this.getCacheKey(type, credentials);
    this.providerCache.delete(cacheKey);
  }

  /**
   * Get cached provider count for monitoring
   */
  getCachedProviderCount(): number {
    return this.providerCache.size;
  }

  /**
   * Generate cache key for provider instances
   */
  private getCacheKey(type: CloudProviderType, credentials: CloudCredentials): string {
    // Create a hash of credentials for caching (don't store actual credentials)
    const credentialHash = this.hashCredentials(credentials);
    return `${type}-${credentialHash}`;
  }

  /**
   * Hash credentials for cache key generation
   */
  private hashCredentials(credentials: CloudCredentials): string {
    // Simple hash for demo - in production, use proper cryptographic hash
    const credentialString = JSON.stringify({
      type: credentials.type,
      region: credentials.region,
      projectId: credentials.projectId,
      subscriptionId: credentials.subscriptionId,
      // Don't include actual secrets in hash
    });
    
    return Buffer.from(credentialString).toString('base64').slice(0, 16);
  }

  /**
   * Validate that a cached provider is still connected
   */
  private async validateProviderConnection(provider: ICloudProvider): Promise<boolean> {
    try {
      // Try to get available regions as a simple connectivity test
      const regions = await provider.getAvailableRegions();
      return regions && regions.length > 0;
    } catch (error) {
      return false;
    }
  }
}