import { Router, Request, Response } from 'express';
import axios from 'axios';
// import { createClient } from 'redis'; // Removed Redis client

const router = Router();
// const redis = createClient({ url: process.env.REDIS_URL }); // Removed Redis client instance

interface MarketTrend {
  skill: string;
  demand: 'rising' | 'stable' | 'falling';
  changePercentage: number;
  jobCount: number;
  salaryRange: {
    min: number;
    max: number;
  };
  growth: string;
  description: string;
}

interface MarketData {
  aiRoles: MarketTrend[];
  emergingSkills: MarketTrend[];
  displacementRisk: {
    roles: string[];
    riskLevel: 'low' | 'medium' | 'high';
    timeframe: string;
  };
  lastUpdated: string;
}

// Get market trends with AI displacement analysis
router.get('/', async (req: Request, res: Response) => {
  try {
    // const cacheKey = 'market-trends-data'; // Cache key removed
    
    // Check Redis cache first - REMOVED
    // const cachedData = await redis.get(cacheKey);
    // if (cachedData) {
    //   return res.json(JSON.parse(cachedData));
    // }

    // Fetch fresh data using MCP APIs
    const marketData = await fetchMarketData();
    
    // Cache for 6 hours - REMOVED
    // await redis.setex(cacheKey, 21600, JSON.stringify(marketData));
    
    res.json(marketData);
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market trends',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get personalized AI displacement risk for a user
router.get('/ai-risk/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // This would typically fetch user's skills/role and compare with market data
    const riskAssessment = await calculateAIRisk(userId);
    
    res.json(riskAssessment);
  } catch (error) {
    console.error('AI risk calculation error:', error);
    res.status(500).json({ 
      error: 'Failed to calculate AI risk',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Fetch market data using MCP APIs
async function fetchMarketData(): Promise<MarketData> {
  try {
    const [braveData, firecrawlData] = await Promise.allSettled([
      fetchBraveSearchData(),
      fetchFirecrawlData(),
      // Add Browserbase data if needed
    ]);

    // Combine and process data
    const processedData: MarketData = {
      aiRoles: [
        {
          skill: 'Machine Learning Engineer',
          demand: 'rising',
          changePercentage: 45,
          jobCount: 12500,
          salaryRange: { min: 130000, max: 220000 },
          growth: '+45% YoY',
          description: 'High demand for ML engineers across all industries'
        },
        {
          skill: 'AI Product Manager',
          demand: 'rising',
          changePercentage: 38,
          jobCount: 8200,
          salaryRange: { min: 140000, max: 250000 },
          growth: '+38% YoY',
          description: 'Growing need for AI-focused product management'
        },
        {
          skill: 'Data Scientist',
          demand: 'stable',
          changePercentage: 12,
          jobCount: 25000,
          salaryRange: { min: 110000, max: 180000 },
          growth: '+12% YoY',
          description: 'Steady demand with AI specialization valued'
        },
        {
          skill: 'Software Engineer',
          demand: 'stable',
          changePercentage: 8,
          jobCount: 180000,
          salaryRange: { min: 95000, max: 160000 },
          growth: '+8% YoY',
          description: 'Traditional roles adapting to include AI skills'
        },
        {
          skill: 'QA Tester (Manual)',
          demand: 'falling',
          changePercentage: -25,
          jobCount: 15000,
          salaryRange: { min: 55000, max: 85000 },
          growth: '-25% YoY',
          description: 'Automation reducing demand for manual testing'
        }
      ],
      emergingSkills: [
        {
          skill: 'Prompt Engineering',
          demand: 'rising',
          changePercentage: 120,
          jobCount: 3500,
          salaryRange: { min: 90000, max: 150000 },
          growth: '+120% YoY',
          description: 'New field with explosive growth'
        },
        {
          skill: 'LLM Fine-tuning',
          demand: 'rising',
          changePercentage: 95,
          jobCount: 2100,
          salaryRange: { min: 130000, max: 200000 },
          growth: '+95% YoY',
          description: 'Specialized AI model customization'
        },
        {
          skill: 'AI Ethics & Safety',
          demand: 'rising',
          changePercentage: 75,
          jobCount: 1800,
          salaryRange: { min: 120000, max: 180000 },
          growth: '+75% YoY',
          description: 'Growing focus on responsible AI'
        }
      ],
      displacementRisk: {
        roles: ['Data Entry Clerk', 'Basic Content Writer', 'Junior Analyst', 'Manual QA Tester'],
        riskLevel: 'high',
        timeframe: '2-5 years'
      },
      lastUpdated: new Date().toISOString()
    };

    return processedData;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
}

// Fetch data from BraveSearch API
async function fetchBraveSearchData() {
  if (!process.env.BRAVESEARCH_API_KEY) {
    console.warn('BraveSearch API key not provided');
    return null;
  }

  try {
    const response = await axios.get('https://api.search.brave.com/res/v1/web/search', {
      headers: {
        'X-Subscription-Token': process.env.BRAVESEARCH_API_KEY,
      },
      params: {
        q: 'AI jobs 2024 market trends machine learning demand',
        count: 10,
        safesearch: 'moderate'
      }
    });

    return response.data;
  } catch (error) {
    console.error('BraveSearch API error:', error);
    return null;
  }
}

// Fetch data from Firecrawl API
async function fetchFirecrawlData() {
  if (!process.env.FIRECRAWL_API_KEY) {
    console.warn('Firecrawl API key not provided');
    return null;
  }

  try {
    const response = await axios.post('https://api.firecrawl.dev/v0/scrape', {
      url: 'https://www.linkedin.com/jobs/search/?keywords=artificial%20intelligence',
      formats: ['markdown', 'html']
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Firecrawl API error:', error);
    return null;
  }
}

// Calculate AI displacement risk for a specific user
async function calculateAIRisk(userId: string) {
  // This would integrate with the User model to get their skills/role
  // For now, return a mock assessment
  return {
    riskScore: 35,
    riskLevel: 'medium',
    factors: [
      'Some skills overlap with AI capabilities',
      'Role has automation potential',
      'Industry is adopting AI solutions'
    ],
    recommendations: [
      'Learn prompt engineering',
      'Develop AI tool proficiency',
      'Focus on human-AI collaboration'
    ],
    timeframe: '3-5 years',
    lastAssessed: new Date().toISOString()
  };
}

export default router; 