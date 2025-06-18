import { z } from "zod";
export declare const generateTerraformConfig: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    resourceType: z.ZodEnum<["vpc", "ec2", "rds", "s3", "aks"]>;
    provider: z.ZodEnum<["aws", "azure", "gcp"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}>>;
export declare const validateTerraformConfig: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    configPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    configPath: string;
}, {
    configPath: string;
}>>;
export declare const planTerraformDeployment: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    configPath: z.ZodString;
    workspace: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    configPath: string;
    workspace?: string | undefined;
}, {
    configPath: string;
    workspace?: string | undefined;
}>>;
export declare const terraformTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    resourceType: z.ZodEnum<["vpc", "ec2", "rds", "s3", "aks"]>;
    provider: z.ZodEnum<["aws", "azure", "gcp"]>;
    config: z.ZodRecord<z.ZodString, z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}, {
    resourceType: "vpc" | "ec2" | "rds" | "s3" | "aks";
    provider: "aws" | "azure" | "gcp";
    config: Record<string, any>;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    configPath: z.ZodString;
}, "strip", z.ZodTypeAny, {
    configPath: string;
}, {
    configPath: string;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    configPath: z.ZodString;
    workspace: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    configPath: string;
    workspace?: string | undefined;
}, {
    configPath: string;
    workspace?: string | undefined;
}>>)[];
//# sourceMappingURL=terraform.d.ts.map