import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user profile
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        targetWeight: true,
        activityLevel: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Calculate BMI if height and weight are available
    let bmi = null;
    let bmiCategory = null;
    let recommendedCalories = null;

    if (user.height && user.weight) {
      // BMI = weight (kg) / (height (m))^2
      const heightInMeters = user.height / 100;
      bmi = user.weight / (heightInMeters * heightInMeters);
      
      // BMI Categories
      if (bmi < 18.5) {
        bmiCategory = 'Underweight';
      } else if (bmi < 25) {
        bmiCategory = 'Normal';
      } else if (bmi < 30) {
        bmiCategory = 'Overweight';
      } else {
        bmiCategory = 'Obese';
      }

      // Calculate recommended daily calories
      if (user.age && user.gender && user.activityLevel) {
        const calorieData = calculateDailyCalories(
          user.weight,
          user.height,
          user.age,
          user.gender,
          user.activityLevel,
          user.targetWeight
        );
        recommendedCalories = calorieData;
      }
    }

    res.json({
      ...user,
      bmi: bmi ? parseFloat(bmi.toFixed(1)) : null,
      bmiCategory,
      maintenanceCalories: recommendedCalories ? Math.round(recommendedCalories.maintenance) : null,
      calorieAdjustment: recommendedCalories ? Math.round(recommendedCalories.adjustment) : null,
      adjustmentType: recommendedCalories ? recommendedCalories.adjustmentType : null,
      recommendedCalories: recommendedCalories ? Math.round(recommendedCalories.recommended) : null,
      macros: recommendedCalories ? recommendedCalories.macros : null,
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update user profile
router.put('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, age, height, weight, gender, targetWeight, activityLevel } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        age: age ? parseInt(age) : null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        gender,
        targetWeight: targetWeight ? parseFloat(targetWeight) : null,
        activityLevel,
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        height: true,
        weight: true,
        gender: true,
        targetWeight: true,
        activityLevel: true,
      }
    });

    // Calculate BMI
    let bmi = null;
    let bmiCategory = null;
    let recommendedCalories = null;

    if (updatedUser.height && updatedUser.weight) {
      const heightInMeters = updatedUser.height / 100;
      bmi = updatedUser.weight / (heightInMeters * heightInMeters);
      
      if (bmi < 18.5) {
        bmiCategory = 'Underweight';
      } else if (bmi < 25) {
        bmiCategory = 'Normal';
      } else if (bmi < 30) {
        bmiCategory = 'Overweight';
      } else {
        bmiCategory = 'Obese';
      }

      if (updatedUser.age && updatedUser.gender && updatedUser.activityLevel) {
        const calorieData = calculateDailyCalories(
          updatedUser.weight,
          updatedUser.height,
          updatedUser.age,
          updatedUser.gender,
          updatedUser.activityLevel,
          updatedUser.targetWeight
        );
        recommendedCalories = calorieData;
      }
    }

    res.json({
      ...updatedUser,
      bmi: bmi ? parseFloat(bmi.toFixed(1)) : null,
      bmiCategory,
      maintenanceCalories: recommendedCalories ? Math.round(recommendedCalories.maintenance) : null,
      calorieAdjustment: recommendedCalories ? Math.round(recommendedCalories.adjustment) : null,
      adjustmentType: recommendedCalories ? recommendedCalories.adjustmentType : null,
      recommendedCalories: recommendedCalories ? Math.round(recommendedCalories.recommended) : null,
      macros: recommendedCalories ? recommendedCalories.macros : null,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Calculate daily calorie needs using Mifflin-St Jeor Equation
function calculateDailyCalories(weight, height, age, gender, activityLevel, targetWeight) {
  // BMR (Basal Metabolic Rate) calculation
  let bmr;
  
  if (gender === 'male') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else if (gender === 'female') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    // Default to average
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 78;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,      // Little or no exercise
    light: 1.375,        // Light exercise 1-3 days/week
    moderate: 1.55,      // Moderate exercise 3-5 days/week
    active: 1.725,       // Hard exercise 6-7 days/week
    very_active: 1.9     // Very hard exercise & physical job
  };

  const multiplier = activityMultipliers[activityLevel] || 1.2;
  const tdee = bmr * multiplier; // Total Daily Energy Expenditure (Maintenance)

  let adjustment = 0;
  let adjustmentType = 'maintenance';
  let recommendedCalories = tdee;

  // Adjust for weight goal
  if (targetWeight) {
    const weightDifference = weight - targetWeight;
    
    if (weightDifference > 0) {
      // User wants to lose weight: create calorie deficit
      // Safe weight loss: 0.5-1 kg per week = 500-1000 cal deficit per day
      adjustment = -500; // Moderate deficit
      adjustmentType = 'deficit';
      recommendedCalories = tdee + adjustment;
    } else if (weightDifference < 0) {
      // User wants to gain weight: create calorie surplus
      adjustment = 300; // Moderate surplus
      adjustmentType = 'surplus';
      recommendedCalories = tdee + adjustment;
    }
  }

  // Ensure minimum calories (not below 1200 for women, 1500 for men)
  const minCalories = gender === 'male' ? 1500 : 1200;
  recommendedCalories = Math.max(recommendedCalories, minCalories);

  // Calculate recommended macros based on goal
  let proteinPercentage, carbsPercentage, fatPercentage;
  
  if (adjustmentType === 'deficit') {
    // Weight loss: Higher protein to preserve muscle
    proteinPercentage = 30;
    carbsPercentage = 40;
    fatPercentage = 30;
  } else if (adjustmentType === 'surplus') {
    // Weight gain: Balanced with slightly more carbs for energy
    proteinPercentage = 25;
    carbsPercentage = 45;
    fatPercentage = 30;
  } else {
    // Maintenance: Balanced macros
    proteinPercentage = 25;
    carbsPercentage = 45;
    fatPercentage = 30;
  }

  // Calculate macro grams
  // Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
  const proteinGrams = Math.round((recommendedCalories * (proteinPercentage / 100)) / 4);
  const carbsGrams = Math.round((recommendedCalories * (carbsPercentage / 100)) / 4);
  const fatGrams = Math.round((recommendedCalories * (fatPercentage / 100)) / 9);

  return {
    maintenance: tdee,
    adjustment: adjustment,
    adjustmentType: adjustmentType,
    recommended: recommendedCalories,
    macros: {
      protein: {
        grams: proteinGrams,
        percentage: proteinPercentage
      },
      carbs: {
        grams: carbsGrams,
        percentage: carbsPercentage
      },
      fat: {
        grams: fatGrams,
        percentage: fatPercentage
      }
    }
  };
}

export default router;
