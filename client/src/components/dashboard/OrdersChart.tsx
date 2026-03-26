import type { DashboardSummary } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { TrendingUp } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  Pending: "#f59e0b",
  Ordered: "#3b82f6",
  Shipped: "#8b5cf6",
  Delivered: "#10b981",
  Cancelled: "#6b7280",
};

interface OrdersChartProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

export default function OrdersChart({ summary, loading }: OrdersChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const data = summary
    ? [
        { status: "Pending", count: summary.pending_orders, fill: STATUS_COLORS.Pending },
        { status: "Ordered", count: summary.ordered_count, fill: STATUS_COLORS.Ordered },
        { status: "Shipped", count: summary.shipped_count, fill: STATUS_COLORS.Shipped },
        { status: "Delivered", count: summary.delivered_count, fill: STATUS_COLORS.Delivered },
        { status: "Cancelled", count: Math.max(0, summary.total_orders - summary.pending_orders - summary.ordered_count - summary.shipped_count - summary.delivered_count), fill: STATUS_COLORS.Cancelled },
      ]
    : [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
        <CardTitle className="text-base">Orders by Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <XAxis
                dataKey="status"
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                  fontSize: "13px",
                }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={56}
              >
                {data.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
