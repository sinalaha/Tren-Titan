import OpenAI from "openai";
import { z } from "zod";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const macroSchema = z.object({
  foodName: z.string(),
  portionGrams: z.number(),
  calories: z.number(),
  protein: z.number(),
  fats: z.number(),
  carbs: z.number(),
  fiber: z.number().optional(),
  confidenceScore: z.number().min(0).max(1),
  notes: z.string().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional()
});

export type FoodAnalysisResult = z.infer<typeof macroSchema>;

const textBatchResponseSchema = z.object({
  items: z.array(
    z.object({
      calories: z.number().finite(),
      protein: z.number().finite(),
      fats: z.number().finite(),
      carbs: z.number().finite(),
      fiber: z.number().finite().optional()
    })
  )
});

export type FoodTextMacroRow = {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber?: number;
};

export async function analyzeFoodImage(base64Image: string, mimeType = "image/jpeg") {
  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 500,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "high" }
          },
          {
            type: "text",
            text: "Analyze this food image and return only valid JSON with fields foodName, portionGrams, calories, protein, fats, carbs, fiber, confidenceScore, notes, mealType."
          }
        ]
      }
    ]
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/```json|```/g, "").trim();
  return macroSchema.parse(JSON.parse(cleaned));
}

/**
 * Оценка КБЖУ по названию продукта и массе (г) для каждой позиции. Один вызов модели на весь список.
 */
export async function analyzeFoodItemsText(
  items: Array<{ name: string; grams: number }>
): Promise<FoodTextMacroRow[]> {
  if (items.length === 0) return [];

  const response = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 2000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          'You estimate food nutrition. User gives items with name and grams. For EACH item, return calories (kcal), protein (g), fats (g), carbs (g) for the EXACT gram amount (not per 100g). Optional fiber (g). Use typical reference values (USDA-like). Return JSON: {"items":[{"calories":number,"protein":number,"fats":number,"carbs":number,"fiber"?:number},...]}. Same number of items and same order as input. No extra keys.'
      },
      {
        role: "user",
        content: JSON.stringify({ items })
      }
    ]
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = textBatchResponseSchema.parse(JSON.parse(raw));
  if (parsed.items.length !== items.length) {
    throw new Error(
      `food text analysis: expected ${items.length} items, got ${parsed.items.length}`
    );
  }

  return parsed.items.map((row) => ({
    calories: Math.max(0, row.calories),
    protein: Math.max(0, row.protein),
    fats: Math.max(0, row.fats),
    carbs: Math.max(0, row.carbs),
    fiber: row.fiber != null ? Math.max(0, row.fiber) : undefined
  }));
}
