import express from 'express';
import cors from 'cors';
import LlmService from '../services/llm-service.js';
import AgentRouter from '../agents/agent-router.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const llmService = new LlmService(process.env.LLM_API_KEY);
const agentRouter = new AgentRouter(llmService);

app.post('/api/chat', async (req, res) => {
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

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
}); 