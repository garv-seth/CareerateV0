import { DynamicTool } from '@langchain/core/tools';
export declare const tools: (import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    resourceType: import("zod").ZodEnum<["vpc", "ec2", "rds", "s3", "aks"]>;
    provider: import("zod").ZodEnum<["aws", "azure", "gcp"]>;
    config: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodAny>;
}, "strip", import("zod").ZodTypeAny, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    configPath: import("zod").ZodString;
}, "strip", import("zod").ZodTypeAny, {
    configPath: string;
}, {
    configPath: string;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    configPath: import("zod").ZodString;
    workspace: import("zod").ZodOptional<import("zod").ZodString>;
}, "strip", import("zod").ZodTypeAny, {
    configPath: string;
    workspace?: string | undefined;
}, {
    configPath: string;
    workspace?: string | undefined;
}>> | DynamicTool | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    timeRange: import("zod").ZodOptional<import("zod").ZodString>;
    groupBy: import("zod").ZodOptional<import("zod").ZodEnum<["SERVICE", "REGION", "INSTANCE_TYPE"]>>;
}, "strip", import("zod").ZodTypeAny, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}, {
    timeRange?: string | undefined;
    groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    instanceType: import("zod").ZodOptional<import("zod").ZodString>;
    amiId: import("zod").ZodOptional<import("zod").ZodString>;
    securityGroup: import("zod").ZodOptional<import("zod").ZodString>;
    keyName: import("zod").ZodOptional<import("zod").ZodString>;
    tags: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
}, "strip", import("zod").ZodTypeAny, {
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
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    groupName: import("zod").ZodString;
    description: import("zod").ZodString;
    vpcId: import("zod").ZodOptional<import("zod").ZodString>;
    rules: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
        protocol: import("zod").ZodOptional<import("zod").ZodString>;
        fromPort: import("zod").ZodNumber;
        toPort: import("zod").ZodOptional<import("zod").ZodNumber>;
        cidr: import("zod").ZodOptional<import("zod").ZodString>;
        sourceGroupId: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
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
}, "strip", import("zod").ZodTypeAny, {
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
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    templateType: import("zod").ZodEnum<["vpc", "webApp", "lambda", "rds"]>;
    parameters: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodAny>;
}, "strip", import("zod").ZodTypeAny, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}, {
    templateType: "vpc" | "rds" | "webApp" | "lambda";
    parameters: Record<string, any>;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    bucketName: import("zod").ZodString;
    region: import("zod").ZodOptional<import("zod").ZodString>;
    versioning: import("zod").ZodOptional<import("zod").ZodBoolean>;
    encryption: import("zod").ZodOptional<import("zod").ZodBoolean>;
    publicAccess: import("zod").ZodOptional<import("zod").ZodBoolean>;
}, "strip", import("zod").ZodTypeAny, {
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
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    title: import("zod").ZodString;
    severity: import("zod").ZodEnum<["critical", "high", "medium", "low"]>;
    description: import("zod").ZodString;
    affectedServices: import("zod").ZodArray<import("zod").ZodString, "many">;
    initialActions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
}, "strip", import("zod").ZodTypeAny, {
    description: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    affectedServices: string[];
    initialActions?: string[] | undefined;
}, {
    description: string;
    title: string;
    severity: "critical" | "high" | "medium" | "low";
    affectedServices: string[];
    initialActions?: string[] | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    incidentId: import("zod").ZodString;
    action: import("zod").ZodString;
    details: import("zod").ZodString;
    status: import("zod").ZodOptional<import("zod").ZodEnum<["active", "acknowledged", "mitigated", "resolved"]>>;
}, "strip", import("zod").ZodTypeAny, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    incidentId: import("zod").ZodString;
    findings: import("zod").ZodArray<import("zod").ZodString, "many">;
    contributingFactors: import("zod").ZodArray<import("zod").ZodString, "many">;
    preventiveMeasures: import("zod").ZodArray<import("zod").ZodString, "many">;
}, "strip", import("zod").ZodTypeAny, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    incidentId: import("zod").ZodString;
    participants: import("zod").ZodArray<import("zod").ZodString, "many">;
    lessonsLearned: import("zod").ZodArray<import("zod").ZodString, "many">;
    actionItems: import("zod").ZodArray<import("zod").ZodObject<{
        description: import("zod").ZodString;
        owner: import("zod").ZodString;
        dueDate: import("zod").ZodString;
        priority: import("zod").ZodEnum<["high", "medium", "low"]>;
    }, "strip", import("zod").ZodTypeAny, {
        description: string;
        owner: string;
        dueDate: string;
        priority: "high" | "medium" | "low";
    }, {
        description: string;
        owner: string;
        dueDate: string;
        priority: "high" | "medium" | "low";
    }>, "many">;
}, "strip", import("zod").ZodTypeAny, {
    incidentId: string;
    participants: string[];
    lessonsLearned: string[];
    actionItems: {
        description: string;
        owner: string;
        dueDate: string;
        priority: "high" | "medium" | "low";
    }[];
}, {
    incidentId: string;
    participants: string[];
    lessonsLearned: string[];
    actionItems: {
        description: string;
        owner: string;
        dueDate: string;
        priority: "high" | "medium" | "low";
    }[];
}>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
    alerts: import("zod").ZodArray<import("zod").ZodObject<{
        id: import("zod").ZodString;
        service: import("zod").ZodString;
        message: import("zod").ZodString;
        timestamp: import("zod").ZodString;
        severity: import("zod").ZodString;
        host: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        message: string;
        service: string;
        severity: string;
        id: string;
        timestamp: string;
        host?: string | undefined;
    }, {
        message: string;
        service: string;
        severity: string;
        id: string;
        timestamp: string;
        host?: string | undefined;
    }>, "many">;
    timeWindow: import("zod").ZodOptional<import("zod").ZodNumber>;
}, "strip", import("zod").ZodTypeAny, {
    alerts: {
        message: string;
        service: string;
        severity: string;
        id: string;
        timestamp: string;
        host?: string | undefined;
    }[];
    timeWindow?: number | undefined;
}, {
    alerts: {
        message: string;
        service: string;
        severity: string;
        id: string;
        timestamp: string;
        host?: string | undefined;
    }[];
    timeWindow?: number | undefined;
}>>)[];
export declare const toolsByCategory: {
    general: DynamicTool[];
    terraform: (import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        resourceType: import("zod").ZodEnum<["vpc", "ec2", "rds", "s3", "aks"]>;
        provider: import("zod").ZodEnum<["aws", "azure", "gcp"]>;
        config: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodAny>;
    }, "strip", import("zod").ZodTypeAny, {
        resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
        provider: "aws" | "azure" | "gcp";
        config: Record<string, any>;
    }, {
        resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
        provider: "aws" | "azure" | "gcp";
        config: Record<string, any>;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        configPath: import("zod").ZodString;
    }, "strip", import("zod").ZodTypeAny, {
        configPath: string;
    }, {
        configPath: string;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        configPath: import("zod").ZodString;
        workspace: import("zod").ZodOptional<import("zod").ZodString>;
    }, "strip", import("zod").ZodTypeAny, {
        configPath: string;
        workspace?: string | undefined;
    }, {
        configPath: string;
        workspace?: string | undefined;
    }>>)[];
    kubernetes: DynamicTool[];
    aws: (import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        timeRange: import("zod").ZodOptional<import("zod").ZodString>;
        groupBy: import("zod").ZodOptional<import("zod").ZodEnum<["SERVICE", "REGION", "INSTANCE_TYPE"]>>;
    }, "strip", import("zod").ZodTypeAny, {
        timeRange?: string | undefined;
        groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
    }, {
        timeRange?: string | undefined;
        groupBy?: "SERVICE" | "REGION" | "INSTANCE_TYPE" | undefined;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        instanceType: import("zod").ZodOptional<import("zod").ZodString>;
        amiId: import("zod").ZodOptional<import("zod").ZodString>;
        securityGroup: import("zod").ZodOptional<import("zod").ZodString>;
        keyName: import("zod").ZodOptional<import("zod").ZodString>;
        tags: import("zod").ZodOptional<import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodString>>;
    }, "strip", import("zod").ZodTypeAny, {
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
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        groupName: import("zod").ZodString;
        description: import("zod").ZodString;
        vpcId: import("zod").ZodOptional<import("zod").ZodString>;
        rules: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodObject<{
            protocol: import("zod").ZodOptional<import("zod").ZodString>;
            fromPort: import("zod").ZodNumber;
            toPort: import("zod").ZodOptional<import("zod").ZodNumber>;
            cidr: import("zod").ZodOptional<import("zod").ZodString>;
            sourceGroupId: import("zod").ZodOptional<import("zod").ZodString>;
        }, "strip", import("zod").ZodTypeAny, {
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
    }, "strip", import("zod").ZodTypeAny, {
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
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        templateType: import("zod").ZodEnum<["vpc", "webApp", "lambda", "rds"]>;
        parameters: import("zod").ZodRecord<import("zod").ZodString, import("zod").ZodAny>;
    }, "strip", import("zod").ZodTypeAny, {
        templateType: "vpc" | "rds" | "webApp" | "lambda";
        parameters: Record<string, any>;
    }, {
        templateType: "vpc" | "rds" | "webApp" | "lambda";
        parameters: Record<string, any>;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        bucketName: import("zod").ZodString;
        region: import("zod").ZodOptional<import("zod").ZodString>;
        versioning: import("zod").ZodOptional<import("zod").ZodBoolean>;
        encryption: import("zod").ZodOptional<import("zod").ZodBoolean>;
        publicAccess: import("zod").ZodOptional<import("zod").ZodBoolean>;
    }, "strip", import("zod").ZodTypeAny, {
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
    incident: (import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        title: import("zod").ZodString;
        severity: import("zod").ZodEnum<["critical", "high", "medium", "low"]>;
        description: import("zod").ZodString;
        affectedServices: import("zod").ZodArray<import("zod").ZodString, "many">;
        initialActions: import("zod").ZodOptional<import("zod").ZodArray<import("zod").ZodString, "many">>;
    }, "strip", import("zod").ZodTypeAny, {
        description: string;
        title: string;
        severity: "critical" | "high" | "medium" | "low";
        affectedServices: string[];
        initialActions?: string[] | undefined;
    }, {
        description: string;
        title: string;
        severity: "critical" | "high" | "medium" | "low";
        affectedServices: string[];
        initialActions?: string[] | undefined;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        incidentId: import("zod").ZodString;
        action: import("zod").ZodString;
        details: import("zod").ZodString;
        status: import("zod").ZodOptional<import("zod").ZodEnum<["active", "acknowledged", "mitigated", "resolved"]>>;
    }, "strip", import("zod").ZodTypeAny, {
        incidentId: string;
        action: string;
        details: string;
        status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
    }, {
        incidentId: string;
        action: string;
        details: string;
        status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        incidentId: import("zod").ZodString;
        findings: import("zod").ZodArray<import("zod").ZodString, "many">;
        contributingFactors: import("zod").ZodArray<import("zod").ZodString, "many">;
        preventiveMeasures: import("zod").ZodArray<import("zod").ZodString, "many">;
    }, "strip", import("zod").ZodTypeAny, {
        incidentId: string;
        findings: string[];
        contributingFactors: string[];
        preventiveMeasures: string[];
    }, {
        incidentId: string;
        findings: string[];
        contributingFactors: string[];
        preventiveMeasures: string[];
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        incidentId: import("zod").ZodString;
        participants: import("zod").ZodArray<import("zod").ZodString, "many">;
        lessonsLearned: import("zod").ZodArray<import("zod").ZodString, "many">;
        actionItems: import("zod").ZodArray<import("zod").ZodObject<{
            description: import("zod").ZodString;
            owner: import("zod").ZodString;
            dueDate: import("zod").ZodString;
            priority: import("zod").ZodEnum<["high", "medium", "low"]>;
        }, "strip", import("zod").ZodTypeAny, {
            description: string;
            owner: string;
            dueDate: string;
            priority: "high" | "medium" | "low";
        }, {
            description: string;
            owner: string;
            dueDate: string;
            priority: "high" | "medium" | "low";
        }>, "many">;
    }, "strip", import("zod").ZodTypeAny, {
        incidentId: string;
        participants: string[];
        lessonsLearned: string[];
        actionItems: {
            description: string;
            owner: string;
            dueDate: string;
            priority: "high" | "medium" | "low";
        }[];
    }, {
        incidentId: string;
        participants: string[];
        lessonsLearned: string[];
        actionItems: {
            description: string;
            owner: string;
            dueDate: string;
            priority: "high" | "medium" | "low";
        }[];
    }>> | import("@langchain/core/tools").DynamicStructuredTool<import("zod").ZodObject<{
        alerts: import("zod").ZodArray<import("zod").ZodObject<{
            id: import("zod").ZodString;
            service: import("zod").ZodString;
            message: import("zod").ZodString;
            timestamp: import("zod").ZodString;
            severity: import("zod").ZodString;
            host: import("zod").ZodOptional<import("zod").ZodString>;
        }, "strip", import("zod").ZodTypeAny, {
            message: string;
            service: string;
            severity: string;
            id: string;
            timestamp: string;
            host?: string | undefined;
        }, {
            message: string;
            service: string;
            severity: string;
            id: string;
            timestamp: string;
            host?: string | undefined;
        }>, "many">;
        timeWindow: import("zod").ZodOptional<import("zod").ZodNumber>;
    }, "strip", import("zod").ZodTypeAny, {
        alerts: {
            message: string;
            service: string;
            severity: string;
            id: string;
            timestamp: string;
            host?: string | undefined;
        }[];
        timeWindow?: number | undefined;
    }, {
        alerts: {
            message: string;
            service: string;
            severity: string;
            id: string;
            timestamp: string;
            host?: string | undefined;
        }[];
        timeWindow?: number | undefined;
    }>>)[];
};
//# sourceMappingURL=index.d.ts.map