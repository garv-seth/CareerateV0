#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { 
  EC2Client, 
  DescribeInstancesCommand, 
  DescribeImagesCommand,
  CreateInstanceCommand,
  TerminateInstancesCommand
} from "@aws-sdk/client-ec2";
import { 
  S3Client, 
  ListBucketsCommand, 
  GetBucketLocationCommand,
  CreateBucketCommand
} from "@aws-sdk/client-s3";
import { 
  CloudFormationClient, 
  DescribeStacksCommand,
  CreateStackCommand,
  ValidateTemplateCommand
} from "@aws-sdk/client-cloudformation";
import { 
  CloudWatchClient, 
  GetMetricStatisticsCommand,
  PutMetricAlarmCommand
} from "@aws-sdk/client-cloudwatch";
import { 
  IAMClient, 
  ListRolesCommand,
  CreateRoleCommand
} from "@aws-sdk/client-iam";

class AWSMCPServer {
  private server: Server;
  private ec2Client: EC2Client;
  private s3Client: S3Client;
  private cloudFormationClient: CloudFormationClient;
  private cloudWatchClient: CloudWatchClient;
  private iamClient: IAMClient;

  constructor() {
    this.server = new Server(
      {
        name: "careerate-aws-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initializeAWSClients();
    this.setupToolHandlers();
  }

  private initializeAWSClients() {
    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    };

    this.ec2Client = new EC2Client(config);
    this.s3Client = new S3Client(config);
    this.cloudFormationClient = new CloudFormationClient(config);
    this.cloudWatchClient = new CloudWatchClient(config);
    this.iamClient = new IAMClient(config);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "aws_ec2_list_instances",
            description: "List EC2 instances with their status and details",
            inputSchema: {
              type: "object",
              properties: {
                region: {
                  type: "string",
                  description: "AWS region (optional)",
                },
                filters: {
                  type: "object",
                  description: "Filters for instance search",
                },
              },
            },
          },
          {
            name: "aws_ec2_create_instance",
            description: "Create a new EC2 instance",
            inputSchema: {
              type: "object",
              properties: {
                imageId: {
                  type: "string",
                  description: "AMI ID for the instance",
                },
                instanceType: {
                  type: "string",
                  description: "Instance type (e.g., t3.micro)",
                  default: "t3.micro",
                },
                keyName: {
                  type: "string",
                  description: "Key pair name",
                },
                securityGroups: {
                  type: "array",
                  items: { type: "string" },
                  description: "Security group IDs",
                },
              },
              required: ["imageId"],
            },
          },
          {
            name: "aws_s3_list_buckets",
            description: "List S3 buckets in the account",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "aws_cloudformation_validate",
            description: "Validate CloudFormation template",
            inputSchema: {
              type: "object",
              properties: {
                template: {
                  type: "string",
                  description: "CloudFormation template (JSON or YAML)",
                },
              },
              required: ["template"],
            },
          },
          {
            name: "aws_cloudformation_deploy",
            description: "Deploy CloudFormation stack",
            inputSchema: {
              type: "object",
              properties: {
                stackName: {
                  type: "string",
                  description: "Name for the CloudFormation stack",
                },
                template: {
                  type: "string",
                  description: "CloudFormation template",
                },
                parameters: {
                  type: "object",
                  description: "Stack parameters",
                },
              },
              required: ["stackName", "template"],
            },
          },
          {
            name: "aws_cloudwatch_get_metrics",
            description: "Get CloudWatch metrics for monitoring",
            inputSchema: {
              type: "object",
              properties: {
                namespace: {
                  type: "string",
                  description: "CloudWatch namespace",
                },
                metricName: {
                  type: "string",
                  description: "Metric name",
                },
                dimensions: {
                  type: "object",
                  description: "Metric dimensions",
                },
                startTime: {
                  type: "string",
                  description: "Start time (ISO string)",
                },
                endTime: {
                  type: "string",
                  description: "End time (ISO string)",
                },
              },
              required: ["namespace", "metricName"],
            },
          },
          {
            name: "aws_cost_estimate",
            description: "Estimate AWS costs for resources",
            inputSchema: {
              type: "object",
              properties: {
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string" },
                      size: { type: "string" },
                      region: { type: "string" },
                    },
                  },
                  description: "List of AWS resources to estimate",
                },
              },
              required: ["resources"],
            },
          },
          {
            name: "aws_security_audit",
            description: "Perform security audit of AWS resources",
            inputSchema: {
              type: "object",
              properties: {
                resourceType: {
                  type: "string",
                  enum: ["ec2", "s3", "iam", "all"],
                  description: "Type of resources to audit",
                  default: "all",
                },
              },
            },
          },
          {
            name: "aws_generate_iam_policy",
            description: "Generate IAM policy based on requirements",
            inputSchema: {
              type: "object",
              properties: {
                requirements: {
                  type: "string",
                  description: "Description of what the policy should allow",
                },
                principle: {
                  type: "string",
                  enum: ["least-privilege", "read-only", "admin"],
                  description: "Security principle to follow",
                  default: "least-privilege",
                },
              },
              required: ["requirements"],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "aws_ec2_list_instances":
            return await this.listEC2Instances(args);
          case "aws_ec2_create_instance":
            return await this.createEC2Instance(args);
          case "aws_s3_list_buckets":
            return await this.listS3Buckets(args);
          case "aws_cloudformation_validate":
            return await this.validateCloudFormationTemplate(args);
          case "aws_cloudformation_deploy":
            return await this.deployCloudFormationStack(args);
          case "aws_cloudwatch_get_metrics":
            return await this.getCloudWatchMetrics(args);
          case "aws_cost_estimate":
            return await this.estimateAWSCosts(args);
          case "aws_security_audit":
            return await this.performSecurityAudit(args);
          case "aws_generate_iam_policy":
            return await this.generateIAMPolicy(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async listEC2Instances(args: any) {
    try {
      const command = new DescribeInstancesCommand({
        Filters: args.filters ? Object.entries(args.filters).map(([Name, Values]) => ({
          Name,
          Values: Array.isArray(Values) ? Values : [Values]
        })) : undefined
      });

      const response = await this.ec2Client.send(command);
      
      const instances = response.Reservations?.flatMap(reservation => 
        reservation.Instances?.map(instance => ({
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          publicIpAddress: instance.PublicIpAddress,
          privateIpAddress: instance.PrivateIpAddress,
          launchTime: instance.LaunchTime,
          tags: instance.Tags?.reduce((acc, tag) => {
            acc[tag.Key!] = tag.Value!;
            return acc;
          }, {} as Record<string, string>),
        })) || []
      ) || [];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              instanceCount: instances.length,
              instances,
              summary: `Found ${instances.length} EC2 instances`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list EC2 instances: ${error.message}`);
    }
  }

  private async createEC2Instance(args: any) {
    try {
      const { imageId, instanceType = 't3.micro', keyName, securityGroups } = args;

      const command = new CreateInstanceCommand({
        ImageId: imageId,
        InstanceType: instanceType,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
        SecurityGroupIds: securityGroups,
        TagSpecifications: [
          {
            ResourceType: 'instance',
            Tags: [
              { Key: 'CreatedBy', Value: 'Careerate' },
              { Key: 'Environment', Value: 'development' }
            ]
          }
        ]
      });

      const response = await this.ec2Client.send(command);
      const instance = response.Instances?.[0];

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              instanceId: instance?.InstanceId,
              state: instance?.State?.Name,
              summary: `Created EC2 instance ${instance?.InstanceId}`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create EC2 instance: ${error.message}`);
    }
  }

  private async listS3Buckets(args: any) {
    try {
      const command = new ListBucketsCommand({});
      const response = await this.s3Client.send(command);

      const buckets = await Promise.all(
        (response.Buckets || []).map(async (bucket) => {
          try {
            const locationCommand = new GetBucketLocationCommand({ Bucket: bucket.Name! });
            const location = await this.s3Client.send(locationCommand);
            
            return {
              name: bucket.Name,
              creationDate: bucket.CreationDate,
              region: location.LocationConstraint || 'us-east-1',
            };
          } catch (error) {
            return {
              name: bucket.Name,
              creationDate: bucket.CreationDate,
              region: 'unknown',
              error: 'Unable to get region'
            };
          }
        })
      );

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              bucketCount: buckets.length,
              buckets,
              summary: `Found ${buckets.length} S3 buckets`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list S3 buckets: ${error.message}`);
    }
  }

  private async validateCloudFormationTemplate(args: any) {
    try {
      const { template } = args;

      const command = new ValidateTemplateCommand({
        TemplateBody: template,
      });

      const response = await this.cloudFormationClient.send(command);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: true,
              description: response.Description,
              parameters: response.Parameters,
              capabilities: response.Capabilities,
              summary: "CloudFormation template is valid",
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: false,
              error: error.message,
              summary: "CloudFormation template validation failed",
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  private async deployCloudFormationStack(args: any) {
    try {
      const { stackName, template, parameters = {} } = args;

      const command = new CreateStackCommand({
        StackName: stackName,
        TemplateBody: template,
        Parameters: Object.entries(parameters).map(([key, value]) => ({
          ParameterKey: key,
          ParameterValue: String(value),
        })),
        Capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM'],
        Tags: [
          { Key: 'CreatedBy', Value: 'Careerate' },
          { Key: 'Environment', Value: 'development' }
        ]
      });

      const response = await this.cloudFormationClient.send(command);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              stackId: response.StackId,
              stackName,
              summary: `CloudFormation stack ${stackName} deployment initiated`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to deploy CloudFormation stack: ${error.message}`);
    }
  }

  private async getCloudWatchMetrics(args: any) {
    try {
      const { 
        namespace, 
        metricName, 
        dimensions = {}, 
        startTime = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime = new Date().toISOString()
      } = args;

      const command = new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: metricName,
        Dimensions: Object.entries(dimensions).map(([Name, Value]) => ({
          Name,
          Value: String(Value),
        })),
        StartTime: new Date(startTime),
        EndTime: new Date(endTime),
        Period: 300, // 5 minutes
        Statistics: ['Average', 'Maximum', 'Minimum'],
      });

      const response = await this.cloudWatchClient.send(command);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              metricName,
              namespace,
              datapoints: response.Datapoints,
              summary: `Retrieved ${response.Datapoints?.length || 0} data points`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get CloudWatch metrics: ${error.message}`);
    }
  }

  private async estimateAWSCosts(args: any) {
    const { resources } = args;

    // Cost estimation based on AWS pricing (simplified)
    const pricingMap: Record<string, Record<string, number>> = {
      'ec2': {
        't3.micro': 0.0104,   // per hour
        't3.small': 0.0208,
        't3.medium': 0.0416,
        't3.large': 0.0832,
      },
      's3': {
        'standard': 0.023,    // per GB per month
        'ia': 0.0125,
        'glacier': 0.004,
      },
      'rds': {
        'db.t3.micro': 0.017, // per hour
        'db.t3.small': 0.034,
        'db.t3.medium': 0.068,
      }
    };

    const estimates = resources.map((resource: any) => {
      const { type, size, region } = resource;
      const basePrice = pricingMap[type]?.[size] || 0;
      
      // Regional pricing adjustments
      const regionMultiplier = region === 'us-east-1' ? 1 : 1.1;
      const hourlyPrice = basePrice * regionMultiplier;
      
      return {
        resource: `${type}-${size}`,
        region,
        hourlyPrice,
        monthlyPrice: hourlyPrice * 24 * 30,
        yearlyPrice: hourlyPrice * 24 * 365,
      };
    });

    const totalMonthly = estimates.reduce((sum, est) => sum + est.monthlyPrice, 0);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            estimates,
            totalMonthlyCost: totalMonthly,
            totalYearlyCost: totalMonthly * 12,
            currency: 'USD',
            disclaimer: 'Estimates based on on-demand pricing. Actual costs may vary.',
            summary: `Estimated monthly cost: $${totalMonthly.toFixed(2)}`,
          }, null, 2),
        },
      ],
    };
  }

  private async performSecurityAudit(args: any) {
    const { resourceType = 'all' } = args;
    const securityIssues: Array<{severity: string; type: string; message: string; resource: string}> = [];

    try {
      if (resourceType === 'ec2' || resourceType === 'all') {
        await this.auditEC2Security(securityIssues);
      }

      if (resourceType === 's3' || resourceType === 'all') {
        await this.auditS3Security(securityIssues);
      }

      if (resourceType === 'iam' || resourceType === 'all') {
        await this.auditIAMSecurity(securityIssues);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              issues: securityIssues,
              issueCount: securityIssues.length,
              summary: securityIssues.length === 0 ? 
                "No security issues found" : 
                `Found ${securityIssues.length} security issues`,
            }, null, 2),
          },
        ],
        isError: securityIssues.some(issue => issue.severity === "HIGH"),
      };
    } catch (error) {
      throw new Error(`Security audit failed: ${error.message}`);
    }
  }

  private async auditEC2Security(issues: Array<{severity: string; type: string; message: string; resource: string}>) {
    // This is a simplified security audit
    // In production, you'd integrate with AWS Config, Security Hub, etc.
    
    try {
      const instances = await this.ec2Client.send(new DescribeInstancesCommand({}));
      
      instances.Reservations?.forEach(reservation => {
        reservation.Instances?.forEach(instance => {
          if (instance.State?.Name === 'running') {
            // Check for instances without key pairs
            if (!instance.KeyName) {
              issues.push({
                severity: "MEDIUM",
                type: "no_key_pair",
                message: "Instance launched without key pair",
                resource: `EC2/${instance.InstanceId}`,
              });
            }

            // Check for public instances
            if (instance.PublicIpAddress) {
              issues.push({
                severity: "LOW",
                type: "public_instance",
                message: "Instance has public IP address",
                resource: `EC2/${instance.InstanceId}`,
              });
            }
          }
        });
      });
    } catch (error) {
      console.error('EC2 security audit error:', error);
    }
  }

  private async auditS3Security(issues: Array<{severity: string; type: string; message: string; resource: string}>) {
    // Simplified S3 security checks
    issues.push({
      severity: "INFO",
      type: "s3_audit",
      message: "S3 security audit requires additional permissions",
      resource: "S3/*",
    });
  }

  private async auditIAMSecurity(issues: Array<{severity: string; type: string; message: string; resource: string}>) {
    try {
      const roles = await this.iamClient.send(new ListRolesCommand({}));
      
      roles.Roles?.forEach(role => {
        // Check for roles with admin access
        if (role.RoleName?.toLowerCase().includes('admin')) {
          issues.push({
            severity: "MEDIUM",
            type: "admin_role",
            message: "Role with admin privileges detected",
            resource: `IAM/Role/${role.RoleName}`,
          });
        }
      });
    } catch (error) {
      console.error('IAM security audit error:', error);
    }
  }

  private async generateIAMPolicy(args: any) {
    const { requirements, principle = 'least-privilege' } = args;

    // This would typically use an LLM to generate the policy
    // For now, providing a template-based approach
    
    const policyTemplates = {
      's3-read': {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetObject", "s3:ListBucket"],
            Resource: ["arn:aws:s3:::bucket-name/*", "arn:aws:s3:::bucket-name"]
          }
        ]
      },
      'ec2-read': {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["ec2:Describe*"],
            Resource: "*"
          }
        ]
      }
    };

    // Simple keyword matching to select template
    let selectedTemplate = policyTemplates['ec2-read'];
    if (requirements.toLowerCase().includes('s3')) {
      selectedTemplate = policyTemplates['s3-read'];
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            policy: selectedTemplate,
            principle,
            requirements,
            warning: "This is a template policy. Review and customize for your specific needs.",
            summary: `Generated IAM policy based on: ${requirements}`,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("AWS MCP Server running on stdio");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new AWSMCPServer();
  server.run().catch(console.error);
}

export default AWSMCPServer; 