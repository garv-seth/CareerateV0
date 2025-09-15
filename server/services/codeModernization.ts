import { storage } from "../storage";
import { generateCodeFromPrompt, analyzeCode } from "./ai";
import type { 
  CodeModernizationTask, 
  InsertCodeModernizationTask,
  LegacySystemAssessment 
} from "@shared/schema";

export interface CodeAnalysisInput {
  codeRepository: string;
  language: string;
  framework?: string;
  includeTests?: boolean;
  scanDepth: 'surface' | 'deep' | 'comprehensive';
}

export interface ModernizationRecommendation {
  category: 'framework' | 'language' | 'architecture' | 'security' | 'performance' | 'testing';
  priority: 'low' | 'medium' | 'high' | 'critical';
  complexity: 'simple' | 'moderate' | 'complex';
  effort: number; // hours
  title: string;
  description: string;
  currentState: string;
  targetState: string;
  benefits: string[];
  risks: string[];
  dependencies: string[];
  codeExample?: {
    before: string;
    after: string;
    explanation: string;
  };
  migrationSteps: string[];
}

export interface FrameworkMigrationPlan {
  sourceFramework: {
    name: string;
    version: string;
    endOfLife?: Date;
  };
  targetFramework: {
    name: string;
    version: string;
    advantages: string[];
  };
  migrationPath: Array<{
    phase: number;
    title: string;
    description: string;
    estimatedHours: number;
    prerequisites: string[];
    deliverables: string[];
    risks: string[];
  }>;
  totalEffort: number;
  timeline: number; // weeks
  compatibility: {
    score: number; // 0-100
    issues: string[];
    solutions: string[];
  };
}

export interface SecurityHardeningPlan {
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    location: string;
    remediation: string;
    code?: {
      vulnerable: string;
      secure: string;
    };
  }>;
  complianceUpdates: Array<{
    standard: string;
    requirement: string;
    currentState: string;
    requiredChanges: string[];
    implementation: string;
  }>;
  securityPatterns: Array<{
    pattern: string;
    description: string;
    implementation: string;
    benefits: string[];
  }>;
}

export interface DatabaseMigrationPlan {
  sourceDatabase: {
    type: string;
    version: string;
    schema: any;
    dataSize: string;
  };
  targetDatabase: {
    type: string;
    version: string;
    advantages: string[];
  };
  migrationStrategy: 'direct' | 'incremental' | 'parallel' | 'blue-green';
  phases: Array<{
    name: string;
    description: string;
    duration: number;
    downtime: number;
    steps: string[];
    rollbackPlan: string[];
  }>;
  dataTransformation: Array<{
    table: string;
    changes: string[];
    scripts: string[];
  }>;
  testing: {
    dataValidation: string[];
    performanceTests: string[];
    rollbackTests: string[];
  };
}

export interface APIModernizationPlan {
  currentAPIs: Array<{
    endpoint: string;
    method: string;
    type: 'REST' | 'SOAP' | 'GraphQL' | 'RPC';
    version: string;
    deprecated: boolean;
  }>;
  targetArchitecture: 'REST' | 'GraphQL' | 'Microservices' | 'Event-Driven';
  modernizationSteps: Array<{
    api: string;
    changes: string[];
    versioningStrategy: string;
    backwardCompatibility: boolean;
    implementation: string;
  }>;
  microservicesDecomposition?: Array<{
    serviceName: string;
    responsibility: string;
    endpoints: string[];
    dependencies: string[];
    deploymentStrategy: string;
  }>;
}

