import express from 'express';
import cors from 'cors';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const port = parseInt(process.env.PORT || '8081', 10);

// Basic middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://*.replit.dev", "https://*.repl.co"],
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: port
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

// Start server
server.listen(port, () => {
  console.log(`🚀 Backend server running on port ${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('✅ Server ready');
});

server.on('error', (error: any) => {
  console.error('Server error:', error);
});