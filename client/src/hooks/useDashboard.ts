import { useState, useEffect, useCallback } from "react";
import type { DashboardSummary, Order } from "@/types";
import { api } from "@/lib/api";

interface ProjectReadiness {
  project_id: number;
  project_name: string;
  readiness_pct: number;
}

interface RawProjectReadiness {
  id: number;
  name: string;
  client_name: string;
  bom_items: number;
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

    interface RawSummary {
      projects: { total: number; active: number };
      orders: { total: number; pending: number; ordered: number; shipped: number; delivered: number };
      items: number;
      suppliers: number;
      total_order_value: number;
    }

    Promise.all([
      api.get<RawSummary>("/dashboard/summary"),
      api.get<Order[]>("/dashboard/recent-orders"),
      api.get<RawProjectReadiness[]>("/dashboard/project-readiness"),
    ])
      .then(([raw, r, rawP]) => {
        // Transform API shape to DashboardSummary type
        const s: DashboardSummary = {
          total_orders: raw.orders?.total ?? 0,
          pending_orders: raw.orders?.pending ?? 0,
          ordered_count: raw.orders?.ordered ?? 0,
          delivered_count: raw.orders?.delivered ?? 0,
          overdue_count: 0,
          total_projects: raw.projects?.total ?? 0,
          active_projects: raw.projects?.active ?? 0,
          total_items: raw.items ?? 0,
        };
        setSummary(s);
        setRecentOrders(Array.isArray(r) ? r : []);
        // Transform project readiness field names
        const p = (Array.isArray(rawP) ? rawP : []).map((pr) => ({
          project_id: pr.id,
          project_name: pr.name,
          readiness_pct: pr.readiness_pct,
        }));
        setProjectReadiness(p);
      })
      .catch(() => {
        // Individual endpoints may fail; keep previous state
      })
      .finally(() => setLoading(false));
  }, [tick]);

  return { summary, recentOrders, projectReadiness, loading, refetch };
}
