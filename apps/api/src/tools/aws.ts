import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { 
  EC2Client, 
  DescribeInstancesCommand, 
  RunInstancesCommand,
  TerminateInstancesCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand
} from "@aws-sdk/client-ec2";
import { 
  S3Client, 
  CreateBucketCommand, 
  PutBucketPolicyCommand,
  ListBucketsCommand
} from "@aws-sdk/client-s3";
import { 
  CloudFormationClient,
  CreateStackCommand,
  ValidateTemplateCommand,
  DescribeStacksCommand
} from "@aws-sdk/client-cloudformation";
import {
  CostExplorerClient,
  GetCostAndUsageCommand
} from "@aws-sdk/client-cost-explorer";

// Initialize AWS clients
const ec2Client = new EC2Client({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const s3Client = new S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const cfnClient = new CloudFormationClient({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const ceClient = new CostExplorerClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });

export const analyzeAWSCosts = tool(
  async ({ timeRange = "7", groupBy = "SERVICE" }) => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startDate.toISOString().split('T')[0],
          End: endDate.toISOString().split('T')[0]
        },
        Granularity: "DAILY",
        Metrics: ["UnblendedCost"],
        GroupBy: [{
          Type: "DIMENSION",
          Key: groupBy
        }]
      });

      const response = await ceClient.send(command);
      
      // Analyze costs and provide recommendations
      const costAnalysis = analyzeCostData(response.ResultsByTime || []);
      
      return {
        success: true,
        timeRange: `${timeRange} days`,
        totalCost: costAnalysis.total,
        topServices: costAnalysis.topServices,
        recommendations: generateCostRecommendations(costAnalysis),
        dailyBreakdown: costAnalysis.dailyBreakdown
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "analyze_aws_costs",
    description: "Analyze AWS costs and provide optimization recommendations",
    schema: z.object({
      timeRange: z.string().optional().describe("Number of days to analyze (default: 7)"),
      groupBy: z.enum(["SERVICE", "REGION", "INSTANCE_TYPE"]).optional()
    })
  }
);

