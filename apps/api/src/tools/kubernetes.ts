import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { KubeConfig, CoreV1Api, AppsV1Api, NetworkingV1Api } from "@kubernetes/client-node";
import * as yaml from "js-yaml";
import * as fs from "fs/promises";
import * as path from "path";

// Initialize Kubernetes client
const kc = new KubeConfig();
try {
  kc.loadFromDefault();
} catch (error) {
  console.log("No default kubeconfig found, will use in-cluster config when available");
}

const k8sApi = kc.makeApiClient(CoreV1Api);
const appsApi = kc.makeApiClient(AppsV1Api);
const networkingApi = kc.makeApiClient(NetworkingV1Api);

export const generateK8sManifest = tool(
  async ({ resourceType, config }) => {
    try {
      let manifest: any;
      
      switch (resourceType) {
        case "deployment":
          manifest = generateDeploymentManifest(config);
          break;
        case "service":
          manifest = generateServiceManifest(config);
          break;
        case "ingress":
          manifest = generateIngressManifest(config);
          break;
        case "configmap":
          manifest = generateConfigMapManifest(config);
          break;
        case "secret":
          manifest = generateSecretManifest(config);
          break;
        case "statefulset":
          manifest = generateStatefulSetManifest(config);
          break;
        default:
          return { error: `Unsupported resource type: ${resourceType}` };
      }
      
      const yamlStr = yaml.dump(manifest);
      
      return {
        success: true,
        manifest: yamlStr,
        parsed: manifest,
        message: `${resourceType} manifest generated successfully`
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "generate_k8s_manifest",
    description: "Generate Kubernetes manifest for various resources",
    schema: z.object({
      resourceType: z.enum(["deployment", "service", "ingress", "configmap", "secret", "statefulset"]),
      config: z.object({
        name: z.string(),
        namespace: z.string().optional(),
        labels: z.record(z.string()).optional(),
        replicas: z.number().optional(),
        image: z.string().optional(),
        ports: z.array(z.number()).optional(),
        env: z.record(z.string()).optional(),
        resources: z.object({
          requests: z.object({
            cpu: z.string().optional(),
            memory: z.string().optional()
          }).optional(),
          limits: z.object({
            cpu: z.string().optional(),
            memory: z.string().optional()
          }).optional()
        }).optional()
      })
    })
  }
);

export const debugPodIssues = tool(
  async ({ podName, namespace = "default" }) => {
    try {
      // Get pod details
      const pod = await k8sApi.readNamespacedPod(podName, namespace);
      
      // Get pod events
      const events = await k8sApi.listNamespacedEvent(namespace);
      const podEvents = events.body.items.filter(
        (event: any) => event.involvedObject.name === podName
      );
      
      // Get pod logs
      let logs = "";
      try {
        const logResponse = await k8sApi.readNamespacedPodLog(podName, namespace);
        logs = logResponse.body;
      } catch (error) {
        logs = "Unable to retrieve logs";
      }
      
      // Analyze issues
      const issues = analyzePodIssues(pod.body, podEvents);
      
      return {
        success: true,
        pod: {
          name: pod.body.metadata?.name,
          status: pod.body.status?.phase,
          conditions: pod.body.status?.conditions,
          containerStatuses: pod.body.status?.containerStatuses
        },
        events: podEvents.map((e: any) => ({
          type: e.type,
          reason: e.reason,
          message: e.message,
          timestamp: e.firstTimestamp
        })),
        logs: logs.slice(-1000), // Last 1000 chars
        issues,
        recommendations: generateRecommendations(issues)
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "debug_pod_issues",
    description: "Debug issues with a Kubernetes pod including events, logs, and status",
    schema: z.object({
      podName: z.string(),
      namespace: z.string().optional()
    })
  }
);

export const scaleDeployment = tool(
  async ({ deploymentName, namespace = "default", replicas }) => {
    try {
      // Get current deployment
      const deployment = await appsApi.readNamespacedDeployment(deploymentName, namespace);
      
      // Update replica count
      deployment.body.spec!.replicas = replicas;
      
      // Apply the update using partial patch
      const patch = [{
        op: "replace",
        path: "/spec/replicas",
        value: replicas
      }];
      
      const updated = await appsApi.patchNamespacedDeployment(
        deploymentName,
        namespace,
        patch as any,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        { headers: { "Content-Type": "application/json-patch+json" } }
      );
      
      return {
        success: true,
        message: `Deployment ${deploymentName} scaled to ${replicas} replicas`,
        previousReplicas: deployment.body.spec?.replicas,
        currentReplicas: replicas
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "scale_deployment",
    description: "Scale a Kubernetes deployment to specified number of replicas",
    schema: z.object({
      deploymentName: z.string(),
      namespace: z.string().optional(),
      replicas: z.number().min(0).max(100)
    })
  }
);

export const applyK8sResource = tool(
  async ({ manifest, dryRun = false }) => {
    try {
      const resources = yaml.loadAll(manifest);
      const results = [];
      
      for (const resource of resources) {
        if (!resource || typeof resource !== 'object') continue;
        
        const res = resource as any;
        const kind = res.kind;
        const namespace = res.metadata?.namespace || 'default';
        
        let result;
        
        switch (kind) {
          case 'Deployment':
            if (dryRun) {
              result = { kind, name: res.metadata.name, action: 'would create/update' };
            } else {
              result = await appsApi.createNamespacedDeployment(namespace, res);
            }
            break;
          case 'Service':
            if (dryRun) {
              result = { kind, name: res.metadata.name, action: 'would create/update' };
            } else {
              result = await k8sApi.createNamespacedService(namespace, res);
            }
            break;
          case 'ConfigMap':
            if (dryRun) {
              result = { kind, name: res.metadata.name, action: 'would create/update' };
            } else {
              result = await k8sApi.createNamespacedConfigMap(namespace, res);
            }
            break;
          default:
            result = { error: `Unsupported resource kind: ${kind}` };
        }
        
        results.push(result);
      }
      
      return {
        success: true,
        message: dryRun ? "Dry run completed" : "Resources applied successfully",
        results
      };
    } catch (error: any) {
      return { error: error.message };
    }
  },
  {
    name: "apply_k8s_resource",
    description: "Apply Kubernetes resources from YAML manifest",
    schema: z.object({
      manifest: z.string().describe("YAML manifest content"),
      dryRun: z.boolean().optional().describe("Perform a dry run without creating resources")
    })
  }
);

// Helper functions
function generateDeploymentManifest(config: any) {
  return {
    apiVersion: "apps/v1",
    kind: "Deployment",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default",
      labels: config.labels || { app: config.name }
    },
    spec: {
      replicas: config.replicas || 3,
      selector: {
        matchLabels: { app: config.name }
      },
      template: {
        metadata: {
          labels: { app: config.name }
        },
        spec: {
          containers: [{
            name: config.name,
            image: config.image || "nginx:latest",
            ports: (config.ports || [80]).map((port: number) => ({
              containerPort: port
            })),
            env: Object.entries(config.env || {}).map(([key, value]) => ({
              name: key,
              value: String(value)
            })),
            resources: config.resources || {
              requests: { cpu: "100m", memory: "128Mi" },
              limits: { cpu: "500m", memory: "512Mi" }
            }
          }]
        }
      }
    }
  };
}

function generateServiceManifest(config: any) {
  return {
    apiVersion: "v1",
    kind: "Service",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default",
      labels: config.labels || { app: config.name }
    },
    spec: {
      selector: { app: config.name },
      ports: (config.ports || [80]).map((port: number, index: number) => ({
        port: port,
        targetPort: port,
        name: `port-${index}`
      })),
      type: config.type || "ClusterIP"
    }
  };
}

function generateIngressManifest(config: any) {
  return {
    apiVersion: "networking.k8s.io/v1",
    kind: "Ingress",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default",
      annotations: {
        "kubernetes.io/ingress.class": "nginx",
        ...config.annotations
      }
    },
    spec: {
      rules: [{
        host: config.host,
        http: {
          paths: [{
            path: config.path || "/",
            pathType: "Prefix",
            backend: {
              service: {
                name: config.serviceName || config.name,
                port: {
                  number: config.servicePort || 80
                }
              }
            }
          }]
        }
      }]
    }
  };
}

function generateConfigMapManifest(config: any) {
  return {
    apiVersion: "v1",
    kind: "ConfigMap",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default"
    },
    data: config.data || {}
  };
}

function generateSecretManifest(config: any) {
  const data: any = {};
  for (const [key, value] of Object.entries(config.data || {})) {
    data[key] = Buffer.from(String(value)).toString('base64');
  }
  
  return {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default"
    },
    type: config.type || "Opaque",
    data
  };
}

function generateStatefulSetManifest(config: any) {
  return {
    apiVersion: "apps/v1",
    kind: "StatefulSet",
    metadata: {
      name: config.name,
      namespace: config.namespace || "default"
    },
    spec: {
      serviceName: config.serviceName || config.name,
      replicas: config.replicas || 3,
      selector: {
        matchLabels: { app: config.name }
      },
      template: {
        metadata: {
          labels: { app: config.name }
        },
        spec: {
          containers: [{
            name: config.name,
            image: config.image || "nginx:latest",
            ports: (config.ports || [80]).map((port: number) => ({
              containerPort: port
            })),
            volumeMounts: config.volumeMounts || []
          }]
        }
      },
      volumeClaimTemplates: config.volumeClaimTemplates || []
    }
  };
}

function analyzePodIssues(pod: any, events: any[]): string[] {
  const issues = [];
  
  // Check pod status
  if (pod.status?.phase === 'Pending') {
    issues.push('Pod is stuck in Pending state');
  }
  
  // Check container statuses
  for (const container of pod.status?.containerStatuses || []) {
    if (container.state?.waiting) {
      issues.push(`Container ${container.name} is waiting: ${container.state.waiting.reason}`);
    }
    if (container.restartCount > 5) {
      issues.push(`Container ${container.name} has restarted ${container.restartCount} times`);
    }
  }
  
  // Check events
  for (const event of events) {
    if (event.type === 'Warning') {
      issues.push(`Warning event: ${event.reason} - ${event.message}`);
    }
  }
  
  return issues;
}

function generateRecommendations(issues: string[]): string[] {
  const recommendations = [];
  
  for (const issue of issues) {
    if (issue.includes('ImagePullBackOff')) {
      recommendations.push('Check if the image exists and credentials are correct');
    }
    if (issue.includes('CrashLoopBackOff')) {
      recommendations.push('Check application logs and ensure the container command is correct');
    }
    if (issue.includes('Pending')) {
      recommendations.push('Check if there are enough resources in the cluster');
    }
    if (issue.includes('restarted')) {
      recommendations.push('Investigate crash logs and consider adding health checks');
    }
  }
  
  return recommendations;
}

export const kubernetesTools = [
  generateK8sManifest,
  debugPodIssues,
  scaleDeployment,
  applyK8sResource
]; 