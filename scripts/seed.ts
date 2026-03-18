/**
 * Seed script - populates sample pantry data for development.
 *
 * Usage:
 *   npx tsx scripts/seed.ts <user_email>
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL
 * to be set (reads from .env.local automatically via dotenv).
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const [key, ...rest] = line.split("=");
  if (key && rest.length) env[key.trim()] = rest.join("=").trim();
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const sampleItems = [
  { name: "Eggs", category: "protein", quantity: 12, unit: "count", expiration_date: getFutureDate(14) },
  { name: "Whole Milk", category: "dairy", quantity: 1, unit: "gallon", expiration_date: getFutureDate(10) },
  { name: "Chicken Breast", category: "protein", quantity: 2, unit: "lbs", expiration_date: getFutureDate(4) },
  { name: "Broccoli", category: "produce", quantity: 1, unit: "bunch", expiration_date: getFutureDate(5) },
  { name: "Carrots", category: "produce", quantity: 1, unit: "bag", expiration_date: getFutureDate(14) },
  { name: "Onions", category: "produce", quantity: 3, unit: "count", expiration_date: getFutureDate(21) },
  { name: "Garlic", category: "produce", quantity: 1, unit: "head", expiration_date: getFutureDate(30) },
  { name: "Rice", category: "pantry", quantity: 2, unit: "lbs" },
  { name: "Pasta", category: "pantry", quantity: 1, unit: "box" },
  { name: "Olive Oil", category: "pantry", quantity: 1, unit: "bottle" },
  { name: "Soy Sauce", category: "pantry", quantity: 1, unit: "bottle" },
  { name: "Butter", category: "dairy", quantity: 1, unit: "stick", expiration_date: getFutureDate(30) },
  { name: "Cheddar Cheese", category: "dairy", quantity: 8, unit: "oz", expiration_date: getFutureDate(21) },
  { name: "Salt", category: "spice", quantity: 1, unit: "container" },
  { name: "Black Pepper", category: "spice", quantity: 1, unit: "container" },
  { name: "Cumin", category: "spice", quantity: 1, unit: "jar" },
  { name: "Paprika", category: "spice", quantity: 1, unit: "jar" },
  { name: "Lemons", category: "produce", quantity: 3, unit: "count", expiration_date: getFutureDate(7) },
  { name: "Ground Beef", category: "protein", quantity: 1, unit: "lb", expiration_date: getFutureDate(3) },
  { name: "Tortillas", category: "pantry", quantity: 1, unit: "pack", expiration_date: getFutureDate(14) },
];

function getFutureDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

async function seed() {
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: npx tsx scripts/seed.ts <user_email>");
    process.exit(1);
  }

  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    console.error("Error listing users:", userError.message);
    process.exit(1);
  }

  const user = users.find((u) => u.email === email);
  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  console.log(`Seeding pantry for user: ${email} (${user.id})`);

  // Clear existing items
  await supabase.from("pantry_items").delete().eq("user_id", user.id);

  // Insert sample items
  const items = sampleItems.map((item) => ({
    ...item,
    user_id: user.id,
  }));

  const { error } = await supabase.from("pantry_items").insert(items);

  if (error) {
    console.error("Error seeding:", error.message);
    process.exit(1);
  }

  console.log(`Seeded ${items.length} pantry items.`);
}

seed();
