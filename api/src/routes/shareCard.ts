import { Router, Request, Response } from 'express';
import sharp from 'sharp';

const router = Router();

interface ShareableCard {
  id: string;
  userId: string;
  type: 'ai-risk' | 'milestone' | 'achievement' | 'progress' | 'certification';
  title: string;
  subtitle: string;
  data: Record<string, any>;
  imageUrl: string;
  shareUrl: string;
  socialText: string;
  createdAt: string;
  expiresAt?: string;
}

interface CardTemplate {
  type: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  layout: 'hero' | 'stats' | 'badge' | 'progress';
  dimensions: {
    width: number;
    height: number;
  };
}

// Generate shareable card
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { userId, type, data, customMessage } = req.body;
    
    const card = await generateShareableCard(userId, type, data, customMessage);
    
    res.json(card);
  } catch (error) {
    console.error('Card generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate shareable card',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get shareable card by ID (for social media previews)
router.get('/:cardId', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    
    const card = await getShareableCard(cardId);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Return HTML with Open Graph meta tags for social media
    const html = generateCardHTML(card);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('Card fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch shareable card',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get card image
router.get('/:cardId/image', async (req: Request, res: Response) => {
  try {
    const { cardId } = req.params;
    
    const imageBuffer = await generateCardImage(cardId);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.send(imageBuffer);
  } catch (error) {
    console.error('Card image error:', error);
    res.status(500).json({ 
      error: 'Failed to generate card image',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Get user's shareable cards
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 10, type } = req.query;
    
    const cards = await getUserShareableCards(userId, Number(limit), type as string);
    
    res.json(cards);
  } catch (error) {
    console.error('User cards error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user cards',
      message: process.env.NODE_ENV !== 'production' ? (error as Error).message : undefined
    });
  }
});

// Generate shareable card
async function generateShareableCard(
  userId: string,
  type: string,
  data: Record<string, any>,
  customMessage?: string
): Promise<ShareableCard> {
  const cardId = `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  let title: string;
  let subtitle: string;
  let socialText: string;
  
  switch (type) {
    case 'ai-risk':
      title = `AI Displacement Risk: ${data.riskLevel.toUpperCase()}`;
      subtitle = `Risk Score: ${data.riskScore}/100`;
      socialText = customMessage || `Just assessed my AI displacement risk on @Careerate! My risk level is ${data.riskLevel} with a score of ${data.riskScore}/100. Understanding where I stand in the AI revolution! 🤖 #AICareer #TechSkills`;
      break;
      
    case 'milestone':
      title = `🎉 ${data.milestoneName} Achieved!`;
      subtitle = `Completed on ${new Date(data.completedAt).toLocaleDateString()}`;
      socialText = customMessage || `Just hit a major milestone on @Careerate! 🚀 ${data.milestoneName} - another step forward in my AI career journey! #CareerGrowth #AISkills #TechCareer`;
      break;
      
    case 'achievement':
      title = `🏆 Badge Earned: ${data.badgeName}`;
      subtitle = data.badgeDescription;
      socialText = customMessage || `Earned the "${data.badgeName}" badge on @Careerate! ${data.badgeDescription} 🎯 #Achievement #AILearning #TechSkills`;
      break;
      
    case 'progress':
      title = `Learning Progress: ${data.progressPercentage}% Complete`;
      subtitle = `${data.pathName} - ${data.hoursCompleted}h invested`;
      socialText = customMessage || `Making great progress on my AI learning journey! ${data.progressPercentage}% through ${data.pathName} on @Careerate 📚 #LearningJourney #AIEducation #TechGrowth`;
      break;
      
    case 'certification':
      title = `🎖️ Certified: ${data.certificationName}`;
      subtitle = `Issued by ${data.issuer}`;
      socialText = customMessage || `Just earned my ${data.certificationName} certification! 🎖️ Grateful for the learning journey on @Careerate. Ready to apply these AI skills! #Certified #AISkills #ProfessionalDevelopment`;
      break;
      
    default:
      title = 'Careerate Achievement';
      subtitle = 'AI Career Progress';
      socialText = customMessage || 'Making progress on my AI career journey with @Careerate! 🚀 #AICareer #TechSkills';
  }
  
  const card: ShareableCard = {
    id: cardId,
    userId,
    type: type as any,
    title,
    subtitle,
    data,
    imageUrl: `https://gocareerate.com/api/share-card/${cardId}/image`,
    shareUrl: `https://gocareerate.com/share/${cardId}`,
    socialText,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };
  
  // In production, save to database
  console.log('Generated shareable card:', card);
  
  return card;
}

// Get shareable card by ID
async function getShareableCard(cardId: string): Promise<ShareableCard | null> {
  // In production, fetch from database
  // Mock response
  return {
    id: cardId,
    userId: 'user-123',
    type: 'ai-risk',
    title: 'AI Displacement Risk: MEDIUM',
    subtitle: 'Risk Score: 35/100',
    data: {
      riskScore: 35,
      riskLevel: 'medium',
      factors: ['Some automation potential', 'Growing AI adoption in industry'],
      recommendations: ['Learn prompt engineering', 'Develop AI tool proficiency']
    },
    imageUrl: `https://gocareerate.com/api/share-card/${cardId}/image`,
    shareUrl: `https://gocareerate.com/share/${cardId}`,
    socialText: 'Just assessed my AI displacement risk on @Careerate! My risk level is medium with a score of 35/100. Understanding where I stand in the AI revolution! 🤖 #AICareer #TechSkills',
    createdAt: '2024-02-15T10:30:00Z'
  };
}

// Generate HTML with Open Graph meta tags
function generateCardHTML(card: ShareableCard): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${card.title} | Careerate</title>
  <meta name="description" content="${card.subtitle}">
  
  <!-- Open Graph meta tags -->
  <meta property="og:title" content="${card.title}">
  <meta property="og:description" content="${card.subtitle}">
  <meta property="og:image" content="${card.imageUrl}">
  <meta property="og:url" content="${card.shareUrl}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Careerate">
  
  <!-- Twitter Card meta tags -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${card.title}">
  <meta name="twitter:description" content="${card.subtitle}">
  <meta name="twitter:image" content="${card.imageUrl}">
  <meta name="twitter:site" content="@Careerate">
  
  <!-- LinkedIn meta tags -->
  <meta property="article:author" content="Careerate">
  
  <style>
    body {
      font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #0066cc 0%, #2ecc71 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      max-width: 600px;
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    }
    .title {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    .subtitle {
      font-size: 18px;
      opacity: 0.9;
      margin-bottom: 32px;
    }
    .cta {
      background: white;
      color: #0066cc;
      padding: 16px 32px;
      border-radius: 12px;
      text-decoration: none;
      font-weight: 600;
      display: inline-block;
      transition: transform 0.2s;
    }
    .cta:hover {
      transform: translateY(-2px);
    }
    .logo {
      width: 48px;
      height: 48px;
      margin: 0 auto 24px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">🚀</div>
    <h1 class="title">${card.title}</h1>
    <p class="subtitle">${card.subtitle}</p>
    <a href="https://gocareerate.com" class="cta">Start Your AI Journey</a>
  </div>
  
  <script>
    // Redirect to main app after 5 seconds
    setTimeout(() => {
      window.location.href = 'https://gocareerate.com';
    }, 5000);
  </script>
</body>
</html>
  `;
}

// Generate card image
async function generateCardImage(cardId: string): Promise<Buffer> {
  // Get card data
  const card = await getShareableCard(cardId);
  
  if (!card) {
    throw new Error('Card not found');
  }
  
  // Create SVG for the card
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0066cc;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#2ecc71;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="1200" height="630" fill="url(#bg)"/>
      
      <!-- Card background -->
      <rect x="80" y="80" width="1040" height="470" rx="24" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
      
      <!-- Logo -->
      <circle cx="600" cy="180" r="32" fill="white"/>
      <text x="600" y="190" text-anchor="middle" font-family="Arial, sans-serif" font-size="24">🚀</text>
      
      <!-- Title -->
      <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">${card.title}</text>
      
      <!-- Subtitle -->
      <text x="600" y="330" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)">${card.subtitle}</text>
      
      <!-- CTA -->
      <rect x="480" y="400" width="240" height="60" rx="12" fill="white"/>
      <text x="600" y="440" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="600" fill="#0066cc">Start Your AI Journey</text>
      
      <!-- Branding -->
      <text x="600" y="500" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.8)">gocareerate.com</text>
    </svg>
  `;
  
  // Convert SVG to PNG using Sharp
  const imageBuffer = await sharp(Buffer.from(svg))
    .png()
    .toBuffer();
  
  return imageBuffer;
}

// Get user's shareable cards
async function getUserShareableCards(userId: string, limit: number, type?: string) {
  // Mock response - in production, fetch from database
  const mockCards: ShareableCard[] = [
    {
      id: 'card-1',
      userId,
      type: 'milestone',
      title: '🎉 First Course Completed!',
      subtitle: 'Introduction to AI - Completed Feb 15, 2024',
      data: { milestoneName: 'First Course Completed', completedAt: '2024-02-15T10:30:00Z' },
      imageUrl: 'https://gocareerate.com/api/share-card/card-1/image',
      shareUrl: 'https://gocareerate.com/share/card-1',
      socialText: 'Just completed my first AI course on @Careerate! 🚀',
      createdAt: '2024-02-15T10:30:00Z'
    },
    {
      id: 'card-2',
      userId,
      type: 'achievement',
      title: '🏆 Badge Earned: AI Explorer',
      subtitle: 'First AI tool mastered',
      data: { badgeName: 'AI Explorer', badgeDescription: 'First AI tool mastered' },
      imageUrl: 'https://gocareerate.com/api/share-card/card-2/image',
      shareUrl: 'https://gocareerate.com/share/card-2',
      socialText: 'Earned my first AI badge on @Careerate! 🎯',
      createdAt: '2024-02-10T14:20:00Z'
    }
  ];
  
  let filteredCards = mockCards;
  if (type) {
    filteredCards = mockCards.filter(card => card.type === type);
  }
  
  return {
    cards: filteredCards.slice(0, limit),
    total: filteredCards.length,
    hasMore: filteredCards.length > limit
  };
}

export default router; 