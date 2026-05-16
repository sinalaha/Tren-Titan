export type FoodTextMacroRow = {
  calories: number;
  protein: number;
  fats: number;
  carbs: number;
  fiber?: number;
};

type Per100 = { kcal: number; p: number; f: number; c: number; fiber?: number };

/** Ккал и БЖУ на 100 г (усреднённые справочные значения). */
const FOOD_ENTRIES: Array<{ keys: string[]; per100: Per100 }> = [
  {
    keys: ["oat", "овся", "геркулес", "oatmeal", "muesli", "мюсл"],
    per100: { kcal: 389, p: 16.9, f: 6.9, c: 66, fiber: 10 }
  },
  {
    keys: ["rice", "рис", "басмати", "wild rice"],
    per100: { kcal: 365, p: 7.1, f: 2.7, c: 78, fiber: 4 }
  },
  {
    keys: ["buckwheat", "греч", "греча"],
    per100: { kcal: 343, p: 12, f: 3.4, c: 62, fiber: 10 }
  },
  {
    keys: ["pasta", "макарон", "спагетти", "spaghetti", "noodle", "лапша"],
    per100: { kcal: 371, p: 13, f: 1.5, c: 74, fiber: 4 }
  },
  {
    keys: ["bread", "хлеб", "батон", "багет", "toast"],
    per100: { kcal: 265, p: 9, f: 3.2, c: 49, fiber: 4 }
  },
  {
    keys: ["potato", "картоф", "карт"],
    per100: { kcal: 77, p: 2, f: 0.1, c: 17, fiber: 2 }
  },
  {
    keys: ["chicken", "курин", "курят", "turkey", "индейк", "breast", "грудк"],
    per100: { kcal: 165, p: 31, f: 3.6, c: 0 }
  },
  {
    keys: ["beef", "говядин", "говяд", "steak", "стейк", "pork", "свинин"],
    per100: { kcal: 250, p: 26, f: 15, c: 0 }
  },
  {
    keys: ["fish", "рыб", "salmon", "лосос", "tuna", "тунец", "cod", "треск"],
    per100: { kcal: 130, p: 26, f: 4, c: 0 }
  },
  {
    keys: ["egg", "яйц", "omelet", "омлет", "scrambled"],
    per100: { kcal: 155, p: 13, f: 11, c: 1.1 }
  },
  {
    keys: ["milk", "молок", "kefir", "кефир", "yogurt", "йогурт", "jogurt"],
    per100: { kcal: 60, p: 3.2, f: 3.25, c: 4.8, fiber: 0 }
  },
  {
    keys: ["cottage", "творог", "ricotta", "сыр творож"],
    per100: { kcal: 98, p: 11, f: 4.3, c: 3.4, fiber: 0 }
  },
  {
    keys: ["cheese", "сыр", "mozzarella", "моцарел", "cheddar", "чеддер", "feta", "фет"],
    per100: { kcal: 350, p: 25, f: 28, c: 2 }
  },
  {
    keys: ["butter", "масло сливоч", "olive", "оливков", "oil", "масло подсолн"],
    per100: { kcal: 884, p: 0, f: 100, c: 0 }
  },
  {
    keys: ["banana", "банан"],
    per100: { kcal: 89, p: 1.1, f: 0.3, c: 23, fiber: 2.6 }
  },
  {
    keys: ["apple", "яблок", "pear", "груш"],
    per100: { kcal: 52, p: 0.3, f: 0.2, c: 14, fiber: 2.4 }
  },
  {
    keys: ["orange", "апельсин", "citrus", "мандарин", "грейпфрут"],
    per100: { kcal: 47, p: 0.9, f: 0.1, c: 12, fiber: 2.4 }
  },
  {
    keys: ["berry", "ягод", "strawber", "клубник", "blueber", "черник", "малин"],
    per100: { kcal: 50, p: 1, f: 0.5, c: 12, fiber: 3 }
  },
  {
    keys: ["nut", "орех", "almond", "миндаль", "walnut", "грецк"],
    per100: { kcal: 607, p: 21, f: 54, c: 20, fiber: 12 }
  },
  {
    keys: ["avocado", "авокадо"],
    per100: { kcal: 160, p: 2, f: 15, c: 9, fiber: 7 }
  },
  {
    keys: ["tomato", "томат", "помидор", "огурец", "cucumber"],
    per100: { kcal: 20, p: 1, f: 0.2, c: 4, fiber: 1.5 }
  },
  {
    keys: ["salad", "салат", "lettuce", "латук", "капуст", "cabbage", "broccoli", "броккол"],
    per100: { kcal: 28, p: 2.5, f: 0.4, c: 5, fiber: 2.5 }
  },
  {
    keys: ["soup", "суп", "борщ", "borscht", "broth", "бульон"],
    per100: { kcal: 50, p: 4, f: 2, c: 4, fiber: 1 }
  },
  {
    keys: ["pizza", "пицц"],
    per100: { kcal: 266, p: 11, f: 10, c: 33, fiber: 2 }
  },
  {
    keys: ["burger", "бургер", "sandwich", "сендвич", "шаурм", "shawarma"],
    per100: { kcal: 250, p: 12, f: 12, c: 22, fiber: 2 }
  },
  {
    keys: ["chocolate", "шоколад", "candy", "конфет"],
    per100: { kcal: 535, p: 8, f: 30, c: 58, fiber: 4 }
  },
  {
    keys: ["cookie", "печень", "cake", "торт", "waffle", "вафл", "donut", "пончик"],
    per100: { kcal: 450, p: 6, f: 18, c: 68, fiber: 2 }
  },
  {
    keys: ["honey", "мёд", "мед ", "jam", "варень"],
    per100: { kcal: 304, p: 0.3, f: 0, c: 82, fiber: 0.2 }
  },
  {
    keys: ["protein", "протеин", "whey"],
    per100: { kcal: 400, p: 80, f: 6, c: 8, fiber: 0 }
  }
];

const DEFAULT_PER100: Per100 = { kcal: 140, p: 7, f: 5, c: 16, fiber: 2 };

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function per100ForName(name: string): Per100 {
  const n = normalizeForMatch(name);
  if (!n) return DEFAULT_PER100;
  for (const entry of FOOD_ENTRIES) {
    if (entry.keys.some((k) => n.includes(k))) {
      return entry.per100;
    }
  }
  return DEFAULT_PER100;
}

/**
 * Локальная оценка без OpenAI — по ключевым словам в названии (RU/EN).
 * Не тратит лимиты AI-подписки.
 */
export function estimateFoodItemsTextHeuristic(
  items: Array<{ name: string; grams: number }>
): FoodTextMacroRow[] {
  return items.map((item) => {
    const per100 = per100ForName(item.name);
    const factor = item.grams / 100;
    const fiberRaw = per100.fiber != null ? per100.fiber * factor : 2 * factor;
    const fiber = Math.round(fiberRaw * 10) / 10;
    return {
      calories: Math.max(0, Math.round(per100.kcal * factor)),
      protein: Math.max(0, Math.round(per100.p * factor * 10) / 10),
      fats: Math.max(0, Math.round(per100.f * factor * 10) / 10),
      carbs: Math.max(0, Math.round(per100.c * factor * 10) / 10),
      fiber: fiber > 0 ? fiber : undefined
    };
  });
}

export function hasOpenAiApiKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
