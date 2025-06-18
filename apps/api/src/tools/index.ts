import axios from 'axios';
import { DynamicTool } from '@langchain/core/tools';
import { terraformTools } from './terraform';
import { kubernetesTools } from './kubernetes';
import { awsTools } from './aws';
import { incidentTools } from './incident';

const braveSearch = new DynamicTool({
  name: 'brave_search',
  description: 'Searches the web for the most up-to-date information, including competitor analysis. Input should be a search query.',
  func: async (query: string): Promise<string> => {
    try {
      const apiKey = process.env.BRAVESEARCH_API_KEY;
      if (!apiKey) {
        throw new Error('BRAVESEARCH_API_KEY environment variable not set.');
      }

      console.log(`Using Brave Search for query: ${query}`);

      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'X-Subscription-Token': apiKey,
          'Accept': 'application/json',
        },
        params: {
          q: query,
        },
      });

      const results = response.data.web?.results;
      if (!results || results.length === 0) {
        return 'No results found.';
      }

      // Return a formatted summary of the top results
      return results
        .slice(0, 5) // Limit to top 5 results
        .map((result: any) => `Title: ${result.title}\nURL: ${result.url}\nSnippet: ${result.snippet}`)
        .join('\n\n---\n\n');
    } catch (error) {
      console.error('Error during Brave Search API call:', error);
      return 'Error performing search.';
    }
  },
});

// Export all tools for agents to use
export const tools = [
  braveSearch,
  ...(terraformTools || []),
  ...(kubernetesTools || []),
  ...(awsTools || []),
  ...(incidentTools || [])
].filter(Boolean);

// Export tool categories for specific agent access
export const toolsByCategory = {
  general: [braveSearch],
  terraform: terraformTools || [],
  kubernetes: kubernetesTools || [],
  aws: awsTools || [],
  incident: incidentTools || []
}; 