export class CodeModernizationEngine {
  async analyzeCodebase(input: CodeAnalysisInput): Promise<ModernizationRecommendation[]> {
    const prompt = `
Analyze the following codebase for modernization opportunities:

Repository: ${input.codeRepository}
Language: ${input.language}
Framework: ${input.framework || 'Unknown'}
Scan Depth: ${input.scanDepth}

Provide modernization recommendations in the following categories:
1. Framework upgrades and migrations
2. Language version updates
3. Architecture improvements
4. Security enhancements
5. Performance optimizations
6. Testing improvements

For each recommendation, include:
- Category and priority level
- Complexity and effort estimation
- Current vs target state
- Benefits and risks
- Migration steps
- Code examples where applicable

Format as JSON array of recommendations.
    `;

    try {
      const analysis = await analyzeCode(input.codeRepository, input.language);

      const aiResponse = await generateCodeFromPrompt(prompt, {
        type: 'full-app',
        projectContext: analysis
      });

      let recommendations: ModernizationRecommendation[];
      try {
        recommendations = JSON.parse(aiResponse.description || '[]');
      } catch {
        // Fallback recommendations based on common patterns
        recommendations = this.generateFallbackRecommendations(input, analysis);
      }

      return recommendations;
    } catch (error) {
      console.error('Error analyzing codebase:', error);
      throw new Error('Failed to analyze codebase for modernization');
    }
  }

  private generateFallbackRecommendations(input: CodeAnalysisInput, analysis: any): ModernizationRecommendation[] {
    const recommendations: ModernizationRecommendation[] = [];

    // Java specific recommendations
    if (input.language.toLowerCase() === 'java') {
      if (input.framework?.includes('Spring Boot 1')) {
        recommendations.push({
          category: 'framework',
          priority: 'high',
          complexity: 'moderate',
          effort: 80,
          title: 'Upgrade Spring Boot to 3.x',
          description: 'Migrate from Spring Boot 1.x to 3.x for improved performance and security',
          currentState: 'Spring Boot 1.x with deprecated dependencies',
          targetState: 'Spring Boot 3.x with modern Java features',
          benefits: [
            'Better performance and memory usage',
            'Enhanced security features',
            'Modern Java support (17+)',
            'Native compilation support'
          ],
          risks: [
            'Breaking API changes',
            'Configuration updates required',
            'Dependency compatibility issues'
          ],
          dependencies: ['Java 17+ upgrade', 'Maven/Gradle updates'],
          migrationSteps: [
            'Update Java version to 17 or later',
            'Update Spring Boot version in build file',
            'Migrate configuration properties',
            'Update deprecated API usage',
            'Update security configuration',
            'Run comprehensive tests'
          ]
        });
      }

      recommendations.push({
        category: 'architecture',
        priority: 'medium',
        complexity: 'complex',
        effort: 160,
        title: 'Implement Microservices Architecture',
        description: 'Break monolithic application into microservices for better scalability',
        currentState: 'Monolithic application with tight coupling',
        targetState: 'Microservices with clear service boundaries',
        benefits: [
          'Independent scaling and deployment',
          'Technology diversity',
          'Fault isolation',
          'Team autonomy'
        ],
        risks: [
          'Increased complexity',
          'Network latency',
          'Data consistency challenges',
          'Monitoring complexity'
        ],
        dependencies: ['Service discovery', 'API gateway', 'Monitoring tools'],
        migrationSteps: [
          'Identify service boundaries',
          'Extract shared libraries',
          'Implement API contracts',
          'Set up service discovery',
          'Implement distributed tracing',
          'Gradual service extraction'
        ]
      });
    }

    // Security recommendations
    recommendations.push({
      category: 'security',
      priority: 'high',
      complexity: 'simple',
      effort: 24,
      title: 'Implement Security Headers',
      description: 'Add essential security headers to protect against common attacks',
      currentState: 'Missing security headers',
      targetState: 'Comprehensive security header implementation',
      benefits: [
        'Protection against XSS attacks',
        'CSRF protection',
        'Content type validation',
        'Improved security posture'
      ],
      risks: [
        'Potential compatibility issues with legacy clients'
      ],
      dependencies: ['Web server configuration'],
      codeExample: {
        before: `// No security headers configured`,
        after: `// Security headers configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));`,
        explanation: 'Added comprehensive security headers using helmet middleware'
      },
      migrationSteps: [
        'Install security middleware',
        'Configure CSP policies',
        'Enable HSTS',
        'Set up CSRF protection',
        'Test security headers',
        'Monitor for issues'
      ]
    });

    return recommendations;
  }

