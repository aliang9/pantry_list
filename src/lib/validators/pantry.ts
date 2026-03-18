import { z } from "zod/v4";

const pantryCategories = [
  "produce",
  "dairy",
  "protein",
  "pantry",
  "spice",
  "other",
] as const;

export const createPantryItemSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(pantryCategories).default("other"),
  quantity: z.number().positive().default(1),
  unit: z.string().min(1).max(50).default("unit"),
  expiration_date: z.string().date().nullable().optional(),
});

export const updatePantryItemSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.enum(pantryCategories).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).max(50).optional(),
  expiration_date: z.string().date().nullable().optional(),
});

export type CreatePantryItem = z.infer<typeof createPantryItemSchema>;
export type UpdatePantryItem = z.infer<typeof updatePantryItemSchema>;
