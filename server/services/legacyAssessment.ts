import { storage } from "../storage";
import { generateCodeFromPrompt } from "./ai";
import type { 
  LegacySystemAssessment, 
  InsertLegacySystemAssessment,
  MigrationAssessmentFinding,
  InsertMigrationAssessmentFinding 
} from "@shared/schema";

export interface InfrastructureDiscoveryInput {
  hostnames?: string[];
  ipRanges?: string[];
  cloudProviders?: string[];
  credentials?: Record<string, any>;
  scanPorts?: boolean;
  deepScan?: boolean;
}

export interface TechnologyStackAnalysis {
  languages: Array<{
    name: string;
    version: string;
    usage: 'primary' | 'secondary' | 'deprecated';
    lineCount: number;
    lastUpdated: Date;
  }>;
  frameworks: Array<{
    name: string;
    version: string;
    category: 'web' | 'api' | 'database' | 'testing' | 'build';
    supportStatus: 'active' | 'maintenance' | 'deprecated' | 'eol';
  }>;
  databases: Array<{
    type: string;
    version: string;
    size: string;
    connections: number;
    performance: 'good' | 'moderate' | 'poor';
  }>;
  services: Array<{
    name: string;
    type: 'microservice' | 'monolith' | 'serverless' | 'container';
    dependencies: string[];
    healthStatus: 'healthy' | 'warning' | 'critical';
  }>;
}

export interface SecurityAssessment {
  vulnerabilities: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'dependency' | 'configuration' | 'code' | 'infrastructure';
    description: string;
    impact: string;
    remediation: string;
    cveId?: string;
  }>;
  complianceIssues: Array<{
    standard: string;
    requirement: string;
    status: 'compliant' | 'non-compliant' | 'partially-compliant';
    impact: string;
    remediation: string;
  }>;
  securityScore: number; // 0-100
}

export interface PerformanceAnalysis {
  bottlenecks: Array<{
    component: string;
    type: 'cpu' | 'memory' | 'disk' | 'network' | 'database';
    severity: 'low' | 'medium' | 'high';
    description: string;
    metrics: Record<string, number>;
    recommendations: string[];
  }>;
  scalabilityIssues: Array<{
    service: string;
    limitation: string;
    impact: string;
    modernizationSuggestion: string;
  }>;
  performanceScore: number; // 0-100
}

export interface CostAnalysis {
  currentCosts: {
    infrastructure: number;
    maintenance: number;
    licensing: number;
    personnel: number;
    total: number;
  };
  projectedCosts: {
    infrastructure: number;
    migration: number;
    training: number;
    ongoing: number;
    total: number;
  };
  savings: {
    annual: number;
    threeYear: number;
    roi: number;
    paybackPeriod: number; // months
  };
}

export interface MigrationRecommendations {
  strategy: 'rehost' | 'replatform' | 'refactor' | 'rearchitect' | 'rebuild' | 'replace';
  priority: 'high' | 'medium' | 'low';
  complexity: 'simple' | 'moderate' | 'complex';
  timelineEstimate: number; // weeks
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
  aiOpportunities: Array<{
    area: string;
    description: string;
    benefit: string;
    effort: 'low' | 'medium' | 'high';
  }>;
}

export class LegacyAssessmentService {
  async discoverInfrastructure(input: InfrastructureDiscoveryInput): Promise<any> {
    // Simulate infrastructure discovery
    const discovered = {
      hosts: input.hostnames || ['app-server-01', 'db-server-01', 'web-server-01'],
      services: [
        { name: 'web-app', port: 80, technology: 'Apache HTTP Server' },
        { name: 'api-service', port: 8080, technology: 'Java Spring Boot' },
        { name: 'database', port: 3306, technology: 'MySQL 5.7' },
        { name: 'cache', port: 6379, technology: 'Redis 4.0' }
      ],
      cloudResources: input.cloudProviders ? [
        { type: 'EC2', count: 3, region: 'us-east-1' },
        { type: 'RDS', count: 1, region: 'us-east-1' },
        { type: 'S3', count: 5, region: 'us-east-1' }
      ] : []
    };

    return discovered;
  }