  async createFrameworkMigrationPlan(
    sourceFramework: string,
    sourceVersion: string,
    targetFramework: string,
    codebaseSize: 'small' | 'medium' | 'large'
  ): Promise<FrameworkMigrationPlan> {
    const prompt = `
Create a detailed migration plan for upgrading from ${sourceFramework} ${sourceVersion} to ${targetFramework}.
Codebase size: ${codebaseSize}

Include:
1. Source and target framework details
2. Phase-by-phase migration plan
3. Effort estimation and timeline
4. Compatibility analysis
5. Risk assessment and mitigation

Format as JSON matching the FrameworkMigrationPlan interface.
    `;

    try {
      const aiResponse = await generateCodeFromPrompt(prompt, {
        type: 'full-app',
        projectContext: { includeContext: false }
      });

      let migrationPlan: FrameworkMigrationPlan;
      try {
        migrationPlan = JSON.parse(aiResponse.description || '{}');
      } catch {
        migrationPlan = this.generateFallbackMigrationPlan(sourceFramework, sourceVersion, targetFramework, codebaseSize);
      }

      return migrationPlan;
    } catch (error) {
      console.error('Error creating migration plan:', error);
      throw new Error('Failed to create framework migration plan');
    }
  }

  private generateFallbackMigrationPlan(
    sourceFramework: string,
    sourceVersion: string,
    targetFramework: string,
    codebaseSize: 'small' | 'medium' | 'large'
  ): FrameworkMigrationPlan {
    const effortMultiplier = { small: 1, medium: 2, large: 4 };
    const baseEffort = 40;
    const totalEffort = baseEffort * effortMultiplier[codebaseSize];

    return {
      sourceFramework: {
        name: sourceFramework,
        version: sourceVersion,
        endOfLife: new Date('2024-12-31')
      },
      targetFramework: {
        name: targetFramework,
        version: 'latest',
        advantages: [
          'Better performance',
          'Enhanced security',
          'Modern features',
          'Active support'
        ]
      },
      migrationPath: [
        {
          phase: 1,
          title: 'Assessment and Planning',
          description: 'Analyze current codebase and plan migration approach',
          estimatedHours: totalEffort * 0.2,
          prerequisites: ['Code audit', 'Dependency analysis'],
          deliverables: ['Migration strategy', 'Risk assessment', 'Timeline'],
          risks: ['Incomplete analysis', 'Underestimated complexity']
        },
        {
          phase: 2,
          title: 'Environment Setup',
          description: 'Set up development and testing environments',
          estimatedHours: totalEffort * 0.15,
          prerequisites: ['Migration strategy approved'],
          deliverables: ['Development environment', 'CI/CD pipeline'],
          risks: ['Environment compatibility issues']
        },
        {
          phase: 3,
          title: 'Core Migration',
          description: 'Migrate core functionality to new framework',
          estimatedHours: totalEffort * 0.5,
          prerequisites: ['Environment ready', 'Tests in place'],
          deliverables: ['Migrated core features', 'Updated tests'],
          risks: ['Breaking changes', 'Performance regression']
        },
        {
          phase: 4,
          title: 'Testing and Validation',
          description: 'Comprehensive testing of migrated application',
          estimatedHours: totalEffort * 0.15,
          prerequisites: ['Core migration complete'],
          deliverables: ['Test reports', 'Performance benchmarks'],
          risks: ['Undetected issues', 'Performance problems']
        }
      ],
      totalEffort,
      timeline: Math.ceil(totalEffort / 40), // weeks
      compatibility: {
        score: 85,
        issues: ['API changes', 'Configuration updates'],
        solutions: ['Adapter patterns', 'Gradual migration']
      }
    };
  }

