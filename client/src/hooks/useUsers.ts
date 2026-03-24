import { useState, useEffect, useCallback } from "react";
import type { User } from "@/types";
import { api } from "@/lib/api";

interface UseUsersResult {
  users: User[];
  loading: boolean;
  refetch: () => void;
}

export function useUsers(): UseUsersResult {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .get<User[]>("/users")
      .then(setUsers)
      .catch(() => {
        // keep previous state on error
      })
      .finally(() => setLoading(false));
  }, [tick]);

  return { users, loading, refetch };
}
