"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolsByCategory = exports.tools = void 0;
const axios_1 = __importDefault(require("axios"));
const tools_1 = require("@langchain/core/tools");
const terraform_1 = require("./terraform");
const kubernetes_1 = require("./kubernetes");
const aws_1 = require("./aws");
const incident_1 = require("./incident");
const braveSearch = new tools_1.DynamicTool({
    name: 'brave_search',
    description: 'Searches the web for the most up-to-date information, including competitor analysis. Input should be a search query.',
    func: async (query) => {
        var _a;
        try {
            const apiKey = process.env.BRAVESEARCH_API_KEY;
            if (!apiKey) {
                throw new Error('BRAVESEARCH_API_KEY environment variable not set.');
            }
            console.log(`Using Brave Search for query: ${query}`);
            const response = await axios_1.default.get('https://api.search.brave.com/res/v1/web/search', {
                headers: {
                    'X-Subscription-Token': apiKey,
                    'Accept': 'application/json',
                },
                params: {
                    q: query,
                },
            });
            const results = (_a = response.data.web) === null || _a === void 0 ? void 0 : _a.results;
            if (!results || results.length === 0) {
                return 'No results found.';
            }
            // Return a formatted summary of the top results
            return results
                .slice(0, 5) // Limit to top 5 results
                .map((result) => `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`)
                .join('\n\n---\n\n');
        }
        catch (error) {
            console.error('Error during Brave Search API call:', error);
            return 'Error performing search.';
        }
    },
});
// Export all tools for agents to use
exports.tools = [
    braveSearch,
    ...(terraform_1.terraformTools || []),
    ...(kubernetes_1.kubernetesTools || []),
    ...(aws_1.awsTools || []),
    ...(incident_1.incidentTools || [])
].filter(Boolean);
// Export tool categories for specific agent access
exports.toolsByCategory = {
    general: [braveSearch],
    terraform: terraform_1.terraformTools || [],
    kubernetes: kubernetes_1.kubernetesTools || [],
    aws: aws_1.awsTools || [],
    incident: incident_1.incidentTools || []
};
//# sourceMappingURL=index.js.map