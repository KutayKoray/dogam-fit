import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const NUTRITION_PROMPT = `
You are a nutrition expert AI. Analyze the provided food image and/or text description to estimate nutritional information ACCURATELY.

CRITICAL GUIDELINES:
- BE CONSERVATIVE with calorie estimates - avoid overestimating
- Use STANDARD portion sizes unless clearly specified otherwise
- For single items (1 lahmacun, 1 portion rice), use TYPICAL restaurant/home serving sizes
- If portion size is mentioned (e.g., "1 portion", "1 piece"), respect that exactly
- Consider cooking methods (grilled vs fried affects calories significantly)
- Return realistic, practical estimates for daily tracking

PORTION SIZE STANDARDS:
- 1 portion chicken breast (grilled): 150-200g = ~165-220 calories, 31-40g protein
- 1 portion cooked rice: 150-200g (about 3/4 cup) = ~190-250 calories, 4-5g protein, 40-50g carbs
- 1 lahmacun (Turkish flatbread): standard size = ~230-280 calories, 8-10g protein, 35-40g carbs, 8-12g fat
- 1 portion pilaf (rice pilaf): 150-200g = ~200-280 calories, 4-6g protein, 35-45g carbs, 5-10g fat

Required response format (JSON):
{
  "foodItems": ["brief description of each food item with portion"],
  "estimatedCalories": number,
  "estimatedProtein": number (grams),
  "estimatedCarbohydrates": number (grams),
  "estimatedFat": number (grams),
  "confidence": number (0.1-1.0),
  "notes": "brief explanation of portion assumptions"
}

IMPORTANT: 
- If user says "1 portion" or "1 piece", use SINGLE serving size
- Do NOT multiply portions unless explicitly stated
- Be accurate and conservative with estimates
`;

export async function analyzeNutrition(imagePath, textDescription) {
  try {
    const messages = [
      {
        role: "system",
        content: NUTRITION_PROMPT
      }
    ];

    // Add content based on available inputs
    if (imagePath && fs.existsSync(imagePath)) {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      messages.push({
        role: "user",
        content: [
          {
            type: "text",
            text: textDescription || "Analyze this food image for nutritional information."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      });
    } else if (textDescription) {
      messages.push({
        role: "user",
        content: textDescription
      });
    } else {
      throw new Error('No image or text description provided');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      max_tokens: 500,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    
    // Parse JSON response
    let nutritionData;
    try {
      nutritionData = JSON.parse(content);
    } catch (parseError) {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        nutritionData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    // Validate required fields
    const requiredFields = ['foodItems', 'estimatedCalories', 'estimatedProtein', 'estimatedCarbohydrates', 'estimatedFat'];
    for (const field of requiredFields) {
      if (nutritionData[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    return {
      ...nutritionData,
      confidence: nutritionData.confidence || 0.7,
      notes: nutritionData.notes || 'AI-generated estimate'
    };

  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error(`Nutrition analysis failed: ${error.message}`);
  }
}
