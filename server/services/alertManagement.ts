import { storage } from "../storage";
import {
  AlertRule,
  InsertAlertRule,
  AlertNotification,
  InsertAlertNotification,
  AnomalyDetection,
  Incident,
} from "@shared/schema";

interface NotificationChannel {
  type: 'email' | 'slack' | 'webhook' | 'sms' | 'teams' | 'discord';
  endpoint: string;
  credentials?: Record<string, any>;
  isEnabled: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

interface EscalationPolicy {
  name: string;
  levels: EscalationLevel[];
  timeoutMinutes: number;
  autoResolve: boolean;
}

interface EscalationLevel {
  level: number;
  delayMinutes: number;
  channels: NotificationChannel[];
  recipients: string[];
  requiresAcknowledgment: boolean;
}

interface AlertContext {
  projectId: string;
  alertRule: AlertRule;
  triggerValue: number;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata: Record<string, any>;
}

export class AlertManagementService {
  private activeAlerts: Map<string, AlertContext> = new Map();
  private suppressedAlerts: Set<string> = new Set();
  private escalationTimers: Map<string, NodeJS.Timeout> = new Map();

  // =====================================================
  // Alert Processing and Evaluation
  // =====================================================

  /**
   * Process incoming metrics and evaluate alert rules
   */
  async processMetricForAlerts(
    projectId: string,
    metricName: string,
    value: number,
    timestamp: Date = new Date()
  ): Promise<void> {
    try {
      // Get relevant alert rules for this metric
      const alertRules = await this.getRelevantAlertRules(projectId, metricName);
      
      for (const rule of alertRules) {
        if (!rule.isEnabled) continue;
        
        const shouldTrigger = await this.evaluateAlertRule(rule, value, timestamp);
        
        if (shouldTrigger) {
          await this.triggerAlert(rule, value, timestamp);
        } else {
          await this.checkAlertResolution(rule, value, timestamp);
        }
      }
    } catch (error) {
      console.error('Error processing metric for alerts:', error);
    }
  }

  /**
   * Get alert rules relevant to a specific metric
   */
  private async getRelevantAlertRules(projectId: string, metricName: string): Promise<AlertRule[]> {
    const allRules = await storage.getAlertRules(projectId);
    
    return allRules.filter(rule => {
      const conditions = rule.conditions as any;
      return conditions?.metric === metricName || 
             rule.metricQuery?.includes(metricName) ||
             (rule.labels as string[])?.includes(metricName);
    });
  }

  /**
   * Evaluate if an alert rule should trigger
   */
  private async evaluateAlertRule(rule: AlertRule, value: number, timestamp: Date): Promise<boolean> {
    try {
      const conditions = rule.conditions as any;
      
      if (!conditions) return false;

      // Check if alert is in suppression period
      if (this.isAlertSuppressed(rule.id, timestamp)) {
        return false;
      }

      // Evaluate threshold conditions
      const threshold = conditions.threshold || 0;
      const operator = conditions.operator || '>';

      let triggered = false;
      switch (operator) {
        case '>':
          triggered = value > threshold;
          break;
        case '<':
          triggered = value < threshold;
          break;
        case '>=':
          triggered = value >= threshold;
          break;
        case '<=':
          triggered = value <= threshold;
          break;
        case '==':
          triggered = value === threshold;
          break;
        case '!=':
          triggered = value !== threshold;
          break;
        default:
          triggered = value > threshold;
      }

      // Check if we need consecutive violations
      if (triggered && conditions.consecutiveViolations) {
        return await this.checkConsecutiveViolations(rule, value, conditions.consecutiveViolations);
      }

      return triggered;
    } catch (error) {
      console.error('Error evaluating alert rule:', error);
      return false;
    }
  }

