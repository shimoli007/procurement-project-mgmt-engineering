import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ShieldAlert, CheckCircle, AlertTriangle, XCircle, Lightbulb } from "lucide-react";

interface RiskFactor {
  factor: string;
  impact: string;
  detail: string;
}

interface RiskData {
  project_id: number;
  project_name: string;
  risk_score: number;
  risk_level: "Low" | "Medium" | "High" | "Critical";
  pct_ordered: number;
  pct_delivered: number;
  overdue_orders: number;
  factors: RiskFactor[];
  recommendations: string[];
}

interface ProjectRiskCardProps {
  projectId: number;
}

const riskLevelConfig = {
  Low: {
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    gaugeColor: "text-emerald-500",
    icon: CheckCircle,
  },
  Medium: {
    color: "bg-amber-100 text-amber-800 border-amber-300",
    gaugeColor: "text-amber-500",
    icon: AlertTriangle,
  },
  High: {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    gaugeColor: "text-orange-500",
    icon: AlertTriangle,
  },
  Critical: {
    color: "bg-red-100 text-red-800 border-red-300",
    gaugeColor: "text-red-500",
    icon: XCircle,
  },
};

const impactColors: Record<string, string> = {
  Low: "bg-emerald-100 text-emerald-700",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

export function ProjectRiskCard({ projectId }: ProjectRiskCardProps) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<RiskData>(`/ai/project-risk/${projectId}`)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load risk data"))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {error || "Unable to assess project risk."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const config = riskLevelConfig[data.risk_level];
  const RiskIcon = config.icon;

  // Gauge angle: 0 = far left (low risk), 180 = far right (critical)
  const gaugeAngle = (data.risk_score / 100) * 180;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4 text-orange-500" /> Risk Assessment
          </CardTitle>
          <Badge className={cn("font-medium gap-1", config.color)}>
            <RiskIcon className="h-3 w-3" />
            {data.risk_level}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-32 h-16 overflow-hidden">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              {/* Background arc */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Score arc */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke={
                  data.risk_score >= 75
                    ? "#ef4444"
                    : data.risk_score >= 50
                      ? "#f97316"
                      : data.risk_score >= 25
                        ? "#eab308"
                        : "#22c55e"
                }
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(gaugeAngle / 180) * 157} 157`}
              />
              {/* Score text */}
              <text x="60" y="50" textAnchor="middle" className="text-2xl font-bold" fontSize="20" fill="currentColor">
                {data.risk_score}
              </text>
              <text x="60" y="58" textAnchor="middle" fontSize="7" fill="#9ca3af">
                / 100
              </text>
            </svg>
          </div>

          <div className="flex-1 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="font-bold text-lg">{data.pct_ordered}%</div>
              <div className="text-muted-foreground">Ordered</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="font-bold text-lg">{data.pct_delivered}%</div>
              <div className="text-muted-foreground">Delivered</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="font-bold text-lg">{data.overdue_orders}</div>
              <div className="text-muted-foreground">Overdue</div>
            </div>
          </div>
        </div>

        {/* Risk Factors */}
        {data.factors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">Risk Factors</h4>
            <div className="space-y-2">
              {data.factors.map((f, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 rounded-md border p-2.5 text-xs"
                >
                  <Badge
                    className={cn(
                      "text-[10px] shrink-0 mt-0.5",
                      impactColors[f.impact] || "bg-gray-100 text-gray-700"
                    )}
                  >
                    {f.impact}
                  </Badge>
                  <div>
                    <span className="font-medium">{f.factor}:</span>{" "}
                    <span className="text-muted-foreground">{f.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {data.recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              Recommendations
            </h4>
            <ul className="space-y-1">
              {data.recommendations.map((rec, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <span className="mt-1 h-1 w-1 rounded-full bg-primary shrink-0" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
