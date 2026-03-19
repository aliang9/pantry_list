"use client";

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
  if (!recipe) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div
        className="absolute inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />
      <div className="relative w-full bg-white dark:bg-gray-900 rounded-t-2xl p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-slide-up">
        <div className="w-10 h-1 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4" />

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

        {/* Ingredients */}
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

        {/* Instructions */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
            Instructions
          </h3>
          <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
            {recipe.instructions}
          </div>
        </div>

        {/* Delete */}
        <button
          onClick={() => {
            onDelete(recipe.id);
            onClose();
          }}
          className="w-full mt-6 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl text-sm min-h-[44px] transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          Delete recipe
        </button>
      </div>
    </div>
  );
}
