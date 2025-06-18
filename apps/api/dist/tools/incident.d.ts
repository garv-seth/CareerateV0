import { z } from "zod";
export declare const createIncidentResponse: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
    description: z.ZodString;
    affectedServices: z.ZodArray<z.ZodString, "many">;
    initialActions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
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
}>>;
export declare const updateIncidentTimeline: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    action: z.ZodString;
    details: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["active", "acknowledged", "mitigated", "resolved"]>>;
}, "strip", z.ZodTypeAny, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}>>;
export declare const performRootCauseAnalysis: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    findings: z.ZodArray<z.ZodString, "many">;
    contributingFactors: z.ZodArray<z.ZodString, "many">;
    preventiveMeasures: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}>>;
export declare const generatePostMortem: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    participants: z.ZodArray<z.ZodString, "many">;
    lessonsLearned: z.ZodArray<z.ZodString, "many">;
    actionItems: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        owner: z.ZodString;
        dueDate: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
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
}, "strip", z.ZodTypeAny, {
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
}>>;
export declare const correlateAlerts: import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    alerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        service: z.ZodString;
        message: z.ZodString;
        timestamp: z.ZodString;
        severity: z.ZodString;
        host: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    timeWindow: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
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
}>>;
export declare const incidentTools: (import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    title: z.ZodString;
    severity: z.ZodEnum<["critical", "high", "medium", "low"]>;
    description: z.ZodString;
    affectedServices: z.ZodArray<z.ZodString, "many">;
    initialActions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
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
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    action: z.ZodString;
    details: z.ZodString;
    status: z.ZodOptional<z.ZodEnum<["active", "acknowledged", "mitigated", "resolved"]>>;
}, "strip", z.ZodTypeAny, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}, {
    incidentId: string;
    action: string;
    details: string;
    status?: "active" | "acknowledged" | "mitigated" | "resolved" | undefined;
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    findings: z.ZodArray<z.ZodString, "many">;
    contributingFactors: z.ZodArray<z.ZodString, "many">;
    preventiveMeasures: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}, {
    incidentId: string;
    findings: string[];
    contributingFactors: string[];
    preventiveMeasures: string[];
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    incidentId: z.ZodString;
    participants: z.ZodArray<z.ZodString, "many">;
    lessonsLearned: z.ZodArray<z.ZodString, "many">;
    actionItems: z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        owner: z.ZodString;
        dueDate: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
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
}, "strip", z.ZodTypeAny, {
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
}>> | import("@langchain/core/tools").DynamicStructuredTool<z.ZodObject<{
    alerts: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        service: z.ZodString;
        message: z.ZodString;
        timestamp: z.ZodString;
        severity: z.ZodString;
        host: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
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
    timeWindow: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
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
//# sourceMappingURL=incident.d.ts.map