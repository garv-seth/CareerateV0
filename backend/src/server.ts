import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import LlmService from '../services/llm-service.js';
import AgentRouter from '../agents/agent-router.js';
import passport from '../services/passport-setup.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN }));
app.use(express.json());
app.use(passport.initialize());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '..', '..', 'frontend', 'dist')));

const llmService = new LlmService(process.env.LLM_API_KEY);
const agentRouter = new AgentRouter(llmService);

const isAuthenticated = passport.authenticate('oauth-bearer', { session: false });

app.post('/api/chat', isAuthenticated, async (req, res) => {
  const { query, context } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  try {
    const response = await agentRouter.route(query, context);
    res.json({ response });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

app.get('/api/user', isAuthenticated, (req, res) => {
    res.json(req.authInfo);
});

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
}); 