import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  FolderKanban,
  DollarSign,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react";

interface Insight {
  type: "warning" | "info" | "success";
  icon: string;
  title: string;
  description: string;
}

interface SupplierSwitch {
  item_id: number;
  item_name: string;
  current_supplier: string;
  current_price: number;
  recommended_supplier: string;
  recommended_price: number;
  quantity: number;
  potential_savings: number;
}

interface BulkOpportunity {
  item_id: number;
  item_name: string;
  order_count: number;
  total_quantity: number;
  avg_price: number;
  suggested_bulk_order: number;
  estimated_savings: number;
}

interface CostData {
  supplier_switches: SupplierSwitch[];
  bulk_opportunities: BulkOpportunity[];
  total_potential_savings: number;
}

interface CategorySuggestion {
  item_id: number;
  item_name: string;
  current_description: string;
  suggested_category: string;
  confidence: number;
}

const iconMap: Record<string, React.ElementType> = {
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  FolderKanban,
  DollarSign,
  Clock,
  Info,
};

const typeConfig = {
  warning: {
    bg: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    fallbackIcon: AlertTriangle,
  },
  info: {
    bg: "bg-blue-50 border-blue-200",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    fallbackIcon: Info,
  },
  success: {
    bg: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    fallbackIcon: CheckCircle,
  },
};

export default function AIInsightsPage() {
  const { toast } = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [costData, setCostData] = useState<CostData | null>(null);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [loadingInsights, setLoadingInsights] = useState(true);
  const [loadingCost, setLoadingCost] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(() => {
    setLoadingInsights(true);
    api
      .get<{ insights: Insight[] }>("/ai/dashboard-insights")
      .then((data) => setInsights(data.insights))
      .catch(() => setInsights([]))
      .finally(() => setLoadingInsights(false));
  }, []);

  const fetchCost = useCallback(() => {
    setLoadingCost(true);
    api
      .get<CostData>("/ai/cost-optimization")
      .then(setCostData)
      .catch(() => setCostData(null))
      .finally(() => setLoadingCost(false));
  }, []);

  const fetchCategories = useCallback(() => {
    setLoadingCategories(true);
    api
      .get<{ suggestions: CategorySuggestion[] }>("/ai/auto-categorize")
      .then((data) => setCategories(data.suggestions))
      .catch(() => setCategories([]))
      .finally(() => setLoadingCategories(false));
  }, []);

  useEffect(() => {
    fetchInsights();
    fetchCost();
    fetchCategories();
  }, [fetchInsights, fetchCost, fetchCategories]);

  function handleRefresh() {
    setRefreshing(true);
    fetchInsights();
    fetchCost();
    fetchCategories();
    setTimeout(() => setRefreshing(false), 500);
  }

  async function handleApplyCategory(itemId: number, category: string) {
    try {
      await api.patch(`/items/${itemId}`, { category });
      setCategories((prev) => prev.filter((c) => c.item_id !== itemId));
      toast(`Category "${category}" applied successfully`, "success");
    } catch {
      toast("Failed to apply category", "error");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Sparkles className="h-6 w-6 text-amber-500" />
            AI Insights
          </h1>
          <p className="text-muted-foreground">
            Smart analytics and recommendations powered by data analysis
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      {/* Dashboard Insights */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Dashboard Insights</h2>
        {loadingInsights ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <p className="text-sm text-muted-foreground">No insights available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {insights.map((insight, i) => {
              const config = typeConfig[insight.type] || typeConfig.info;
              const Icon =
                iconMap[insight.icon] || config.fallbackIcon;
              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-4",
                    config.bg
                  )}
                >
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      config.iconBg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.iconColor)} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{insight.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {insight.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Cost Optimization */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-emerald-500" />
          Cost Optimization
        </h2>
        {loadingCost ? (
          <Skeleton className="h-48 w-full rounded-lg" />
        ) : !costData ? (
          <p className="text-sm text-muted-foreground">Unable to load cost data.</p>
        ) : (
          <div className="space-y-4">
            {costData.total_potential_savings > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-800">
                  Total potential savings:{" "}
                  <span className="text-lg font-bold">
                    ${costData.total_potential_savings.toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            {/* Supplier Switches */}
            {costData.supplier_switches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Supplier Switch Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-4">Item</th>
                          <th className="pb-2 pr-4">Current</th>
                          <th className="pb-2 pr-4">Recommended</th>
                          <th className="pb-2 pr-4 text-right">Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costData.supplier_switches.map((sw, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">
                              {sw.item_name}
                            </td>
                            <td className="py-2 pr-4 text-muted-foreground">
                              {sw.current_supplier}{" "}
                              <span className="text-xs">
                                (${sw.current_price})
                              </span>
                            </td>
                            <td className="py-2 pr-4">
                              <span className="text-emerald-600 font-medium">
                                {sw.recommended_supplier}
                              </span>{" "}
                              <span className="text-xs">
                                (${sw.recommended_price})
                              </span>
                            </td>
                            <td className="py-2 text-right font-medium text-emerald-600">
                              ${sw.potential_savings}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bulk Opportunities */}
            {costData.bulk_opportunities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Bulk Order Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs text-muted-foreground">
                          <th className="pb-2 pr-4">Item</th>
                          <th className="pb-2 pr-4 text-right">Orders</th>
                          <th className="pb-2 pr-4 text-right">Total Qty</th>
                          <th className="pb-2 pr-4 text-right">
                            Suggested Bulk
                          </th>
                          <th className="pb-2 text-right">Est. Savings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costData.bulk_opportunities.map((bo, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 pr-4 font-medium">
                              {bo.item_name}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              {bo.order_count}
                            </td>
                            <td className="py-2 pr-4 text-right">
                              {bo.total_quantity}
                            </td>
                            <td className="py-2 pr-4 text-right font-medium">
                              {bo.suggested_bulk_order}
                            </td>
                            <td className="py-2 text-right font-medium text-emerald-600">
                              ${bo.estimated_savings}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {costData.supplier_switches.length === 0 &&
              costData.bulk_opportunities.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cost optimization opportunities found at this time.
                </p>
              )}
          </div>
        )}
      </section>

      {/* Auto-Categorize */}
      <section>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Tag className="h-5 w-5 text-purple-500" />
          Auto-Categorize Items
        </h2>
        {loadingCategories ? (
          <Skeleton className="h-32 w-full rounded-lg" />
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-sm text-muted-foreground">
                All items are categorized. No suggestions needed.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                {categories.map((cat) => (
                  <div
                    key={cat.item_id}
                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {cat.item_name}
                      </p>
                      {cat.current_description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {cat.current_description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <Badge variant="secondary">{cat.suggested_category}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {Math.round(cat.confidence * 100)}%
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() =>
                          handleApplyCategory(cat.item_id, cat.suggested_category)
                        }
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
