import { z } from "zod/v4";

const difficulties = ["easy", "medium", "hard"] as const;
const sources = ["ai_generated", "manual", "external_url"] as const;

export const createRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).nullable().optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().optional(),
      unit: z.string().optional(),
    })
  ).default([]),
  instructions: z.string().min(1),
  cuisine_type: z.string().max(50).nullable().optional(),
  difficulty: z.enum(difficulties).nullable().optional(),
  source: z.enum(sources).default("manual"),
});

export const updateRecipeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  ingredients: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().optional(),
      unit: z.string().optional(),
    })
  ).optional(),
  instructions: z.string().min(1).optional(),
  cuisine_type: z.string().max(50).nullable().optional(),
  difficulty: z.enum(difficulties).nullable().optional(),
});

export const createCookingLogSchema = z.object({
  title: z.string().min(1).max(200),
  recipe_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  cooked_at: z.string().datetime().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
});

export type CreateRecipe = z.infer<typeof createRecipeSchema>;
export type UpdateRecipe = z.infer<typeof updateRecipeSchema>;
export type CreateCookingLog = z.infer<typeof createCookingLogSchema>;
