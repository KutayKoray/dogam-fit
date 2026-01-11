import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeNutrition } from '../services/nutritionService.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Analyze nutrition with AI
router.post('/analyze', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { description } = req.body;
    const imagePath = req.file ? req.file.path : null;

    if (!imagePath && !description) {
      return res.status(400).json({ error: 'Either image or description is required' });
    }

    const analysis = await analyzeNutrition(imagePath, description);

    res.json({
      success: true,
      data: analysis,
      imagePath: imagePath ? path.basename(imagePath) : null
    });

  } catch (error) {
    console.error('Nutrition analysis error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all meals for a user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 50 } = req.query;
    
    const whereClause = { userId: req.user.id };
    
    if (startDate || endDate) {
      whereClause.loggedAt = {};
      if (startDate) whereClause.loggedAt.gte = new Date(startDate);
      if (endDate) whereClause.loggedAt.lte = new Date(endDate);
    }

    const meals = await prisma.meal.findMany({
      where: whereClause,
      orderBy: { loggedAt: 'desc' },
      take: parseInt(limit)
    });

    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Create a new meal
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      mealType,
      imageUrl,
      aiCalories,
      aiProtein,
      aiCarbohydrates,
      aiFat,
      aiConfidence,
      aiNotes,
      confirmedCalories,
      confirmedProtein,
      confirmedCarbohydrates,
      confirmedFat,
      loggedAt
    } = req.body;

    const meal = await prisma.meal.create({
      data: {
        userId: req.user.id,
        name,
        description,
        mealType,
        imageUrl,
        aiCalories: aiCalories ? parseInt(aiCalories) : null,
        aiProtein: aiProtein ? parseFloat(aiProtein) : null,
        aiCarbohydrates: aiCarbohydrates ? parseFloat(aiCarbohydrates) : null,
        aiFat: aiFat ? parseFloat(aiFat) : null,
        aiConfidence: aiConfidence ? parseFloat(aiConfidence) : null,
        aiNotes,
        confirmedCalories: confirmedCalories ? parseInt(confirmedCalories) : null,
        confirmedProtein: confirmedProtein ? parseFloat(confirmedProtein) : null,
        confirmedCarbohydrates: confirmedCarbohydrates ? parseFloat(confirmedCarbohydrates) : null,
        confirmedFat: confirmedFat ? parseFloat(confirmedFat) : null,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date()
      }
    });

    res.status(201).json(meal);
  } catch (error) {
    console.error('Create meal error:', error);
    res.status(500).json({ error: 'Failed to create meal' });
  }
});

// Update a meal
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verify meal belongs to user
    const existingMeal = await prisma.meal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    const meal = await prisma.meal.update({
      where: { id },
      data: updateData
    });

    res.json(meal);
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Delete a meal
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify meal belongs to user
    const existingMeal = await prisma.meal.findFirst({
      where: { id, userId: req.user.id }
    });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    await prisma.meal.delete({
      where: { id }
    });

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

export default router;
