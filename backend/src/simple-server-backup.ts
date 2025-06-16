import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import path from 'path';

const app = express();
const server = createServer(app);
const port = parseInt(process.env.PORT || '8081', 10);
const isProduction = process.env.NODE_ENV === 'production';

// Basic middleware
app.use(cors({
  origin: isProduction 
    ? ["https://careerate-app.azurewebsites.net", "https://*.replit.dev", "https://*.repl.co"]
    : ["http://localhost:3000", "https://*.replit.dev", "https://*.repl.co"],
  credentials: true
}));
app.use(express.json());

// Serve static files in production
if (isProduction) {
  app.use(express.static(path.join(__dirname, '../public')));
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port
  });
});

// API Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port,
    api: 'operational'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    message: 'Careerate Backend API',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Basic agents endpoint
app.get('/api/agents', (req, res) => {
  res.json([
    { id: 'terraform', name: 'Terraform Agent', status: 'available' },
    { id: 'kubernetes', name: 'Kubernetes Agent', status: 'available' },
    { id: 'aws', name: 'AWS Agent', status: 'available' }
  ]);
});

// Serve React app in production
if (isProduction) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// Start server
server.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Server ready');
});

server.on('error', (error: any) => {
  console.error('Server error:', error);
});