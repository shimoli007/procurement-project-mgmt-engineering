import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import type { DashboardSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Info,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

interface KpiDef {
  label: string;
  key: keyof DashboardSummary;
  icon: LucideIcon;
  color: string;
  iconBg: string;
  iconColor: string;
}

const KPI_DEFS: KpiDef[] = [
  {
    label: "Total Orders",
    key: "total_orders",
    icon: ShoppingCart,
    color: "border-blue-500/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-500",
  },
  {
    label: "Pending Orders",
    key: "pending_orders",
    icon: Clock,
    color: "border-amber-500/20",
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-500",
  },
  {
    label: "Delivered",
    key: "delivered_count",
    icon: CheckCircle,
    color: "border-emerald-500/20",
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-500",
  },
  {
    label: "Overdue",
    key: "overdue_count",
    icon: AlertTriangle,
    color: "border-red-500/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-500",
  },
];

interface SummaryCardsProps {
  summary: DashboardSummary | null;
  loading: boolean;
}

interface AiInsight {
  type: "warning" | "info" | "success";
  icon: string;
  title: string;
  description: string;
}

const insightIconMap: Record<string, LucideIcon> = {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Info,
};

const insightTypeStyle = {
  warning: "border-amber-200 bg-amber-50/50",
  info: "border-blue-200 bg-blue-50/50",
  success: "border-emerald-200 bg-emerald-50/50",
};

const insightIconStyle = {
  warning: "text-amber-500",
  info: "text-blue-500",
  success: "text-emerald-500",
};

export default function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ insights: AiInsight[] }>("/ai/dashboard-insights")
      .then((data) => setInsights(data.insights.slice(0, 3)))
      .catch(() => setInsights([]))
      .finally(() => setInsightsLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KPI_DEFS.map((kpi) => {
          const Icon = kpi.icon;
          const value = summary ? summary[kpi.key] : 0;
          return (
            <Card
              key={kpi.key}
              className={cn("overflow-hidden border-l-4 transition-shadow hover:shadow-md", kpi.color)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                      kpi.iconBg
                    )}
                  >
                    <Icon className={cn("h-6 w-6", kpi.iconColor)} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {kpi.label}
                    </p>
                    <p className="text-3xl font-bold tracking-tight">{value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* AI Insights mini-section */}
      {insightsLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 flex-1 rounded-lg" />
          ))}
        </div>
      ) : insights.length > 0 ? (
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="h-4 w-4 text-amber-500" />
              AI Insights
            </div>
            <Link
              to="/ai-insights"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {insights.map((insight, i) => {
              const Icon = insightIconMap[insight.icon] || Info;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-2 rounded-md border p-2.5 text-xs",
                    insightTypeStyle[insight.type] || insightTypeStyle.info
                  )}
                >
                  <Icon
                    className={cn(
                      "h-3.5 w-3.5 mt-0.5 shrink-0",
                      insightIconStyle[insight.type] || insightIconStyle.info
                    )}
                  />
                  <div>
                    <span className="font-medium">{insight.title}:</span>{" "}
                    <span className="text-muted-foreground">{insight.description}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
