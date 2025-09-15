import { BaseProvider } from '../../base/BaseProvider';
import {
  CloudProviderType,
  CloudCredentials,
  IComputeService,
  IStorageService,
  IDatabaseService,
  IContainerService,
  IFunctionService,
  IMonitoringService
} from '../../types';
import { AwsComputeService } from './services/AwsComputeService';
import { AwsStorageService } from './services/AwsStorageService';
import { AwsDatabaseService } from './services/AwsDatabaseService';
import { AwsContainerService } from './services/AwsContainerService';
import { AwsFunctionService } from './services/AwsFunctionService';
import { AwsMonitoringService } from './services/AwsMonitoringService';

export class AwsProvider extends BaseProvider {
  private awsConfig: any;
  private readonly awsRegions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1', 'ap-northeast-2',
    'ca-central-1', 'sa-east-1'
  ];

  constructor(credentials: CloudCredentials) {
    super('aws', 'Amazon Web Services', [], credentials);
    this.regions.push(...this.awsRegions);
  }

  async authenticate(credentials: CloudCredentials): Promise<boolean> {
    try {
      this.awsConfig = {
        accessKeyId: credentials.credentials.accessKeyId,
        secretAccessKey: credentials.credentials.secretAccessKey,
        region: credentials.region || 'us-east-1',
        sessionToken: credentials.credentials.sessionToken, // for temporary credentials
      };

      // Validate credentials by making a simple API call
      const isValid = await this.validateCredentials(credentials);
      if (isValid) {
        this.authenticated = true;
        this.credentials = credentials;
      }
      
      return isValid;
    } catch (error) {
      console.error('AWS authentication failed:', error);
      return false;
    }
  }

  async validateCredentials(credentials: CloudCredentials): Promise<boolean> {
    try {
      // Simple validation - try to get caller identity
      // In a real implementation, you would use AWS SDK here
      // const sts = new AWS.STS(this.awsConfig);
      // await sts.getCallerIdentity().promise();
      
      // For now, just validate that required fields are present
      const { accessKeyId, secretAccessKey } = credentials.credentials;
      return !!(accessKeyId && secretAccessKey);
    } catch (error) {
      return false;
    }
  }

  getComputeService(region: string): IComputeService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`compute-${region}`, () => 
      new AwsComputeService(this.awsConfig, region)
    );
  }

  getStorageService(region: string): IStorageService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`storage-${region}`, () => 
      new AwsStorageService(this.awsConfig, region)
    );
  }

  getDatabaseService(region: string): IDatabaseService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`database-${region}`, () => 
      new AwsDatabaseService(this.awsConfig, region)
    );
  }

  getContainerService(region: string): IContainerService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`container-${region}`, () => 
      new AwsContainerService(this.awsConfig, region)
    );
  }

  getFunctionService(region: string): IFunctionService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`function-${region}`, () => 
      new AwsFunctionService(this.awsConfig, region)
    );
  }

  getMonitoringService(region: string): IMonitoringService {
    this.ensureAuthenticated();
    this.validateRegion(region);
    
    return this.getCachedService(`monitoring-${region}`, () => 
      new AwsMonitoringService(this.awsConfig, region)
    );
  }

  async getAvailableRegions(): Promise<string[]> {
    return this.awsRegions;
  }

  async getAvailableInstanceTypes(region: string): Promise<any[]> {
    this.validateRegion(region);
    
    // AWS EC2 instance types (simplified list)
    return [
      {
        name: 't3.micro',
        cpu: 2,
        memory: 1,
        network: 'up to 5 Gbps',
        storage: 'EBS only',
        price: { linux: 0.0104, windows: 0.0208 }
      },
      {
        name: 't3.small',
        cpu: 2,
        memory: 2,
        network: 'up to 5 Gbps',
        storage: 'EBS only',
        price: { linux: 0.0208, windows: 0.0416 }
      },
      {
        name: 't3.medium',
        cpu: 2,
        memory: 4,
        network: 'up to 5 Gbps',
        storage: 'EBS only',
        price: { linux: 0.0416, windows: 0.0832 }
      },
      {
        name: 'm5.large',
        cpu: 2,
        memory: 8,
        network: 'up to 10 Gbps',
        storage: 'EBS only',
        price: { linux: 0.096, windows: 0.192 }
      },
      {
        name: 'm5.xlarge',
        cpu: 4,
        memory: 16,
        network: 'up to 10 Gbps',
        storage: 'EBS only',
        price: { linux: 0.192, windows: 0.384 }
      },
      {
        name: 'c5.large',
        cpu: 2,
        memory: 4,
        network: 'up to 10 Gbps',
        storage: 'EBS only',
        price: { linux: 0.085, windows: 0.170 }
      },
      {
        name: 'r5.large',
        cpu: 2,
        memory: 16,
        network: 'up to 10 Gbps',
        storage: 'EBS only',
        price: { linux: 0.126, windows: 0.252 }
      }
    ];
  }

  async tagResource(resourceId: string, tags: Record<string, string>): Promise<boolean> {
    try {
      this.ensureAuthenticated();
      
      // In a real implementation, you would use AWS SDK to tag resources
      // const ec2 = new AWS.EC2(this.awsConfig);
      // await ec2.createTags({
      //   Resources: [resourceId],
      //   Tags: Object.entries(tags).map(([Key, Value]) => ({ Key, Value }))
      // }).promise();
      
      console.log(`Tagged AWS resource ${resourceId} with:`, tags);
      return true;
    } catch (error) {
      console.error('Failed to tag AWS resource:', error);
      return false;
    }
  }

  protected getRegionalCostMultiplier(region: string): number {
    // AWS-specific regional cost multipliers
    const awsMultipliers: Record<string, number> = {
      'us-east-1': 1.0,        // N. Virginia (base)
      'us-east-2': 0.98,       // Ohio
      'us-west-1': 1.05,       // N. California
      'us-west-2': 1.0,        // Oregon
      'eu-west-1': 1.1,        // Ireland
      'eu-west-2': 1.12,       // London
      'eu-west-3': 1.15,       // Paris
      'eu-central-1': 1.08,    // Frankfurt
      'ap-southeast-1': 1.15,  // Singapore
      'ap-southeast-2': 1.18,  // Sydney
      'ap-northeast-1': 1.2,   // Tokyo
      'ap-northeast-2': 1.15,  // Seoul
      'ca-central-1': 1.05,    // Canada
      'sa-east-1': 1.25,       // São Paulo
    };
    
    return awsMultipliers[region] || 1.0;
  }

  async getEstimatedCosts(resources: any[], region: string): Promise<any> {
    const baseCosts = await super.getEstimatedCosts(resources, region);
    
    // Add AWS-specific cost calculations
    baseCosts.breakdown['data-transfer'] = this.calculateDataTransferCosts(resources);
    baseCosts.breakdown['ebs-storage'] = this.calculateEbsStorageCosts(resources);
    baseCosts.breakdown['nat-gateway'] = this.calculateNatGatewayCosts(resources);
    
    // Recalculate total
    baseCosts.total = Object.values(baseCosts.breakdown).reduce((sum: number, cost) => sum + (cost as number), 0);
    
    return {
      ...baseCosts,
      provider: 'aws',
      region,
      estimatedAt: new Date().toISOString(),
      includes: [
        'Compute instances',
        'Storage (S3, EBS)',
        'Database (RDS)',
        'Container services (ECS)',
        'Function compute (Lambda)',
        'Data transfer',
        'NAT Gateway'
      ]
    };
  }

  private calculateDataTransferCosts(resources: any[]): number {
    // Simplified data transfer cost calculation
    const avgDataTransferGb = resources.length * 10; // 10GB per resource per month
    return avgDataTransferGb * 0.09; // $0.09 per GB after first 1GB free
  }

  private calculateEbsStorageCosts(resources: any[]): number {
    // Calculate EBS storage costs for compute resources
    const computeResources = resources.filter(r => r.type === 'compute');
    const totalStorageGb = computeResources.reduce((sum, r) => sum + (r.storage || 0), 0);
    return totalStorageGb * 0.10; // $0.10 per GB-month for gp3
  }

  private calculateNatGatewayCosts(resources: any[]): number {
    // Estimate NAT Gateway costs for private subnets
    const hasPrivateResources = resources.some(r => r.subnet === 'private');
    return hasPrivateResources ? 45.60 : 0; // $45.60 per month per NAT Gateway
  }
}