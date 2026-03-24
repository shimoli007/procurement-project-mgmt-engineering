import { useState, useEffect, useCallback } from "react";
import type { Item } from "@/types";
import { api } from "@/lib/api";

interface UseItemsResult {
  items: Item[];
  loading: boolean;
  error: string | null;
  createItem: (data: Partial<Item>) => Promise<void>;
  updateItem: (id: number, data: Partial<Item>) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  refetch: () => void;
}

export function useItems(search?: string, category?: string): UseItemsResult {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    const qs = params.toString();
    const url = qs ? `/items?${qs}` : "/items";
    api
      .get<Item[]>(url)
      .then(setItems)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [search, category, tick]);

  const createItem = useCallback(
    async (data: Partial<Item>) => {
      await api.post<Item>("/items", data);
      refetch();
    },
    [refetch],
  );

  const updateItem = useCallback(
    async (id: number, data: Partial<Item>) => {
      await api.patch<Item>(`/items/${id}`, data);
      refetch();
    },
    [refetch],
  );

  const deleteItem = useCallback(
    async (id: number) => {
      await api.delete(`/items/${id}`);
      refetch();
    },
    [refetch],
  );

  return { items, loading, error, createItem, updateItem, deleteItem, refetch };
}
