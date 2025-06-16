const express = require('express');
const app = express();
const port = 8081;

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', port: port });
});

app.get('/api', (req, res) => {
  res.json({ message: 'Test API working', port: port });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Test server running on port ${port}`);
});