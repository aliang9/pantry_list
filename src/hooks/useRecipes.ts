"use client";

import useSWR from "swr";
import type { Recipe } from "@/types/recipe";
import type { CreateRecipe, UpdateRecipe } from "@/lib/validators/recipe";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useRecipes() {
  const { data, error, isLoading, mutate } = useSWR<Recipe[]>(
    "/api/recipes",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  async function addRecipe(recipe: CreateRecipe) {
    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recipe),
    });
    if (!res.ok) throw new Error("Failed to add recipe");
    const newRecipe = await res.json();
    mutate([newRecipe, ...(data ?? [])], false);
    return newRecipe;
  }

  async function updateRecipe(id: string, updates: UpdateRecipe) {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update recipe");
    const updated = await res.json();
    mutate(
      data?.map((r) => (r.id === id ? updated : r)),
      false
    );
    return updated;
  }

  async function deleteRecipe(id: string) {
    const res = await fetch(`/api/recipes/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete recipe");
    mutate(
      data?.filter((r) => r.id !== id),
      false
    );
  }

  return {
    recipes: data ?? [],
    isLoading,
    error,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    mutate,
  };
}
