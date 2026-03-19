"use client";

import { memo } from "react";
import type { Recipe } from "@/types/recipe";

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  hard: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

interface RecipeCardProps {
  recipe: Recipe;
  onSelect: (recipe: Recipe) => void;
}

function RecipeCardInner({ recipe, onSelect }: RecipeCardProps) {
  return (
    <button
      onClick={() => onSelect(recipe)}
      className="w-full text-left bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm active:scale-[0.98] transition-transform"
    >
      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
        {recipe.title}
      </h3>
      {recipe.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
          {recipe.description}
        </p>
      )}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        {recipe.cuisine_type && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            {recipe.cuisine_type}
          </span>
        )}
        {recipe.difficulty && (
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              difficultyColors[recipe.difficulty] ?? ""
            }`}
          >
            {recipe.difficulty}
          </span>
        )}
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {recipe.ingredients.length} ingredients
        </span>
      </div>
    </button>
  );
}

const RecipeCard = memo(RecipeCardInner);
RecipeCard.displayName = "RecipeCard";

export default RecipeCard;
