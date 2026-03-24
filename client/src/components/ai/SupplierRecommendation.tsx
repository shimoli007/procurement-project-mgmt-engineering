import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Award, Clock, DollarSign, Star, TrendingUp } from "lucide-react";

interface SupplierRec {
  supplier_id: number;
  supplier_name: string;
  unit_price: number;
  lead_time_days: number;
  is_preferred: number;
  total_orders: number;
  delivered_orders: number;
  on_time_pct: number;
  price_score: number;
  lead_time_score: number;
  reliability_score: number;
  experience_score: number;
  overall_score: number;
  reasoning: string;
  badges: string[];
}

interface SupplierRecommendationProps {
  itemId: number;
}

const badgeConfig: Record<string, { color: string; icon: React.ElementType }> = {
  "Best Value": { color: "bg-emerald-100 text-emerald-800 border-emerald-300", icon: DollarSign },
  Fastest: { color: "bg-blue-100 text-blue-800 border-blue-300", icon: Clock },
  "Most Reliable": { color: "bg-purple-100 text-purple-800 border-purple-300", icon: Award },
};

export function SupplierRecommendation({ itemId }: SupplierRecommendationProps) {
  const [recommendations, setRecommendations] = useState<SupplierRec[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .get<{ recommendations: SupplierRec[]; message?: string }>(
        `/ai/supplier-recommendations/${itemId}`
      )
      .then((data) => {
        setRecommendations(data.recommendations);
        setMessage(data.message || "");
      })
      .catch(() => setMessage("Failed to load recommendations"))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" /> Supplier Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Star className="h-4 w-4" /> Supplier Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {message || "No suppliers available for recommendation."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Star className="h-4 w-4 text-amber-500" /> Supplier Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, idx) => (
          <div
            key={rec.supplier_id}
            className={cn(
              "rounded-lg border p-4 transition-shadow hover:shadow-sm",
              idx === 0 && "border-primary/30 bg-primary/5"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-muted-foreground">
                    #{idx + 1}
                  </span>
                  <span className="font-medium">{rec.supplier_name}</span>
                  {rec.badges.map((badge) => {
                    const config = badgeConfig[badge];
                    const Icon = config?.icon || TrendingUp;
                    return (
                      <Badge
                        key={badge}
                        className={cn(
                          "text-[10px] gap-1",
                          config?.color || "bg-gray-100 text-gray-800"
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {badge}
                      </Badge>
                    );
                  })}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {rec.reasoning}
                </p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-primary">
                  {rec.overall_score}
                </div>
                <div className="text-[10px] text-muted-foreground">SCORE</div>
              </div>
            </div>

            {/* Score bars */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <ScoreBar label="Price" score={rec.price_score} />
              <ScoreBar label="Lead Time" score={rec.lead_time_score} />
              <ScoreBar label="Reliability" score={rec.reliability_score} />
              <ScoreBar label="Experience" score={rec.experience_score} />
            </div>

            {/* Stats */}
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>
                Price: <span className="font-medium text-foreground">${rec.unit_price}</span>
              </span>
              <span>
                Lead: <span className="font-medium text-foreground">{rec.lead_time_days}d</span>
              </span>
              <span>
                On-time: <span className="font-medium text-foreground">{rec.on_time_pct}%</span>
              </span>
              <span>
                Orders: <span className="font-medium text-foreground">{rec.total_orders}</span>
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 text-muted-foreground">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            score >= 80
              ? "bg-emerald-500"
              : score >= 50
                ? "bg-amber-500"
                : "bg-red-500"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-7 text-right font-medium">{score}</span>
    </div>
  );
}
