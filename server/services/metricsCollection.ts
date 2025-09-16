import { storage } from "../storage";
import { AIIncidentDetectionService } from "./aiIncidentDetection";
import {
  InsertTimeSeriesMetric,
  InsertPerformanceMetric,
  InsertApmTransaction,
  InsertDatabasePerformanceMetric,
  InsertRumMetric,
} from "@shared/schema";

interface SystemMetrics {
  cpu: number;
  memory: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  activeConnections: number;
  responseTime: number;
}

interface ApiMetrics {
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userId?: string;
  timestamp: Date;
}

interface DatabaseMetrics {
  queryType: string;
  executionTime: number;
  rowsAffected: number;
  rowsExamined: number;
  indexesUsed: string[];
  isSlowQuery: boolean;
  query: string;
  timestamp: Date;
}

export class MetricsCollectionService {
  private aiDetectionService: AIIncidentDetectionService;
  private metricsBuffer: Map<string, any[]> = new Map();
  private collectionInterval: NodeJS.Timeout | null = null;
  private isCollecting = false;
  
  constructor() {
    this.aiDetectionService = new AIIncidentDetectionService();
    this.initializeMetricsCollection();
  }

  // =====================================================
  // Core Metrics Collection
  // =====================================================

  /**
   * Initialize metrics collection with configurable intervals
   */
  private initializeMetricsCollection(): void {
    console.log('Initializing metrics collection service...');
    
    // Start system metrics collection every 30 seconds
    this.collectionInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Start buffer flush every 60 seconds
    setInterval(() => {
      this.flushMetricsBuffer();
    }, 60000);

    this.isCollecting = true;
    console.log('Metrics collection service started');
  }

  /**
   * Collect system-level performance metrics
   */
  async collectSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      const timestamp = new Date();

      // Store different metric types
      const metricTypes = [
        { name: 'cpu_usage', value: metrics.cpu, unit: 'percentage' },
        { name: 'memory_usage', value: metrics.memory, unit: 'percentage' },
        { name: 'disk_usage', value: metrics.diskUsage, unit: 'percentage' },
        { name: 'network_in', value: metrics.networkIn, unit: 'bytes/sec' },
        { name: 'network_out', value: metrics.networkOut, unit: 'bytes/sec' },
        { name: 'active_connections', value: metrics.activeConnections, unit: 'count' },
        { name: 'response_time', value: metrics.responseTime, unit: 'milliseconds' }
      ];

      for (const metric of metricTypes) {
        // Store time series metric
        await this.storeTimeSeriesMetric('system', metric.name, metric.value, metric.unit, timestamp);
        
        // Check for anomalies using AI detection
        await this.checkForAnomalies('system', metric.name, metric.value, timestamp);
      }

