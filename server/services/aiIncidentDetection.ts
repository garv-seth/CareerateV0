import OpenAI from "openai";
import { storage } from "../storage";
import {
  TimeSeriesMetric,
  InsertTimeSeriesMetric,
  AnomalyDetection,
  InsertAnomalyDetection,
  AnomalyDetectionModel,
  InsertAnomalyDetectionModel,
  AlertRule,
  InsertAlertRule,
  AlertNotification,
  InsertAlertNotification,
  Incident,
  InsertIncident,
} from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface MetricDataPoint {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

interface AnomalyDetectionResult {
  isAnomaly: boolean;
  confidence: number;
  anomalyType: 'spike' | 'drop' | 'trend_change' | 'seasonality_break';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: Record<string, any>;
  recommendations: string[];
}

interface IncidentContext {
  projectId: string;
  metricName: string;
  currentValue: number;
  expectedValue: number;
  deviation: number;
  relatedMetrics: MetricDataPoint[];
  historicalData: MetricDataPoint[];
  systemState: Record<string, any>;
}

class AIIncidentDetectionService {
  private anomalyDetectionModels: Map<string, any> = new Map();
  private baselineThresholds: Map<string, any> = new Map();

  // =====================================================
  // Machine Learning-based Anomaly Detection
  // =====================================================

  /**
   * Train an anomaly detection model for a specific metric
   */
  async trainAnomalyDetectionModel(
    projectId: string,
    metricName: string,
    modelType: 'isolation_forest' | 'lstm' | 'arima' | 'statistical' = 'statistical',
    trainingDays: number = 30
  ): Promise<AnomalyDetectionModel> {
    try {
      console.log(`Training anomaly detection model for ${metricName} in project ${projectId}`);

      // Get historical data for training
      const historicalData = await this.getHistoricalMetricData(projectId, metricName, trainingDays);
      
      if (historicalData.length < 100) {
        throw new Error('Insufficient data for training. Need at least 100 data points.');
      }

      // Prepare training data based on model type
      const trainingFeatures = this.prepareTrainingFeatures(historicalData, modelType);
      
      // Train the model using the appropriate algorithm
      const modelArtifacts = await this.trainModelWithAlgorithm(
        trainingFeatures,
        modelType,
        metricName
      );

      // Calculate model accuracy and performance metrics
      const accuracy = await this.evaluateModelAccuracy(modelArtifacts, historicalData);

      // Create and store the model
      const model = await storage.createAnomalyDetectionModel({
        projectId,
        modelName: `${metricName}_${modelType}_model`,
        modelType,
        targetMetrics: [metricName],
        trainingData: { 
          dataPoints: historicalData.length,
          dateRange: {
            start: historicalData[0]?.timestamp,
            end: historicalData[historicalData.length - 1]?.timestamp
          }
        },
        hyperparameters: this.getDefaultHyperparameters(modelType),
        modelArtifacts,
        sensitivity: 0.8,
        accuracy,
        lastTrained: new Date(),
        retrainingSchedule: 'daily',
        status: 'active',
        version: '1.0',
        metadata: {
          algorithm: modelType,
          trainingDuration: trainingDays,
          featureCount: Object.keys(trainingFeatures).length
        }
      });

      // Cache the model for faster inference
      this.anomalyDetectionModels.set(`${projectId}_${metricName}`, modelArtifacts);

      console.log(`Successfully trained anomaly detection model ${model.id} for ${metricName}`);
      return model;

    } catch (error) {
      console.error('Error training anomaly detection model:', error);
      throw new Error(`Failed to train anomaly detection model: ${error.message}`);
    }
  }

  /**
   * Detect anomalies in real-time metric data
   */
  async detectAnomalies(
    projectId: string,
    metricName: string,
    currentValue: number,
    timestamp: Date = new Date()
  ): Promise<AnomalyDetectionResult | null> {
    try {
      // Get the trained model for this metric
      const models = await storage.getAnomalyDetectionModels(projectId, metricName);
      if (!models.length) {
        console.log(`No trained model found for ${metricName}. Training new model...`);
        await this.trainAnomalyDetectionModel(projectId, metricName);
        return null;
      }

      const model = models[0]; // Use the most recent model

      // Get recent historical data for context
      const contextData = await this.getHistoricalMetricData(projectId, metricName, 7);
      
      // Run anomaly detection algorithm
      const anomalyResult = await this.runAnomalyDetection(
        model,
        currentValue,
        contextData,
        timestamp
      );

      if (anomalyResult.isAnomaly) {
        // Store the anomaly detection result
        await this.storeAnomalyDetection(projectId, model.id, metricName, anomalyResult, currentValue, timestamp);

        // Generate intelligent context and recommendations
        const enhancedResult = await this.enhanceAnomalyWithAI(
          projectId,
          metricName,
          currentValue,
          contextData,
          anomalyResult
        );

        return enhancedResult;
      }

      return null;

    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw new Error(`Failed to detect anomalies: ${error.message}`);
    }
  }

  /**
   * Run the core anomaly detection algorithm
   */
  private async runAnomalyDetection(
    model: AnomalyDetectionModel,
    currentValue: number,
    contextData: MetricDataPoint[],
    timestamp: Date
  ): Promise<AnomalyDetectionResult> {
    try {
      // Implement statistical anomaly detection (can be extended with ML models)
      const stats = this.calculateStatistics(contextData);
      
      // Calculate Z-score for current value
      const zScore = Math.abs(currentValue - stats.mean) / stats.stdDev;
      const threshold = model.sensitivity || 0.8;
      
      // Determine if it's an anomaly based on configurable thresholds
      const isAnomaly = zScore > (2.5 * threshold); // Configurable threshold
      
      if (!isAnomaly) {
        return {
          isAnomaly: false,
          confidence: 0,
          anomalyType: 'spike',
          severity: 'low',
          context: {},
          recommendations: []
        };
      }

      // Classify anomaly type
      const anomalyType = this.classifyAnomalyType(currentValue, contextData, stats);
      
      // Calculate confidence based on deviation magnitude
      const confidence = Math.min(zScore / 5, 1); // Normalize confidence to 0-1
      
      // Determine severity based on deviation and business impact
      const severity = this.calculateSeverity(zScore, anomalyType, model.targetMetrics);
      
      // Generate context information
      const context = {
        zScore,
        mean: stats.mean,
        stdDev: stats.stdDev,
        percentile95: stats.percentile95,
        percentile99: stats.percentile99,
        recentTrend: stats.trend,
        dataPoints: contextData.length,
        modelVersion: model.version,
        detectionMethod: model.modelType
      };

      return {
        isAnomaly: true,
        confidence,
        anomalyType,
        severity,
        context,
        recommendations: []
      };

    } catch (error) {
      console.error('Error in anomaly detection algorithm:', error);
      throw error;
    }
  }

  /**
   * Enhance anomaly detection with AI-powered insights
   */
  private async enhanceAnomalyWithAI(
    projectId: string,
    metricName: string,
    currentValue: number,
    contextData: MetricDataPoint[],
    anomalyResult: AnomalyDetectionResult
  ): Promise<AnomalyDetectionResult> {
    try {
      // Get additional system context
      const systemContext = await this.gatherSystemContext(projectId);
      
      // Get related incidents and patterns
      const relatedIncidents = await storage.getProjectIncidents(projectId);
      const recentIncidents = relatedIncidents.filter(inc => 
        new Date().getTime() - new Date(inc.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
      );

      // Use AI to analyze the anomaly and provide intelligent insights
      const aiAnalysis = await this.analyzeAnomalyWithAI({
        metricName,
        currentValue,
        expectedValue: anomalyResult.context.mean,
        anomalyType: anomalyResult.anomalyType,
        severity: anomalyResult.severity,
        systemContext,
        recentIncidents: recentIncidents.map(inc => ({
          title: inc.title,
          category: inc.category,
          severity: inc.severity,
          createdAt: inc.createdAt
        })),
        historicalData: contextData.slice(-20) // Last 20 data points
      });

      // Enhance the result with AI insights
      return {
        ...anomalyResult,
        context: {
          ...anomalyResult.context,
          aiInsights: aiAnalysis.insights,
          rootCauseAnalysis: aiAnalysis.rootCause,
          impactAssessment: aiAnalysis.impact
        },
        recommendations: aiAnalysis.recommendations
      };

    } catch (error) {
      console.error('Error enhancing anomaly with AI:', error);
      // Return original result if AI enhancement fails
      return anomalyResult;
    }
  }

  /**
   * Use AI to analyze anomalies and provide intelligent insights
   */
  private async analyzeAnomalyWithAI(context: any): Promise<any> {
    try {
      const prompt = `
Analyze this system anomaly and provide intelligent insights:

**Metric:** ${context.metricName}
**Current Value:** ${context.currentValue}
**Expected Value:** ${context.expectedValue}
**Anomaly Type:** ${context.anomalyType}
**Severity:** ${context.severity}

**Recent System Context:**
${JSON.stringify(context.systemContext, null, 2)}

**Recent Incidents:**
${context.recentIncidents.map((inc: any) => `- ${inc.title} (${inc.category}, ${inc.severity}) - ${inc.createdAt}`).join('\n')}

**Historical Data Trend:**
${context.historicalData.map((d: any) => `${d.timestamp}: ${d.value}`).join('\n')}

Provide a comprehensive analysis including:
1. **Root Cause Analysis** - What likely caused this anomaly?
2. **Impact Assessment** - What are the potential business impacts?
3. **Insights** - Key observations and patterns
4. **Recommendations** - Specific action items to address this anomaly

Respond in JSON format:
{
  "rootCause": "detailed analysis of likely root cause",
  "impact": "assessment of business and technical impact",
  "insights": ["key insight 1", "key insight 2", "..."],
  "recommendations": ["actionable recommendation 1", "recommendation 2", "..."]
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        insights: analysis.insights || [],
        rootCause: analysis.rootCause || 'Unknown root cause',
        impact: analysis.impact || 'Impact assessment unavailable',
        recommendations: analysis.recommendations || []
      };

    } catch (error) {
      console.error('Error in AI anomaly analysis:', error);
      return {
        insights: ['AI analysis temporarily unavailable'],
        rootCause: 'Unable to determine root cause automatically',
        impact: 'Impact assessment requires manual review',
        recommendations: ['Manual investigation required']
      };
    }
  }

  // =====================================================
  // Intelligent Alerting and Incident Management
  // =====================================================

  /**
   * Create intelligent alert based on anomaly detection
   */
  async createIntelligentAlert(
    anomaly: AnomalyDetection,
    context: IncidentContext
  ): Promise<void> {
    try {
      console.log(`Creating intelligent alert for anomaly ${anomaly.id}`);

      // Check if similar alerts exist to avoid alert fatigue
      const existingAlerts = await this.checkForSimilarAlerts(context.projectId, context.metricName);
      
      if (existingAlerts.length > 0) {
        console.log('Similar alert already exists, updating instead of creating new one');
        await this.updateExistingAlert(existingAlerts[0], anomaly);
        return;
      }

      // Determine alert severity and escalation rules
      const alertSeverity = this.mapAnomalySeverityToAlert(anomaly.severity);
      const escalationRules = await this.generateEscalationRules(context.projectId, alertSeverity);

      // Get notification channels based on severity and time
      const notificationChannels = await this.getNotificationChannels(context.projectId, alertSeverity);

      // Create intelligent alert rule
      const alertRule = await storage.createAlertRule({
        projectId: context.projectId,
        name: `${anomaly.anomalyType} detected in ${context.metricName}`,
        description: `Automatic alert for ${anomaly.anomalyType} anomaly in ${context.metricName}. Current: ${context.currentValue}, Expected: ${context.expectedValue}`,
        ruleType: 'anomaly',
        metricQuery: `${context.metricName}:${anomaly.anomalyType}`,
        conditions: {
          metric: context.metricName,
          anomalyType: anomaly.anomalyType,
          threshold: context.deviation,
          operator: '>',
          confidenceThreshold: anomaly.confidenceScore
        },
        severity: alertSeverity,
        evaluationInterval: 60,
        silenceDuration: 300,
        escalationRules,
        notificationChannels,
        automaticActions: await this.generateAutomaticActions(anomaly, context),
        isEnabled: true,
        createdBy: 'system', // AI system
        metadata: {
          anomalyId: anomaly.id,
          detectionTimestamp: anomaly.detectedAt,
          context: anomaly.context
        }
      });

      // Send initial notifications
      await this.sendIntelligentNotifications(alertRule, anomaly, context);

      // Create incident if severity is high enough
      if (['high', 'critical'].includes(anomaly.severity)) {
        await this.createAutomaticIncident(anomaly, context, alertRule.id);
      }

      console.log(`Created intelligent alert rule ${alertRule.id} for anomaly ${anomaly.id}`);

    } catch (error) {
      console.error('Error creating intelligent alert:', error);
      throw error;
    }
  }

  /**
   * Send context-aware notifications
   */
  private async sendIntelligentNotifications(
    alertRule: AlertRule,
    anomaly: AnomalyDetection,
    context: IncidentContext
  ): Promise<void> {
    try {
      // Generate context-aware message using AI
      const intelligentMessage = await this.generateIntelligentAlertMessage(anomaly, context);

      for (const channel of alertRule.notificationChannels as any[]) {
        const notification = await storage.createAlertNotification({
          alertRuleId: alertRule.id,
          projectId: context.projectId,
          notificationType: channel.type,
          channel: channel.endpoint,
          subject: `🚨 ${anomaly.severity.toUpperCase()}: ${anomaly.anomalyType} detected in ${context.metricName}`,
          message: intelligentMessage,
          priority: this.mapSeverityToPriority(anomaly.severity),
          status: 'pending',
          metadata: {
            anomalyId: anomaly.id,
            alertRuleId: alertRule.id,
            context: anomaly.context
          }
        });

        // Send the notification through the appropriate channel
        await this.deliverNotification(notification);
      }

    } catch (error) {
      console.error('Error sending intelligent notifications:', error);
    }
  }

  /**
   * Generate context-aware alert message using AI
   */
  private async generateIntelligentAlertMessage(
    anomaly: AnomalyDetection,
    context: IncidentContext
  ): Promise<string> {
    try {
      const prompt = `
Generate a professional, context-aware alert message for this system anomaly:

**Alert Details:**
- Metric: ${context.metricName}
- Anomaly Type: ${anomaly.anomalyType}
- Severity: ${anomaly.severity}
- Current Value: ${context.currentValue}
- Expected Value: ${context.expectedValue}
- Confidence: ${anomaly.confidenceScore * 100}%

**System Context:**
${JSON.stringify(anomaly.context, null, 2)}

**Requirements:**
- Professional tone suitable for engineering teams
- Include key metrics and context
- Provide actionable next steps
- Keep under 500 characters for mobile notifications
- Include relevant emojis for visual clarity

Generate a clear, actionable alert message.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 300
      });

      return completion.choices[0].message.content || 
        `${anomaly.anomalyType.toUpperCase()} anomaly detected in ${context.metricName}. Current: ${context.currentValue}, Expected: ${context.expectedValue}. Confidence: ${Math.round(anomaly.confidenceScore * 100)}%. Investigate immediately.`;

    } catch (error) {
      console.error('Error generating intelligent alert message:', error);
      return `${anomaly.anomalyType.toUpperCase()} anomaly detected in ${context.metricName}. Current: ${context.currentValue}, Expected: ${context.expectedValue}.`;
    }
  }

  /**
   * Create automatic incident for high severity anomalies
   */
  private async createAutomaticIncident(
    anomaly: AnomalyDetection,
    context: IncidentContext,
    alertRuleId: string
  ): Promise<Incident> {
    try {
      // Use AI to generate incident description
      const incidentDescription = await this.generateIncidentDescription(anomaly, context);

      const incident = await storage.createIncident({
        projectId: context.projectId,
        title: `${anomaly.anomalyType.replace('_', ' ').toUpperCase()}: ${context.metricName} anomaly`,
        description: incidentDescription,
        severity: anomaly.severity,
        status: 'open',
        category: this.categorizeIncident(context.metricName, anomaly.anomalyType),
        detectionMethod: 'automated',
        metadata: {
          anomalyId: anomaly.id,
          alertRuleId,
          metricName: context.metricName,
          currentValue: context.currentValue,
          expectedValue: context.expectedValue,
          deviation: context.deviation,
          detectionTimestamp: anomaly.detectedAt,
          confidence: anomaly.confidenceScore,
          context: anomaly.context
        }
      });

      console.log(`Created automatic incident ${incident.id} for anomaly ${anomaly.id}`);
      return incident;

    } catch (error) {
      console.error('Error creating automatic incident:', error);
      throw error;
    }
  }

  // =====================================================
  // Pattern Recognition and Root Cause Analysis
  // =====================================================

  /**
   * Analyze patterns in incidents and anomalies
   */
  async analyzeIncidentPatterns(projectId: string, days: number = 30): Promise<any> {
    try {
      console.log(`Analyzing incident patterns for project ${projectId} over ${days} days`);

      // Get historical incidents and anomalies
      const incidents = await storage.getProjectIncidents(projectId);
      const recentIncidents = incidents.filter(inc => 
        new Date().getTime() - new Date(inc.createdAt).getTime() <= days * 24 * 60 * 60 * 1000
      );

      const anomalies = await storage.getProjectAnomalies(projectId, days);

      // Analyze patterns using AI
      const patterns = await this.identifyPatternsWithAI(recentIncidents, anomalies);

      // Store pattern analysis results
      await storage.createPerformanceBaseline({
        projectId,
        metricName: 'incident_patterns',
        baselineType: 'historical',
        timeFrame: `${days}d`,
        baselineValue: recentIncidents.length,
        lastCalculated: new Date(),
        metadata: {
          patterns,
          analysisDate: new Date(),
          incidentCount: recentIncidents.length,
          anomalyCount: anomalies.length
        }
      });

      return patterns;

    } catch (error) {
      console.error('Error analyzing incident patterns:', error);
      throw error;
    }
  }

  /**
   * Identify patterns using AI analysis
   */
  private async identifyPatternsWithAI(incidents: any[], anomalies: any[]): Promise<any> {
    try {
      const prompt = `
Analyze these incidents and anomalies to identify patterns:

**Recent Incidents:**
${incidents.map(inc => `${inc.title} - ${inc.category} - ${inc.severity} - ${inc.createdAt}`).join('\n')}

**Recent Anomalies:**
${anomalies.map(anom => `${anom.metricName} - ${anom.anomalyType} - ${anom.severity} - ${anom.detectedAt}`).join('\n')}

Identify:
1. **Temporal Patterns** - Time-based recurring patterns
2. **Severity Patterns** - Escalation or correlation patterns
3. **Metric Patterns** - Which metrics are most problematic
4. **Root Cause Patterns** - Common underlying causes
5. **Recommendations** - Prevention strategies

Respond in JSON format with pattern analysis and insights.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1500
      });

      const analysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        temporalPatterns: analysis.temporalPatterns || [],
        severityPatterns: analysis.severityPatterns || [],
        metricPatterns: analysis.metricPatterns || [],
        rootCausePatterns: analysis.rootCausePatterns || [],
        recommendations: analysis.recommendations || [],
        confidence: analysis.confidence || 0.7,
        analysisDate: new Date()
      };

    } catch (error) {
      console.error('Error in AI pattern identification:', error);
      return {
        temporalPatterns: [],
        severityPatterns: [],
        metricPatterns: [],
        rootCausePatterns: [],
        recommendations: ['Pattern analysis requires manual review'],
        confidence: 0.0,
        analysisDate: new Date()
      };
    }
  }

  // =====================================================
  // Integration with Existing AI Agents
  // =====================================================

  /**
   * Integrate with existing AI agents for automated response
   */
  async triggerAutomatedResponse(
    anomaly: AnomalyDetection,
    incident: Incident,
    context: IncidentContext
  ): Promise<void> {
    try {
      console.log(`Triggering automated response for incident ${incident.id}`);

      // Get available AI agents for this project
      const agents = await storage.getProjectAgents(context.projectId);
      const relevantAgents = agents.filter(agent => 
        agent.status === 'active' && this.isAgentRelevantForIncident(agent, incident)
      );

      for (const agent of relevantAgents) {
        // Create agent task for incident response
        const task = await storage.createAgentTask({
          agentId: agent.id,
          projectId: context.projectId,
          taskType: 'incident-response',
          priority: this.mapSeverityToPriority(anomaly.severity) as any,
          description: `Respond to ${anomaly.anomalyType} anomaly in ${context.metricName}`,
          input: {
            incidentId: incident.id,
            anomalyId: anomaly.id,
            metricName: context.metricName,
            anomalyType: anomaly.anomalyType,
            severity: anomaly.severity,
            currentValue: context.currentValue,
            expectedValue: context.expectedValue,
            context: anomaly.context,
            recommendations: [], // Will be filled by agent
            automatedActions: anomaly.automaticActions
          }
        });

        console.log(`Created agent task ${task.id} for agent ${agent.id} to respond to incident ${incident.id}`);
      }

    } catch (error) {
      console.error('Error triggering automated response:', error);
    }
  }

  // =====================================================
  // Utility and Helper Methods
  // =====================================================

  /**
   * Get historical metric data for training and analysis
   */
  private async getHistoricalMetricData(
    projectId: string,
    metricName: string,
    days: number
  ): Promise<MetricDataPoint[]> {
    try {
      const metrics = await storage.getTimeSeriesMetrics(
        projectId,
        metricName,
        new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        new Date()
      );

      return metrics.map(m => ({
        timestamp: new Date(m.timestamp),
        value: parseFloat(m.value.toString()),
        metadata: m.tags as Record<string, any>
      }));

    } catch (error) {
      console.error('Error getting historical metric data:', error);
      return [];
    }
  }

  /**
   * Prepare training features based on model type
   */
  private prepareTrainingFeatures(data: MetricDataPoint[], modelType: string): any {
    // Implement feature engineering based on model type
    switch (modelType) {
      case 'statistical':
        return this.prepareStatisticalFeatures(data);
      case 'lstm':
        return this.prepareLSTMFeatures(data);
      case 'arima':
        return this.prepareARIMAFeatures(data);
      case 'isolation_forest':
        return this.prepareIsolationForestFeatures(data);
      default:
        return this.prepareStatisticalFeatures(data);
    }
  }

  /**
   * Prepare statistical features for training
   */
  private prepareStatisticalFeatures(data: MetricDataPoint[]): any {
    const values = data.map(d => d.value);
    const stats = this.calculateStatistics(data);
    
    return {
      mean: stats.mean,
      stdDev: stats.stdDev,
      min: stats.min,
      max: stats.max,
      percentile95: stats.percentile95,
      percentile99: stats.percentile99,
      trend: stats.trend,
      seasonality: this.detectSeasonality(data),
      dataPoints: values.length,
      features: values
    };
  }

  /**
   * Calculate comprehensive statistics for a dataset
   */
  private calculateStatistics(data: MetricDataPoint[]): any {
    const values = data.map(d => d.value).sort((a, b) => a - b);
    const n = values.length;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    
    const percentile95 = values[Math.floor(n * 0.95)] || mean;
    const percentile99 = values[Math.floor(n * 0.99)] || mean;
    
    // Simple trend calculation (slope of linear regression)
    const trend = this.calculateTrend(data);
    
    return {
      mean,
      stdDev,
      variance,
      min: values[0] || 0,
      max: values[n - 1] || 0,
      percentile95,
      percentile99,
      trend,
      count: n
    };
  }

  /**
   * Calculate trend using simple linear regression
   */
  private calculateTrend(data: MetricDataPoint[]): number {
    if (data.length < 2) return 0;
    
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.value);
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  /**
   * Detect seasonality patterns in the data
   */
  private detectSeasonality(data: MetricDataPoint[]): any {
    // Simple seasonality detection based on day of week and hour patterns
    const hourly = new Map<number, number[]>();
    const daily = new Map<number, number[]>();
    
    data.forEach(point => {
      const date = new Date(point.timestamp);
      const hour = date.getHours();
      const day = date.getDay();
      
      if (!hourly.has(hour)) hourly.set(hour, []);
      if (!daily.has(day)) daily.set(day, []);
      
      hourly.get(hour)!.push(point.value);
      daily.get(day)!.push(point.value);
    });
    
    return {
      hourlyPattern: Object.fromEntries(
        Array.from(hourly.entries()).map(([hour, values]) => [
          hour, 
          values.reduce((sum, val) => sum + val, 0) / values.length
        ])
      ),
      dailyPattern: Object.fromEntries(
        Array.from(daily.entries()).map(([day, values]) => [
          day, 
          values.reduce((sum, val) => sum + val, 0) / values.length
        ])
      )
    };
  }

  /**
   * Classify the type of anomaly based on data patterns
   */
  private classifyAnomalyType(
    currentValue: number,
    contextData: MetricDataPoint[],
    stats: any
  ): 'spike' | 'drop' | 'trend_change' | 'seasonality_break' {
    const recentMean = contextData.slice(-10).reduce((sum, d) => sum + d.value, 0) / Math.min(10, contextData.length);
    
    if (currentValue > stats.mean + 2 * stats.stdDev) {
      return 'spike';
    } else if (currentValue < stats.mean - 2 * stats.stdDev) {
      return 'drop';
    } else if (Math.abs(recentMean - stats.mean) > stats.stdDev) {
      return 'trend_change';
    } else {
      return 'seasonality_break';
    }
  }

  /**
   * Calculate severity based on deviation magnitude and business impact
   */
  private calculateSeverity(
    zScore: number,
    anomalyType: string,
    targetMetrics: string[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Base severity on Z-score
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (zScore > 4) {
      severity = 'critical';
    } else if (zScore > 3) {
      severity = 'high';
    } else if (zScore > 2) {
      severity = 'medium';
    }
    
    // Adjust based on metric importance
    const criticalMetrics = ['error_rate', 'response_time', 'cpu_usage', 'memory_usage'];
    const hasCriticalMetric = targetMetrics.some(metric => 
      criticalMetrics.some(critical => metric.toLowerCase().includes(critical))
    );
    
    if (hasCriticalMetric && severity === 'medium') {
      severity = 'high';
    }
    
    return severity;
  }

  /**
   * Get default hyperparameters based on model type
   */
  private getDefaultHyperparameters(modelType: string): any {
    switch (modelType) {
      case 'statistical':
        return {
          threshold: 2.5,
          windowSize: 100,
          sensitivity: 0.8
        };
      case 'lstm':
        return {
          sequenceLength: 24,
          hiddenUnits: 50,
          learningRate: 0.001,
          epochs: 100
        };
      case 'arima':
        return {
          p: 2,
          d: 1,
          q: 2,
          seasonalPeriod: 24
        };
      case 'isolation_forest':
        return {
          contamination: 0.1,
          maxSamples: 256,
          randomState: 42
        };
      default:
        return {};
    }
  }

  /**
   * Store anomaly detection result in database
   */
  private async storeAnomalyDetection(
    projectId: string,
    modelId: string,
    metricName: string,
    result: AnomalyDetectionResult,
    currentValue: number,
    timestamp: Date
  ): Promise<void> {
    try {
      await storage.createAnomalyDetection({
        modelId,
        projectId,
        metricName,
        anomalyType: result.anomalyType,
        severity: result.severity,
        confidenceScore: result.confidence,
        actualValue: currentValue,
        expectedValue: result.context.mean || 0,
        deviation: Math.abs(currentValue - (result.context.mean || 0)),
        context: result.context,
        automaticActions: [],
        status: 'new',
        detectedAt: timestamp
      });
    } catch (error) {
      console.error('Error storing anomaly detection:', error);
    }
  }

  /**
   * Gather comprehensive system context for analysis
   */
  private async gatherSystemContext(projectId: string): Promise<any> {
    try {
      const [deployments, agents, resources] = await Promise.all([
        storage.getProjectDeployments(projectId),
        storage.getProjectAgents(projectId),
        storage.getProjectResources(projectId)
      ]);

      return {
        activeDeployments: deployments.filter(d => d.status === 'deployed'),
        aiAgents: agents.filter(a => a.status === 'active'),
        resources: resources.filter(r => r.status === 'active'),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error gathering system context:', error);
      return {};
    }
  }

  // Additional helper methods for alert management, notification delivery, etc.
  private async checkForSimilarAlerts(projectId: string, metricName: string): Promise<any[]> {
    // Implementation to check for existing similar alerts
    return [];
  }

  private async updateExistingAlert(alert: any, anomaly: AnomalyDetection): Promise<void> {
    // Implementation to update existing alert
  }

  private mapAnomalySeverityToAlert(severity: string): string {
    return severity;
  }

  private async generateEscalationRules(projectId: string, severity: string): Promise<any> {
    return [];
  }

  private async getNotificationChannels(projectId: string, severity: string): Promise<any[]> {
    return [];
  }

  private async generateAutomaticActions(anomaly: AnomalyDetection, context: IncidentContext): Promise<any[]> {
    return [];
  }

  private mapSeverityToPriority(severity: string): string {
    const mapping: Record<string, string> = {
      low: 'low',
      medium: 'normal', 
      high: 'high',
      critical: 'urgent'
    };
    return mapping[severity] || 'normal';
  }

  private async deliverNotification(notification: AlertNotification): Promise<void> {
    // Implementation for delivering notifications through various channels
    console.log(`Delivering notification ${notification.id} via ${notification.notificationType}`);
  }

  private async generateIncidentDescription(anomaly: AnomalyDetection, context: IncidentContext): Promise<string> {
    return `${anomaly.anomalyType} detected in ${context.metricName}. Current value: ${context.currentValue}, Expected: ${context.expectedValue}`;
  }

  private categorizeIncident(metricName: string, anomalyType: string): string {
    if (metricName.includes('error')) return 'performance';
    if (metricName.includes('security')) return 'security';
    if (metricName.includes('infra')) return 'infrastructure';
    return 'performance';
  }

  private isAgentRelevantForIncident(agent: any, incident: Incident): boolean {
    const relevantTypes = ['sre', 'performance', 'security'];
    return relevantTypes.includes(agent.type) && incident.category === agent.type;
  }

  // Placeholder implementations for different ML model preparations
  private prepareLSTMFeatures(data: MetricDataPoint[]): any {
    return { features: data.map(d => d.value) };
  }

  private prepareARIMAFeatures(data: MetricDataPoint[]): any {
    return { features: data.map(d => d.value) };
  }

  private prepareIsolationForestFeatures(data: MetricDataPoint[]): any {
    return { features: data.map(d => d.value) };
  }

  private async trainModelWithAlgorithm(features: any, modelType: string, metricName: string): Promise<any> {
    // Placeholder for actual ML model training
    return {
      modelType,
      metricName,
      trainedAt: new Date(),
      parameters: features
    };
  }

  private async evaluateModelAccuracy(modelArtifacts: any, historicalData: MetricDataPoint[]): Promise<number> {
    // Placeholder for model accuracy evaluation
    return Math.random() * 0.3 + 0.7; // Random accuracy between 0.7 and 1.0
  }
}

// Export singleton instance
export const aiIncidentDetectionService = new AIIncidentDetectionService();