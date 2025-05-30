import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Import Key Vault configuration
// import { initializeSecrets } from './config/keyVault'; // Commented out

// Import middleware
import { protect } from './middleware/authMiddleware';

// Import routes
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import marketTrendsRoutes from './routes/marketTrends';
import learningPathRoutes from './routes/learningPath';
import achievementsRoutes from './routes/achievements';
import referralRoutes from './routes/referral';
import shareCardRoutes from './routes/shareCard';
import resumeRoutes from './routes/resume';
import toolsRoutes from './routes/tools';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize secrets from Key Vault before starting the server
async function initializeApp() {
  try {
    // Initialize secrets from Key Vault
    // await initializeSecrets(); // Commented out

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          scriptSrc: ["'self'"],
        },
      },
    }));

    // CORS configuration - hardcoded for production, can be overridden by env var
    const corsOrigin = process.env.CORS_ORIGIN || 'https://careerate-b0a7fqbzhckbebs.westus-01.azurewebsites.net';
    const corsOptions = {
      origin: corsOrigin,
      credentials: true,
      optionsSuccessStatus: 200,
    };
    app.use(cors(corsOptions));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files from the 'public' directory (for frontend)
    app.use(express.static(path.join(__dirname, 'public')));

    // Session configuration
    app.use(session({
      secret: process.env.SESSION_SECRET || 'fallback-secret-dev-only',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      },
    }));

    // MongoDB connection
    const mongoURI = process.env.COSMOSDB_CONNECTION_STRING_CENTRALUS || process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('MongoDB connection string not found. Please set MONGO_URI or COSMOSDB_CONNECTION_STRING_CENTRALUS in your environment variables.');
      process.exit(1);
    }

    mongoose.connect(mongoURI)
      .then(() => console.log('Connected to Cosmos DB (MongoDB API)'))
      .catch((err: Error) => console.error('MongoDB connection error:', err));

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.status(200).json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV 
      });
    });

    // API routes
    app.use('/api/auth', authRoutes);
    app.use('/api/user', protect, userRoutes);
    app.use('/api/market-trends', protect, marketTrendsRoutes);
    app.use('/api/learning-path', protect, learningPathRoutes);
    app.use('/api/achievements', protect, achievementsRoutes);
    app.use('/api/referral', protect, referralRoutes);
    app.use('/api/share-card', protect, shareCardRoutes);
    app.use('/api/resume', protect, resumeRoutes);
    app.use('/api/tools', protect, toolsRoutes);

    // Error handling middleware
    app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Error:', err);
      
      if ((err as any).type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'Invalid JSON payload' });
      }
      
      res.status((err as any).status || 500).json({
        error: process.env.NODE_ENV === 'production' 
          ? 'Internal server error' 
          : err.message,
        ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
      });
    });

    // Handle SPA routing: send index.html for any other GET request that doesn't match an API route or a static file
    app.get('*', (req, res) => {
      // Check if the request is for an API route or a file with an extension
      if (req.path.startsWith('/api/') || req.path.includes('.')) {
        return res.status(404).json({ error: 'Resource not found' });
      }
      res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
        if (err) {
          res.status(500).send(err);
        }
      });
    });

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Careerate API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`CORS Origin: ${corsOrigin}`);
    });

  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1);
  }
}

// Initialize the application
initializeApp();

export default app; 