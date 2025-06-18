import { DynamicTool } from '@langchain/core/tools';
import * as k8s from '@kubernetes/client-node';

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
try {
    kc.loadFromDefault();
} catch (error) {
    console.warn('Failed to load kubeconfig, Kubernetes tools will be disabled:', error);
}

const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);

// Helper function to format error messages
const formatK8sError = (error: any): string => {
    if (error.response?.body?.message) {
        return error.response.body.message;
    }
    return error.message || 'Unknown Kubernetes API error';
};

// Tool: List pods in a namespace
const listPods = new DynamicTool({
    name: 'k8s_list_pods',
    description: 'List all pods in a specific Kubernetes namespace. Input should be a namespace name.',
    func: async (namespace: string): Promise<string> => {
        try {
            const response = await k8sCoreApi.listNamespacedPod({ namespace });
            const pods = response.items.map(pod => ({
                name: pod.metadata?.name,
                status: pod.status?.phase,
                ready: pod.status?.conditions?.find(c => c.type === 'Ready')?.status === 'True',
                restarts: pod.status?.containerStatuses?.reduce((sum, cs) => sum + cs.restartCount, 0) || 0,
                age: pod.metadata?.creationTimestamp
            }));
            
            if (pods.length === 0) {
                return `No pods found in namespace "${namespace}".`;
            }
            
            return `Pods in namespace "${namespace}":\n${pods.map(p => 
                `- ${p.name}: ${p.status} (Ready: ${p.ready}, Restarts: ${p.restarts})`
            ).join('\n')}`;
        } catch (error) {
            return `Error listing pods: ${formatK8sError(error)}`;
        }
    }
});

// Tool: Get deployment status
const getDeploymentStatus = new DynamicTool({
    name: 'k8s_deployment_status',
    description: 'Get the status of a Kubernetes deployment. Input should be JSON: {"namespace": "default", "name": "deployment-name"}',
    func: async (input: string): Promise<string> => {
        try {
            const { namespace, name } = JSON.parse(input);
            const deployment = await k8sAppsApi.readNamespacedDeployment({ 
                namespace, 
                name 
            });
            
            const status = deployment.status;
            const spec = deployment.spec;
            
            return `Deployment "${name}" in namespace "${namespace}":
- Desired Replicas: ${spec?.replicas || 0}
- Current Replicas: ${status?.replicas || 0}
- Ready Replicas: ${status?.readyReplicas || 0}
- Available Replicas: ${status?.availableReplicas || 0}
- Updated Replicas: ${status?.updatedReplicas || 0}
- Conditions: ${status?.conditions?.map(c => `${c.type}: ${c.status}`).join(', ') || 'None'}`;
        } catch (error) {
            return `Error getting deployment status: ${formatK8sError(error)}`;
        }
    }
});

// Tool: Describe a pod (get events and logs)
const describePod = new DynamicTool({
    name: 'k8s_describe_pod',
    description: 'Get detailed information about a pod including recent events. Input should be JSON: {"namespace": "default", "name": "pod-name"}',
    func: async (input: string): Promise<string> => {
        try {
            const { namespace, name } = JSON.parse(input);
            
            // Get pod details
            const pod = await k8sCoreApi.readNamespacedPod({ namespace, name });
            
            // Get pod events
            const eventList = await k8sCoreApi.listNamespacedEvent({ 
                namespace,
                fieldSelector: `involvedObject.name=${name}`
            });
            const events = eventList.items || [];
            
            // Try to get recent logs (last 50 lines)
            let logs = '';
            try {
                logs = await k8sCoreApi.readNamespacedPodLog({ 
                    namespace, 
                    name,
                    tailLines: 50
                });
            } catch (logError) {
                logs = 'Unable to retrieve logs: ' + formatK8sError(logError);
            }
            
            const containerStatuses = pod.status?.containerStatuses || [];
            
            return `Pod "${name}" in namespace "${namespace}":
            
Status: ${pod.status?.phase}
Conditions: ${pod.status?.conditions?.map(c => `${c.type}: ${c.status}`).join(', ') || 'None'}
Node: ${pod.spec?.nodeName || 'Not scheduled'}
IP: ${pod.status?.podIP || 'No IP assigned'}

Container Statuses:
${containerStatuses.map(cs => `- ${cs.name}: Ready: ${cs.ready}, Restarts: ${cs.restartCount}`).join('\n')}

Recent Events (${events.length}):
${events.slice(-5).map(e => `- ${e.type}: ${e.reason} - ${e.message}`).join('\n') || 'No recent events'}

Recent Logs:
${logs || 'No logs available'}`;
        } catch (error) {
            return `Error describing pod: ${formatK8sError(error)}`;
        }
    }
});

// Tool: Scale a deployment
const scaleDeployment = new DynamicTool({
    name: 'k8s_scale_deployment',
    description: 'Scale a Kubernetes deployment to a specific number of replicas. Input should be JSON: {"namespace": "default", "name": "deployment-name", "replicas": 3}',
    func: async (input: string): Promise<string> => {
        try {
            const { namespace, name, replicas } = JSON.parse(input);
            
            // Get current deployment
            const deployment = await k8sAppsApi.readNamespacedDeployment({ 
                namespace, 
                name 
            });
            
            // Update the replica count
            deployment.spec!.replicas = replicas;
            
            // Apply the update
            const updated = await k8sAppsApi.replaceNamespacedDeployment({
                namespace,
                name,
                body: deployment
            });
            
            return `Successfully scaled deployment "${name}" in namespace "${namespace}" to ${replicas} replicas. Current status: ${updated.status?.replicas || 0} replicas running.`;
        } catch (error) {
            return `Error scaling deployment: ${formatK8sError(error)}`;
        }
    }
});

// Tool: Restart a deployment (by updating annotation)
const restartDeployment = new DynamicTool({
    name: 'k8s_restart_deployment',
    description: 'Restart a Kubernetes deployment by updating its pod template annotation. Input should be JSON: {"namespace": "default", "name": "deployment-name"}',
    func: async (input: string): Promise<string> => {
        try {
            const { namespace, name } = JSON.parse(input);
            
            // Get current deployment
            const deployment = await k8sAppsApi.readNamespacedDeployment({ 
                namespace, 
                name 
            });
            
            // Update restart annotation
            if (!deployment.spec?.template?.metadata?.annotations) {
                deployment.spec!.template!.metadata = deployment.spec!.template!.metadata || {};
                deployment.spec!.template!.metadata.annotations = {};
            }
            deployment.spec!.template!.metadata!.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();
            
            // Apply the update
            await k8sAppsApi.replaceNamespacedDeployment({
                namespace,
                name,
                body: deployment
            });
            
            return `Successfully triggered restart of deployment "${name}" in namespace "${namespace}". Pods will be recreated.`;
        } catch (error) {
            return `Error restarting deployment: ${formatK8sError(error)}`;
        }
    }
});

export const kubernetesTools = [
    listPods,
    getDeploymentStatus,
    describePod,
    scaleDeployment,
    restartDeployment
]; 