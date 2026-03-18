"use client";

import useSWR from "swr";
import type { PantryItem } from "@/types/pantry";
import type { CreatePantryItem, UpdatePantryItem } from "@/lib/validators/pantry";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function usePantry() {
  const { data, error, isLoading, mutate } = useSWR<PantryItem[]>(
    "/api/pantry",
    fetcher
  );

  async function addItem(item: CreatePantryItem) {
    const res = await fetch("/api/pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
    if (!res.ok) throw new Error("Failed to add item");
    const newItem = await res.json();
    mutate([...(data ?? []), newItem], false);
    return newItem;
  }

  async function updateItem(id: string, updates: UpdatePantryItem) {
    const res = await fetch(`/api/pantry/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error("Failed to update item");
    const updated = await res.json();
    mutate(
      data?.map((item) => (item.id === id ? updated : item)),
      false
    );
    return updated;
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/pantry/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete item");
    mutate(
      data?.filter((item) => item.id !== id),
      false
    );
  }

  return {
    items: data ?? [],
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    mutate,
  };
}