  /**
   * Trigger an alert and start notification process
   */
  private async triggerAlert(rule: AlertRule, triggerValue: number, timestamp: Date): Promise<void> {
    try {
      const alertKey = `${rule.projectId}_${rule.id}`;
      
      // Check if alert is already active
      if (this.activeAlerts.has(alertKey)) {
        console.log(`Alert ${rule.name} is already active, skipping...`);
        return;
      }

      console.log(`🚨 Triggering alert: ${rule.name}`);

      const alertContext: AlertContext = {
        projectId: rule.projectId,
        alertRule: rule,
        triggerValue,
        threshold: (rule.conditions as any)?.threshold || 0,
        severity: rule.severity as any,
        metadata: {
          triggeredAt: timestamp,
          metricName: (rule.conditions as any)?.metric,
          conditions: rule.conditions
        }
      };

      // Mark alert as active
      this.activeAlerts.set(alertKey, alertContext);

      // Start notification process
      await this.sendAlertNotifications(alertContext);

      // Start escalation process if configured
      if (rule.escalationRules) {
        await this.startEscalationProcess(alertContext);
      }

      // Trigger automatic actions if configured
      if (rule.automaticActions) {
        await this.executeAutomaticActions(alertContext);
      }

      // Apply silence duration
      if (rule.silenceDuration && rule.silenceDuration > 0) {
        this.suppressAlert(rule.id, rule.silenceDuration);
      }

    } catch (error) {
      console.error('Error triggering alert:', error);
    }
  }

  /**
   * Check if an active alert can be resolved
   */
  private async checkAlertResolution(rule: AlertRule, value: number, timestamp: Date): Promise<void> {
    const alertKey = `${rule.projectId}_${rule.id}`;
    
    if (this.activeAlerts.has(alertKey)) {
      const conditions = rule.conditions as any;
      const threshold = conditions?.threshold || 0;
      const operator = conditions?.operator || '>';

      // Check if value is back within normal range
      let resolved = false;
      switch (operator) {
        case '>':
          resolved = value <= threshold;
          break;
        case '<':
          resolved = value >= threshold;
          break;
        case '>=':
          resolved = value < threshold;
          break;
        case '<=':
          resolved = value > threshold;
          break;
        default:
          resolved = value <= threshold;
      }

      if (resolved) {
        await this.resolveAlert(alertKey, value, timestamp);
      }
    }
  }

