import express from 'express';

const router = express.Router();

router.get('/overview/:teamId', (req, res) => {
  res.json({ 
    teamId: req.params.teamId,
    metrics: {
      productivity: 0.85,
      satisfaction: 0.92,
      timesSaved: '24 hours'
    }
  });
});

export default router; 