  async analyzeTechnologyStack(systemInfo: any): Promise<TechnologyStackAnalysis> {
    const analysis: TechnologyStackAnalysis = {
      languages: [
        {
          name: 'Java',
          version: '8',
          usage: 'primary',
          lineCount: 50000,
          lastUpdated: new Date('2021-01-01')
        },
        {
          name: 'JavaScript',
          version: 'ES5',
          usage: 'secondary',
          lineCount: 15000,
          lastUpdated: new Date('2020-06-01')
        },
        {
          name: 'Python',
          version: '2.7',
          usage: 'deprecated',
          lineCount: 8000,
          lastUpdated: new Date('2019-12-01')
        }
      ],
      frameworks: [
        {
          name: 'Spring Boot',
          version: '1.5.22',
          category: 'web',
          supportStatus: 'deprecated'
        },
        {
          name: 'jQuery',
          version: '1.12.4',
          category: 'web',
          supportStatus: 'maintenance'
        },
        {
          name: 'Hibernate',
          version: '4.3.11',
          category: 'database',
          supportStatus: 'eol'
        }
      ],
      databases: [
        {
          type: 'MySQL',
          version: '5.7',
          size: '100GB',
          connections: 150,
          performance: 'moderate'
        },
        {
          type: 'Redis',
          version: '4.0',
          size: '2GB',
          connections: 50,
          performance: 'good'
        }
      ],
      services: [
        {
          name: 'user-service',
          type: 'monolith',
          dependencies: ['database', 'cache'],
          healthStatus: 'warning'
        },
        {
          name: 'notification-service',
          type: 'microservice',
          dependencies: ['database'],
          healthStatus: 'healthy'
        }
      ]
    };

    return analysis;
  }

  async performSecurityAssessment(systemInfo: any): Promise<SecurityAssessment> {
    const assessment: SecurityAssessment = {
      vulnerabilities: [
        {
          severity: 'high',
          category: 'dependency',
          description: 'Log4j vulnerability (CVE-2021-44228)',
          impact: 'Remote code execution possible',
          remediation: 'Upgrade to Log4j 2.17.0 or later',
          cveId: 'CVE-2021-44228'
        },
        {
          severity: 'medium',
          category: 'configuration',
          description: 'Weak SSL/TLS configuration',
          impact: 'Man-in-the-middle attacks possible',
          remediation: 'Enable TLS 1.3 and disable older protocols'
        },
        {
          severity: 'critical',
          category: 'infrastructure',
          description: 'Unpatched operating system',
          impact: 'System compromise possible',
          remediation: 'Apply latest security patches'
        }
      ],
      complianceIssues: [
        {
          standard: 'SOX',
          requirement: 'Access controls',
          status: 'non-compliant',
          impact: 'Audit failure risk',
          remediation: 'Implement role-based access controls'
        },
        {
          standard: 'GDPR',
          requirement: 'Data encryption',
          status: 'partially-compliant',
          impact: 'Privacy violations possible',
          remediation: 'Encrypt personal data at rest and in transit'
        }
      ],
      securityScore: 45
    };

    return assessment;
  }

  async analyzePerformance(systemInfo: any): Promise<PerformanceAnalysis> {
    const analysis: PerformanceAnalysis = {
      bottlenecks: [
        {
          component: 'database',
          type: 'database',
          severity: 'high',
          description: 'Slow query performance due to missing indexes',
          metrics: { avgQueryTime: 2500, slowQueries: 45 },
          recommendations: [
            'Add indexes on frequently queried columns',
            'Optimize query structure',
            'Consider read replicas'
          ]
        },
        {
          component: 'web-server',
          type: 'memory',
          severity: 'medium',
          description: 'High memory usage during peak hours',
          metrics: { memoryUsage: 85, peakUsage: 95 },
          recommendations: [
            'Implement connection pooling',
            'Add horizontal scaling',
            'Optimize memory allocation'
          ]
        }
      ],
      scalabilityIssues: [
        {
          service: 'user-service',
          limitation: 'Monolithic architecture limits horizontal scaling',
          impact: 'Cannot handle traffic spikes effectively',
          modernizationSuggestion: 'Break into microservices with AI-powered load balancing'
        }
      ],
      performanceScore: 60
    };

    return analysis;
  }

