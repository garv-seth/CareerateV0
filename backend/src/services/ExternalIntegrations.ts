import { AzureSecretsManager } from './AzureSecretsManager.js';
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
  private secretsManager: AzureSecretsManager;
  private firecrawlApp?: any;
  private braveApiKey?: string;

  constructor(secretsManager: AzureSecretsManager) {
    this.secretsManager = secretsManager;
  }

  async initialize() {
    try {
      // Initialize Firecrawl dynamically (optional dependency)
      const firecrawlApiKey = await this.secretsManager.getSecret('FIRECRAWL_API_KEY');
      if (firecrawlApiKey) {
        try {
          // Use require for optional dependency
          const FirecrawlModule = await eval("import('@firecrawl/api')").catch(() => null);
          if (FirecrawlModule) {
            this.firecrawlApp = new FirecrawlModule.default({ apiKey: firecrawlApiKey });
            console.log('✅ Firecrawl initialized');
          }
        } catch (error) {
          console.warn('⚠️  Firecrawl module not available, continuing without it');
        }
      }

      // Initialize Brave Search
      this.braveApiKey = await this.secretsManager.getSecret('BRAVESEARCH_API_KEY');
      if (this.braveApiKey) {
        console.log('✅ Brave Search initialized');
      }
    } catch (error) {
      console.warn('⚠️  Some external integrations failed to initialize:', error);
    }
  }

  // Brave Search - for getting latest information
  async searchWeb(query: string, count: number = 10): Promise<WebSearchResult[]> {
    if (!this.braveApiKey) {
      throw new Error('Brave Search API key not configured');
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
      throw error;
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
    if (!this.firecrawlApp) {
      throw new Error('Firecrawl not initialized');
    }

    try {
      const response = await this.firecrawlApp.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        waitFor: 2000,
        includeTags: ['article', 'main', 'content'],
        excludeTags: ['nav', 'footer', 'aside']
      });

      if (!response.success) {
        throw new Error('Failed to scrape page');
      }

      return {
        title: response.metadata?.title || 'Untitled',
        content: response.text || '',
        markdown: response.markdown || '',
        metadata: response.metadata
      };
    } catch (error) {
      console.error('Firecrawl error:', error);
      throw error;
    }
  }

  // Crawl entire documentation sites
  async crawlDocumentation(baseUrl: string, maxPages: number = 10): Promise<ScrapedContent[]> {
    if (!this.firecrawlApp) {
      throw new Error('Firecrawl not initialized');
    }

    try {
      const crawlResult = await this.firecrawlApp.crawlUrl(baseUrl, {
        maxCrawlPages: maxPages,
        allowBackwardLinks: false,
        formats: ['markdown'],
        includePaths: ['/docs', '/api', '/reference'],
        excludePaths: ['/blog', '/community']
      });

      if (!crawlResult.success) {
        throw new Error('Failed to crawl documentation');
      }

      // Poll for completion
      let status = await this.firecrawlApp.checkCrawlStatus(crawlResult.id);
      
      while (status.status === 'crawling') {
        await new Promise(resolve => setTimeout(resolve, 5000));
        status = await this.firecrawlApp.checkCrawlStatus(crawlResult.id);
      }

      if (status.status === 'completed' && status.data) {
        return status.data.map((page: any) => ({
          title: page.metadata?.title || 'Untitled',
          content: page.text || '',
          markdown: page.markdown || '',
          metadata: page.metadata
        }));
      }

      return [];
    } catch (error) {
      console.error('Documentation crawl error:', error);
      throw error;
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
    for (const result of searches.slice(0, 5)) {
      try {
        const content = await this.scrapeWebPage(result.url);
        const text = content.markdown.toLowerCase();

        // Extract model information
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
        console.warn(`Failed to scrape ${result.url}`);
      }
    }

    return modelInfo;
  }

  // Search for specific integration documentation
  async searchIntegrationDocs(integration: string): Promise<ScrapedContent[]> {
    const searchResults = await this.searchWeb(`${integration} API documentation 2025`, 5);
    const docs: ScrapedContent[] = [];

    for (const result of searchResults) {
      try {
        const content = await this.scrapeWebPage(result.url);
        docs.push(content);
      } catch (error) {
        console.warn(`Failed to scrape ${result.url}`);
      }
    }

    return docs;
  }
} 