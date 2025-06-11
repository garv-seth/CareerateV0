// Real AI chat endpoint with streaming
this.app.post('/api/chat', (req: Request, res: Response) => {
  const { messages, agent, context } = req.body;
  
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages array is required' });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const responseGenerator = this.agentOrchestrator.invoke({
    messages,
    requestedAgent: agent || 'Auto',
    context,
  });

  Promise.resolve().then(async () => {
    for await (const event of responseGenerator) {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
    }
    res.end();
  }).catch(error => {
    logger.error('Chat stream error:', error);
    if (!res.writableEnded) {
      // Cannot set headers after they are sent, so just end the response
      res.end();
    }
  });
});

// Get available agents
this.app.get('/api/agents', (req: Request, res: Response) => {
// ... existing code ...
}); 