  async calculateCostAnalysis(systemInfo: any, techStack: TechnologyStackAnalysis): Promise<CostAnalysis> {
    const analysis: CostAnalysis = {
      currentCosts: {
        infrastructure: 15000,
        maintenance: 8000,
        licensing: 5000,
        personnel: 25000,
        total: 53000
      },
      projectedCosts: {
        infrastructure: 18000,
        migration: 12000,
        training: 8000,
        ongoing: 20000,
        total: 58000
      },
      savings: {
        annual: 15000,
        threeYear: 45000,
        roi: 1.8,
        paybackPeriod: 18
      }
    };

    return analysis;
  }

  async generateMigrationRecommendations(
    techStack: TechnologyStackAnalysis,
    security: SecurityAssessment,
    performance: PerformanceAnalysis,
    costs: CostAnalysis
  ): Promise<MigrationRecommendations> {
    const prompt = `
Based on the following legacy system analysis, provide migration strategy recommendations:

Technology Stack:
- Languages: ${techStack.languages.map(l => `${l.name} ${l.version} (${l.usage})`).join(', ')}
- Frameworks: ${techStack.frameworks.map(f => `${f.name} ${f.version} (${f.supportStatus})`).join(', ')}
- Databases: ${techStack.databases.map(d => `${d.type} ${d.version}`).join(', ')}

Security Score: ${security.securityScore}/100
Performance Score: ${performance.performanceScore}/100
ROI: ${costs.savings.roi}x

Provide:
1. Recommended migration strategy (rehost/replatform/refactor/rearchitect/rebuild/replace)
2. Priority level and complexity assessment
3. Timeline estimate in weeks
4. Risk level assessment
5. Specific recommendations for modernization
6. AI/ML opportunities for improvement

Format as JSON with strategy, priority, complexity, timelineEstimate, riskLevel, recommendations[], and aiOpportunities[].
    `;

    try {
      const aiResponse = await generateCodeFromPrompt(prompt, {
        type: 'full-app',
        projectContext: { includeContext: false }
      });

      // Parse AI response or provide fallback
      let recommendations: MigrationRecommendations;
      try {
        recommendations = JSON.parse(aiResponse.description || '{}');
      } catch {
        recommendations = {
          strategy: 'refactor',
          priority: 'high',
          complexity: 'moderate',
          timelineEstimate: 16,
          riskLevel: 'medium',
          recommendations: [
            'Upgrade to Java 11+ for better performance and security',
            'Migrate from Spring Boot 1.x to Spring Boot 3.x',
            'Implement microservices architecture for better scalability',
            'Add comprehensive monitoring and observability',
            'Implement CI/CD pipelines with automated testing'
          ],
          aiOpportunities: [
            {
              area: 'Automated Testing',
              description: 'AI-powered test generation and maintenance',
              benefit: 'Reduce testing time by 60% and improve coverage',
              effort: 'medium'
            },
            {
              area: 'Performance Optimization',
              description: 'ML-driven performance tuning and resource allocation',
              benefit: 'Improve response times by 40% and reduce infrastructure costs',
              effort: 'low'
            },
            {
              area: 'Security Monitoring',
              description: 'AI-powered threat detection and incident response',
              benefit: 'Detect security issues 10x faster with reduced false positives',
              effort: 'medium'
            }
          ]
        };
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating migration recommendations:', error);
      throw new Error('Failed to generate migration recommendations');
    }
  }

  async runCompleteAssessment(
    projectId: string,
    systemName: string,
    discoveryInput: InfrastructureDiscoveryInput,
    assignedTo?: string
  ): Promise<LegacySystemAssessment> {
    try {
      // Step 1: Discover infrastructure
      const discoveredInfra = await this.discoverInfrastructure(discoveryInput);

      // Step 2: Analyze technology stack
      const techStack = await this.analyzeTechnologyStack(discoveredInfra);

      // Step 3: Perform security assessment
      const security = await this.performSecurityAssessment(discoveredInfra);

      // Step 4: Analyze performance
      const performance = await this.analyzePerformance(discoveredInfra);

      // Step 5: Calculate cost analysis
      const costs = await this.calculateCostAnalysis(discoveredInfra, techStack);

      // Step 6: Generate migration recommendations
      const recommendations = await this.generateMigrationRecommendations(
        techStack, security, performance, costs
      );

      // Create assessment record
      const assessmentData: InsertLegacySystemAssessment = {
        projectId,
        name: systemName,
        systemType: techStack.services.length > 1 ? 'distributed' : 'monolithic',
        technologyStack: techStack,
        infrastructure: discoveredInfra
      };

      const assessment = await storage.createLegacySystemAssessment(assessmentData);

      // Update assessment with additional data
      await storage.updateLegacySystemAssessment(assessment.id, {
        assessmentStatus: 'completed',
        recommendedStrategy: recommendations.strategy,
        riskFactors: [recommendations.riskLevel],
        automationPotential: 75,
        assessmentFindings: [
          { security, performance, costs, recommendations }
        ]
      });

      // Create assessment findings
      const findings: InsertMigrationAssessmentFinding[] = [
        ...security.vulnerabilities.map(vuln => ({
          assessmentId: assessment.id,
          findingType: 'security' as const,
          severity: vuln.severity,
          category: vuln.category,
          title: vuln.description,
          description: vuln.impact,
          impact: vuln.impact,
          recommendation: vuln.remediation,
          status: 'open' as const
        })),
        ...performance.bottlenecks.map(bottleneck => ({
          assessmentId: assessment.id,
          findingType: 'performance' as const,
          severity: bottleneck.severity,
          category: 'bottleneck',
          title: `Performance bottleneck: ${bottleneck.component}`,
          description: bottleneck.description,
          impact: `Component: ${bottleneck.component}, Type: ${bottleneck.type}`,
          recommendation: bottleneck.recommendations.join('; '),
          status: 'open' as const
        })),
        ...recommendations.recommendations.map((rec, index) => ({
          assessmentId: assessment.id,
          findingType: 'architecture' as const,
          severity: 'medium' as const,
          category: 'technical-debt',
          title: `Migration Recommendation ${index + 1}`,
          description: rec,
          impact: 'System modernization opportunity',
          recommendation: rec,
          status: 'open' as const,
          component: 'system'
        }))
      ];

      for (const finding of findings) {
        await storage.createMigrationAssessmentFinding(finding);
      }

      return assessment;
    } catch (error) {
      console.error('Error running complete assessment:', error);
      throw new Error('Failed to complete legacy system assessment');
    }
  }

  async getAssessmentSummary(assessmentId: string): Promise<{
    assessment: LegacySystemAssessment;
    findings: MigrationAssessmentFinding[];
    summary: {
      totalFindings: number;
      criticalFindings: number;
      securityScore: number;
      performanceScore: number;
      migrationReadiness: 'ready' | 'needs-preparation' | 'not-ready';
    };
  }> {
    const assessment = await storage.getLegacySystemAssessment(assessmentId);
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const findings = await storage.getAssessmentFindings(assessmentId);

    const criticalFindings = findings.filter(f => f.severity === 'critical' || f.severity === 'high').length;
    const assessmentData = assessment.assessmentFindings as any[] || [];
    const securityScore = assessmentData[0]?.security?.securityScore || 0;
    const performanceScore = assessmentData[0]?.performance?.performanceScore || 0;

    let migrationReadiness: 'ready' | 'needs-preparation' | 'not-ready';
    if (criticalFindings === 0 && securityScore >= 80 && performanceScore >= 70) {
      migrationReadiness = 'ready';
    } else if (criticalFindings <= 2 && securityScore >= 60 && performanceScore >= 50) {
      migrationReadiness = 'needs-preparation';
    } else {
      migrationReadiness = 'not-ready';
    }

    return {
      assessment,
      findings,
      summary: {
        totalFindings: findings.length,
        criticalFindings,
        securityScore,
        performanceScore,
        migrationReadiness
      }
    };
  }
}

export const legacyAssessmentService = new LegacyAssessmentService();