      console.log(`Collected system metrics: CPU ${metrics.cpu}%, Memory ${metrics.memory}%`);

    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  }

  /**
   * Track API endpoint performance
   */
  async trackApiMetrics(apiMetrics: ApiMetrics): Promise<void> {
    try {
      const timestamp = apiMetrics.timestamp || new Date();

      // Store APM transaction
      await storage.createApmTransaction({
        projectId: 'system', // Could be passed as parameter for multi-project support
        traceId: this.generateTraceId(),
        spanId: this.generateSpanId(),
        transactionName: `${apiMetrics.method} ${apiMetrics.endpoint}`,
        serviceName: 'careerate-api',
        operationType: 'http-request',
        startTime: timestamp,
        endTime: new Date(timestamp.getTime() + apiMetrics.responseTime),
        duration: apiMetrics.responseTime,
        status: apiMetrics.statusCode < 400 ? 'success' : 'error',
        statusCode: apiMetrics.statusCode,
        userId: apiMetrics.userId,
        tags: {
          endpoint: apiMetrics.endpoint,
          method: apiMetrics.method,
          requestSize: apiMetrics.requestSize,
          responseSize: apiMetrics.responseSize
        },
        metadata: {
          collectTime: new Date(),
          source: 'metrics-collection-service'
        }
      });

      // Store performance metric
      await storage.createPerformanceMetric({
        projectId: 'system',
        metricType: 'api_response_time',
        metricName: `${apiMetrics.method}_${apiMetrics.endpoint.replace(/\//g, '_')}`,
        value: apiMetrics.responseTime.toString(),
        unit: 'milliseconds',
        tags: {
          endpoint: apiMetrics.endpoint,
          method: apiMetrics.method,
          statusCode: apiMetrics.statusCode.toString()
        },
        metadata: {
          requestSize: apiMetrics.requestSize,
          responseSize: apiMetrics.responseSize,
          userId: apiMetrics.userId
        }
      });

      // Check for API performance anomalies
      await this.checkForAnomalies('system', `api_response_time_${apiMetrics.endpoint}`, apiMetrics.responseTime, timestamp);

      // Check for error rate anomalies
      if (apiMetrics.statusCode >= 400) {
        await this.trackErrorMetric(apiMetrics.endpoint, apiMetrics.statusCode, timestamp);
      }

    } catch (error) {
      console.error('Error tracking API metrics:', error);
    }
  }

  /**
   * Track database performance metrics
   */
  async trackDatabaseMetrics(dbMetrics: DatabaseMetrics): Promise<void> {
    try {
      const timestamp = dbMetrics.timestamp || new Date();

      // Store database performance metric
      await storage.createDatabasePerformanceMetric({
        projectId: 'system',
        databaseType: 'postgresql',
        instanceId: 'primary',
        queryHash: this.hashQuery(dbMetrics.query),
        query: dbMetrics.query.length > 1000 ? dbMetrics.query.substring(0, 1000) + '...' : dbMetrics.query,
        executionTime: dbMetrics.executionTime,
        rowsAffected: dbMetrics.rowsAffected,
        rowsExamined: dbMetrics.rowsExamined,
        indexesUsed: dbMetrics.indexesUsed,
        isSlowQuery: dbMetrics.isSlowQuery,
        frequency: 1,
        timestamp,
        metadata: {
          queryType: dbMetrics.queryType,
          collectTime: new Date()
        }
      });

      // Check for database performance anomalies
      await this.checkForAnomalies('system', 'database_execution_time', dbMetrics.executionTime, timestamp);

      // Alert on slow queries
      if (dbMetrics.isSlowQuery) {
        await this.handleSlowQuery(dbMetrics);
      }

    } catch (error) {
      console.error('Error tracking database metrics:', error);
    }
  }

  /**
   * Track Real User Monitoring (RUM) metrics
   */
  async trackRumMetrics(rumData: any): Promise<void> {
    try {
      await storage.createRumMetric({
        projectId: rumData.projectId || 'system',
        sessionId: rumData.sessionId,
        pageUrl: rumData.pageUrl,
        userAgent: rumData.userAgent,
        deviceType: this.detectDeviceType(rumData.userAgent),
        browserName: this.detectBrowser(rumData.userAgent),
        browserVersion: rumData.browserVersion || 'unknown',
        connectionType: rumData.connectionType || 'unknown',
        country: rumData.country || 'unknown',
        region: rumData.region || 'unknown',
        firstContentfulPaint: rumData.metrics.fcp,
        largestContentfulPaint: rumData.metrics.lcp,
        firstInputDelay: rumData.metrics.fid,
        cumulativeLayoutShift: rumData.metrics.cls,
        timeToInteractive: rumData.metrics.tti,
        domContentLoaded: rumData.metrics.domContentLoaded,
        pageLoadTime: rumData.metrics.pageLoadTime,
        errorCount: rumData.errors?.length || 0,
        jsErrorMessages: rumData.errors || [],
        performanceEntries: rumData.performanceEntries || {},
        customMetrics: rumData.customMetrics || {},
        userId: rumData.userId,
        timestamp: new Date(rumData.timestamp)
      });

      // Check for performance anomalies in user experience metrics
      const coreWebVitals = ['fcp', 'lcp', 'fid', 'cls', 'tti'];
      for (const vital of coreWebVitals) {
        if (rumData.metrics[vital] !== undefined) {
          await this.checkForAnomalies('system', `rum_${vital}`, rumData.metrics[vital], new Date());
        }
      }

    } catch (error) {
      console.error('Error tracking RUM metrics:', error);
    }
  }

  // =====================================================
  // Metrics Processing and Analysis
  // =====================================================

  /**
   * Store time series metric and trigger anomaly detection
   */
  private async storeTimeSeriesMetric(
    projectId: string,
    metricName: string,
    value: number,
    unit: string,
    timestamp: Date
  ): Promise<void> {
    try {
      // Store time series metric
      await storage.createTimeSeriesMetric({
        projectId,
        resourceId: 'system',
        metricName,
        metricType: 'gauge',
        value,
        unit,
        dimensions: { source: 'metrics-collection-service' },
        tags: ['system', 'real-time'],
        aggregation: 'average',
        timeWindow: '1m',
        timestamp
      });

      // Add to buffer for batch processing
      const bufferKey = `${projectId}_${metricName}`;
      if (!this.metricsBuffer.has(bufferKey)) {
        this.metricsBuffer.set(bufferKey, []);
      }
      this.metricsBuffer.get(bufferKey)!.push({ value, timestamp });

    } catch (error) {
      console.error('Error storing time series metric:', error);
    }
  }

  /**
   * Check for anomalies using AI detection service
   */
  private async checkForAnomalies(
    projectId: string,
    metricName: string,
    value: number,
    timestamp: Date
  ): Promise<void> {
    try {
      const anomalyResult = await this.aiDetectionService.detectAnomalies(
        projectId,
        metricName,
        value,
        timestamp
      );

      if (anomalyResult) {
        console.log(`🚨 Anomaly detected in ${metricName}:`, {
          type: anomalyResult.anomalyType,
          severity: anomalyResult.severity,
          confidence: anomalyResult.confidence
        });

        // Create intelligent alert if anomaly is significant
        if (anomalyResult.severity === 'high' || anomalyResult.severity === 'critical') {
          await this.aiDetectionService.createIntelligentAlert(
            anomalyResult as any,
            {
              projectId,
              metricName,
              currentValue: value,
              expectedValue: anomalyResult.context?.mean || 0,
              deviation: Math.abs(value - (anomalyResult.context?.mean || 0)),
              relatedMetrics: [],
              historicalData: [],
              systemState: {}
            }
          );
        }
      }

    } catch (error) {
      console.error('Error checking for anomalies:', error);
    }
  }

  /**
   * Track error metrics and patterns
   */
  private async trackErrorMetric(endpoint: string, statusCode: number, timestamp: Date): Promise<void> {
    try {
      // Store error metric
      await this.storeTimeSeriesMetric('system', `error_rate_${endpoint}`, 1, 'count', timestamp);
      
      // Check for error rate anomalies
      await this.checkForAnomalies('system', `error_rate_${endpoint}`, 1, timestamp);

    } catch (error) {
      console.error('Error tracking error metric:', error);
    }
  }

  /**
   * Handle slow query alerts
   */
  private async handleSlowQuery(dbMetrics: DatabaseMetrics): Promise<void> {
    try {
      console.log(`⚠️ Slow query detected: ${dbMetrics.executionTime}ms`);
      
      // Store as anomaly
      await this.checkForAnomalies('system', 'slow_query_detection', dbMetrics.executionTime, new Date());

    } catch (error) {
      console.error('Error handling slow query:', error);
    }
  }

  // =====================================================
  // System Metrics Collection
  // =====================================================

  /**
   * Get actual system metrics (simulated for demo)
   */
  private async getSystemMetrics(): Promise<SystemMetrics> {
    // In a real implementation, this would gather actual system metrics
    // using libraries like pidusage, systeminformation, or node-os-utils
    
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkIn: Math.random() * 1000000,
      networkOut: Math.random() * 1000000,
      activeConnections: Math.floor(Math.random() * 1000),
      responseTime: Math.random() * 500 + 50
    };
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  /**
   * Flush metrics buffer to storage
   */
  private async flushMetricsBuffer(): Promise<void> {
    try {
      for (const [key, metrics] of this.metricsBuffer.entries()) {
        if (metrics.length > 0) {
          console.log(`Flushing ${metrics.length} metrics for ${key}`);
          // Process aggregated metrics here if needed
          this.metricsBuffer.set(key, []);
        }
      }
    } catch (error) {
      console.error('Error flushing metrics buffer:', error);
    }
  }

  /**
   * Generate trace ID for distributed tracing
   */
  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate span ID for distributed tracing
   */
  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  /**
   * Hash query for identification
   */
  private hashQuery(query: string): string {
    // Simple hash function - in production, use a proper hash algorithm
    let hash = 0;
    if (query.length === 0) return hash.toString();
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Detect device type from user agent
   */
  private detectDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  /**
   * Detect browser from user agent
   */
  private detectBrowser(userAgent: string): string {
    if (/chrome/i.test(userAgent)) return 'chrome';
    if (/firefox/i.test(userAgent)) return 'firefox';
    if (/safari/i.test(userAgent)) return 'safari';
    if (/edge/i.test(userAgent)) return 'edge';
    return 'unknown';
  }

  // =====================================================
  // Service Management
  // =====================================================

  /**
   * Start metrics collection
   */
  start(): void {
    if (!this.isCollecting) {
      this.initializeMetricsCollection();
    }
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    this.isCollecting = false;
    console.log('Metrics collection service stopped');
  }

  /**
   * Get collection status
   */
  getStatus(): { isCollecting: boolean; bufferSize: number } {
    let totalBufferSize = 0;
    for (const metrics of this.metricsBuffer.values()) {
      totalBufferSize += metrics.length;
    }

    return {
      isCollecting: this.isCollecting,
      bufferSize: totalBufferSize
    };
  }
}

// Export singleton instance
export const metricsCollectionService = new MetricsCollectionService();