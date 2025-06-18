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
exports.kubernetesTools = void 0;
const tools_1 = require("@langchain/core/tools");
const k8s = __importStar(require("@kubernetes/client-node"));
// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
try {
    kc.loadFromDefault();
}
catch (error) {
    console.warn('Failed to load kubeconfig, Kubernetes tools will be disabled:', error);
}
const k8sCoreApi = kc.makeApiClient(k8s.CoreV1Api);
const k8sAppsApi = kc.makeApiClient(k8s.AppsV1Api);
// Helper function to format error messages
const formatK8sError = (error) => {
    var _a, _b;
    if ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.body) === null || _b === void 0 ? void 0 : _b.message) {
        return error.response.body.message;
    }
    return error.message || 'Unknown Kubernetes API error';
};
// Tool: List pods in a namespace
const listPods = new tools_1.DynamicTool({
    name: 'k8s_list_pods',
    description: 'List all pods in a specific Kubernetes namespace. Input should be a namespace name.',
    func: async (namespace) => {
        try {
            const response = await k8sCoreApi.listNamespacedPod({ namespace });
            const pods = response.items.map(pod => {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                return ({
                    name: (_a = pod.metadata) === null || _a === void 0 ? void 0 : _a.name,
                    status: (_b = pod.status) === null || _b === void 0 ? void 0 : _b.phase,
                    ready: ((_e = (_d = (_c = pod.status) === null || _c === void 0 ? void 0 : _c.conditions) === null || _d === void 0 ? void 0 : _d.find(c => c.type === 'Ready')) === null || _e === void 0 ? void 0 : _e.status) === 'True',
                    restarts: ((_g = (_f = pod.status) === null || _f === void 0 ? void 0 : _f.containerStatuses) === null || _g === void 0 ? void 0 : _g.reduce((sum, cs) => sum + cs.restartCount, 0)) || 0,
                    age: (_h = pod.metadata) === null || _h === void 0 ? void 0 : _h.creationTimestamp
                });
            });
            if (pods.length === 0) {
                return `No pods found in namespace "${namespace}".`;
            }
            return `Pods in namespace "${namespace}":\n${pods.map(p => `- ${p.name}: ${p.status} (Ready: ${p.ready}, Restarts: ${p.restarts})`).join('\n')}`;
        }
        catch (error) {
            return `Error listing pods: ${formatK8sError(error)}`;
        }
    }
});
// Tool: Get deployment status
const getDeploymentStatus = new tools_1.DynamicTool({
    name: 'k8s_deployment_status',
    description: 'Get the status of a Kubernetes deployment. Input should be JSON: {"namespace": "default", "name": "deployment-name"}',
    func: async (input) => {
        var _a;
        try {
            const { namespace, name } = JSON.parse(input);
            const deployment = await k8sAppsApi.readNamespacedDeployment({
                namespace,
                name
            });
            const status = deployment.status;
            const spec = deployment.spec;
            return `Deployment "${name}" in namespace "${namespace}":
- Desired Replicas: ${(spec === null || spec === void 0 ? void 0 : spec.replicas) || 0}
- Current Replicas: ${(status === null || status === void 0 ? void 0 : status.replicas) || 0}
- Ready Replicas: ${(status === null || status === void 0 ? void 0 : status.readyReplicas) || 0}
- Available Replicas: ${(status === null || status === void 0 ? void 0 : status.availableReplicas) || 0}
- Updated Replicas: ${(status === null || status === void 0 ? void 0 : status.updatedReplicas) || 0}
- Conditions: ${((_a = status === null || status === void 0 ? void 0 : status.conditions) === null || _a === void 0 ? void 0 : _a.map(c => `${c.type}: ${c.status}`).join(', ')) || 'None'}`;
        }
        catch (error) {
            return `Error getting deployment status: ${formatK8sError(error)}`;
        }
    }
});
// Tool: Describe a pod (get events and logs)
const describePod = new tools_1.DynamicTool({
    name: 'k8s_describe_pod',
    description: 'Get detailed information about a pod including recent events. Input should be JSON: {"namespace": "default", "name": "pod-name"}',
    func: async (input) => {
        var _a, _b, _c, _d, _e, _f;
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
            }
            catch (logError) {
                logs = 'Unable to retrieve logs: ' + formatK8sError(logError);
            }
            const containerStatuses = ((_a = pod.status) === null || _a === void 0 ? void 0 : _a.containerStatuses) || [];
            return `Pod "${name}" in namespace "${namespace}":
            
Status: ${(_b = pod.status) === null || _b === void 0 ? void 0 : _b.phase}
Conditions: ${((_d = (_c = pod.status) === null || _c === void 0 ? void 0 : _c.conditions) === null || _d === void 0 ? void 0 : _d.map(c => `${c.type}: ${c.status}`).join(', ')) || 'None'}
Node: ${((_e = pod.spec) === null || _e === void 0 ? void 0 : _e.nodeName) || 'Not scheduled'}
IP: ${((_f = pod.status) === null || _f === void 0 ? void 0 : _f.podIP) || 'No IP assigned'}

Container Statuses:
${containerStatuses.map(cs => `- ${cs.name}: Ready: ${cs.ready}, Restarts: ${cs.restartCount}`).join('\n')}

Recent Events (${events.length}):
${events.slice(-5).map(e => `- ${e.type}: ${e.reason} - ${e.message}`).join('\n') || 'No recent events'}

Recent Logs:
${logs || 'No logs available'}`;
        }
        catch (error) {
            return `Error describing pod: ${formatK8sError(error)}`;
        }
    }
});
// Tool: Scale a deployment
const scaleDeployment = new tools_1.DynamicTool({
    name: 'k8s_scale_deployment',
    description: 'Scale a Kubernetes deployment to a specific number of replicas. Input should be JSON: {"namespace": "default", "name": "deployment-name", "replicas": 3}',
    func: async (input) => {
        var _a;
        try {
            const { namespace, name, replicas } = JSON.parse(input);
            // Get current deployment
            const deployment = await k8sAppsApi.readNamespacedDeployment({
                namespace,
                name
            });
            // Update the replica count
            deployment.spec.replicas = replicas;
            // Apply the update
            const updated = await k8sAppsApi.replaceNamespacedDeployment({
                namespace,
                name,
                body: deployment
            });
            return `Successfully scaled deployment "${name}" in namespace "${namespace}" to ${replicas} replicas. Current status: ${((_a = updated.status) === null || _a === void 0 ? void 0 : _a.replicas) || 0} replicas running.`;
        }
        catch (error) {
            return `Error scaling deployment: ${formatK8sError(error)}`;
        }
    }
});
// Tool: Restart a deployment (by updating annotation)
const restartDeployment = new tools_1.DynamicTool({
    name: 'k8s_restart_deployment',
    description: 'Restart a Kubernetes deployment by updating its pod template annotation. Input should be JSON: {"namespace": "default", "name": "deployment-name"}',
    func: async (input) => {
        var _a, _b, _c;
        try {
            const { namespace, name } = JSON.parse(input);
            // Get current deployment
            const deployment = await k8sAppsApi.readNamespacedDeployment({
                namespace,
                name
            });
            // Update restart annotation
            if (!((_c = (_b = (_a = deployment.spec) === null || _a === void 0 ? void 0 : _a.template) === null || _b === void 0 ? void 0 : _b.metadata) === null || _c === void 0 ? void 0 : _c.annotations)) {
                deployment.spec.template.metadata = deployment.spec.template.metadata || {};
                deployment.spec.template.metadata.annotations = {};
            }
            deployment.spec.template.metadata.annotations['kubectl.kubernetes.io/restartedAt'] = new Date().toISOString();
            // Apply the update
            await k8sAppsApi.replaceNamespacedDeployment({
                namespace,
                name,
                body: deployment
            });
            return `Successfully triggered restart of deployment "${name}" in namespace "${namespace}". Pods will be recreated.`;
        }
        catch (error) {
            return `Error restarting deployment: ${formatK8sError(error)}`;
        }
    }
});
exports.kubernetesTools = [
    listPods,
    getDeploymentStatus,
    describePod,
    scaleDeployment,
    restartDeployment
];
//# sourceMappingURL=kubernetes.js.map