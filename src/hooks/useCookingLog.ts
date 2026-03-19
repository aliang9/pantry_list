"use client";

import useSWR from "swr";
import type { CookingLog } from "@/types/recipe";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useCookingLog() {
  const { data, error, isLoading, mutate } = useSWR<CookingLog[]>(
    "/api/cooking-log",
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    logs: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
