import type { DashboardSummary } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function SummaryCards({ summary, loading }: SummaryCardsProps) {
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
  );
}
