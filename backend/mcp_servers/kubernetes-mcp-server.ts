#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as k8s from '@kubernetes/client-node';
import { exec } from "child_process";
import { promisify } from "util";
import * as yaml from 'js-yaml';

const execAsync = promisify(exec);

interface K8sContext {
  cluster?: string;
  namespace?: string;
  kubeconfig?: string;
}

class KubernetesMCPServer {
  private server: Server;
  private k8sApi: k8s.KubernetesApi;
  private coreV1Api: k8s.CoreV1Api;
  private appsV1Api: k8s.AppsV1Api;

  constructor() {
    this.server = new Server(
      {
        name: "careerate-kubernetes-tools",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.initializeK8sClient();
    this.setupToolHandlers();
  }

  private initializeK8sClient() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    
    this.k8sApi = kc.makeApiClient(k8s.KubernetesApi);
    this.coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
    this.appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "k8s_validate_manifest",
            description: "Validate Kubernetes YAML manifests",
            inputSchema: {
              type: "object",
              properties: {
                manifest: {
                  type: "string",
                  description: "Kubernetes YAML manifest to validate",
                },
              },
              required: ["manifest"],
            },
          },
          {
            name: "k8s_analyze_pods",
            description: "Analyze pod status and health",
            inputSchema: {
              type: "object",
              properties: {
                namespace: {
                  type: "string",
                  description: "Kubernetes namespace (optional)",
                },
                podName: {
                  type: "string",
                  description: "Specific pod name (optional)",
                },
              },
            },
          },
          {
            name: "k8s_troubleshoot_deployment",
            description: "Troubleshoot deployment issues",
            inputSchema: {
              type: "object",
              properties: {
                deploymentName: {
                  type: "string",
                  description: "Deployment name to troubleshoot",
                },
                namespace: {
                  type: "string",
                  description: "Kubernetes namespace",
                  default: "default",
                },
              },
              required: ["deploymentName"],
            },
          },
          {
            name: "k8s_get_events",
            description: "Get Kubernetes events for troubleshooting",
            inputSchema: {
              type: "object",
              properties: {
                namespace: {
                  type: "string",
                  description: "Kubernetes namespace",
                },
                resourceName: {
                  type: "string",
                  description: "Specific resource name (optional)",
                },
              },
            },
          },
          {
            name: "k8s_generate_manifest",
            description: "Generate Kubernetes manifests from description",
            inputSchema: {
              type: "object",
              properties: {
                description: {
                  type: "string",
                  description: "Description of what to deploy",
                },
                resourceType: {
                  type: "string",
                  enum: ["deployment", "service", "configmap", "secret", "ingress"],
                  description: "Type of Kubernetes resource",
                },
                namespace: {
                  type: "string",
                  description: "Target namespace",
                  default: "default",
                },
              },
              required: ["description", "resourceType"],
            },
          },
          {
            name: "k8s_security_scan",
            description: "Scan manifests for security issues",
            inputSchema: {
              type: "object",
              properties: {
                manifest: {
                  type: "string",
                  description: "Kubernetes manifest to scan",
                },
              },
              required: ["manifest"],
            },
          },
          {
            name: "k8s_resource_usage",
            description: "Get cluster resource usage and recommendations",
            inputSchema: {
              type: "object",
              properties: {
                namespace: {
                  type: "string",
                  description: "Kubernetes namespace (optional)",
                },
              },
            },
          },
          {
            name: "k8s_explain_concept",
            description: "Explain Kubernetes concepts with examples",
            inputSchema: {
              type: "object",
              properties: {
                concept: {
                  type: "string",
                  description: "Kubernetes concept to explain",
                },
                level: {
                  type: "string",
                  enum: ["beginner", "intermediate", "advanced"],
                  default: "intermediate",
                },
              },
              required: ["concept"],
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "k8s_validate_manifest":
            return await this.validateManifest(args);
          case "k8s_analyze_pods":
            return await this.analyzePods(args);
          case "k8s_troubleshoot_deployment":
            return await this.troubleshootDeployment(args);
          case "k8s_get_events":
            return await this.getEvents(args);
          case "k8s_generate_manifest":
            return await this.generateManifest(args);
          case "k8s_security_scan":
            return await this.securityScan(args);
          case "k8s_resource_usage":
            return await this.getResourceUsage(args);
          case "k8s_explain_concept":
            return await this.explainConcept(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing ${name}: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async validateManifest(args: any) {
    const { manifest } = args;

    try {
      // Parse YAML
      const docs = yaml.loadAll(manifest);
      const validationResults = [];

      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;

        const result = this.validateSingleResource(doc as any);
        validationResults.push(result);
      }

      const hasErrors = validationResults.some(r => r.errors.length > 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              valid: !hasErrors,
              results: validationResults,
              summary: hasErrors ? "Manifest has validation errors" : "Manifest is valid",
            }, null, 2),
          },
        ],
        isError: hasErrors,
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `YAML parsing error: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  private validateSingleResource(resource: any) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!resource.apiVersion) errors.push("Missing apiVersion");
    if (!resource.kind) errors.push("Missing kind");
    if (!resource.metadata?.name) errors.push("Missing metadata.name");

    // Resource-specific validation
    switch (resource.kind) {
      case 'Deployment':
        this.validateDeployment(resource, errors, warnings);
        break;
      case 'Service':
        this.validateService(resource, errors, warnings);
        break;
      case 'Pod':
        this.validatePod(resource, errors, warnings);
        break;
    }

    return {
      kind: resource.kind,
      name: resource.metadata?.name || 'unknown',
      errors,
      warnings,
    };
  }

  private validateDeployment(deployment: any, errors: string[], warnings: string[]) {
    if (!deployment.spec?.template?.spec?.containers) {
      errors.push("Deployment must have containers");
      return;
    }

    const containers = deployment.spec.template.spec.containers;
    
    containers.forEach((container: any, index: number) => {
      if (!container.image) {
        errors.push(`Container ${index} missing image`);
      }
      
      if (!container.resources) {
        warnings.push(`Container ${container.name || index} missing resource limits`);
      }
      
      if (!container.securityContext) {
        warnings.push(`Container ${container.name || index} missing security context`);
      }
    });
  }

  private validateService(service: any, errors: string[], warnings: string[]) {
    if (!service.spec?.ports) {
      errors.push("Service must have ports");
    }
    
    if (!service.spec?.selector) {
      warnings.push("Service should have selector");
    }
  }

  private validatePod(pod: any, errors: string[], warnings: string[]) {
    if (!pod.spec?.containers) {
      errors.push("Pod must have containers");
    }
  }

  private async analyzePods(args: any) {
    const { namespace, podName } = args;

    try {
      let pods: k8s.V1Pod[];

      if (podName && namespace) {
        const response = await this.coreV1Api.readNamespacedPod(podName, namespace);
        pods = [response.body];
      } else if (namespace) {
        const response = await this.coreV1Api.listNamespacedPod(namespace);
        pods = response.body.items;
      } else {
        const response = await this.coreV1Api.listPodForAllNamespaces();
        pods = response.body.items;
      }

      const analysis = pods.map(pod => this.analyzeSinglePod(pod));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              totalPods: pods.length,
              analysis,
              summary: `Analyzed ${pods.length} pods`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to analyze pods: ${error.message}`);
    }
  }

  private analyzeSinglePod(pod: k8s.V1Pod) {
    const containerStatuses = pod.status?.containerStatuses || [];
    const phase = pod.status?.phase;
    
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check pod phase
    if (phase === 'Failed') {
      issues.push('Pod is in Failed state');
    } else if (phase === 'Pending') {
      issues.push('Pod is stuck in Pending state');
    }

    // Check container statuses
    containerStatuses.forEach(status => {
      if (!status.ready) {
        issues.push(`Container ${status.name} is not ready`);
      }
      
      if (status.restartCount && status.restartCount > 0) {
        issues.push(`Container ${status.name} has restarted ${status.restartCount} times`);
      }

      if (status.state?.waiting) {
        issues.push(`Container ${status.name} is waiting: ${status.state.waiting.reason}`);
      }
    });

    // Resource recommendations
    const containers = pod.spec?.containers || [];
    containers.forEach(container => {
      if (!container.resources?.limits) {
        recommendations.push(`Add resource limits to container ${container.name}`);
      }
      
      if (!container.livenessProbe) {
        recommendations.push(`Add liveness probe to container ${container.name}`);
      }
      
      if (!container.readinessProbe) {
        recommendations.push(`Add readiness probe to container ${container.name}`);
      }
    });

    return {
      name: pod.metadata?.name,
      namespace: pod.metadata?.namespace,
      phase,
      issues,
      recommendations,
      createdAt: pod.metadata?.creationTimestamp,
    };
  }

  private async troubleshootDeployment(args: any) {
    const { deploymentName, namespace = 'default' } = args;

    try {
      // Get deployment
      const deployment = await this.appsV1Api.readNamespacedDeployment(deploymentName, namespace);
      
      // Get replica set
      const replicaSets = await this.appsV1Api.listNamespacedReplicaSet(namespace, undefined, undefined, undefined, undefined, `app=${deploymentName}`);
      
      // Get pods
      const pods = await this.coreV1Api.listNamespacedPod(namespace, undefined, undefined, undefined, undefined, `app=${deploymentName}`);
      
      // Get events
      const events = await this.coreV1Api.listNamespacedEvent(namespace);
      const relevantEvents = events.body.items.filter(event => 
        event.involvedObject?.name?.includes(deploymentName)
      );

      const troubleshootingReport = {
        deployment: {
          name: deploymentName,
          namespace,
          replicas: deployment.body.status?.replicas || 0,
          readyReplicas: deployment.body.status?.readyReplicas || 0,
          updatedReplicas: deployment.body.status?.updatedReplicas || 0,
          conditions: deployment.body.status?.conditions || [],
        },
        pods: pods.body.items.map(pod => this.analyzeSinglePod(pod)),
        events: relevantEvents.map(event => ({
          type: event.type,
          reason: event.reason,
          message: event.message,
          timestamp: event.lastTimestamp,
        })),
        recommendations: this.generateTroubleshootingRecommendations(deployment.body, pods.body.items, relevantEvents),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(troubleshootingReport, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to troubleshoot deployment: ${error.message}`);
    }
  }

  private generateTroubleshootingRecommendations(deployment: k8s.V1Deployment, pods: k8s.V1Pod[], events: k8s.CoreV1Event[]): string[] {
    const recommendations: string[] = [];
    
    // Check if deployment is progressing
    const progressingCondition = deployment.status?.conditions?.find(c => c.type === 'Progressing');
    if (progressingCondition?.status === 'False') {
      recommendations.push('Deployment is not progressing. Check pod events and logs.');
    }

    // Check for image pull errors
    const imagePullEvents = events.filter(e => e.reason?.includes('ImagePull'));
    if (imagePullEvents.length > 0) {
      recommendations.push('Image pull errors detected. Verify image exists and credentials are correct.');
    }

    // Check for insufficient resources
    const resourceEvents = events.filter(e => e.reason?.includes('FailedScheduling'));
    if (resourceEvents.length > 0) {
      recommendations.push('Pod scheduling failures detected. Check cluster resource availability.');
    }

    // Check pod restart patterns
    const highRestartPods = pods.filter(pod => 
      pod.status?.containerStatuses?.some(cs => (cs.restartCount || 0) > 3)
    );
    if (highRestartPods.length > 0) {
      recommendations.push('High restart count detected. Check application health and resource limits.');
    }

    return recommendations;
  }

  private async getEvents(args: any) {
    const { namespace, resourceName } = args;

    try {
      let events: k8s.CoreV1Event[];

      if (namespace) {
        const response = await this.coreV1Api.listNamespacedEvent(namespace);
        events = response.body.items;
      } else {
        const response = await this.coreV1Api.listEventForAllNamespaces();
        events = response.body.items;
      }

      if (resourceName) {
        events = events.filter(event => 
          event.involvedObject?.name?.includes(resourceName)
        );
      }

      // Sort by timestamp (most recent first)
      events.sort((a, b) => {
        const aTime = new Date(a.lastTimestamp || a.firstTimestamp || 0);
        const bTime = new Date(b.lastTimestamp || b.firstTimestamp || 0);
        return bTime.getTime() - aTime.getTime();
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              eventCount: events.length,
              events: events.slice(0, 50).map(event => ({
                type: event.type,
                reason: event.reason,
                message: event.message,
                object: `${event.involvedObject?.kind}/${event.involvedObject?.name}`,
                namespace: event.namespace,
                timestamp: event.lastTimestamp || event.firstTimestamp,
              })),
              summary: `Found ${events.length} events`,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get events: ${error.message}`);
    }
  }

  private async generateManifest(args: any) {
    const { description, resourceType, namespace = 'default' } = args;

    // This would typically use an LLM to generate the manifest
    // For now, providing templates based on resource type
    
    const templates = {
      deployment: this.generateDeploymentTemplate(description, namespace),
      service: this.generateServiceTemplate(description, namespace),
      configmap: this.generateConfigMapTemplate(description, namespace),
      secret: this.generateSecretTemplate(description, namespace),
      ingress: this.generateIngressTemplate(description, namespace),
    };

    const template = templates[resourceType as keyof typeof templates];

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            resourceType,
            manifest: yaml.dump(template),
            description: `Generated ${resourceType} manifest based on: ${description}`,
          }, null, 2),
        },
      ],
    };
  }

  private generateDeploymentTemplate(description: string, namespace: string) {
    const appName = description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: appName,
        namespace,
        labels: {
          app: appName,
        },
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: appName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: appName,
            },
          },
          spec: {
            containers: [
              {
                name: appName,
                image: 'nginx:latest', // Placeholder
                ports: [
                  {
                    containerPort: 80,
                  },
                ],
                resources: {
                  limits: {
                    cpu: '500m',
                    memory: '512Mi',
                  },
                  requests: {
                    cpu: '250m',
                    memory: '256Mi',
                  },
                },
                livenessProbe: {
                  httpGet: {
                    path: '/',
                    port: 80,
                  },
                  initialDelaySeconds: 30,
                  timeoutSeconds: 5,
                },
                readinessProbe: {
                  httpGet: {
                    path: '/',
                    port: 80,
                  },
                  initialDelaySeconds: 5,
                  timeoutSeconds: 3,
                },
              },
            ],
          },
        },
      },
    };
  }

  private generateServiceTemplate(description: string, namespace: string) {
    const appName = description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: `${appName}-service`,
        namespace,
      },
      spec: {
        selector: {
          app: appName,
        },
        ports: [
          {
            port: 80,
            targetPort: 80,
            protocol: 'TCP',
          },
        ],
        type: 'ClusterIP',
      },
    };
  }

  private generateConfigMapTemplate(description: string, namespace: string) {
    const name = description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: `${name}-config`,
        namespace,
      },
      data: {
        'config.yaml': '# Configuration file\nkey: value\n',
      },
    };
  }

  private generateSecretTemplate(description: string, namespace: string) {
    const name = description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: `${name}-secret`,
        namespace,
      },
      type: 'Opaque',
      data: {
        username: Buffer.from('admin').toString('base64'),
        password: Buffer.from('changeme').toString('base64'),
      },
    };
  }

  private generateIngressTemplate(description: string, namespace: string) {
    const name = description.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    
    return {
      apiVersion: 'networking.k8s.io/v1',
      kind: 'Ingress',
      metadata: {
        name: `${name}-ingress`,
        namespace,
        annotations: {
          'nginx.ingress.kubernetes.io/rewrite-target': '/',
        },
      },
      spec: {
        rules: [
          {
            host: `${name}.example.com`,
            http: {
              paths: [
                {
                  path: '/',
                  pathType: 'Prefix',
                  backend: {
                    service: {
                      name: `${name}-service`,
                      port: {
                        number: 80,
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }

  private async securityScan(args: any) {
    const { manifest } = args;

    try {
      const docs = yaml.loadAll(manifest);
      const securityIssues: Array<{severity: string; type: string; message: string; resource: string}> = [];

      for (const doc of docs) {
        if (!doc || typeof doc !== 'object') continue;
        
        const resource = doc as any;
        const resourceName = `${resource.kind}/${resource.metadata?.name || 'unknown'}`;

        // Check for security issues
        this.scanSecurityIssues(resource, securityIssues, resourceName);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              issues: securityIssues,
              issueCount: securityIssues.length,
              summary: securityIssues.length === 0 ? "No security issues found" : `Found ${securityIssues.length} security issues`,
            }, null, 2),
          },
        ],
        isError: securityIssues.some(issue => issue.severity === "HIGH"),
      };
    } catch (error) {
      throw new Error(`Security scan failed: ${error.message}`);
    }
  }

  private scanSecurityIssues(resource: any, issues: Array<{severity: string; type: string; message: string; resource: string}>, resourceName: string) {
    // Check for privileged containers
    if (resource.spec?.template?.spec?.containers) {
      resource.spec.template.spec.containers.forEach((container: any) => {
        if (container.securityContext?.privileged) {
          issues.push({
            severity: "HIGH",
            type: "privileged_container",
            message: "Container is running in privileged mode",
            resource: resourceName,
          });
        }

        if (!container.securityContext?.runAsNonRoot) {
          issues.push({
            severity: "MEDIUM",
            type: "root_user",
            message: "Container may be running as root user",
            resource: resourceName,
          });
        }

        if (!container.resources?.limits) {
          issues.push({
            severity: "LOW",
            type: "no_resource_limits",
            message: "Container has no resource limits",
            resource: resourceName,
          });
        }
      });
    }

    // Check for host network
    if (resource.spec?.template?.spec?.hostNetwork) {
      issues.push({
        severity: "HIGH",
        type: "host_network",
        message: "Pod is using host network",
        resource: resourceName,
      });
    }

    // Check for host PID
    if (resource.spec?.template?.spec?.hostPID) {
      issues.push({
        severity: "HIGH",
        type: "host_pid",
        message: "Pod is using host PID namespace",
        resource: resourceName,
      });
    }
  }

  private async getResourceUsage(args: any) {
    const { namespace } = args;

    try {
      // This would typically integrate with metrics-server
      // For now, providing basic resource information
      
      let pods: k8s.V1Pod[];
      if (namespace) {
        const response = await this.coreV1Api.listNamespacedPod(namespace);
        pods = response.body.items;
      } else {
        const response = await this.coreV1Api.listPodForAllNamespaces();
        pods = response.body.items;
      }

      const resourceSummary = {
        totalPods: pods.length,
        runningPods: pods.filter(p => p.status?.phase === 'Running').length,
        pendingPods: pods.filter(p => p.status?.phase === 'Pending').length,
        failedPods: pods.filter(p => p.status?.phase === 'Failed').length,
        namespaces: [...new Set(pods.map(p => p.metadata?.namespace))],
        recommendations: this.generateResourceRecommendations(pods),
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(resourceSummary, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get resource usage: ${error.message}`);
    }
  }

  private generateResourceRecommendations(pods: k8s.V1Pod[]): string[] {
    const recommendations: string[] = [];
    
    const podsWithoutLimits = pods.filter(pod => 
      pod.spec?.containers?.some(c => !c.resources?.limits)
    );
    
    if (podsWithoutLimits.length > 0) {
      recommendations.push(`${podsWithoutLimits.length} pods are missing resource limits`);
    }

    const highRestartPods = pods.filter(pod => 
      pod.status?.containerStatuses?.some(cs => (cs.restartCount || 0) > 5)
    );
    
    if (highRestartPods.length > 0) {
      recommendations.push(`${highRestartPods.length} pods have high restart counts - investigate application health`);
    }

    return recommendations;
  }

  private async explainConcept(args: any) {
    const { concept, level = 'intermediate' } = args;

    // Knowledge base of Kubernetes concepts
    const concepts: Record<string, Record<string, string>> = {
      pod: {
        beginner: "A Pod is the smallest deployable unit in Kubernetes. Think of it as a wrapper around one or more containers that share storage and network.",
        intermediate: "A Pod represents a group of one or more containers with shared storage/network and a specification for how to run the containers. Pods are ephemeral and typically managed by higher-level controllers.",
        advanced: "Pods provide shared execution context including PID namespace, network namespace, and IPC namespace. They support init containers, sidecar patterns, and lifecycle hooks for advanced orchestration scenarios."
      },
      service: {
        beginner: "A Service is like a load balancer that helps other parts of your application find and talk to your pods, even when pods are created and destroyed.",
        intermediate: "Services provide stable network identities for pods through label selectors. They enable service discovery and load balancing across pod replicas using virtual IPs and DNS.",
        advanced: "Services abstract pod networking through kube-proxy implementations (iptables, IPVS, eBPF). They support various types (ClusterIP, NodePort, LoadBalancer) and advanced features like session affinity and topology-aware routing."
      },
      deployment: {
        beginner: "A Deployment manages multiple copies of your application and can automatically restart them if they fail or update them to new versions.",
        intermediate: "Deployments provide declarative updates for pods and ReplicaSets. They handle rolling updates, rollbacks, and scaling while maintaining desired state through controllers.",
        advanced: "Deployments use ReplicaSet controllers to manage pod lifecycles. They support advanced deployment strategies (rolling, blue-green via multiple deployments), history tracking, and pausing/resuming updates."
      }
    };

    const explanation = concepts[concept.toLowerCase()]?.[level] || 
                      `I don't have specific information about "${concept}". This might be a specialized or newer Kubernetes concept.`;

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            concept,
            level,
            explanation,
            summary: `Explained ${concept} at ${level} level`,
          }, null, 2),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Kubernetes MCP Server running on stdio");
  }
}

// Run the server if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new KubernetesMCPServer();
  server.run().catch(console.error);
}

export default KubernetesMCPServer; 