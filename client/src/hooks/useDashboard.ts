import { useState, useEffect, useCallback } from "react";
import type { DashboardSummary, Order } from "@/types";
import { api } from "@/lib/api";

interface ProjectReadiness {
  project_id: number;
  project_name: string;
  readiness_pct: number;
}

interface UseDashboardResult {
  summary: DashboardSummary | null;
  recentOrders: Order[];
  projectReadiness: ProjectReadiness[];
  loading: boolean;
  refetch: () => void;
}

export function useDashboard(): UseDashboardResult {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [projectReadiness, setProjectReadiness] = useState<
    ProjectReadiness[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<DashboardSummary>("/dashboard/summary"),
      api.get<Order[]>("/dashboard/recent-orders"),
      api.get<ProjectReadiness[]>("/dashboard/project-readiness"),
    ])
      .then(([s, r, p]) => {
        setSummary(s);
        setRecentOrders(r);
        setProjectReadiness(p);
      })
      .catch(() => {
        // Individual endpoints may fail; keep previous state
      })
      .finally(() => setLoading(false));
  }, [tick]);

  return { summary, recentOrders, projectReadiness, loading, refetch };
}
