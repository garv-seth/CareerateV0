import { tool } from "@langchain/core/tools";
import { z } from "zod";
import * as fs from "fs/promises";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// In-memory incident store (in production, use a database)
const incidentStore = new Map<string, any>();

export const createIncidentResponse = tool(
  async ({ title, severity, description, affectedServices, initialActions }) => {
    try {
      const incidentId = `INC-${Date.now()}-${uuidv4().slice(0, 8)}`;
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
        initialActions.forEach((action: string) => {
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "create_incident_response",
    description: "Create a new incident response with tracking and runbook",
    schema: z.object({
      title: z.string(),
      severity: z.enum(["critical", "high", "medium", "low"]),
      description: z.string(),
      affectedServices: z.array(z.string()),
      initialActions: z.array(z.string()).optional()
    })
  }
);

export const updateIncidentTimeline = tool(
  async ({ incidentId, action, details, status }) => {
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
        } else if (status === "mitigated" && !incident.metrics.mitigationTime) {
          incident.metrics.mitigationTime = timestamp;
        } else if (status === "resolved" && !incident.metrics.resolutionTime) {
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "update_incident_timeline",
    description: "Update incident timeline with new actions and status changes",
    schema: z.object({
      incidentId: z.string(),
      action: z.string(),
      details: z.string(),
      status: z.enum(["active", "acknowledged", "mitigated", "resolved"]).optional()
    })
  }
);

export const performRootCauseAnalysis = tool(
  async ({ incidentId, findings, contributingFactors, preventiveMeasures }) => {
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "perform_root_cause_analysis",
    description: "Perform root cause analysis for an incident",
    schema: z.object({
      incidentId: z.string(),
      findings: z.array(z.string()),
      contributingFactors: z.array(z.string()),
      preventiveMeasures: z.array(z.string())
    })
  }
);

export const generatePostMortem = tool(
  async ({ incidentId, participants, lessonsLearned, actionItems }) => {
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
        actionItems: actionItems.map((item: any, index: number) => ({
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "generate_post_mortem",
    description: "Generate a comprehensive post-mortem document for an incident",
    schema: z.object({
      incidentId: z.string(),
      participants: z.array(z.string()),
      lessonsLearned: z.array(z.string()),
      actionItems: z.array(z.object({
        description: z.string(),
        owner: z.string(),
        dueDate: z.string(),
        priority: z.enum(["high", "medium", "low"])
      }))
    })
  }
);

export const correlateAlerts = tool(
  async ({ alerts, timeWindow = 300 }) => {
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
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "correlate_alerts",
    description: "Correlate multiple alerts to identify patterns and reduce noise",
    schema: z.object({
      alerts: z.array(z.object({
        id: z.string(),
        service: z.string(),
        message: z.string(),
        timestamp: z.string(),
        severity: z.string(),
        host: z.string().optional()
      })),
      timeWindow: z.number().optional().describe("Time window in seconds for correlation")
    })
  }
);

// Helper functions
function generateRunbook(incident: any): any {
  const runbook = {
    title: `Runbook for ${incident.title}`,
    severity: incident.severity,
    steps: [] as string[]
  };

  // Add severity-specific steps
  if (incident.severity === "critical") {
    runbook.steps.push(
      "1. Immediately notify on-call engineer and incident commander",
      "2. Open bridge call and communication channels",
      "3. Begin impact assessment and customer communication"
    );
  }

  // Add service-specific steps
  incident.affectedServices.forEach((service: string) => {
    runbook.steps.push(
      `Check ${service} health metrics and logs`,
      `Verify ${service} dependencies and upstream/downstream services`,
      `Review recent deployments to ${service}`
    );
  });

  // Add general troubleshooting steps
  runbook.steps.push(
    "Collect relevant logs and metrics",
    "Check for recent configuration changes",
    "Verify infrastructure health (CPU, memory, disk, network)",
    "Review monitoring dashboards for anomalies",
    "Document all findings in incident timeline"
  );

  return runbook;
}

function generateNextSteps(severity: string, affectedServices: string[]): string[] {
  const steps: string[] = [];

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

function generateCommunicationPlan(severity: string): any {
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

function calculateIncidentMetrics(incident: any): any {
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

function performFiveWhysAnalysis(findings: string[]): any {
  // Simplified 5 whys analysis
  const whys: any[] = [];
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

function generateWhyAnswer(question: string, level: number): string {
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

function analyzeIncidentImpact(incident: any): any {
  return {
    services: incident.affectedServices,
    estimatedUsersAffected: "Unknown",
    businessImpact: incident.severity === "critical" ? "High" : "Medium",
    reputationalImpact: incident.severity === "critical" ? "Significant" : "Minor",
    financialImpact: "To be determined"
  };
}

function generateRCARecommendations(findings: string[], factors: string[]): string[] {
  const recommendations: string[] = [];

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
  recommendations.push(
    "Conduct regular incident response drills",
    "Review and update runbooks quarterly",
    "Implement chaos engineering practices"
  );

  return recommendations;
}

function generateActionItems(rca: any): any[] {
  return rca.preventiveMeasures.map((measure: string, index: number) => ({
    id: `RCA-${index + 1}`,
    action: measure,
    type: "preventive",
    priority: index === 0 ? "high" : "medium",
    estimatedEffort: "To be determined"
  }));
}

function generatePreventionPlan(rca: any): any {
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

function calculateDuration(incident: any): string {
  if (!incident.metrics.resolutionTime) {
    return "Ongoing";
  }
  
  const duration = new Date(incident.metrics.resolutionTime).getTime() - 
                  new Date(incident.metrics.detectionTime).getTime();
  const hours = Math.floor(duration / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  return `${hours}h ${minutes}m`;
}

function formatTimelineForPostMortem(timeline: any[]): any[] {
  return timeline.map(entry => ({
    time: new Date(entry.timestamp).toLocaleString(),
    action: entry.action,
    details: entry.details,
    actor: entry.actor
  }));
}

function generatePostMortemRecommendations(incident: any, lessons: string[]): string[] {
  const recommendations: string[] = [];

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

function generatePostMortemMarkdown(postMortem: any): string {
  return `# Post-Mortem: ${postMortem.incident.title}

## Incident Summary
- **ID**: ${postMortem.incident.id}
- **Severity**: ${postMortem.incident.severity}
- **Duration**: ${postMortem.incident.duration}
- **Date**: ${new Date(postMortem.generatedAt).toLocaleDateString()}

## Impact
${postMortem.incident.impact}

## Timeline
${postMortem.timeline.map((entry: any) => `- **${entry.time}**: ${entry.action} - ${entry.details}`).join('\n')}

## Root Cause Analysis
${postMortem.rootCause ? formatRootCause(postMortem.rootCause) : 'Not yet determined'}

## Lessons Learned
${postMortem.lessonsLearned.map((lesson: string) => `- ${lesson}`).join('\n')}

## Action Items
${postMortem.actionItems.map((item: any) => `- [ ] **${item.id}**: ${item.description} (Owner: ${item.owner}, Due: ${item.dueDate})`).join('\n')}

## Recommendations
${postMortem.recommendations.map((rec: string) => `- ${rec}`).join('\n')}
`;
}

function formatRootCause(rca: any): string {
  return `
### Findings
${rca.findings.map((f: string) => `- ${f}`).join('\n')}

### Contributing Factors
${rca.contributingFactors.map((f: string) => `- ${f}`).join('\n')}

### Preventive Measures
${rca.preventiveMeasures.map((m: string) => `- ${m}`).join('\n')}
`;
}

function generateExecutiveSummary(postMortem: any): string {
  return `Incident ${postMortem.incident.id} (${postMortem.incident.severity}) lasted ${postMortem.incident.duration}. ` +
         `${postMortem.actionItems.length} action items identified. Key focus areas: ${postMortem.recommendations.slice(0, 2).join(', ')}.`;
}

function groupAlertsByService(alerts: any[]): any {
  return alerts.reduce((groups, alert) => {
    if (!groups[alert.service]) {
      groups[alert.service] = [];
    }
    groups[alert.service].push(alert);
    return groups;
  }, {});
}

function groupAlertsByTimeWindow(alerts: any[], windowSeconds: number): any[] {
  const windows: any[][] = [];
  const sorted = alerts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  let currentWindow: any[] = [];
  let windowStart = sorted[0] ? new Date(sorted[0].timestamp).getTime() : 0;
  
  sorted.forEach(alert => {
    const alertTime = new Date(alert.timestamp).getTime();
    if (alertTime - windowStart <= windowSeconds * 1000) {
      currentWindow.push(alert);
    } else {
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

function groupAlertsBySimilarity(alerts: any[]): any {
  // Simple similarity grouping by message content
  const groups: any = {};
  
  alerts.forEach(alert => {
    const key = alert.message.toLowerCase().replace(/[0-9]/g, 'N').slice(0, 50);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(alert);
  });
  
  return groups;
}

function groupAlertsByHost(alerts: any[]): any {
  return alerts.reduce((groups, alert) => {
    const host = alert.host || 'unknown';
    if (!groups[host]) {
      groups[host] = [];
    }
    groups[host].push(alert);
    return groups;
  }, {});
}

function identifyAlertPatterns(correlations: any): any {
  const patterns = {
    rootCauses: [] as string[],
    noisy: [] as string[],
    actionable: [] as string[]
  };

  // Identify potential root causes
  Object.entries(correlations.byService).forEach(([service, alerts]: [string, any]) => {
    if (alerts.length > 5) {
      patterns.rootCauses.push(`High alert volume from ${service} service`);
    }
  });

  // Identify noisy alerts
  Object.entries(correlations.byError).forEach(([error, alerts]: [string, any]) => {
    if (alerts.length > 10) {
      patterns.noisy.push(error);
    }
  });

  // Identify actionable alerts
  correlations.byTime.forEach((window: any[]) => {
    if (window.length > 3) {
      patterns.actionable.push(`Alert storm detected at ${new Date(window[0].timestamp).toLocaleString()}`);
    }
  });

  return patterns;
}

function generateAlertRecommendations(patterns: any): string[] {
  const recommendations: string[] = [];

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

export const incidentTools = [
  createIncidentResponse,
  updateIncidentTimeline,
  performRootCauseAnalysis,
  generatePostMortem,
  correlateAlerts
]; 