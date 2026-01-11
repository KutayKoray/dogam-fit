import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get user's goals
router.get('/', authenticateToken, async (req, res) => {
  try {
    const goals = await prisma.goal.findMany({
      where: { 
        userId: req.user.id,
        isActive: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(goals);
  } catch (error) {
    console.error('Get goals error:', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// Create a new goal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      targetCalories,
      targetProtein,
      targetCarbohydrates,
      targetFat
    } = req.body;

    // Deactivate existing goals
    await prisma.goal.updateMany({
      where: { userId: req.user.id },
      data: { isActive: false }
    });

    const goal = await prisma.goal.create({
      data: {
        userId: req.user.id,
        name,
        targetCalories: parseInt(targetCalories),
        targetProtein: parseFloat(targetProtein),
        targetCarbohydrates: parseFloat(targetCarbohydrates),
        targetFat: parseFloat(targetFat)
      }
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// Update a goal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify goal belongs to user
    const existingGoal = await prisma.goal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingGoal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData
    });

    res.json(goal);
  } catch (error) {
    console.error('Update goal error:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

export default router;
