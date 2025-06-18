"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.incidentTools = exports.correlateAlerts = exports.generatePostMortem = exports.performRootCauseAnalysis = exports.updateIncidentTimeline = exports.createIncidentResponse = void 0;
const tools_1 = require("@langchain/core/tools");
const zod_1 = require("zod");
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
// In-memory incident store (in production, use a database)
const incidentStore = new Map();
exports.createIncidentResponse = (0, tools_1.tool)(async ({ title, severity, description, affectedServices, initialActions }) => {
    try {
        const incidentId = `INC-${Date.now()}-${(0, uuid_1.v4)().slice(0, 8)}`;
        const timestamp = new Date().toISOString();
        const incident = {
            id: incidentId,
            title,
            severity,
            description,
            affectedServices,
            status: "active",
            createdAt: timestamp,
            updatedAt: timestamp,
            timeline: [{
                    timestamp,
                    action: "Incident created",
                    actor: "system",
                    details: description
                }],
            initialActions: initialActions || [],
            metrics: {
                detectionTime: timestamp,
                acknowledgementTime: null,
                mitigationTime: null,
                resolutionTime: null
            },
            participants: [],
            communications: [],
            rootCause: null,
            lessonsLearned: []
        };
        // Add initial actions to timeline
        if (initialActions && initialActions.length > 0) {
            initialActions.forEach((action) => {
                incident.timeline.push({
                    timestamp: new Date().toISOString(),
                    action: "Initial action",
                    actor: "system",
                    details: action
                });
            });
        }
        // Store incident
        incidentStore.set(incidentId, incident);
        // Generate initial runbook
        const runbook = generateRunbook(incident);
        return {
            success: true,
            incidentId,
            incident,
            runbook,
            nextSteps: generateNextSteps(severity, affectedServices),
            communicationPlan: generateCommunicationPlan(severity)
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "create_incident_response",
    description: "Create a new incident response with tracking and runbook",
    schema: zod_1.z.object({
        title: zod_1.z.string(),
        severity: zod_1.z.enum(["critical", "high", "medium", "low"]),
        description: zod_1.z.string(),
        affectedServices: zod_1.z.array(zod_1.z.string()),
        initialActions: zod_1.z.array(zod_1.z.string()).optional()
    })
});
exports.updateIncidentTimeline = (0, tools_1.tool)(async ({ incidentId, action, details, status }) => {
    try {
        const incident = incidentStore.get(incidentId);
        if (!incident) {
            return { error: `Incident ${incidentId} not found` };
        }
        const timestamp = new Date().toISOString();
        // Add to timeline
        incident.timeline.push({
            timestamp,
            action,
            actor: "system",
            details
        });
        // Update status if provided
        if (status) {
            incident.status = status;
            // Update metrics based on status
            if (status === "acknowledged" && !incident.metrics.acknowledgementTime) {
                incident.metrics.acknowledgementTime = timestamp;
            }
            else if (status === "mitigated" && !incident.metrics.mitigationTime) {
                incident.metrics.mitigationTime = timestamp;
            }
            else if (status === "resolved" && !incident.metrics.resolutionTime) {
                incident.metrics.resolutionTime = timestamp;
            }
        }
        incident.updatedAt = timestamp;
        incidentStore.set(incidentId, incident);
        return {
            success: true,
            incidentId,
            currentStatus: incident.status,
            timelineEntry: incident.timeline[incident.timeline.length - 1],
            metrics: calculateIncidentMetrics(incident)
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "update_incident_timeline",
    description: "Update incident timeline with new actions and status changes",
    schema: zod_1.z.object({
        incidentId: zod_1.z.string(),
        action: zod_1.z.string(),
        details: zod_1.z.string(),
        status: zod_1.z.enum(["active", "acknowledged", "mitigated", "resolved"]).optional()
    })
});
exports.performRootCauseAnalysis = (0, tools_1.tool)(async ({ incidentId, findings, contributingFactors, preventiveMeasures }) => {
    try {
        const incident = incidentStore.get(incidentId);
        if (!incident) {
            return { error: `Incident ${incidentId} not found` };
        }
        const rca = {
            performedAt: new Date().toISOString(),
            findings,
            contributingFactors,
            preventiveMeasures,
            fiveWhysAnalysis: performFiveWhysAnalysis(findings),
            impactAnalysis: analyzeIncidentImpact(incident),
            recommendations: generateRCARecommendations(findings, contributingFactors)
        };
        incident.rootCause = rca;
        incidentStore.set(incidentId, incident);
        return {
            success: true,
            incidentId,
            rootCauseAnalysis: rca,
            actionItems: generateActionItems(rca),
            preventionPlan: generatePreventionPlan(rca)
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "perform_root_cause_analysis",
    description: "Perform root cause analysis for an incident",
    schema: zod_1.z.object({
        incidentId: zod_1.z.string(),
        findings: zod_1.z.array(zod_1.z.string()),
        contributingFactors: zod_1.z.array(zod_1.z.string()),
        preventiveMeasures: zod_1.z.array(zod_1.z.string())
    })
});
exports.generatePostMortem = (0, tools_1.tool)(async ({ incidentId, participants, lessonsLearned, actionItems }) => {
    try {
        const incident = incidentStore.get(incidentId);
        if (!incident) {
            return { error: `Incident ${incidentId} not found` };
        }
        const postMortem = {
            generatedAt: new Date().toISOString(),
            incident: {
                id: incident.id,
                title: incident.title,
                severity: incident.severity,
                duration: calculateDuration(incident),
                impact: incident.description
            },
            timeline: formatTimelineForPostMortem(incident.timeline),
            participants,
            rootCause: incident.rootCause,
            lessonsLearned,
            actionItems: actionItems.map((item, index) => ({
                id: `AI-${index + 1}`,
                description: item.description,
                owner: item.owner,
                dueDate: item.dueDate,
                priority: item.priority
            })),
            metrics: calculateIncidentMetrics(incident),
            recommendations: generatePostMortemRecommendations(incident, lessonsLearned)
        };
        // Generate markdown document
        const markdown = generatePostMortemMarkdown(postMortem);
        // Save to file
        const filename = `postmortem-${incident.id}-${Date.now()}.md`;
        const filepath = path.join(process.cwd(), "postmortems", filename);
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        await fs.writeFile(filepath, markdown);
        return {
            success: true,
            incidentId,
            postMortem,
            markdownPath: filepath,
            summary: generateExecutiveSummary(postMortem)
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "generate_post_mortem",
    description: "Generate a comprehensive post-mortem document for an incident",
    schema: zod_1.z.object({
        incidentId: zod_1.z.string(),
        participants: zod_1.z.array(zod_1.z.string()),
        lessonsLearned: zod_1.z.array(zod_1.z.string()),
        actionItems: zod_1.z.array(zod_1.z.object({
            description: zod_1.z.string(),
            owner: zod_1.z.string(),
            dueDate: zod_1.z.string(),
            priority: zod_1.z.enum(["high", "medium", "low"])
        }))
    })
});
exports.correlateAlerts = (0, tools_1.tool)(async ({ alerts, timeWindow = 300 }) => {
    try {
        // Group alerts by various criteria
        const correlations = {
            byService: groupAlertsByService(alerts),
            byTime: groupAlertsByTimeWindow(alerts, timeWindow),
            byError: groupAlertsBySimilarity(alerts),
            byHost: groupAlertsByHost(alerts)
        };
        // Identify patterns
        const patterns = identifyAlertPatterns(correlations);
        // Generate correlation summary
        const summary = {
            totalAlerts: alerts.length,
            uniqueServices: Object.keys(correlations.byService).length,
            timeWindowClusters: correlations.byTime.length,
            likelyRootCauses: patterns.rootCauses,
            noisyAlerts: patterns.noisy,
            actionableAlerts: patterns.actionable
        };
        return {
            success: true,
            correlations,
            patterns,
            summary,
            recommendations: generateAlertRecommendations(patterns)
        };
    }
    catch (error) {
        return { error: error.message };
    }
}, {
    name: "correlate_alerts",
    description: "Correlate multiple alerts to identify patterns and reduce noise",
    schema: zod_1.z.object({
        alerts: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string(),
            service: zod_1.z.string(),
            message: zod_1.z.string(),
            timestamp: zod_1.z.string(),
            severity: zod_1.z.string(),
            host: zod_1.z.string().optional()
        })),
        timeWindow: zod_1.z.number().optional().describe("Time window in seconds for correlation")
    })
});
// Helper functions
function generateRunbook(incident) {
    const runbook = {
        title: `Runbook for ${incident.title}`,
        severity: incident.severity,
        steps: []
    };
    // Add severity-specific steps
    if (incident.severity === "critical") {
        runbook.steps.push("1. Immediately notify on-call engineer and incident commander", "2. Open bridge call and communication channels", "3. Begin impact assessment and customer communication");
    }
    // Add service-specific steps
    incident.affectedServices.forEach((service) => {
        runbook.steps.push(`Check ${service} health metrics and logs`, `Verify ${service} dependencies and upstream/downstream services`, `Review recent deployments to ${service}`);
    });
    // Add general troubleshooting steps
    runbook.steps.push("Collect relevant logs and metrics", "Check for recent configuration changes", "Verify infrastructure health (CPU, memory, disk, network)", "Review monitoring dashboards for anomalies", "Document all findings in incident timeline");
    return runbook;
}
function generateNextSteps(severity, affectedServices) {
    const steps = [];
    if (severity === "critical" || severity === "high") {
        steps.push("Establish incident command structure");
        steps.push("Open dedicated communication channel");
        steps.push("Prepare customer communication");
    }
    steps.push("Begin systematic troubleshooting using runbook");
    steps.push("Assign roles (commander, communicator, investigator)");
    steps.push("Set up monitoring for incident metrics");
    steps.push("Schedule regular status updates");
    return steps;
}
function generateCommunicationPlan(severity) {
    return {
        internal: {
            frequency: severity === "critical" ? "15 minutes" : "30 minutes",
            channels: ["Slack #incidents", "Email to engineering"],
            template: "Status: [STATUS] | Impact: [IMPACT] | Next Update: [TIME]"
        },
        external: {
            required: severity === "critical" || severity === "high",
            frequency: "30 minutes",
            channels: ["Status page", "Customer email"],
            template: "We are experiencing issues with [SERVICE]. Our team is investigating."
        }
    };
}
function calculateIncidentMetrics(incident) {
    const metrics = incident.metrics;
    const now = new Date();
    return {
        timeToDetect: 0, // Assuming immediate detection for demo
        timeToAcknowledge: metrics.acknowledgementTime ?
            (new Date(metrics.acknowledgementTime).getTime() - new Date(metrics.detectionTime).getTime()) / 1000 : null,
        timeToMitigate: metrics.mitigationTime ?
            (new Date(metrics.mitigationTime).getTime() - new Date(metrics.detectionTime).getTime()) / 1000 : null,
        timeToResolve: metrics.resolutionTime ?
            (new Date(metrics.resolutionTime).getTime() - new Date(metrics.detectionTime).getTime()) / 1000 : null,
        currentDuration: (now.getTime() - new Date(metrics.detectionTime).getTime()) / 1000
    };
}
function performFiveWhysAnalysis(findings) {
    // Simplified 5 whys analysis
    const whys = [];
    let currentWhy = findings[0] || "System failure occurred";
    for (let i = 0; i < 5; i++) {
        whys.push({
            level: i + 1,
            question: `Why did ${currentWhy}?`,
            answer: generateWhyAnswer(currentWhy, i)
        });
        currentWhy = whys[i].answer;
    }
    return whys;
}
function generateWhyAnswer(question, level) {
    // Simplified answer generation
    const answers = [
        "inadequate monitoring coverage",
        "missing alerting thresholds",
        "lack of automated testing",
        "insufficient capacity planning",
        "absence of proper procedures"
    ];
    return answers[level] || "root cause identified";
}
function analyzeIncidentImpact(incident) {
    return {
        services: incident.affectedServices,
        estimatedUsersAffected: "Unknown",
        businessImpact: incident.severity === "critical" ? "High" : "Medium",
        reputationalImpact: incident.severity === "critical" ? "Significant" : "Minor",
        financialImpact: "To be determined"
    };
}
function generateRCARecommendations(findings, factors) {
    const recommendations = [];
    // Generate recommendations based on findings
    findings.forEach(finding => {
        if (finding.toLowerCase().includes("monitoring")) {
            recommendations.push("Enhance monitoring coverage for critical services");
        }
        if (finding.toLowerCase().includes("capacity")) {
            recommendations.push("Implement predictive capacity planning");
        }
        if (finding.toLowerCase().includes("deployment")) {
            recommendations.push("Strengthen deployment procedures and rollback capabilities");
        }
    });
    // Add general recommendations
    recommendations.push("Conduct regular incident response drills", "Review and update runbooks quarterly", "Implement chaos engineering practices");
    return recommendations;
}
function generateActionItems(rca) {
    return rca.preventiveMeasures.map((measure, index) => ({
        id: `RCA-${index + 1}`,
        action: measure,
        type: "preventive",
        priority: index === 0 ? "high" : "medium",
        estimatedEffort: "To be determined"
    }));
}
function generatePreventionPlan(rca) {
    return {
        shortTerm: rca.preventiveMeasures.slice(0, 2),
        mediumTerm: rca.preventiveMeasures.slice(2, 4),
        longTerm: rca.recommendations,
        monitoring: [
            "Set up alerts for similar patterns",
            "Create dashboard for key indicators",
            "Implement automated response where possible"
        ]
    };
}
function calculateDuration(incident) {
    if (!incident.metrics.resolutionTime) {
        return "Ongoing";
    }
    const duration = new Date(incident.metrics.resolutionTime).getTime() -
        new Date(incident.metrics.detectionTime).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}
function formatTimelineForPostMortem(timeline) {
    return timeline.map(entry => ({
        time: new Date(entry.timestamp).toLocaleString(),
        action: entry.action,
        details: entry.details,
        actor: entry.actor
    }));
}
function generatePostMortemRecommendations(incident, lessons) {
    const recommendations = [];
    // Based on incident severity
    if (incident.severity === "critical") {
        recommendations.push("Implement additional safeguards for critical services");
        recommendations.push("Review and enhance disaster recovery procedures");
    }
    // Based on lessons learned
    lessons.forEach(lesson => {
        if (lesson.toLowerCase().includes("communication")) {
            recommendations.push("Improve incident communication protocols");
        }
        if (lesson.toLowerCase().includes("detection")) {
            recommendations.push("Enhance monitoring and alerting systems");
        }
    });
    return recommendations;
}
function generatePostMortemMarkdown(postMortem) {
    return `# Post-Mortem: ${postMortem.incident.title}

## Incident Summary
- **ID**: ${postMortem.incident.id}
- **Severity**: ${postMortem.incident.severity}
- **Duration**: ${postMortem.incident.duration}
- **Date**: ${new Date(postMortem.generatedAt).toLocaleDateString()}

## Impact
${postMortem.incident.impact}

## Timeline
${postMortem.timeline.map((entry) => `- **${entry.time}**: ${entry.action} - ${entry.details}`).join('\n')}

## Root Cause Analysis
${postMortem.rootCause ? formatRootCause(postMortem.rootCause) : 'Not yet determined'}

## Lessons Learned
${postMortem.lessonsLearned.map((lesson) => `- ${lesson}`).join('\n')}

## Action Items
${postMortem.actionItems.map((item) => `- [ ] **${item.id}**: ${item.description} (Owner: ${item.owner}, Due: ${item.dueDate})`).join('\n')}

## Recommendations
${postMortem.recommendations.map((rec) => `- ${rec}`).join('\n')}
`;
}
function formatRootCause(rca) {
    return `
### Findings
${rca.findings.map((f) => `- ${f}`).join('\n')}

### Contributing Factors
${rca.contributingFactors.map((f) => `- ${f}`).join('\n')}

### Preventive Measures
${rca.preventiveMeasures.map((m) => `- ${m}`).join('\n')}
`;
}
function generateExecutiveSummary(postMortem) {
    return `Incident ${postMortem.incident.id} (${postMortem.incident.severity}) lasted ${postMortem.incident.duration}. ` +
        `${postMortem.actionItems.length} action items identified. Key focus areas: ${postMortem.recommendations.slice(0, 2).join(', ')}.`;
}
function groupAlertsByService(alerts) {
    return alerts.reduce((groups, alert) => {
        if (!groups[alert.service]) {
            groups[alert.service] = [];
        }
        groups[alert.service].push(alert);
        return groups;
    }, {});
}
function groupAlertsByTimeWindow(alerts, windowSeconds) {
    const windows = [];
    const sorted = alerts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    let currentWindow = [];
    let windowStart = sorted[0] ? new Date(sorted[0].timestamp).getTime() : 0;
    sorted.forEach(alert => {
        const alertTime = new Date(alert.timestamp).getTime();
        if (alertTime - windowStart <= windowSeconds * 1000) {
            currentWindow.push(alert);
        }
        else {
            if (currentWindow.length > 0) {
                windows.push(currentWindow);
            }
            currentWindow = [alert];
            windowStart = alertTime;
        }
    });
    if (currentWindow.length > 0) {
        windows.push(currentWindow);
    }
    return windows;
}
function groupAlertsBySimilarity(alerts) {
    // Simple similarity grouping by message content
    const groups = {};
    alerts.forEach(alert => {
        const key = alert.message.toLowerCase().replace(/[0-9]/g, 'N').slice(0, 50);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(alert);
    });
    return groups;
}
function groupAlertsByHost(alerts) {
    return alerts.reduce((groups, alert) => {
        const host = alert.host || 'unknown';
        if (!groups[host]) {
            groups[host] = [];
        }
        groups[host].push(alert);
        return groups;
    }, {});
}
function identifyAlertPatterns(correlations) {
    const patterns = {
        rootCauses: [],
        noisy: [],
        actionable: []
    };
    // Identify potential root causes
    Object.entries(correlations.byService).forEach(([service, alerts]) => {
        if (alerts.length > 5) {
            patterns.rootCauses.push(`High alert volume from ${service} service`);
        }
    });
    // Identify noisy alerts
    Object.entries(correlations.byError).forEach(([error, alerts]) => {
        if (alerts.length > 10) {
            patterns.noisy.push(error);
        }
    });
    // Identify actionable alerts
    correlations.byTime.forEach((window) => {
        if (window.length > 3) {
            patterns.actionable.push(`Alert storm detected at ${new Date(window[0].timestamp).toLocaleString()}`);
        }
    });
    return patterns;
}
function generateAlertRecommendations(patterns) {
    const recommendations = [];
    if (patterns.rootCauses.length > 0) {
        recommendations.push("Investigate root causes to prevent cascading failures");
    }
    if (patterns.noisy.length > 0) {
        recommendations.push("Tune alert thresholds to reduce noise");
        recommendations.push("Implement alert deduplication");
    }
    if (patterns.actionable.length > 0) {
        recommendations.push("Create composite alerts for correlated events");
        recommendations.push("Implement intelligent alert routing");
    }
    recommendations.push("Consider implementing AIOps for automated correlation");
    return recommendations;
}
exports.incidentTools = [
    exports.createIncidentResponse,
    exports.updateIncidentTimeline,
    exports.performRootCauseAnalysis,
    exports.generatePostMortem,
    exports.correlateAlerts
];
//# sourceMappingURL=incident.js.map