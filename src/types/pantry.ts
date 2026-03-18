export type PantryCategory =
  | "produce"
  | "dairy"
  | "protein"
  | "pantry"
  | "spice"
  | "other";

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: PantryCategory;
  quantity: number;
  unit: string;
  added_at: string;
  updated_at: string;
  expiration_date: string | null;
}