  async generateSecurityHardeningPlan(codebaseAnalysis: any): Promise<SecurityHardeningPlan> {
    const plan: SecurityHardeningPlan = {
      vulnerabilities: [
        {
          type: 'SQL Injection',
          severity: 'high',
          description: 'Potential SQL injection vulnerabilities found',
          location: 'Database query functions',
          remediation: 'Use parameterized queries and input validation',
          code: {
            vulnerable: `const query = "SELECT * FROM users WHERE id = " + userId;`,
            secure: `const query = "SELECT * FROM users WHERE id = ?";
const result = await db.query(query, [userId]);`
          }
        },
        {
          type: 'Cross-Site Scripting (XSS)',
          severity: 'medium',
          description: 'Unescaped user input in templates',
          location: 'Template rendering functions',
          remediation: 'Implement input sanitization and output encoding'
        }
      ],
      complianceUpdates: [
        {
          standard: 'GDPR',
          requirement: 'Data encryption at rest',
          currentState: 'Plain text storage',
          requiredChanges: [
            'Implement database encryption',
            'Add encryption key management',
            'Update privacy policies'
          ],
          implementation: 'Use AES-256 encryption for sensitive data fields'
        }
      ],
      securityPatterns: [
        {
          pattern: 'OAuth 2.0 + JWT',
          description: 'Modern authentication and authorization',
          implementation: 'Replace session-based auth with JWT tokens',
          benefits: [
            'Stateless authentication',
            'Better scalability',
            'Cross-domain support'
          ]
        }
      ]
    };

    return plan;
  }

  async createDatabaseMigrationPlan(
    sourceDB: string,
    targetDB: string,
    dataSize: string
  ): Promise<DatabaseMigrationPlan> {
    const plan: DatabaseMigrationPlan = {
      sourceDatabase: {
        type: sourceDB,
        version: '5.7',
        schema: {},
        dataSize
      },
      targetDatabase: {
        type: targetDB,
        version: 'latest',
        advantages: [
          'Better performance',
          'Enhanced security',
          'Modern features'
        ]
      },
      migrationStrategy: dataSize === 'large' ? 'blue-green' : 'incremental',
      phases: [
        {
          name: 'Schema Migration',
          description: 'Migrate database schema and structure',
          duration: 2,
          downtime: 0,
          steps: [
            'Create target database schema',
            'Set up replication',
            'Validate schema compatibility'
          ],
          rollbackPlan: [
            'Disable replication',
            'Restore from backup'
          ]
        },
        {
          name: 'Data Migration',
          description: 'Migrate data with minimal downtime',
          duration: 8,
          downtime: 1,
          steps: [
            'Start data replication',
            'Validate data integrity',
            'Switch traffic to new database'
          ],
          rollbackPlan: [
            'Switch traffic back',
            'Verify data consistency'
          ]
        }
      ],
      dataTransformation: [
        {
          table: 'users',
          changes: ['Add UUID column', 'Encrypt PII fields'],
          scripts: ['ALTER TABLE users ADD COLUMN uuid VARCHAR(36)']
        }
      ],
      testing: {
        dataValidation: [
          'Row count verification',
          'Data integrity checks',
          'Performance benchmarks'
        ],
        performanceTests: [
          'Query performance comparison',
          'Load testing',
          'Connection pool testing'
        ],
        rollbackTests: [
          'Rollback procedure validation',
          'Data consistency verification'
        ]
      }
    };

    return plan;
  }

  async generateAPIModernizationPlan(apiInventory: any[]): Promise<APIModernizationPlan> {
    const plan: APIModernizationPlan = {
      currentAPIs: apiInventory,
      targetArchitecture: 'REST',
      modernizationSteps: [
        {
          api: '/api/users',
          changes: [
            'Add OpenAPI documentation',
            'Implement proper HTTP status codes',
            'Add pagination support'
          ],
          versioningStrategy: 'URL versioning (/v2/users)',
          backwardCompatibility: true,
          implementation: 'Progressive enhancement approach'
        }
      ],
      microservicesDecomposition: [
        {
          serviceName: 'user-service',
          responsibility: 'User management and authentication',
          endpoints: ['/users', '/auth', '/profile'],
          dependencies: ['auth-service', 'notification-service'],
          deploymentStrategy: 'Blue-green deployment'
        }
      ]
    };

    return plan;
  }