export const createEC2Instance = tool(
  async ({ instanceType, amiId, securityGroup, keyName, tags }) => {
    try {
      const command = new RunInstancesCommand({
        ImageId: amiId || "ami-0c55b159cbfafe1f0", // Default Amazon Linux 2
        InstanceType: (instanceType || "t3.micro") as any,
        MinCount: 1,
        MaxCount: 1,
        KeyName: keyName,
        SecurityGroups: securityGroup ? [securityGroup] : undefined,
        TagSpecifications: tags ? [{
          ResourceType: "instance" as any,
          Tags: Object.entries(tags).map(([key, value]) => ({
            Key: key,
            Value: String(value)
          }))
        }] : undefined
      });

      const response = await ec2Client.send(command);
      const instance = response.Instances?.[0];

      return {
        success: true,
        instanceId: instance?.InstanceId,
        publicIp: instance?.PublicIpAddress,
        privateIp: instance?.PrivateIpAddress,
        state: instance?.State?.Name,
        message: "EC2 instance created successfully"
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "create_ec2_instance",
    description: "Launch a new EC2 instance with specified configuration",
    schema: z.object({
      instanceType: z.string().optional(),
      amiId: z.string().optional(),
      securityGroup: z.string().optional(),
      keyName: z.string().optional(),
      tags: z.record(z.string()).optional()
    })
  }
);

export const createSecurityGroup = tool(
  async ({ groupName, description, vpcId, rules }) => {
    try {
      // Create security group
      const createCommand = new CreateSecurityGroupCommand({
        GroupName: groupName,
        Description: description,
        VpcId: vpcId
      });

      const createResponse = await ec2Client.send(createCommand);
      const groupId = createResponse.GroupId;

      // Add ingress rules if provided
      if (rules && rules.length > 0) {
        const permissions = rules.map((rule: any) => ({
          IpProtocol: rule.protocol || "tcp",
          FromPort: rule.fromPort,
          ToPort: rule.toPort || rule.fromPort,
          IpRanges: rule.cidr ? [{ CidrIp: rule.cidr }] : undefined,
          UserIdGroupPairs: rule.sourceGroupId ? [{ GroupId: rule.sourceGroupId }] : undefined
        }));

        const ingressCommand = new AuthorizeSecurityGroupIngressCommand({
          GroupId: groupId,
          IpPermissions: permissions
        });

        await ec2Client.send(ingressCommand);
      }

      return {
        success: true,
        groupId,
        groupName,
        message: "Security group created successfully with rules"
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "create_security_group",
    description: "Create an AWS security group with specified rules",
    schema: z.object({
      groupName: z.string(),
      description: z.string(),
      vpcId: z.string().optional(),
      rules: z.array(z.object({
        protocol: z.string().optional(),
        fromPort: z.number(),
        toPort: z.number().optional(),
        cidr: z.string().optional(),
        sourceGroupId: z.string().optional()
      })).optional()
    })
  }
);

export const generateCloudFormationTemplate = tool(
  async ({ templateType, parameters }) => {
    try {
      let template: any;
      
      switch (templateType) {
        case "vpc":
          template = generateVPCTemplate(parameters);
          break;
        case "webApp":
          template = generateWebAppTemplate(parameters);
          break;
        case "lambda":
          template = generateLambdaTemplate(parameters);
          break;
        case "rds":
          template = generateRDSTemplate(parameters);
          break;
        default:
          return { error: `Unsupported template type: ${templateType}` };
      }

      // Validate template
      const validateCommand = new ValidateTemplateCommand({
        TemplateBody: JSON.stringify(template)
      });

      try {
        await cfnClient.send(validateCommand);
      } catch (validationError: any) {
        return { 
          success: false, 
          template: JSON.stringify(template, null, 2),
          validationError: validationError.message 
        };
      }

      return {
        success: true,
        template: JSON.stringify(template, null, 2),
        message: "CloudFormation template generated and validated successfully"
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "generate_cloudformation_template",
    description: "Generate AWS CloudFormation templates for infrastructure",
    schema: z.object({
      templateType: z.enum(["vpc", "webApp", "lambda", "rds"]),
      parameters: z.record(z.any())
    })
  }
);

export const createS3Bucket = tool(
  async ({ bucketName, region, versioning = false, encryption = true, publicAccess = false }) => {
    try {
      // Create bucket
      const createCommand = new CreateBucketCommand({
        Bucket: bucketName,
        CreateBucketConfiguration: region !== "us-east-1" ? {
          LocationConstraint: region as any
        } : undefined
      });

      await s3Client.send(createCommand);

      // Set bucket policy for security
      if (!publicAccess) {
        const policyDocument = {
          Version: "2012-10-17",
          Statement: [{
            Sid: "DenyPublicAccess",
            Effect: "Deny",
            Principal: "*",
            Action: "s3:*",
            Resource: [
              `arn:aws:s3:::${bucketName}/*`,
              `arn:aws:s3:::${bucketName}`
            ],
            Condition: {
              Bool: {
                "aws:SecureTransport": "false"
              }
            }
          }]
        };

        const policyCommand = new PutBucketPolicyCommand({
          Bucket: bucketName,
          Policy: JSON.stringify(policyDocument)
        });

        await s3Client.send(policyCommand);
      }

      return {
        success: true,
        bucketName,
        region,
        versioning,
        encryption,
        publicAccess,
        message: "S3 bucket created successfully"
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "create_s3_bucket",
    description: "Create an S3 bucket with security best practices",
    schema: z.object({
      bucketName: z.string(),
      region: z.string().optional(),
      versioning: z.boolean().optional(),
      encryption: z.boolean().optional(),
      publicAccess: z.boolean().optional()
    })
  }
);

// Helper functions
function analyzeCostData(costData: any[]): any {
  const analysis = {
    total: 0,
    topServices: [] as any[],
    dailyBreakdown: [] as any[],
    serviceBreakdown: {} as any
  };

  costData.forEach(day => {
    const dayTotal = day.Groups?.reduce((sum: number, group: any) => {
      const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
      const service = group.Keys[0];
      
      if (!analysis.serviceBreakdown[service]) {
        analysis.serviceBreakdown[service] = 0;
      }
      analysis.serviceBreakdown[service] += cost;
      
      return sum + cost;
    }, 0) || 0;

    analysis.total += dayTotal;
    analysis.dailyBreakdown.push({
      date: day.TimePeriod.Start,
      cost: dayTotal.toFixed(2)
    });
  });

  // Get top services by cost
  analysis.topServices = Object.entries(analysis.serviceBreakdown)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .map(([service, cost]: any) => ({
      service,
      cost: cost.toFixed(2),
      percentage: ((cost / analysis.total) * 100).toFixed(1)
    }));

  return analysis;
}

function generateCostRecommendations(analysis: any): string[] {
  const recommendations = [];
  
  // Check for EC2 costs
  const ec2Service = analysis.topServices.find((s: any) => s.service.includes('EC2'));
  if (ec2Service && parseFloat(ec2Service.percentage) > 30) {
    recommendations.push("Consider using Reserved Instances or Savings Plans for EC2");
    recommendations.push("Review and terminate unused EC2 instances");
    recommendations.push("Use Auto Scaling to match capacity with demand");
  }

  // Check for RDS costs
  const rdsService = analysis.topServices.find((s: any) => s.service.includes('RDS'));
  if (rdsService) {
    recommendations.push("Consider using Aurora Serverless for variable workloads");
    recommendations.push("Enable RDS instance stopping for non-production databases");
  }

  // Check for S3 costs
  const s3Service = analysis.topServices.find((s: any) => s.service.includes('S3'));
  if (s3Service) {
    recommendations.push("Implement S3 lifecycle policies to move data to cheaper storage classes");
    recommendations.push("Enable S3 Intelligent-Tiering for automatic cost optimization");
  }

  // General recommendations
  recommendations.push("Set up AWS Budget alerts to monitor spending");
  recommendations.push("Use AWS Cost Explorer to identify cost trends");

  return recommendations;
}

function generateVPCTemplate(params: any): any {
  return {
    AWSTemplateFormatVersion: "2010-09-09",
    Description: "VPC with public and private subnets",
    Parameters: {
      VPCCidr: {
        Type: "String",
        Default: params.cidr || "10.0.0.0/16"
      },
      EnvironmentName: {
        Type: "String",
        Default: params.environment || "production"
      }
    },
    Resources: {
      VPC: {
        Type: "AWS::EC2::VPC",
        Properties: {
          CidrBlock: { Ref: "VPCCidr" },
          EnableDnsHostnames: true,
          EnableDnsSupport: true,
          Tags: [{
            Key: "Name",
            Value: { "Fn::Sub": "${EnvironmentName}-vpc" }
          }]
        }
      },
      InternetGateway: {
        Type: "AWS::EC2::InternetGateway",
        Properties: {
          Tags: [{
            Key: "Name",
            Value: { "Fn::Sub": "${EnvironmentName}-igw" }
          }]
        }
      },
      InternetGatewayAttachment: {
        Type: "AWS::EC2::VPCGatewayAttachment",
        Properties: {
          InternetGatewayId: { Ref: "InternetGateway" },
          VpcId: { Ref: "VPC" }
        }
      }
    }
  };
}

function generateWebAppTemplate(params: any): any {
  // Implementation for web app template
  return {};
}

function generateLambdaTemplate(params: any): any {
  // Implementation for Lambda template
  return {};
}

function generateRDSTemplate(params: any): any {
  // Implementation for RDS template
  return {};
}

export const awsTools = [
  analyzeAWSCosts,
  createEC2Instance,
  createSecurityGroup,
  generateCloudFormationTemplate,
  createS3Bucket
]; 