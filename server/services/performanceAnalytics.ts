import OpenAI from "openai";
import { storage } from "../storage";
import {
  ApmTransaction,
  InsertApmTransaction,
  DatabasePerformanceMetric,
  InsertDatabasePerformanceMetric,
  RumMetric,
  InsertRumMetric,
  TimeSeriesMetric,
  InsertTimeSeriesMetric,
  PerformanceBaseline,
  InsertPerformanceBaseline,
  LogEntry,
  InsertLogEntry,
} from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskIo: number;
  networkIo: number;
}

interface DatabaseOptimization {
  queryHash: string;
  query: string;
  currentPerformance: {
    executionTime: number;
    rowsExamined: number;
    frequency: number;
  };
  optimization: {
    suggestedIndexes: string[];
    queryRewrite: string;
    estimatedImprovement: number;
    implementation: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface BottleneckAnalysis {
  type: 'database' | 'api' | 'infrastructure' | 'external' | 'code';
  location: string;
  impact: number; // 0-1 scale
  description: string;
  rootCause: string;
  suggestions: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

interface CoreWebVitals {
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  timeToInteractive: number;
  score: number; // 0-100 performance score
  grade: 'poor' | 'needs-improvement' | 'good';
}

class PerformanceAnalyticsService {
  private performanceBaselines: Map<string, any> = new Map();
  private optimizationCache: Map<string, DatabaseOptimization[]> = new Map();

  // =====================================================
  // Real-time Application Performance Monitoring (APM)
  // =====================================================

  /**
   * Track application performance transaction
   */
  async trackTransaction(
    projectId: string,
    transactionData: {
      transactionName: string;
      serviceName: string;
      operationType: string;
      duration: number;
      status: string;
      statusCode?: number;
      errorMessage?: string;
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<ApmTransaction> {
    try {
      const transaction = await storage.createApmTransaction({
        projectId,
        traceId: this.generateTraceId(),
        spanId: this.generateSpanId(),
        transactionName: transactionData.transactionName,
        serviceName: transactionData.serviceName,
        operationType: transactionData.operationType,
        startTime: new Date(Date.now() - transactionData.duration),
        endTime: new Date(),
        duration: transactionData.duration,
        status: transactionData.status,
        statusCode: transactionData.statusCode,
        errorMessage: transactionData.errorMessage,
        userAgent: transactionData.userAgent,
        ipAddress: transactionData.ipAddress,
        userId: transactionData.userId,
        sessionId: this.generateSessionId(),
        tags: this.extractTags(transactionData.metadata || {}),
        metadata: transactionData.metadata || {}
      });

      // Analyze transaction performance in real-time
      await this.analyzeTransactionPerformance(transaction);

      // Update performance metrics
      await this.updatePerformanceMetrics(projectId, transaction);

      return transaction;

    } catch (error) {
      console.error('Error tracking transaction:', error);
      throw new Error(`Failed to track transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get real-time performance analytics dashboard data
   */
  async getPerformanceAnalytics(
    projectId: string,
    timeRange: '1h' | '1d' | '7d' | '30d' = '1h'
  ): Promise<any> {
    try {
      console.log(`Getting performance analytics for project ${projectId} over ${timeRange}`);

      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);

      // Get comprehensive performance data
      const [
        transactions,
        dbMetrics,
        rumMetrics,
        timeSeriesMetrics,
        baselines
      ] = await Promise.all([
        storage.getApmTransactions(projectId, startTime, now),
        storage.getDatabasePerformanceMetrics(projectId, startTime, now),
        storage.getRumMetrics(projectId, startTime, now),
        storage.getTimeSeriesMetrics(projectId, null, startTime, now),
        storage.getPerformanceBaselines(projectId)
      ]);

      // Calculate performance KPIs
      const performanceKpis = this.calculatePerformanceKpis(transactions, dbMetrics, rumMetrics);

      // Analyze trends and patterns
      const trendAnalysis = await this.analyzeTrends(timeSeriesMetrics, baselines);

      // Identify bottlenecks
      const bottlenecks = await this.identifyBottlenecks(transactions, dbMetrics, rumMetrics);

      // Generate AI-powered insights
      const aiInsights = await this.generatePerformanceInsights(
        performanceKpis,
        trendAnalysis,
        bottlenecks,
        timeRange
      );

      return {
        overview: {
          timeRange,
          dataPoints: transactions.length,
          lastUpdated: new Date(),
          summary: performanceKpis
        },
        performanceKpis,
        trendAnalysis,
        bottlenecks,
        insights: aiInsights,
        recommendations: await this.generatePerformanceRecommendations(bottlenecks, trendAnalysis),
        healthScore: this.calculateOverallHealthScore(performanceKpis, bottlenecks),
        alerts: await this.checkPerformanceAlerts(projectId, performanceKpis)
      };

    } catch (error) {
      console.error('Error getting performance analytics:', error);
      throw new Error(`Failed to get performance analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze transaction performance and detect issues
   */
  private async analyzeTransactionPerformance(transaction: ApmTransaction): Promise<void> {
    try {
      // Get performance baseline for this transaction type
      const baseline = await this.getPerformanceBaseline(
        transaction.projectId,
        `transaction_${transaction.transactionName}`,
        'response_time'
      );

      if (baseline && baseline.baselineValue && transaction.duration > parseFloat(baseline.baselineValue) * 1.5) {
        const baselineValue = parseFloat(baseline.baselineValue);
        // Transaction is significantly slower than baseline
        console.log(`Slow transaction detected: ${transaction.transactionName} took ${transaction.duration}ms (baseline: ${baselineValue}ms)`);
        
        // Log performance issue
        await storage.createLogEntry({
          projectId: transaction.projectId,
          source: 'apm',
          logLevel: 'warn',
          serviceName: transaction.serviceName,
          message: `Slow transaction detected: ${transaction.transactionName}`,
          structuredData: {
            transactionId: transaction.id,
            duration: transaction.duration,
            baseline: baselineValue,
            deviation: transaction.duration - baselineValue
          },
          traceId: transaction.traceId || null,
          timestamp: new Date()
        });
      }

    } catch (error) {
      console.error('Error analyzing transaction performance:', error);
    }
  }

  /**
   * Calculate comprehensive performance KPIs
   */
  private calculatePerformanceKpis(
    transactions: ApmTransaction[],
    dbMetrics: DatabasePerformanceMetric[],
    rumMetrics: RumMetric[]
  ): PerformanceMetrics {
    const totalTransactions = transactions.length;
    const errorTransactions = transactions.filter(t => t.status === 'error').length;

    const responseTimes = transactions.map(t => t.duration).filter(d => d != null);
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length 
      : 0;

    const p95ResponseTime = this.calculatePercentile(responseTimes, 95);
    const p99ResponseTime = this.calculatePercentile(responseTimes, 99);

    const dbExecutionTimes = dbMetrics
      .map(m => m.executionTime ? parseFloat(m.executionTime) : null)
      .filter((time): time is number => time !== null);
    const avgDbTime = dbExecutionTimes.length > 0
      ? dbExecutionTimes.reduce((sum: number, time: number) => sum + time, 0) / dbExecutionTimes.length
      : 0;

    const rumData = rumMetrics[0] || {};

    return {
      responseTime: avgResponseTime,
      throughput: totalTransactions,
      errorRate: totalTransactions > 0 ? (errorTransactions / totalTransactions) * 100 : 0,
      cpuUsage: 0, // Will be populated from system metrics
      memoryUsage: 0, // Will be populated from system metrics
      diskIo: 0, // Will be populated from system metrics
      networkIo: 0, // Will be populated from system metrics
      p95ResponseTime,
      p99ResponseTime,
      databasePerformance: {
        avgExecutionTime: avgDbTime,
        slowQueries: dbMetrics.filter(m => m.isSlowQuery).length
      },
      userExperience: {
        firstContentfulPaint: rumData.firstContentfulPaint || 0,
        largestContentfulPaint: rumData.largestContentfulPaint || 0,
        firstInputDelay: rumData.firstInputDelay || 0,
        cumulativeLayoutShift: rumData.cumulativeLayoutShift || 0
      }
    } as any;
  }

  // =====================================================
  // Database Performance Analysis and Optimization
  // =====================================================

  /**
   * Analyze database performance and generate optimization suggestions
   */
  async analyzeDatabasePerformance(
    projectId: string,
    timeRange: '1h' | '1d' | '7d' | '30d' = '1d'
  ): Promise<DatabaseOptimization[]> {
    try {
      console.log(`Analyzing database performance for project ${projectId} over ${timeRange}`);

      const cacheKey = `${projectId}_${timeRange}`;
      if (this.optimizationCache.has(cacheKey)) {
        return this.optimizationCache.get(cacheKey)!;
      }

      const now = new Date();
      const timeRangeMs = this.parseTimeRange(timeRange);
      const startTime = new Date(now.getTime() - timeRangeMs);

      // Get database performance metrics
      const dbMetrics = await storage.getDatabasePerformanceMetrics(projectId, startTime, now);

      if (dbMetrics.length === 0) {
        return [];
      }

      // Group metrics by query hash for analysis
      const queryGroups = this.groupMetricsByQuery(dbMetrics);

      // Analyze each query group for optimization opportunities
      const optimizations: DatabaseOptimization[] = [];

      for (const [queryHash, metrics] of Array.from(queryGroups.entries())) {
        const optimization = await this.analyzeQueryPerformance(queryHash, metrics);
        if (optimization) {
          optimizations.push(optimization);
        }
      }

      // Sort by impact/priority
      optimizations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Cache results for performance
      this.optimizationCache.set(cacheKey, optimizations);
      setTimeout(() => this.optimizationCache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache

      return optimizations;

    } catch (error) {
      console.error('Error analyzing database performance:', error);
      throw new Error(`Failed to analyze database performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze individual query performance and suggest optimizations
   */
  private async analyzeQueryPerformance(
    queryHash: string,
    metrics: DatabasePerformanceMetric[]
  ): Promise<DatabaseOptimization | null> {
    try {
      if (metrics.length === 0) return null;

      const latestMetric = metrics[0];
      const validExecutionTimes = metrics
        .map(m => m.executionTime ? parseFloat(m.executionTime) : null)
        .filter((time): time is number => time !== null);
      const avgExecutionTime = validExecutionTimes.length > 0 
        ? validExecutionTimes.reduce((sum: number, time: number) => sum + time, 0) / validExecutionTimes.length 
        : 0;
      const totalExecutions = metrics
        .map(m => m.frequency || 0)
        .reduce((sum: number, freq: number) => sum + freq, 0);

      // Skip queries that are already fast
      if (avgExecutionTime < 100) return null; // Skip queries under 100ms

      // Use AI to analyze the query and suggest optimizations
      const aiOptimization = await this.generateQueryOptimization(
        latestMetric.query || '',
        {
          executionTime: avgExecutionTime,
          rowsExamined: latestMetric.rowsExamined,
          frequency: totalExecutions,
          indexesUsed: latestMetric.indexesUsed as string[] || []
        }
      );

      // Calculate priority based on impact
      const priority = this.calculateOptimizationPriority(avgExecutionTime, totalExecutions);

      return {
        queryHash,
        query: latestMetric.query || '',
        currentPerformance: {
          executionTime: avgExecutionTime,
          rowsExamined: latestMetric.rowsExamined || 0,
          frequency: totalExecutions
        },
        optimization: aiOptimization,
        priority
      };

    } catch (error) {
      console.error('Error analyzing query performance:', error);
      return null;
    }
  }

  /**
   * Generate query optimization using AI
   */
  private async generateQueryOptimization(
    query: string,
    performance: any
  ): Promise<any> {
    try {
      const prompt = `
Analyze this SQL query and provide optimization recommendations:

**Query:**
${query}

**Current Performance:**
- Execution Time: ${performance.executionTime}ms
- Rows Examined: ${performance.rowsExamined}
- Frequency: ${performance.frequency} executions
- Indexes Used: ${JSON.stringify(performance.indexesUsed)}

Please provide optimization suggestions including:
1. **Suggested Indexes** - Specific index recommendations
2. **Query Rewrite** - Optimized version of the query if possible
3. **Estimated Improvement** - Expected performance improvement percentage
4. **Implementation Steps** - How to implement the optimizations

Respond in JSON format:
{
  "suggestedIndexes": ["index creation statements"],
  "queryRewrite": "optimized query or null",
  "estimatedImprovement": "percentage improvement",
  "implementation": "step-by-step implementation guide"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 1000
      });

      const optimization = JSON.parse(completion.choices[0].message.content || '{}');
      
      return {
        suggestedIndexes: optimization.suggestedIndexes || [],
        queryRewrite: optimization.queryRewrite || null,
        estimatedImprovement: parseFloat(optimization.estimatedImprovement) || 0,
        implementation: optimization.implementation || 'Manual optimization required'
      };

    } catch (error) {
      console.error('Error generating query optimization:', error);
      return {
        suggestedIndexes: [],
        queryRewrite: null,
        estimatedImprovement: 0,
        implementation: 'AI optimization temporarily unavailable'
      };
    }
  }

  /**
   * Track database query performance
   */
  async trackDatabaseQuery(
    projectId: string,
    queryData: {
      databaseType: string;
      instanceId: string;
      query: string;
      executionTime: number;
      rowsAffected: number;
      rowsExamined: number;
      indexesUsed?: string[];
      executionPlan?: Record<string, any>;
      metadata?: Record<string, any>;
    }
  ): Promise<DatabasePerformanceMetric> {
    try {
      const queryHash = this.generateQueryHash(queryData.query);
      const isSlowQuery = queryData.executionTime > 1000; // Queries over 1 second

      const metric = await storage.createDatabasePerformanceMetric({
        projectId,
        databaseType: queryData.databaseType,
        instanceId: queryData.instanceId,
        queryHash,
        query: queryData.query,
        executionTime: queryData.executionTime.toString(),
        rowsAffected: queryData.rowsAffected,
        rowsExamined: queryData.rowsExamined,
        indexesUsed: queryData.indexesUsed || [],
        executionPlan: queryData.executionPlan || {},
        isSlowQuery,
        frequency: 1,
        metadata: queryData.metadata || {},
        timestamp: new Date()
      });

      // Auto-analyze slow queries
      if (isSlowQuery) {
        await this.analyzeSingleSlowQuery(metric);
      }

      return metric;

    } catch (error) {
      console.error('Error tracking database query:', error);
      throw new Error(`Failed to track database query: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // =====================================================
  // API Response Time and Bottleneck Identification
  // =====================================================

  /**
   * Identify performance bottlenecks across the application stack
   */
  async identifyBottlenecks(
    transactions: ApmTransaction[],
    dbMetrics: DatabasePerformanceMetric[],
    rumMetrics: RumMetric[]
  ): Promise<BottleneckAnalysis[]> {
    try {
      const bottlenecks: BottleneckAnalysis[] = [];

      // Analyze API endpoint bottlenecks
      const apiBottlenecks = this.analyzeApiBottlenecks(transactions);
      bottlenecks.push(...apiBottlenecks);

      // Analyze database bottlenecks
      const dbBottlenecks = this.analyzeDatabaseBottlenecks(dbMetrics);
      bottlenecks.push(...dbBottlenecks);

      // Analyze frontend performance bottlenecks
      const frontendBottlenecks = this.analyzeFrontendBottlenecks(rumMetrics);
      bottlenecks.push(...frontendBottlenecks);

      // Use AI to provide deeper analysis and root cause identification
      const enhancedBottlenecks = await this.enhanceBottleneckAnalysisWithAI(bottlenecks);

      // Sort by impact and urgency
      enhancedBottlenecks.sort((a, b) => b.impact - a.impact);

      return enhancedBottlenecks;

    } catch (error) {
      console.error('Error identifying bottlenecks:', error);
      return [];
    }
  }

  /**
   * Analyze API endpoint performance bottlenecks
   */
  private analyzeApiBottlenecks(transactions: ApmTransaction[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    // Group transactions by endpoint
    const endpointGroups = new Map<string, ApmTransaction[]>();
    
    transactions.forEach(transaction => {
      const key = transaction.transactionName;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(transaction);
    });

    // Analyze each endpoint for bottlenecks
    endpointGroups.forEach((txns, endpoint) => {
      const avgDuration = txns.reduce((sum, t) => sum + t.duration, 0) / txns.length;
      const errorRate = txns.filter(t => t.status === 'error').length / txns.length;
      
      // Identify slow endpoints (over 2 seconds average)
      if (avgDuration > 2000) {
        bottlenecks.push({
          type: 'api',
          location: endpoint,
          impact: Math.min(avgDuration / 10000, 1), // Normalize to 0-1
          description: `Slow API endpoint with ${avgDuration.toFixed(0)}ms average response time`,
          rootCause: 'High response time indicating potential performance issues',
          suggestions: [
            'Add database query optimization',
            'Implement response caching',
            'Review business logic efficiency',
            'Add performance monitoring'
          ],
          urgency: avgDuration > 5000 ? 'high' : 'medium'
        });
      }

      // Identify high error rate endpoints
      if (errorRate > 0.05) { // Over 5% error rate
        bottlenecks.push({
          type: 'api',
          location: endpoint,
          impact: errorRate,
          description: `High error rate endpoint with ${(errorRate * 100).toFixed(1)}% errors`,
          rootCause: 'Frequent errors indicating reliability issues',
          suggestions: [
            'Review error handling logic',
            'Add input validation',
            'Implement retry mechanisms',
            'Add comprehensive logging'
          ],
          urgency: errorRate > 0.1 ? 'critical' : 'high'
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Analyze database performance bottlenecks
   */
  private analyzeDatabaseBottlenecks(dbMetrics: DatabasePerformanceMetric[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    // Group by query for analysis
    const queryGroups = this.groupMetricsByQuery(dbMetrics);

    queryGroups.forEach((metrics, queryHash) => {
      const validExecutionTimes = metrics
        .map(m => m.executionTime ? parseFloat(m.executionTime) : null)
        .filter((time): time is number => time !== null);
      const avgExecutionTime = validExecutionTimes.length > 0 
        ? validExecutionTimes.reduce((sum: number, time: number) => sum + time, 0) / validExecutionTimes.length 
        : 0;
      const totalExecutions = metrics
        .map(m => m.frequency || 0)
        .reduce((sum: number, freq: number) => sum + freq, 0);
      
      if (avgExecutionTime > 1000) { // Queries over 1 second
        bottlenecks.push({
          type: 'database',
          location: `Query ${queryHash.substring(0, 8)}`,
          impact: Math.min(avgExecutionTime / 5000, 1),
          description: `Slow database query with ${avgExecutionTime.toFixed(0)}ms average execution time`,
          rootCause: 'Query optimization needed - missing indexes or inefficient query structure',
          suggestions: [
            'Add appropriate database indexes',
            'Optimize query structure',
            'Consider query result caching',
            'Review data access patterns'
          ],
          urgency: avgExecutionTime > 3000 ? 'high' : 'medium'
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Analyze frontend performance bottlenecks
   */
  private analyzeFrontendBottlenecks(rumMetrics: RumMetric[]): BottleneckAnalysis[] {
    const bottlenecks: BottleneckAnalysis[] = [];

    if (rumMetrics.length === 0) return bottlenecks;

    // Calculate average Core Web Vitals
    const avgLcp = rumMetrics.reduce((sum, m) => sum + (m.largestContentfulPaint || 0), 0) / rumMetrics.length;
    const avgFid = rumMetrics.reduce((sum, m) => sum + (m.firstInputDelay || 0), 0) / rumMetrics.length;
    const avgCls = rumMetrics.reduce((sum, m) => sum + (m.cumulativeLayoutShift ? parseFloat(m.cumulativeLayoutShift) : 0), 0) / rumMetrics.length;
    const avgTti = rumMetrics.reduce((sum, m) => sum + (m.timeToInteractive || 0), 0) / rumMetrics.length;

    // Check LCP (Largest Contentful Paint)
    if (avgLcp > 2500) { // Poor LCP threshold
      bottlenecks.push({
        type: 'infrastructure',
        location: 'Frontend Performance - LCP',
        impact: Math.min(avgLcp / 5000, 1),
        description: `Poor Largest Contentful Paint: ${avgLcp.toFixed(0)}ms`,
        rootCause: 'Slow loading of main content, potentially due to large images or slow server response',
        suggestions: [
          'Optimize images and use modern formats',
          'Implement lazy loading',
          'Use CDN for static assets',
          'Optimize server response times'
        ],
        urgency: avgLcp > 4000 ? 'high' : 'medium'
      });
    }

    // Check FID (First Input Delay)
    if (avgFid > 100) { // Poor FID threshold
      bottlenecks.push({
        type: 'code',
        location: 'Frontend Performance - FID',
        impact: Math.min(avgFid / 300, 1),
        description: `Poor First Input Delay: ${avgFid.toFixed(0)}ms`,
        rootCause: 'Heavy JavaScript execution blocking main thread',
        suggestions: [
          'Code splitting and lazy loading',
          'Optimize JavaScript bundles',
          'Use web workers for heavy computations',
          'Defer non-critical JavaScript'
        ],
        urgency: avgFid > 200 ? 'high' : 'medium'
      });
    }

    // Check CLS (Cumulative Layout Shift)
    if (avgCls > 0.1) { // Poor CLS threshold
      bottlenecks.push({
        type: 'code',
        location: 'Frontend Performance - CLS',
        impact: Math.min(avgCls / 0.25, 1),
        description: `Poor Cumulative Layout Shift: ${avgCls.toFixed(3)}`,
        rootCause: 'Unexpected layout shifts due to missing dimensions or dynamic content',
        suggestions: [
          'Set explicit dimensions for images and ads',
          'Reserve space for dynamic content',
          'Use font display swap',
          'Optimize loading of third-party content'
        ],
        urgency: avgCls > 0.2 ? 'high' : 'medium'
      });
    }

    return bottlenecks;
  }

  /**
   * Enhance bottleneck analysis with AI insights
   */
  private async enhanceBottleneckAnalysisWithAI(bottlenecks: BottleneckAnalysis[]): Promise<BottleneckAnalysis[]> {
    try {
      if (bottlenecks.length === 0) return bottlenecks;

      const prompt = `
Analyze these performance bottlenecks and provide enhanced insights:

${bottlenecks.map((b, i) => `
**Bottleneck ${i + 1}:**
- Type: ${b.type}
- Location: ${b.location}
- Impact: ${b.impact}
- Description: ${b.description}
- Current Root Cause: ${b.rootCause}
- Current Suggestions: ${b.suggestions.join(', ')}
`).join('\n')}

For each bottleneck, provide:
1. **Enhanced Root Cause Analysis** - Deeper analysis of the underlying issue
2. **Priority Ranking** - Which bottlenecks to address first
3. **Interconnected Issues** - How these bottlenecks might be related
4. **Implementation Timeline** - Recommended order and timeline for fixes

Respond in JSON format with enhanced analysis for each bottleneck.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      });

      const aiAnalysis = JSON.parse(completion.choices[0].message.content || '{}');
      
      // Enhance each bottleneck with AI insights
      return bottlenecks.map((bottleneck, index) => {
        const enhancement = aiAnalysis[`bottleneck_${index}`] || {};
        
        return {
          ...bottleneck,
          rootCause: enhancement.enhancedRootCause || bottleneck.rootCause,
          suggestions: enhancement.enhancedSuggestions || bottleneck.suggestions,
          metadata: {
            aiInsights: enhancement.insights || [],
            priorityRanking: enhancement.priority || bottleneck.urgency,
            interconnectedWith: enhancement.relatedBottlenecks || [],
            implementationTimeline: enhancement.timeline || 'Immediate'
          }
        };
      });

    } catch (error) {
      console.error('Error enhancing bottleneck analysis with AI:', error);
      return bottlenecks;
    }
  }

  // =====================================================
  // User Experience Monitoring with Core Web Vitals
  // =====================================================

  /**
   * Track Real User Monitoring (RUM) data
   */
  async trackRumMetrics(
    projectId: string,
    rumData: {
      sessionId: string;
      pageUrl: string;
      userAgent: string;
      deviceType: string;
      browserName: string;
      connectionType?: string;
      country?: string;
      region?: string;
      performanceMetrics: {
        firstContentfulPaint: number;
        largestContentfulPaint: number;
        firstInputDelay: number;
        cumulativeLayoutShift: number;
        timeToInteractive: number;
      };
      customMetrics?: Record<string, any>;
      userId?: string;
    }
  ): Promise<RumMetric> {
    try {
      const metric = await storage.createRumMetric({
        projectId,
        sessionId: rumData.sessionId,
        pageUrl: rumData.pageUrl,
        userAgent: rumData.userAgent,
        deviceType: rumData.deviceType,
        browserName: rumData.browserName,
        browserVersion: this.extractBrowserVersion(rumData.userAgent),
        connectionType: rumData.connectionType,
        country: rumData.country,
        region: rumData.region,
        firstContentfulPaint: rumData.performanceMetrics.firstContentfulPaint,
        largestContentfulPaint: rumData.performanceMetrics.largestContentfulPaint,
        firstInputDelay: rumData.performanceMetrics.firstInputDelay,
        cumulativeLayoutShift: rumData.performanceMetrics.cumulativeLayoutShift.toString(),
        timeToInteractive: rumData.performanceMetrics.timeToInteractive,
        domContentLoaded: 0, // Will be provided by client
        pageLoadTime: 0, // Will be calculated
        errorCount: 0,
        customMetrics: rumData.customMetrics || {},
        userId: rumData.userId,
        timestamp: new Date()
      });

      // Analyze Core Web Vitals
      const webVitals = this.calculateCoreWebVitals(rumData.performanceMetrics);
      
      // Store baseline if needed
      await this.updateUserExperienceBaseline(projectId, webVitals);

      return metric;

    } catch (error) {
      console.error('Error tracking RUM metrics:', error);
      throw new Error(`Failed to track RUM metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Calculate Core Web Vitals score and grade
   */
  private calculateCoreWebVitals(metrics: any): CoreWebVitals {
    const lcp = metrics.largestContentfulPaint;
    const fid = metrics.firstInputDelay;
    const cls = metrics.cumulativeLayoutShift;
    
    // Scoring based on Google's thresholds
    const lcpScore = lcp <= 2500 ? 100 : lcp <= 4000 ? 75 : 50;
    const fidScore = fid <= 100 ? 100 : fid <= 300 ? 75 : 50;
    const clsScore = cls <= 0.1 ? 100 : cls <= 0.25 ? 75 : 50;
    
    const overallScore = Math.round((lcpScore + fidScore + clsScore) / 3);
    
    let grade: 'poor' | 'needs-improvement' | 'good' = 'good';
    if (overallScore < 60) grade = 'poor';
    else if (overallScore < 85) grade = 'needs-improvement';
    
    return {
      firstContentfulPaint: metrics.firstContentfulPaint,
      largestContentfulPaint: lcp,
      firstInputDelay: fid,
      cumulativeLayoutShift: cls,
      timeToInteractive: metrics.timeToInteractive,
      score: overallScore,
      grade
    };
  }

  // =====================================================
  // Performance Trends and Baseline Analysis
  // =====================================================

  /**
   * Analyze performance trends over time
   */
  async analyzeTrends(
    timeSeriesMetrics: TimeSeriesMetric[],
    baselines: PerformanceBaseline[]
  ): Promise<any> {
    try {
      const trends = {
        responseTime: this.calculateTrend(timeSeriesMetrics.filter(m => m.metricName.includes('response_time'))),
        errorRate: this.calculateTrend(timeSeriesMetrics.filter(m => m.metricName.includes('error_rate'))),
        throughput: this.calculateTrend(timeSeriesMetrics.filter(m => m.metricName.includes('throughput'))),
        databasePerformance: this.calculateTrend(timeSeriesMetrics.filter(m => m.metricName.includes('db_'))),
        userExperience: this.calculateTrend(timeSeriesMetrics.filter(m => m.metricName.includes('rum_')))
      };

      // Compare against baselines
      const baselineComparison = this.compareAgainstBaselines(trends, baselines);

      // Generate trend insights
      const insights = await this.generateTrendInsights(trends, baselineComparison);

      return {
        trends,
        baselineComparison,
        insights,
        recommendations: await this.generateTrendRecommendations(trends),
        alertWorthy: this.identifyAlertWorthyTrends(trends)
      };

    } catch (error) {
      console.error('Error analyzing trends:', error);
      return {
        trends: {},
        baselineComparison: {},
        insights: [],
        recommendations: [],
        alertWorthy: []
      };
    }
  }

  // =====================================================
  // AI-Powered Performance Insights and Recommendations
  // =====================================================

  /**
   * Generate comprehensive performance insights using AI
   */
  private async generatePerformanceInsights(
    performanceKpis: any,
    trendAnalysis: any,
    bottlenecks: BottleneckAnalysis[],
    timeRange: string
  ): Promise<string[]> {
    try {
      const prompt = `
Analyze this application performance data and provide intelligent insights:

**Performance KPIs:**
${JSON.stringify(performanceKpis, null, 2)}

**Trend Analysis:**
${JSON.stringify(trendAnalysis, null, 2)}

**Top Bottlenecks:**
${bottlenecks.slice(0, 3).map(b => `- ${b.type}: ${b.description}`).join('\n')}

**Time Range:** ${timeRange}

Provide 5-7 key insights about the application performance, focusing on:
1. Overall health assessment
2. Most critical issues to address
3. Positive trends to maintain
4. Performance patterns and anomalies
5. Business impact considerations

Make insights actionable and specific to the data provided.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = completion.choices[0].message.content || '';
      return content.split('\n').filter(line => line.trim().length > 0);

    } catch (error) {
      console.error('Error generating performance insights:', error);
      return [
        'Performance analysis completed successfully',
        'Monitor response times and error rates regularly',
        'Consider implementing performance baselines for better tracking'
      ];
    }
  }

  /**
   * Generate performance recommendations
   */
  private async generatePerformanceRecommendations(
    bottlenecks: BottleneckAnalysis[],
    trendAnalysis: any
  ): Promise<string[]> {
    try {
      const topBottlenecks = bottlenecks.slice(0, 5);
      const recommendations: string[] = [];

      // Add recommendations based on bottleneck types
      topBottlenecks.forEach(bottleneck => {
        bottleneck.suggestions.forEach(suggestion => {
          if (!recommendations.includes(suggestion)) {
            recommendations.push(suggestion);
          }
        });
      });

      // Add trend-based recommendations
      if (trendAnalysis.alertWorthy?.length > 0) {
        recommendations.push('Address degrading performance trends identified in analysis');
      }

      return recommendations.slice(0, 10); // Limit to top 10 recommendations

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return ['Review performance metrics regularly for optimization opportunities'];
    }
  }

  // =====================================================
  // Utility and Helper Methods
  // =====================================================

  private generateTraceId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateQueryHash(query: string): string {
    // Simple hash function for SQL queries
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private extractTags(metadata: Record<string, any>): string[] {
    return Object.keys(metadata).filter(key => typeof metadata[key] === 'string');
  }

  private extractBrowserVersion(userAgent: string): string {
    // Simple browser version extraction
    const match = userAgent.match(/(Chrome|Firefox|Safari|Edge)\/([0-9]+)/);
    return match ? match[2] : 'unknown';
  }

  private parseTimeRange(timeRange: string): number {
    const timeRangeMap: Record<string, number> = {
      '1h': 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return timeRangeMap[timeRange] || timeRangeMap['1h'];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }

  private groupMetricsByQuery(metrics: DatabasePerformanceMetric[]): Map<string, DatabasePerformanceMetric[]> {
    const groups = new Map<string, DatabasePerformanceMetric[]>();
    
    metrics.forEach(metric => {
      const hash = metric.queryHash || 'unknown';
      if (!groups.has(hash)) {
        groups.set(hash, []);
      }
      groups.get(hash)!.push(metric);
    });
    
    return groups;
  }

  private calculateOptimizationPriority(executionTime: number, frequency: number): 'low' | 'medium' | 'high' | 'critical' {
    const impact = executionTime * frequency; // Simple impact calculation
    
    if (impact > 100000) return 'critical';
    if (impact > 50000) return 'high';
    if (impact > 10000) return 'medium';
    return 'low';
  }

  private calculateOverallHealthScore(performanceKpis: any, bottlenecks: BottleneckAnalysis[]): number {
    let score = 100;
    
    // Deduct points for high response times
    if (performanceKpis.responseTime > 1000) {
      score -= Math.min((performanceKpis.responseTime - 1000) / 100, 30);
    }
    
    // Deduct points for high error rates
    if (performanceKpis.errorRate > 1) {
      score -= Math.min(performanceKpis.errorRate * 10, 40);
    }
    
    // Deduct points for critical bottlenecks
    const criticalBottlenecks = bottlenecks.filter(b => b.urgency === 'critical').length;
    score -= criticalBottlenecks * 15;
    
    const highBottlenecks = bottlenecks.filter(b => b.urgency === 'high').length;
    score -= highBottlenecks * 10;
    
    return Math.max(Math.round(score), 0);
  }

  private async checkPerformanceAlerts(projectId: string, performanceKpis: any): Promise<any[]> {
    // Check for performance threshold violations
    const alerts = [];
    
    if (performanceKpis.responseTime > 2000) {
      alerts.push({
        type: 'response_time',
        severity: 'high',
        message: `High response time: ${performanceKpis.responseTime}ms`,
        threshold: 2000,
        currentValue: performanceKpis.responseTime
      });
    }
    
    if (performanceKpis.errorRate > 5) {
      alerts.push({
        type: 'error_rate',
        severity: 'critical',
        message: `High error rate: ${performanceKpis.errorRate}%`,
        threshold: 5,
        currentValue: performanceKpis.errorRate
      });
    }
    
    return alerts;
  }

  private calculateTrend(metrics: TimeSeriesMetric[]): any {
    if (metrics.length < 2) return { direction: 'stable', strength: 0 };
    
    const values = metrics.map(m => parseFloat(m.value.toString()));
    const timestamps = metrics.map(m => new Date(m.timestamp).getTime());
    
    // Simple linear regression for trend
    const n = values.length;
    const sumX = timestamps.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    return {
      direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
      strength: Math.abs(slope),
      slope
    };
  }

  private compareAgainstBaselines(trends: any, baselines: PerformanceBaseline[]): any {
    // Compare current trends against established baselines
    return {
      deviations: baselines.filter(baseline => {
        const trend = trends[baseline.metricName];
        return trend && Math.abs(trend.slope) > 0.1;
      }),
      summary: 'Baseline comparison completed'
    };
  }

  private async generateTrendInsights(trends: any, baselineComparison: any): Promise<string[]> {
    return [
      'Performance trends analyzed successfully',
      'Monitor degrading metrics closely',
      'Maintain good performance practices'
    ];
  }

  private async generateTrendRecommendations(trends: any): Promise<string[]> {
    return [
      'Implement performance baselines',
      'Set up automated alerting for trend changes',
      'Regular performance review meetings'
    ];
  }

  private identifyAlertWorthyTrends(trends: any): Array<{metric: string, trend: string, strength: number, severity: string}> {
    const alertWorthy: Array<{metric: string, trend: string, strength: number, severity: string}> = [];
    
    Object.entries(trends).forEach(([metric, trend]: [string, any]) => {
      if (trend.direction === 'decreasing' && trend.strength > 0.05) {
        alertWorthy.push({
          metric,
          trend: trend.direction,
          strength: trend.strength,
          severity: 'medium'
        });
      }
    });
    
    return alertWorthy;
  }

  private async getPerformanceBaseline(
    projectId: string,
    metricName: string,
    resourceType: string
  ): Promise<PerformanceBaseline | null> {
    try {
      const baselines = await storage.getPerformanceBaselines(projectId);
      return baselines.find(b => b.metricName === metricName && b.resourceType === resourceType) || null;
    } catch (error) {
      return null;
    }
  }

  private async updatePerformanceMetrics(projectId: string, transaction: ApmTransaction): Promise<void> {
    try {
      // Update time series metrics for this transaction
      await storage.createTimeSeriesMetric({
        projectId,
        metricName: `transaction_${transaction.transactionName}_duration`,
        metricType: 'gauge',
        value: transaction.duration.toString(),
        unit: 'ms',
        dimensions: {
          service: transaction.serviceName,
          operation: transaction.operationType,
          status: transaction.status
        },
        tags: ['apm', 'performance'],
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error updating performance metrics:', error);
    }
  }

  private async updateUserExperienceBaseline(projectId: string, webVitals: CoreWebVitals): Promise<void> {
    try {
      await storage.createPerformanceBaseline({
        projectId,
        metricName: 'core_web_vitals',
        resourceType: 'frontend',
        baselineType: 'target',
        timeFrame: '1d',
        baselineValue: webVitals.score.toString(),
        metadata: {
          lcp: webVitals.largestContentfulPaint,
          fid: webVitals.firstInputDelay,
          cls: webVitals.cumulativeLayoutShift,
          grade: webVitals.grade
        },
        lastCalculated: new Date()
      });
    } catch (error) {
      console.error('Error updating user experience baseline:', error);
    }
  }

  private async analyzeSingleSlowQuery(metric: DatabasePerformanceMetric): Promise<void> {
    try {
      console.log(`Analyzing slow query: ${metric.queryHash} took ${metric.executionTime}ms`);
      
      // Log the slow query for further analysis
      await storage.createLogEntry({
        projectId: metric.projectId,
        source: 'database',
        logLevel: 'warn',
        serviceName: 'database-analyzer',
        message: `Slow query detected: ${metric.executionTime}ms execution time`,
        structuredData: {
          queryHash: metric.queryHash,
          executionTime: metric.executionTime,
          rowsExamined: metric.rowsExamined,
          query: metric.query?.substring(0, 200) // First 200 chars
        },
        timestamp: new Date()
      });

    } catch (error) {
      console.error('Error analyzing slow query:', error);
    }
  }
}

// Export singleton instance
export const performanceAnalyticsService = new PerformanceAnalyticsService();