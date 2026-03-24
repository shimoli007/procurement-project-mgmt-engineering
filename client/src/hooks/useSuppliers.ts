import { useState, useEffect, useCallback } from "react";
import type { Supplier } from "@/types";
import { api } from "@/lib/api";

interface UseSuppliersResult {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  createSupplier: (data: Partial<Supplier>) => Promise<void>;
  updateSupplier: (id: number, data: Partial<Supplier>) => Promise<void>;
  deleteSupplier: (id: number) => Promise<void>;
  refetch: () => void;
}

export function useSuppliers(): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<Supplier[]>("/suppliers")
      .then(setSuppliers)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tick]);

  const createSupplier = useCallback(
    async (data: Partial<Supplier>) => {
      await api.post<Supplier>("/suppliers", data);
      refetch();
    },
    [refetch],
  );

  const updateSupplier = useCallback(
    async (id: number, data: Partial<Supplier>) => {
      await api.patch<Supplier>(`/suppliers/${id}`, data);
      refetch();
    },
    [refetch],
  );

  const deleteSupplier = useCallback(
    async (id: number) => {
      await api.delete(`/suppliers/${id}`);
      refetch();
    },
    [refetch],
  );

  return {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refetch,
  };
}
