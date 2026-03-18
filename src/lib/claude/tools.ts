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
];
