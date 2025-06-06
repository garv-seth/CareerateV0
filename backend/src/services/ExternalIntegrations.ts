import axios from 'axios';

interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
}

interface ScrapedContent {
  title: string;
  content: string;
  markdown: string;
  metadata?: any;
}

export class ExternalIntegrations {
  private braveApiKey?: string;
  private firecrawlApiKey?: string;

  constructor() {
    this.braveApiKey = process.env.BRAVESEARCH_API_KEY;
    this.firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
  }

  async initialize() {
    if (this.braveApiKey) {
      console.log('✅ Brave Search initialized');
    } else {
      console.warn('⚠️  Brave Search API key not found');
    }

    if (this.firecrawlApiKey) {
      console.log('✅ Firecrawl initialized');
    } else {
      console.warn('⚠️  Firecrawl API key not found');
    }
  }

  // Brave Search - for getting latest information
  async searchWeb(query: string, count: number = 10): Promise<WebSearchResult[]> {
    if (!this.braveApiKey) {
      console.warn('Brave Search API key not configured, returning empty results');
      return [];
    }

    try {
      const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.braveApiKey
        },
        params: {
          q: query,
          count,
          safesearch: 'moderate',
          search_lang: 'en'
        }
      });

      return response.data.web?.results?.map((result: any) => ({
        title: result.title,
        url: result.url,
        snippet: result.description,
        publishedDate: result.page_age
      })) || [];
    } catch (error) {
      console.error('Brave Search error:', error);
      return [];
    }
  }

  // Search specifically for June 2025 AI agent information
  async searchLatestAgentTech(): Promise<WebSearchResult[]> {
    const queries = [
      'June 2025 AI agent frameworks MCP A2A latest',
      'GPT-4.1 mini nano Claude 3.5 haiku pricing June 2025',
      'Model Context Protocol MCP servers 2025',
      'AI agents task automation frameworks 2025'
    ];

    const allResults: WebSearchResult[] = [];
    
    for (const query of queries) {
      try {
        const results = await this.searchWeb(query, 5);
        allResults.push(...results);
      } catch (error) {
        console.warn(`Search failed for query: ${query}`);
      }
    }

    // Remove duplicates based on URL
    const uniqueResults = Array.from(
      new Map(allResults.map(item => [item.url, item])).values()
    );

    return uniqueResults;
  }

  // Firecrawl - for scraping documentation and web content
  async scrapeWebPage(url: string): Promise<ScrapedContent> {
    if (!this.firecrawlApiKey) {
      console.warn('Firecrawl API key not configured, returning basic content');
      return {
        title: 'Content not available',
        content: 'Firecrawl not configured',
        markdown: 'Firecrawl not configured'
      };
    }

    try {
      const response = await axios.post('https://api.firecrawl.dev/v0/scrape', {
        url,
        formats: ['markdown', 'html'],
        waitFor: 2000,
        includeTags: ['article', 'main', 'content'],
        excludeTags: ['nav', 'footer', 'aside']
      }, {
        headers: {
          'Authorization': `Bearer ${this.firecrawlApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.data.success) {
        throw new Error('Failed to scrape page');
      }

      return {
        title: response.data.data?.metadata?.title || 'Untitled',
        content: response.data.data?.text || '',
        markdown: response.data.data?.markdown || '',
        metadata: response.data.data?.metadata
      };
    } catch (error) {
      console.error('Firecrawl error:', error);
      return {
        title: 'Error',
        content: 'Failed to scrape content',
        markdown: 'Failed to scrape content'
      };
    }
  }

  // Get latest AI model information
  async getLatestAIModelInfo(): Promise<any> {
    const searches = await this.searchLatestAgentTech();
    const modelInfo: any = {
      openai: {},
      anthropic: {},
      google: {},
      frameworks: [],
      protocols: []
    };

    // Extract information from search results
    for (const result of searches.slice(0, 3)) {
      try {
        const text = result.snippet.toLowerCase();

        // Extract model information from snippets
        if (text.includes('gpt-4.1')) {
          const priceMatch = text.match(/gpt-4\.1[^$]*\$(\d+\.?\d*)/);
          if (priceMatch) {
            modelInfo.openai['gpt-4.1-price'] = priceMatch[1];
          }
        }

        if (text.includes('claude') && text.includes('haiku')) {
          const priceMatch = text.match(/haiku[^$]*\$(\d+\.?\d*)/);
          if (priceMatch) {
            modelInfo.anthropic['claude-haiku-price'] = priceMatch[1];
          }
        }

        // Extract framework information
        if (text.includes('langgraph')) {
          modelInfo.frameworks.push('LangGraph');
        }
        if (text.includes('mcp') || text.includes('model context protocol')) {
          modelInfo.protocols.push('MCP (Model Context Protocol)');
        }
        if (text.includes('a2a') && text.includes('agent')) {
          modelInfo.protocols.push('A2A (Agent-to-Agent)');
        }
      } catch (error) {
        console.warn(`Failed to process result: ${result.url}`);
      }
    }

    return modelInfo;
  }

  // Search for specific integration documentation
  async searchIntegrationDocs(integration: string): Promise<WebSearchResult[]> {
    return await this.searchWeb(`${integration} API documentation 2025`, 5);
  }
} 