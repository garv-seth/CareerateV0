import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import session from 'express-session';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
async function startServer() {
  try {
    app.listen(PORT, () => {
      console.log(`🚀 Careerate API running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app; 