import { useState, useEffect, useCallback } from "react";
import type { Order } from "@/types";
import { api } from "@/lib/api";

interface OrderFilters {
  status?: string;
  project_id?: number;
  assigned_to?: number;
}

interface UseOrdersResult {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (data: Partial<Order>) => Promise<void>;
  updateOrder: (id: number, data: Partial<Order>) => Promise<void>;
  updateStatus: (id: number, status: string, note?: string) => Promise<void>;
  refetch: () => void;
}

export function useOrders(filters?: OrderFilters): UseOrdersResult {
  const [orders, setOrders] = useState<Order[]>([]);
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
    if (filters?.status) params.set("status", filters.status);
    if (filters?.project_id)
      params.set("project_id", String(filters.project_id));
    if (filters?.assigned_to)
      params.set("assigned_to", String(filters.assigned_to));
    const qs = params.toString();
    const url = qs ? `/orders?${qs}` : "/orders";
    api
      .get<Order[]>(url)
      .then(setOrders)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [filters?.status, filters?.project_id, filters?.assigned_to, tick]);

  const createOrder = useCallback(
    async (data: Partial<Order>) => {
      await api.post<Order>("/orders", data);
      refetch();
    },
    [refetch],
  );

  const updateOrder = useCallback(
    async (id: number, data: Partial<Order>) => {
      await api.patch<Order>(`/orders/${id}`, data);
      refetch();
    },
    [refetch],
  );

  const updateStatus = useCallback(
    async (id: number, status: string, note?: string) => {
      await api.patch<Order>(`/orders/${id}/status`, { status, note });
      refetch();
    },
    [refetch],
  );

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    updateStatus,
    refetch,
  };
}
