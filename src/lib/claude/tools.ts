import type { Tool } from "@anthropic-ai/sdk/resources/messages";

export const pantryTools: Tool[] = [
  {
    name: "update_pantry",
    description:
      "Add, remove, or update items in the user's pantry. Use this whenever the user mentions buying groceries, using up ingredients, or wanting to modify their pantry. Supports batch operations.",
    input_schema: {
      type: "object" as const,
      properties: {
        operations: {
          type: "array",
          description: "List of pantry operations to perform",
          items: {
            type: "object",
            properties: {
              action: {
                type: "string",
                enum: ["add", "update", "remove"],
                description:
                  "'add' creates a new item or increases quantity if it exists. 'update' modifies an existing item. 'remove' deletes an item.",
              },
              name: {
                type: "string",
                description: "Name of the pantry item",
              },
              category: {
                type: "string",
                enum: [
                  "produce",
                  "dairy",
                  "protein",
                  "pantry",
                  "spice",
                  "other",
                ],
                description:
                  "Category of the item. Infer from the item name if not specified.",
              },
              quantity: {
                type: "number",
                description:
                  "Quantity. For 'add', amount to add. For 'update', new total.",
              },
              unit: {
                type: "string",
                description:
                  "Unit of measurement (e.g., lbs, oz, count, gallon, bunch, can)",
              },
              expiration_date: {
                type: "string",
                description:
                  "Optional expiration date in YYYY-MM-DD format. Estimate for perishables if not specified.",
              },
            },
            required: ["action", "name"],
          },
        },
      },
      required: ["operations"],
    },
  },
  {
    name: "query_pantry",
    description:
      "Search and filter the user's current pantry inventory. Use when the user asks what they have, what's expiring, or to check specific items.",
    input_schema: {
      type: "object" as const,
      properties: {
        category: {
          type: "string",
          enum: [
            "produce",
            "dairy",
            "protein",
            "pantry",
            "spice",
            "other",
          ],
          description: "Filter by category. Omit to search all.",
        },
        search_term: {
          type: "string",
          description:
            "Search term to filter items by name (case-insensitive partial match).",
        },
        expiring_within_days: {
          type: "integer",
          description:
            "Filter to items expiring within this many days. 0 = already expired.",
        },
      },
      required: [],
    },
  },
  {
    name: "suggest_recipe",
    description:
      "Fetch the user's pantry contents to suggest a recipe. Call when the user asks what they can cook or wants meal ideas. Returns current pantry so you can craft a suggestion.",
    input_schema: {
      type: "object" as const,
      properties: {
        cuisine_preference: {
          type: "string",
          description: "Preferred cuisine type (e.g., Italian, Mexican, Asian).",
        },
        max_cooking_time_minutes: {
          type: "integer",
          description: "Maximum cooking time in minutes.",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Desired difficulty level.",
        },
        dietary_restrictions: {
          type: "array",
          items: { type: "string" },
          description:
            "Dietary restrictions (e.g., vegetarian, gluten-free, dairy-free).",
        },
        must_use_ingredients: {
          type: "array",
          items: { type: "string" },
          description:
            "Specific ingredients the user wants to use (e.g., items expiring soon).",
        },
      },
      required: [],
    },
  },
  {
    name: "save_recipe",
    description:
      "Save a recipe to the user's recipe collection. Use when the user wants to save a recipe you suggested, or when they share a recipe they want to keep. Always include a complete ingredient list and clear instructions.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "Recipe title.",
        },
        description: {
          type: "string",
          description: "Brief description of the dish.",
        },
        ingredients: {
          type: "array",
          description: "List of ingredients with quantities.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Ingredient name." },
              quantity: { type: "number", description: "Amount needed." },
              unit: { type: "string", description: "Unit of measurement." },
            },
            required: ["name"],
          },
        },
        instructions: {
          type: "string",
          description:
            "Step-by-step cooking instructions. Use numbered steps.",
        },
        cuisine_type: {
          type: "string",
          description: "Cuisine type (e.g., Italian, Mexican, Asian).",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Difficulty level.",
        },
      },
      required: ["title", "ingredients", "instructions"],
    },
  },
  {
    name: "log_cooking",
    description:
      "Record that the user cooked something and optionally deduct used ingredients from the pantry. Use when the user says they made, cooked, or prepared a meal.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: {
          type: "string",
          description: "What was cooked (e.g., 'Chicken Stir Fry').",
        },
        notes: {
          type: "string",
          description: "Any notes about how it turned out.",
        },
        rating: {
          type: "integer",
          description: "Rating from 1-5 if the user mentions how it was.",
        },
        ingredients_used: {
          type: "array",
          description:
            "Ingredients to deduct from the pantry. Estimate based on the recipe if not specified.",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Ingredient name." },
              quantity: { type: "number", description: "Amount used." },
              unit: { type: "string", description: "Unit." },
            },
            required: ["name"],
          },
        },
      },
      required: ["title"],
    },
  },
  {
    name: "search_recipes",
    description:
      "Search the user's saved recipes and cooking history. Use when they ask about past meals, want to find a recipe, or check their cooking history.",
    input_schema: {
      type: "object" as const,
      properties: {
        search_term: {
          type: "string",
          description: "Search by recipe title or description.",
        },
        cuisine_type: {
          type: "string",
          description: "Filter by cuisine type.",
        },
        difficulty: {
          type: "string",
          enum: ["easy", "medium", "hard"],
          description: "Filter by difficulty.",
        },
      },
      required: [],
    },
  },
];
