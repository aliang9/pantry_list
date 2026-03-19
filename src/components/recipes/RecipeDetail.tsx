"use client";

import BottomSheet from "@/components/ui/BottomSheet";
import type { Recipe } from "@/types/recipe";

interface RecipeDetailProps {
  recipe: Recipe | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export default function RecipeDetail({
  recipe,
  onClose,
  onDelete,
}: RecipeDetailProps) {
  return (
    <BottomSheet open={!!recipe} onClose={onClose}>
      {recipe && (
        <>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {recipe.title}
          </h2>

          {recipe.description && (
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {recipe.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {recipe.cuisine_type && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                {recipe.cuisine_type}
              </span>
            )}
            {recipe.difficulty && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 capitalize">
                {recipe.difficulty}
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {recipe.source === "ai_generated" ? "AI generated" : recipe.source}
            </span>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
              Ingredients
            </h3>
            <ul className="space-y-1.5">
              {recipe.ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
                  <span>
                    {ing.quantity && `${ing.quantity} `}
                    {ing.unit && `${ing.unit} `}
                    {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
              Instructions
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {recipe.instructions}
            </div>
          </div>

          <button
            onClick={() => {
              onDelete(recipe.id);
              onClose();
            }}
            className="w-full mt-6 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl text-sm min-h-[44px] transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Delete recipe
          </button>
        </>
      )}
    </BottomSheet>
  );
}
