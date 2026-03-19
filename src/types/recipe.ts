export type RecipeDifficulty = "easy" | "medium" | "hard";
export type RecipeSource = "ai_generated" | "manual" | "external_url";

export interface RecipeIngredient {
  name: string;
  quantity?: number;
  unit?: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: RecipeIngredient[];
  instructions: string;
  cuisine_type: string | null;
  difficulty: RecipeDifficulty | null;
  created_at: string;
  updated_at: string;
  source: RecipeSource;
}

export interface CookingLog {
  id: string;
  user_id: string;
  recipe_id: string | null;
  title: string;
  notes: string | null;
  cooked_at: string;
  rating: number | null;
  created_at: string;
  recipe?: Recipe | null;
}
