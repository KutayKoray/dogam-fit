import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeNutrition } from '../services/nutritionService.js';

const router = express.Router();

// Quick nutrition analysis (no database storage)
router.post('/quick-analyze', authenticateToken, async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const analysis = await analyzeNutrition(null, description);

    res.json({
      success: true,
      data: analysis
    });

  } catch (error) {
    console.error('Quick analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
