"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.awsTools = exports.createS3Bucket = exports.generateCloudFormationTemplate = exports.createSecurityGroup = exports.createEC2Instance = exports.analyzeAWSCosts = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const client_ec2_1 = require("@aws-sdk/client-ec2");
const client_s3_1 = require("@aws-sdk/client-s3");
const client_cloudformation_1 = require("@aws-sdk/client-cloudformation");
const client_cost_explorer_1 = require("@aws-sdk/client-cost-explorer");
// Initialize AWS clients
const ec2Client = new client_ec2_1.EC2Client({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const s3Client = new client_s3_1.S3Client({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const cfnClient = new client_cloudformation_1.CloudFormationClient({ region: process.env.AWS_DEFAULT_REGION || "us-west-2" });
const ceClient = new client_cost_explorer_1.CostExplorerClient({ region: process.env.AWS_DEFAULT_REGION || "us-east-1" });
exports.analyzeAWSCosts = (0, tools_1.tool)(async ({ timeRange = "7", groupBy = "SERVICE" }) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(timeRange));
        const command = new client_cost_explorer_1.GetCostAndUsageCommand({
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
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "analyze_aws_costs",
    description: "Analyze AWS costs and provide optimization recommendations",
    schema: zod_1.z.object({
        timeRange: zod_1.z.string().optional().describe("Number of days to analyze (default: 7)"),
        groupBy: zod_1.z.enum(["SERVICE", "REGION", "INSTANCE_TYPE"]).optional()
    })
});
exports.createEC2Instance = (0, tools_1.tool)(async ({ instanceType, amiId, securityGroup, keyName, tags }) => {
    var _a, _b;
    try {
        const command = new client_ec2_1.RunInstancesCommand({
            ImageId: amiId || "ami-0c55b159cbfafe1f0", // Default Amazon Linux 2
            InstanceType: (instanceType || "t3.micro"),
            MinCount: 1,
            MaxCount: 1,
            KeyName: keyName,
            SecurityGroups: securityGroup ? [securityGroup] : undefined,
            TagSpecifications: tags ? [{
                    ResourceType: "instance",
                    Tags: Object.entries(tags).map(([key, value]) => ({
                        Key: key,
                        Value: String(value)
                    }))
                }] : undefined
        });
        const response = await ec2Client.send(command);
        const instance = (_a = response.Instances) === null || _a === void 0 ? void 0 : _a[0];
        return {
            success: true,
            instanceId: instance === null || instance === void 0 ? void 0 : instance.InstanceId,
            publicIp: instance === null || instance === void 0 ? void 0 : instance.PublicIpAddress,
            privateIp: instance === null || instance === void 0 ? void 0 : instance.PrivateIpAddress,
            state: (_b = instance === null || instance === void 0 ? void 0 : instance.State) === null || _b === void 0 ? void 0 : _b.Name,
            message: "EC2 instance created successfully"
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "create_ec2_instance",
    description: "Launch a new EC2 instance with specified configuration",
    schema: zod_1.z.object({
        instanceType: zod_1.z.string().optional(),
        amiId: zod_1.z.string().optional(),
        securityGroup: zod_1.z.string().optional(),
        keyName: zod_1.z.string().optional(),
        tags: zod_1.z.record(zod_1.z.string()).optional()
    })
});
exports.createSecurityGroup = (0, tools_1.tool)(async ({ groupName, description, vpcId, rules }) => {
    try {
        // Create security group
        const createCommand = new client_ec2_1.CreateSecurityGroupCommand({
            GroupName: groupName,
            Description: description,
            VpcId: vpcId
        });
        const createResponse = await ec2Client.send(createCommand);
        const groupId = createResponse.GroupId;
        // Add ingress rules if provided
        if (rules && rules.length > 0) {
            const permissions = rules.map((rule) => ({
                IpProtocol: rule.protocol || "tcp",
                FromPort: rule.fromPort,
                ToPort: rule.toPort || rule.fromPort,
                IpRanges: rule.cidr ? [{ CidrIp: rule.cidr }] : undefined,
                UserIdGroupPairs: rule.sourceGroupId ? [{ GroupId: rule.sourceGroupId }] : undefined
            }));
            const ingressCommand = new client_ec2_1.AuthorizeSecurityGroupIngressCommand({
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
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "create_security_group",
    description: "Create an AWS security group with specified rules",
    schema: zod_1.z.object({
        groupName: zod_1.z.string(),
        description: zod_1.z.string(),
        vpcId: zod_1.z.string().optional(),
        rules: zod_1.z.array(zod_1.z.object({
            protocol: zod_1.z.string().optional(),
            fromPort: zod_1.z.number(),
            toPort: zod_1.z.number().optional(),
            cidr: zod_1.z.string().optional(),
            sourceGroupId: zod_1.z.string().optional()
        })).optional()
    })
});
exports.generateCloudFormationTemplate = (0, tools_1.tool)(async ({ templateType, parameters }) => {
    try {
        let template;
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
        const validateCommand = new client_cloudformation_1.ValidateTemplateCommand({
            TemplateBody: JSON.stringify(template)
        });
        try {
            await cfnClient.send(validateCommand);
        }
        catch (validationError) {
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
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "generate_cloudformation_template",
    description: "Generate AWS CloudFormation templates for infrastructure",
    schema: zod_1.z.object({
        templateType: zod_1.z.enum(["vpc", "webApp", "lambda", "rds"]),
        parameters: zod_1.z.record(zod_1.z.any())
    })
});
exports.createS3Bucket = (0, tools_1.tool)(async ({ bucketName, region, versioning = false, encryption = true, publicAccess = false }) => {
    try {
        // Create bucket
        const createCommand = new client_s3_1.CreateBucketCommand({
            Bucket: bucketName,
            CreateBucketConfiguration: region !== "us-east-1" ? {
                LocationConstraint: region
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
            const policyCommand = new client_s3_1.PutBucketPolicyCommand({
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
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "create_s3_bucket",
    description: "Create an S3 bucket with security best practices",
    schema: zod_1.z.object({
        bucketName: zod_1.z.string(),
        region: zod_1.z.string().optional(),
        versioning: zod_1.z.boolean().optional(),
        encryption: zod_1.z.boolean().optional(),
        publicAccess: zod_1.z.boolean().optional()
    })
});
// Helper functions
function analyzeCostData(costData) {
    const analysis = {
        total: 0,
        topServices: [],
        dailyBreakdown: [],
        serviceBreakdown: {}
    };
    costData.forEach(day => {
        var _a;
        const dayTotal = ((_a = day.Groups) === null || _a === void 0 ? void 0 : _a.reduce((sum, group) => {
            const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
            const service = group.Keys[0];
            if (!analysis.serviceBreakdown[service]) {
                analysis.serviceBreakdown[service] = 0;
            }
            analysis.serviceBreakdown[service] += cost;
            return sum + cost;
        }, 0)) || 0;
        analysis.total += dayTotal;
        analysis.dailyBreakdown.push({
            date: day.TimePeriod.Start,
            cost: dayTotal.toFixed(2)
        });
    });
    // Get top services by cost
    analysis.topServices = Object.entries(analysis.serviceBreakdown)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([service, cost]) => ({
        service,
        cost: cost.toFixed(2),
        percentage: ((cost / analysis.total) * 100).toFixed(1)
    }));
    return analysis;
}
function generateCostRecommendations(analysis) {
    const recommendations = [];
    // Check for EC2 costs
    const ec2Service = analysis.topServices.find((s) => s.service.includes('EC2'));
    if (ec2Service && parseFloat(ec2Service.percentage) > 30) {
        recommendations.push("Consider using Reserved Instances or Savings Plans for EC2");
        recommendations.push("Review and terminate unused EC2 instances");
        recommendations.push("Use Auto Scaling to match capacity with demand");
    }
    // Check for RDS costs
    const rdsService = analysis.topServices.find((s) => s.service.includes('RDS'));
    if (rdsService) {
        recommendations.push("Consider using Aurora Serverless for variable workloads");
        recommendations.push("Enable RDS instance stopping for non-production databases");
    }
    // Check for S3 costs
    const s3Service = analysis.topServices.find((s) => s.service.includes('S3'));
    if (s3Service) {
        recommendations.push("Implement S3 lifecycle policies to move data to cheaper storage classes");
        recommendations.push("Enable S3 Intelligent-Tiering for automatic cost optimization");
    }
    // General recommendations
    recommendations.push("Set up AWS Budget alerts to monitor spending");
    recommendations.push("Use AWS Cost Explorer to identify cost trends");
    return recommendations;
}
function generateVPCTemplate(params) {
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
function generateWebAppTemplate(params) {
    // Implementation for web app template
    return {};
}
function generateLambdaTemplate(params) {
    // Implementation for Lambda template
    return {};
}
function generateRDSTemplate(params) {
    // Implementation for RDS template
    return {};
}
exports.awsTools = [
    exports.analyzeAWSCosts,
    exports.createEC2Instance,
    exports.createSecurityGroup,
    exports.generateCloudFormationTemplate,
    exports.createS3Bucket
];
//# sourceMappingURL=aws.js.map