  /**
   * Resolve an active alert
   */
  private async resolveAlert(alertKey: string, resolveValue: number, timestamp: Date): Promise<void> {
    try {
      const alertContext = this.activeAlerts.get(alertKey);
      if (!alertContext) return;

      console.log(`✅ Resolving alert: ${alertContext.alertRule.name}`);

      // Send resolution notification
      await this.sendResolutionNotification(alertContext, resolveValue, timestamp);

      // Clear escalation timers
      if (this.escalationTimers.has(alertKey)) {
        clearTimeout(this.escalationTimers.get(alertKey)!);
        this.escalationTimers.delete(alertKey);
      }

      // Remove from active alerts
      this.activeAlerts.delete(alertKey);

      console.log(`Alert resolved: ${alertContext.alertRule.name}`);
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  // =====================================================
  // Notification System
  // =====================================================

  /**
   * Send alert notifications through configured channels
   */
  private async sendAlertNotifications(alertContext: AlertContext): Promise<void> {
    try {
      const { alertRule, triggerValue, threshold, severity } = alertContext;
      const channels = alertRule.notificationChannels as NotificationChannel[];

      if (!channels || channels.length === 0) {
        console.log('No notification channels configured for alert rule');
        return;
      }

      const message = await this.generateAlertMessage(alertContext);
      const subject = `🚨 ${severity.toUpperCase()}: ${alertRule.name}`;

      for (const channel of channels) {
        if (!channel.isEnabled) continue;

        // Filter channels by severity
        if (!this.shouldNotifyChannel(channel, severity)) continue;

        try {
          const notification = await storage.createAlertNotification({
            alertRuleId: alertRule.id,
            projectId: alertRule.projectId,
            notificationType: channel.type,
            channel: channel.endpoint,
            subject,
            message,
            priority: this.mapSeverityToPriority(severity),
            status: 'pending',
            metadata: {
              alertContext: alertContext.metadata,
              channelConfig: channel,
              triggerValue,
              threshold
            }
          });

          await this.deliverNotification(notification, channel);
        } catch (error) {
          console.error(`Error sending notification to ${channel.type}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending alert notifications:', error);
    }
  }

  /**
   * Send alert resolution notification
   */
  private async sendResolutionNotification(
    alertContext: AlertContext,
    resolveValue: number,
    timestamp: Date
  ): Promise<void> {
    try {
      const { alertRule, severity } = alertContext;
      const channels = alertRule.notificationChannels as NotificationChannel[];

      const message = `✅ **RESOLVED**: Alert "${alertRule.name}" has been resolved.\n\n` +
                     `**Current Value**: ${resolveValue}\n` +
                     `**Resolved At**: ${timestamp.toISOString()}\n` +
                     `**Duration**: ${this.calculateAlertDuration(alertContext.metadata.triggeredAt, timestamp)}`;

      const subject = `✅ RESOLVED: ${alertRule.name}`;

      for (const channel of channels) {
        if (!channel.isEnabled) continue;

        try {
          const notification = await storage.createAlertNotification({
            alertRuleId: alertRule.id,
            projectId: alertRule.projectId,
            notificationType: channel.type,
            channel: channel.endpoint,
            subject,
            message,
            priority: 'low',
            status: 'pending',
            metadata: {
              type: 'resolution',
              resolveValue,
              resolvedAt: timestamp
            }
          });

          await this.deliverNotification(notification, channel);
        } catch (error) {
          console.error(`Error sending resolution notification to ${channel.type}:`, error);
        }
      }
    } catch (error) {
      console.error('Error sending resolution notification:', error);
    }
  }

  /**
   * Deliver notification through specific channel
   */
  private async deliverNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    try {
      console.log(`Delivering ${notification.notificationType} notification: ${notification.subject}`);

      switch (channel.type) {
        case 'email':
          await this.sendEmailNotification(notification, channel);
          break;
        case 'slack':
          await this.sendSlackNotification(notification, channel);
          break;
        case 'webhook':
          await this.sendWebhookNotification(notification, channel);
          break;
        case 'teams':
          await this.sendTeamsNotification(notification, channel);
          break;
        case 'discord':
          await this.sendDiscordNotification(notification, channel);
          break;
        case 'sms':
          await this.sendSmsNotification(notification, channel);
          break;
        default:
          console.log(`Unknown notification channel type: ${channel.type}`);
      }

      // Update notification status
      await storage.updateAlertNotification(notification.id, {
        status: 'sent',
        sentAt: new Date()
      });

    } catch (error) {
      console.error(`Error delivering ${channel.type} notification:`, error);
      
      // Update notification status to failed
      await storage.updateAlertNotification(notification.id, {
        status: 'failed',
        failureReason: error.message
      });
    }
  }

  // =====================================================
  // Notification Channel Implementations
  // =====================================================

  private async sendEmailNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would use a service like SendGrid, AWS SES, or Nodemailer
    console.log(`📧 Email notification sent to ${channel.endpoint}:`, {
      subject: notification.subject,
      message: notification.message
    });
  }

  private async sendSlackNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would use the Slack Web API
    const slackMessage = {
      text: notification.subject,
      attachments: [{
        color: this.getSlackColorBySeverity(notification.priority),
        fields: [{
          title: "Alert Details",
          value: notification.message,
          short: false
        }]
      }]
    };

    console.log(`💬 Slack notification sent to ${channel.endpoint}:`, slackMessage);
  }

  private async sendWebhookNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would make an HTTP POST request
    const webhookPayload = {
      alertId: notification.alertRuleId,
      projectId: notification.projectId,
      subject: notification.subject,
      message: notification.message,
      priority: notification.priority,
      timestamp: notification.createdAt,
      metadata: notification.metadata
    };

    console.log(`🔗 Webhook notification sent to ${channel.endpoint}:`, webhookPayload);
  }

  private async sendTeamsNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would use Microsoft Teams webhook API
    console.log(`👥 Teams notification sent to ${channel.endpoint}:`, {
      subject: notification.subject,
      message: notification.message
    });
  }

  private async sendDiscordNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would use Discord webhook API
    console.log(`🎮 Discord notification sent to ${channel.endpoint}:`, {
      subject: notification.subject,
      message: notification.message
    });
  }

  private async sendSmsNotification(notification: AlertNotification, channel: NotificationChannel): Promise<void> {
    // In a real implementation, this would use a service like Twilio
    const smsText = `${notification.subject}\n\n${notification.message}`.substring(0, 160);
    console.log(`📱 SMS notification sent to ${channel.endpoint}:`, smsText);
  }

  // =====================================================
  // Escalation Management
  // =====================================================

  private async startEscalationProcess(alertContext: AlertContext): Promise<void> {
    try {
      const escalationRules = alertContext.alertRule.escalationRules as EscalationPolicy;
      if (!escalationRules || !escalationRules.levels) return;

      const alertKey = `${alertContext.projectId}_${alertContext.alertRule.id}`;
      
      // Start with the first escalation level
      this.scheduleEscalation(alertKey, alertContext, escalationRules, 0);
    } catch (error) {
      console.error('Error starting escalation process:', error);
    }
  }

  private scheduleEscalation(
    alertKey: string,
    alertContext: AlertContext,
    escalationRules: EscalationPolicy,
    levelIndex: number
  ): void {
    if (levelIndex >= escalationRules.levels.length) {
      console.log('All escalation levels exhausted for alert:', alertContext.alertRule.name);
      return;
    }

    const level = escalationRules.levels[levelIndex];
    const delayMs = level.delayMinutes * 60 * 1000;

    const timer = setTimeout(async () => {
      // Check if alert is still active
      if (!this.activeAlerts.has(alertKey)) {
        console.log('Alert resolved before escalation level', levelIndex + 1);
        return;
      }

      console.log(`⬆️ Escalating alert "${alertContext.alertRule.name}" to level ${levelIndex + 1}`);

      // Send escalation notifications
      await this.sendEscalationNotifications(alertContext, level, levelIndex + 1);

      // Schedule next escalation level
      this.scheduleEscalation(alertKey, alertContext, escalationRules, levelIndex + 1);
    }, delayMs);

    // Store timer for cleanup
    this.escalationTimers.set(alertKey, timer);
  }

  private async sendEscalationNotifications(
    alertContext: AlertContext,
    level: EscalationLevel,
    levelNumber: number
  ): Promise<void> {
    const message = `🚨 **ESCALATED TO LEVEL ${levelNumber}**\n\n` +
                   `Alert: ${alertContext.alertRule.name}\n` +
                   `Severity: ${alertContext.severity}\n` +
                   `Current Value: ${alertContext.triggerValue}\n` +
                   `Threshold: ${alertContext.threshold}\n\n` +
                   `This alert has been escalated due to lack of acknowledgment.`;

    const subject = `🚨 ESCALATED L${levelNumber}: ${alertContext.alertRule.name}`;

    for (const channel of level.channels) {
      if (!channel.isEnabled) continue;

      try {
        const notification = await storage.createAlertNotification({
          alertRuleId: alertContext.alertRule.id,
          projectId: alertContext.projectId,
          notificationType: channel.type,
          channel: channel.endpoint,
          subject,
          message,
          priority: 'critical',
          status: 'pending',
          metadata: {
            escalationLevel: levelNumber,
            recipients: level.recipients
          }
        });

        await this.deliverNotification(notification, channel);
      } catch (error) {
        console.error(`Error sending escalation notification:`, error);
      }
    }
  }

  // =====================================================
  // Automatic Actions
  // =====================================================

  private async executeAutomaticActions(alertContext: AlertContext): Promise<void> {
    try {
      const actions = alertContext.alertRule.automaticActions as any[];
      if (!actions || actions.length === 0) return;

      console.log(`Executing ${actions.length} automatic actions for alert: ${alertContext.alertRule.name}`);

      for (const action of actions) {
        try {
          await this.executeAction(action, alertContext);
        } catch (error) {
          console.error(`Error executing automatic action:`, error);
        }
      }
    } catch (error) {
      console.error('Error executing automatic actions:', error);
    }
  }

  private async executeAction(action: any, alertContext: AlertContext): Promise<void> {
    switch (action.type) {
      case 'scale':
        console.log(`🔄 Auto-scaling triggered for ${action.resource}`);
        break;
      case 'restart':
        console.log(`🔄 Service restart triggered for ${action.service}`);
        break;
      case 'runbook':
        console.log(`📖 Runbook execution triggered: ${action.runbook}`);
        break;
      case 'webhook':
        console.log(`🔗 Webhook triggered: ${action.url}`);
        break;
      default:
        console.log(`Unknown action type: ${action.type}`);
    }
  }

  // =====================================================
  // Utility Methods
  // =====================================================

  private async generateAlertMessage(alertContext: AlertContext): Promise<string> {
    const { alertRule, triggerValue, threshold, severity } = alertContext;
    const conditions = alertRule.conditions as any;

    return `🚨 **ALERT TRIGGERED**: ${alertRule.name}\n\n` +
           `**Severity**: ${severity.toUpperCase()}\n` +
           `**Metric**: ${conditions?.metric || 'Unknown'}\n` +
           `**Current Value**: ${triggerValue}\n` +
           `**Threshold**: ${threshold}\n` +
           `**Condition**: ${conditions?.operator || '>'} ${threshold}\n` +
           `**Project**: ${alertRule.projectId}\n` +
           `**Time**: ${new Date().toISOString()}\n\n` +
           `**Description**: ${alertRule.description || 'No description provided'}\n\n` +
           `Please investigate this issue immediately.`;
  }

  private shouldNotifyChannel(channel: NotificationChannel, severity: string): boolean {
    const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 };
    const channelLevel = severityLevels[channel.priority];
    const alertLevel = severityLevels[severity as keyof typeof severityLevels];
    
    return alertLevel >= channelLevel;
  }

  private mapSeverityToPriority(severity: string): string {
    switch (severity) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  private getSlackColorBySeverity(priority: string): string {
    switch (priority) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6600';
      case 'medium': return '#FFCC00';
      default: return '#36a64f';
    }
  }

  private calculateAlertDuration(startTime: Date, endTime: Date): string {
    const durationMs = endTime.getTime() - startTime.getTime();
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  }

  private isAlertSuppressed(alertRuleId: string, timestamp: Date): boolean {
    return this.suppressedAlerts.has(alertRuleId);
  }

  private suppressAlert(alertRuleId: string, durationSeconds: number): void {
    this.suppressedAlerts.add(alertRuleId);
    
    setTimeout(() => {
      this.suppressedAlerts.delete(alertRuleId);
      console.log(`Alert suppression lifted for rule: ${alertRuleId}`);
    }, durationSeconds * 1000);
  }

  private async checkConsecutiveViolations(rule: AlertRule, value: number, required: number): Promise<boolean> {
    // This would check historical violations in a real implementation
    // For now, just return true if we have enough violations
    return true;
  }

  // =====================================================
  // Public API Methods
  // =====================================================

  /**
   * Get active alerts for a project
   */
  getActiveAlerts(projectId: string): AlertContext[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.projectId === projectId);
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertRuleId: string, acknowledgedBy: string): Promise<void> {
    const alertKey = Array.from(this.activeAlerts.keys()).find(key => key.includes(alertRuleId));
    
    if (alertKey) {
      console.log(`✅ Alert acknowledged by ${acknowledgedBy}: ${alertRuleId}`);
      // Stop escalation process
      if (this.escalationTimers.has(alertKey)) {
        clearTimeout(this.escalationTimers.get(alertKey)!);
        this.escalationTimers.delete(alertKey);
      }
    }
  }

  /**
   * Get alert management statistics
   */
  getStatistics(): any {
    return {
      activeAlerts: this.activeAlerts.size,
      suppressedAlerts: this.suppressedAlerts.size,
      activeEscalations: this.escalationTimers.size
    };
  }
}

// Export singleton instance
export const alertManagementService = new AlertManagementService();