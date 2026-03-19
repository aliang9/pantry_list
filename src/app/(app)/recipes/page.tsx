"use client";

import { useState } from "react";
import { useRecipes } from "@/hooks/useRecipes";
import { useCookingLog } from "@/hooks/useCookingLog";
import RecipeCard from "@/components/recipes/RecipeCard";
import RecipeDetail from "@/components/recipes/RecipeDetail";
import CookingLogEntry from "@/components/recipes/CookingLogEntry";
import type { Recipe } from "@/types/recipe";

type Tab = "recipes" | "log";

function RecipesSkeleton() {
  return (
    <div className="space-y-3 mt-2">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-24 bg-gray-100 dark:bg-gray-900 rounded-2xl animate-pulse"
        />
      ))}
    </div>
  );
}

export default function RecipesPage() {
  const [tab, setTab] = useState<Tab>("recipes");
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { recipes, isLoading: recipesLoading, deleteRecipe } = useRecipes();
  const { logs, isLoading: logsLoading } = useCookingLog();

  const isLoading = tab === "recipes" ? recipesLoading : logsLoading;

  return (
    <div className="px-4 pt-safe-top">
      <h1 className="text-2xl font-bold py-6 text-gray-900 dark:text-white">
        Recipes
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTab("recipes")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
            tab === "recipes"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          Saved Recipes
          {recipes.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">
              ({recipes.length})
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("log")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium min-h-[44px] transition-all ${
            tab === "log"
              ? "bg-green-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          }`}
        >
          Cooking Log
          {logs.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">({logs.length})</span>
          )}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <RecipesSkeleton />
      ) : tab === "recipes" ? (
        recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-lg">No saved recipes</p>
            <p className="text-sm mt-1">
              Ask your assistant to suggest a recipe, then save it
            </p>
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onSelect={setSelectedRecipe}
              />
            ))}
          </div>
        )
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <p className="text-lg">No cooking history</p>
          <p className="text-sm mt-1">
            Tell your assistant when you cook something to start tracking
          </p>
        </div>
      ) : (
        <div className="space-y-3 animate-fade-in">
          {logs.map((log) => (
            <CookingLogEntry key={log.id} log={log} />
          ))}
        </div>
      )}

      <RecipeDetail
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onDelete={deleteRecipe}
      />
    </div>
  );
}
