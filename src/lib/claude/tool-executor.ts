import { createAdminClient } from "@/lib/supabase/admin";

interface UpdatePantryInput {
  operations: Array<{
    action: "add" | "update" | "remove";
    name: string;
    category?: string;
    quantity?: number;
    unit?: string;
    expiration_date?: string;
  }>;
}

interface QueryPantryInput {
  category?: string;
  search_term?: string;
  expiring_within_days?: number;
}

interface SaveRecipeInput {
  title: string;
  description?: string;
  ingredients: Array<{ name: string; quantity?: number; unit?: string }>;
  instructions: string;
  cuisine_type?: string;
  difficulty?: string;
}

interface LogCookingInput {
  title: string;
  notes?: string;
  rating?: number;
  ingredients_used?: Array<{ name: string; quantity?: number; unit?: string }>;
}

interface SearchRecipesInput {
  search_term?: string;
  cuisine_type?: string;
  difficulty?: string;
}

interface SuggestRecipeInput {
  cuisine_preference?: string;
  max_cooking_time_minutes?: number;
  difficulty?: string;
  dietary_restrictions?: string[];
  must_use_ingredients?: string[];
}

export async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  userId: string
): Promise<unknown> {
  switch (toolName) {
    case "update_pantry":
      return executeUpdatePantry(input as unknown as UpdatePantryInput, userId);
    case "query_pantry":
      return executeQueryPantry(input as unknown as QueryPantryInput, userId);
    case "suggest_recipe":
      return executeSuggestRecipe(
        input as unknown as SuggestRecipeInput,
        userId
      );
    case "save_recipe":
      return executeSaveRecipe(input as unknown as SaveRecipeInput, userId);
    case "log_cooking":
      return executeLogCooking(input as unknown as LogCookingInput, userId);
    case "search_recipes":
      return executeSearchRecipes(
        input as unknown as SearchRecipesInput,
        userId
      );
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function executeUpdatePantry(input: UpdatePantryInput, userId: string) {
  const supabase = createAdminClient();
  const results: Array<{ action: string; name: string; success: boolean; detail?: string }> = [];

  for (const op of input.operations) {
    try {
      if (op.action === "add") {
        // Try to find existing item first
        const { data: existing } = await supabase
          .from("pantry_items")
          .select("id, quantity")
          .eq("user_id", userId)
          .ilike("name", op.name)
          .eq("category", op.category ?? "other")
          .single();

        if (existing) {
          // Increment quantity
          const newQty = existing.quantity + (op.quantity ?? 1);
          await supabase
            .from("pantry_items")
            .update({
              quantity: newQty,
              unit: op.unit ?? undefined,
              expiration_date: op.expiration_date ?? undefined,
            })
            .eq("id", existing.id);
          results.push({
            action: "updated",
            name: op.name,
            success: true,
            detail: `quantity now ${newQty} ${op.unit ?? ""}`.trim(),
          });
        } else {
          // Insert new
          await supabase.from("pantry_items").insert({
            user_id: userId,
            name: op.name,
            category: op.category ?? "other",
            quantity: op.quantity ?? 1,
            unit: op.unit ?? "unit",
            expiration_date: op.expiration_date ?? null,
          });
          results.push({
            action: "added",
            name: op.name,
            success: true,
            detail: `${op.quantity ?? 1} ${op.unit ?? "unit"}`,
          });
        }
      } else if (op.action === "update") {
        const updates: Record<string, unknown> = {};
        if (op.quantity !== undefined) updates.quantity = op.quantity;
        if (op.unit !== undefined) updates.unit = op.unit;
        if (op.category !== undefined) updates.category = op.category;
        if (op.expiration_date !== undefined)
          updates.expiration_date = op.expiration_date;

        const { error } = await supabase
          .from("pantry_items")
          .update(updates)
          .eq("user_id", userId)
          .ilike("name", op.name);

        results.push({
          action: "updated",
          name: op.name,
          success: !error,
          detail: error?.message,
        });
      } else if (op.action === "remove") {
        const { error } = await supabase
          .from("pantry_items")
          .delete()
          .eq("user_id", userId)
          .ilike("name", op.name);

        results.push({
          action: "removed",
          name: op.name,
          success: !error,
          detail: error?.message,
        });
      }
    } catch (err) {
      results.push({
        action: op.action,
        name: op.name,
        success: false,
        detail: String(err),
      });
    }
  }

  return { results };
}

async function executeQueryPantry(input: QueryPantryInput, userId: string) {
  const supabase = createAdminClient();

  let query = supabase
    .from("pantry_items")
    .select("name, category, quantity, unit, expiration_date, added_at")
    .eq("user_id", userId)
    .order("category")
    .order("name");

  if (input.category) {
    query = query.eq("category", input.category);
  }

  if (input.search_term) {
    query = query.ilike("name", `%${input.search_term}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  // Filter by expiration if requested
  let items = data ?? [];
  if (input.expiring_within_days !== undefined) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + input.expiring_within_days);
    items = items.filter((item) => {
      if (!item.expiration_date) return false;
      const expDate = new Date(item.expiration_date);
      return expDate <= cutoff;
    });
  }

  return {
    items,
    total_count: items.length,
  };
}

async function executeSuggestRecipe(
  input: SuggestRecipeInput,
  userId: string
) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("pantry_items")
    .select("name, category, quantity, unit, expiration_date")
    .eq("user_id", userId)
    .order("category")
    .order("name");

  if (error) {
    return { error: error.message };
  }

  return {
    available_ingredients: data ?? [],
    total_items: data?.length ?? 0,
    preferences: {
      cuisine: input.cuisine_preference ?? null,
      max_time: input.max_cooking_time_minutes ?? null,
      difficulty: input.difficulty ?? null,
      dietary_restrictions: input.dietary_restrictions ?? [],
      must_use: input.must_use_ingredients ?? [],
    },
  };
}

async function executeSaveRecipe(input: SaveRecipeInput, userId: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: input.title,
      description: input.description ?? null,
      ingredients: input.ingredients,
      instructions: input.instructions,
      cuisine_type: input.cuisine_type ?? null,
      difficulty: input.difficulty ?? null,
      source: "ai_generated",
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return {
    saved: true,
    recipe: {
      id: data.id,
      title: data.title,
      cuisine_type: data.cuisine_type,
      difficulty: data.difficulty,
      ingredient_count: input.ingredients.length,
    },
  };
}

async function executeLogCooking(input: LogCookingInput, userId: string) {
  const supabase = createAdminClient();

  // Try to find a matching saved recipe
  let recipeId: string | null = null;
  const { data: matchingRecipe } = await supabase
    .from("recipes")
    .select("id")
    .eq("user_id", userId)
    .ilike("title", `%${input.title}%`)
    .limit(1)
    .single();

  if (matchingRecipe) {
    recipeId = matchingRecipe.id;
  }

  // Insert cooking log
  const { data: log, error: logError } = await supabase
    .from("cooking_logs")
    .insert({
      user_id: userId,
      recipe_id: recipeId,
      title: input.title,
      notes: input.notes ?? null,
      rating: input.rating ?? null,
    })
    .select()
    .single();

  if (logError) {
    return { error: logError.message };
  }

  // Deduct ingredients from pantry
  const deducted: Array<{ name: string; success: boolean; detail?: string }> = [];

  if (input.ingredients_used) {
    for (const ing of input.ingredients_used) {
      const { data: existing } = await supabase
        .from("pantry_items")
        .select("id, quantity, unit")
        .eq("user_id", userId)
        .ilike("name", ing.name)
        .single();

      if (existing) {
        const qtyToDeduct = ing.quantity ?? 1;
        const newQty = existing.quantity - qtyToDeduct;

        if (newQty <= 0) {
          await supabase
            .from("pantry_items")
            .delete()
            .eq("id", existing.id);
          deducted.push({
            name: ing.name,
            success: true,
            detail: "removed (used up)",
          });
        } else {
          await supabase
            .from("pantry_items")
            .update({ quantity: newQty })
            .eq("id", existing.id);
          deducted.push({
            name: ing.name,
            success: true,
            detail: `${newQty} ${existing.unit} remaining`,
          });
        }
      } else {
        deducted.push({
          name: ing.name,
          success: false,
          detail: "not found in pantry",
        });
      }
    }
  }

  return {
    logged: true,
    cooking_log: {
      id: log.id,
      title: log.title,
      rating: log.rating,
      linked_recipe: recipeId ? true : false,
    },
    pantry_updates: deducted,
  };
}

async function executeSearchRecipes(
  input: SearchRecipesInput,
  userId: string
) {
  const supabase = createAdminClient();

  // Search recipes
  let recipeQuery = supabase
    .from("recipes")
    .select("id, title, description, cuisine_type, difficulty, ingredients, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(10);

  if (input.search_term) {
    recipeQuery = recipeQuery.or(
      `title.ilike.%${input.search_term}%,description.ilike.%${input.search_term}%`
    );
  }
  if (input.cuisine_type) {
    recipeQuery = recipeQuery.ilike("cuisine_type", `%${input.cuisine_type}%`);
  }
  if (input.difficulty) {
    recipeQuery = recipeQuery.eq("difficulty", input.difficulty);
  }

  const { data: recipes, error: recipeError } = await recipeQuery;

  if (recipeError) {
    return { error: recipeError.message };
  }

  // Get recent cooking logs
  const { data: logs } = await supabase
    .from("cooking_logs")
    .select("id, title, notes, rating, cooked_at")
    .eq("user_id", userId)
    .order("cooked_at", { ascending: false })
    .limit(10);

  return {
    recipes: recipes ?? [],
    recent_cooking: logs ?? [],
    recipe_count: recipes?.length ?? 0,
  };
}
