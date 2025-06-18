import { z } from "zod";
export declare const analyzeAWSCosts: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    timeRange: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodOptional<z.ZodEnum<["SERVICE", "REGION", "INSTANCE_TYPE"]>>;
}, "strip", z.ZodTypeAny, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}>>;
export declare const createEC2Instance: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    instanceType: z.ZodOptional<z.ZodString>;
    amiId: z.ZodOptional<z.ZodString>;
    securityGroup: z.ZodOptional<z.ZodString>;
    keyName: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    instanceType?: string | undefined;
    amiId?: string | undefined;
    securityGroup?: string | undefined;
    keyName?: string | undefined;
    tags?: Record<string, string> | undefined;
}, {
    instanceType?: string | undefined;
    amiId?: string | undefined;
    securityGroup?: string | undefined;
    keyName?: string | undefined;
    tags?: Record<string, string> | undefined;
}>>;
export declare const createSecurityGroup: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    groupName: z.ZodString;
    description: z.ZodString;
    vpcId: z.ZodOptional<z.ZodString>;
    rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodOptional<z.ZodString>;
        fromPort: z.ZodNumber;
        toPort: z.ZodOptional<z.ZodNumber>;
        cidr: z.ZodOptional<z.ZodString>;
        sourceGroupId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }, {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    groupName: string;
    description: string;
    vpcId?: string | undefined;
    rules?: {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }[] | undefined;
}, {
    groupName: string;
    description: string;
    vpcId?: string | undefined;
    rules?: {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }[] | undefined;
}>>;
export declare const generateCloudFormationTemplate: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    templateType: z.ZodEnum<["vpc", "webApp", "lambda", "rds"]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}>>;
export declare const createS3Bucket: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    bucketName: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    versioning: z.ZodOptional<z.ZodBoolean>;
    encryption: z.ZodOptional<z.ZodBoolean>;
    publicAccess: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    bucketName: string;
    region?: string | undefined;
    versioning?: boolean | undefined;
    encryption?: boolean | undefined;
    publicAccess?: boolean | undefined;
}, {
    bucketName: string;
    region?: string | undefined;
    versioning?: boolean | undefined;
    encryption?: boolean | undefined;
    publicAccess?: boolean | undefined;
}>>;
export declare const awsTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    timeRange: z.ZodOptional<z.ZodString>;
    groupBy: z.ZodOptional<z.ZodEnum<["SERVICE", "REGION", "INSTANCE_TYPE"]>>;
}, "strip", z.ZodTypeAny, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    instanceType: z.ZodOptional<z.ZodString>;
    amiId: z.ZodOptional<z.ZodString>;
    securityGroup: z.ZodOptional<z.ZodString>;
    keyName: z.ZodOptional<z.ZodString>;
    tags: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    instanceType?: string | undefined;
    amiId?: string | undefined;
    securityGroup?: string | undefined;
    keyName?: string | undefined;
    tags?: Record<string, string> | undefined;
}, {
    instanceType?: string | undefined;
    amiId?: string | undefined;
    securityGroup?: string | undefined;
    keyName?: string | undefined;
    tags?: Record<string, string> | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    groupName: z.ZodString;
    description: z.ZodString;
    vpcId: z.ZodOptional<z.ZodString>;
    rules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        protocol: z.ZodOptional<z.ZodString>;
        fromPort: z.ZodNumber;
        toPort: z.ZodOptional<z.ZodNumber>;
        cidr: z.ZodOptional<z.ZodString>;
        sourceGroupId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }, {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    groupName: string;
    description: string;
    vpcId?: string | undefined;
    rules?: {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }[] | undefined;
}, {
    groupName: string;
    description: string;
    vpcId?: string | undefined;
    rules?: {
        fromPort: number;
        protocol?: string | undefined;
        toPort?: number | undefined;
        cidr?: string | undefined;
        sourceGroupId?: string | undefined;
    }[] | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    templateType: z.ZodEnum<["vpc", "webApp", "lambda", "rds"]>;
    parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    bucketName: z.ZodString;
    region: z.ZodOptional<z.ZodString>;
    versioning: z.ZodOptional<z.ZodBoolean>;
    encryption: z.ZodOptional<z.ZodBoolean>;
    publicAccess: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    bucketName: string;
    region?: string | undefined;
    versioning?: boolean | undefined;
    encryption?: boolean | undefined;
    publicAccess?: boolean | undefined;
}, {
    bucketName: string;
    region?: string | undefined;
    versioning?: boolean | undefined;
    encryption?: boolean | undefined;
    publicAccess?: boolean | undefined;
}>>)[];
//# sourceMappingURL=aws.d.ts.map