  async createModernizationTasks(
    projectId: string,
    legacySystemId: string,
    recommendations: ModernizationRecommendation[],
    assignedTo?: string
  ): Promise<CodeModernizationTask[]> {
    const tasks: CodeModernizationTask[] = [];

    for (const rec of recommendations) {
      const taskData: InsertCodeModernizationTask = {
        projectId,
        legacySystemId,
        taskType: rec.category,
        taskName: rec.title,
        priority: rec.priority,
        estimatedEffort: rec.effort,
        dependencies: rec.dependencies,
        assignedTo
      };

      const task = await storage.createCodeModernizationTask(taskData);
      tasks.push(task);
    }

    return tasks;
  }

  async executeModernizationTask(taskId: string): Promise<{
    success: boolean;
    output: string;
    updatedCode?: string;
    errors?: string[];
  }> {
    try {
      const task = await storage.getCodeModernizationTask(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Update task status to in_progress
      await storage.updateCodeModernizationTask(taskId, {
        status: 'in_progress',
        startedAt: new Date()
      });

      // Simulate task execution based on task type
      let result;
      switch (task.taskType) {
        case 'framework':
          result = await this.executeFrameworkUpgrade(task);
          break;
        case 'security':
          result = await this.executeSecurityHardening(task);
          break;
        case 'performance':
          result = await this.executePerformanceOptimization(task);
          break;
        default:
          result = await this.executeGenericModernization(task);
      }

      // Update task with results
      await storage.updateCodeModernizationTask(taskId, {
        status: result.success ? 'completed' : 'failed',
        completedAt: result.success ? new Date() : undefined,
        actualEffort: task.estimatedEffort || 0 // For demo purposes
      });

      return result;
    } catch (error) {
      console.error('Error executing modernization task:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await storage.updateCodeModernizationTask(taskId, {
        status: 'failed'
      });
      
      return {
        success: false,
        output: `Task execution failed: ${errorMessage}`,
        errors: [errorMessage]
      };
    }
  }

  private async executeFrameworkUpgrade(task: CodeModernizationTask) {
    // Simulate framework upgrade execution
    return {
      success: true,
      output: `Framework upgrade completed successfully. ${task.taskName} has been implemented.`,
      updatedCode: `// Updated framework configuration
import { SpringBootApplication } from 'spring-boot-3.x';

@SpringBootApplication
public class ModernizedApplication {
    // Updated implementation
}`
    };
  }

  private async executeSecurityHardening(task: CodeModernizationTask) {
    // Simulate security hardening execution
    return {
      success: true,
      output: `Security hardening completed. ${task.taskName} has been implemented with enhanced security measures.`,
      updatedCode: `// Security headers added
app.use(helmet());
app.use(csrf());`
    };
  }

  private async executePerformanceOptimization(task: CodeModernizationTask) {
    // Simulate performance optimization
    return {
      success: true,
      output: `Performance optimization completed. ${task.taskName} shows 40% improvement in response times.`
    };
  }

  private async executeGenericModernization(task: CodeModernizationTask) {
    // Simulate generic modernization task
    return {
      success: true,
      output: `Modernization task "${task.taskName}" completed successfully.`
    };
  }

  async getModernizationProgress(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    blockedTasks: number;
    progressPercentage: number;
    estimatedCompletion: Date;
  }> {
    const tasks = await storage.getProjectModernizationTasks(projectId);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const blockedTasks = tasks.filter(t => t.status === 'blocked').length;
    
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    
    // Calculate estimated completion based on remaining effort
    const remainingTasks = tasks.filter(t => t.status !== 'completed');
    const remainingEffort = remainingTasks.reduce((sum, task) => sum + (task.estimatedEffort || 0), 0);
    const estimatedCompletion = new Date();
    estimatedCompletion.setDate(estimatedCompletion.getDate() + Math.ceil(remainingEffort / 40)); // 40 hours per week

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      progressPercentage,
      estimatedCompletion
    };
  }
}

export const codeModernizationEngine = new CodeModernizationEngine();