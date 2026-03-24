import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";

interface HistoryPoint {
  month: string;
  quantity: number;
}

interface ForecastPoint {
  month: string;
  predicted_quantity: number;
}

interface ForecastData {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  trend: "increasing" | "decreasing" | "stable";
  avg_monthly: number;
  message?: string;
}

interface DemandForecastProps {
  itemId: number;
}

const trendConfig = {
  increasing: {
    icon: TrendingUp,
    label: "Increasing",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  decreasing: {
    icon: TrendingDown,
    label: "Decreasing",
    color: "text-red-600",
    bg: "bg-red-50",
  },
  stable: {
    icon: Minus,
    label: "Stable",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
};

export function DemandForecast({ itemId }: DemandForecastProps) {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get<ForecastData>(`/ai/demand-forecast/${itemId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Demand Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Demand Forecast
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {data?.message || "No order history available for forecasting."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const trend = trendConfig[data.trend];
  const TrendIcon = trend.icon;

  // Combine history and forecast for chart
  const chartData = [
    ...data.history.map((h) => ({
      month: h.month,
      actual: h.quantity,
      forecast: null as number | null,
    })),
    // Bridge point: last history point is also first forecast reference
    ...data.forecast.map((f) => ({
      month: f.month,
      actual: null as number | null,
      forecast: f.predicted_quantity,
    })),
  ];

  // Add the bridge connection
  if (data.history.length > 0 && data.forecast.length > 0) {
    const lastHistoryIdx = data.history.length - 1;
    chartData[lastHistoryIdx].forecast = chartData[lastHistoryIdx].actual;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4 text-blue-500" /> Demand Forecast
          </CardTitle>
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                trend.bg,
                trend.color
              )}
            >
              <TrendIcon className="h-3 w-3" />
              {trend.label}
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Avg Monthly</div>
              <div className="text-sm font-bold">{data.avg_monthly}</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11 }}
                tickFormatter={(v: string) => v.slice(5)}
              />
              <YAxis tick={{ fontSize: 11 }} width={40} />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                }}
              />
              <ReferenceLine
                y={data.avg_monthly}
                stroke="#94a3b8"
                strokeDasharray="3 3"
                label={{ value: "Avg", fontSize: 10, fill: "#94a3b8" }}
              />
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="Actual"
                connectNulls={false}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#3b82f6"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={{ r: 3, strokeDasharray: "" }}
                name="Forecast"
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 bg-blue-500 rounded" />
            Historical
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-0.5 w-4 bg-blue-500 rounded border-dashed border border-blue-500" />
            Forecast
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
