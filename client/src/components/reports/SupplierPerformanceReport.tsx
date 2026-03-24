import { useState, useEffect } from "react";
import type { SupplierPerformance } from "@/types";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { PrintableReport } from "./PrintableReport";

export function SupplierPerformanceReport() {
  const [data, setData] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<SupplierPerformance[]>("/reports/supplier-performance")
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load report: {error}
      </div>
    );
  }

  const bestOnTime = data.length > 0 ? Math.max(...data.map((s) => s.on_time_pct)) : 0;
  const worstOnTime = data.length > 0 ? Math.min(...data.map((s) => s.on_time_pct)) : 0;

  return (
    <PrintableReport
      title="Supplier Performance Report"
      subtitle="Track supplier reliability and pricing"
    >
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead className="text-right">Total Orders</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="text-right">On-time %</TableHead>
              <TableHead className="text-right">Avg Lead Time (days)</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No supplier performance data available.
                </TableCell>
              </TableRow>
            ) : (
              data.map((s) => {
                const isBest = s.on_time_pct === bestOnTime && data.length > 1;
                const isWorst = s.on_time_pct === worstOnTime && data.length > 1 && worstOnTime !== bestOnTime;
                return (
                  <TableRow
                    key={s.supplier_id}
                    className={
                      isBest
                        ? "bg-green-50 dark:bg-green-950/20"
                        : isWorst
                          ? "bg-red-50 dark:bg-red-950/20"
                          : ""
                    }
                  >
                    <TableCell className="font-medium">
                      {s.supplier_name}
                      {isBest && (
                        <span className="ml-2 text-xs text-green-600 font-semibold">Best</span>
                      )}
                      {isWorst && (
                        <span className="ml-2 text-xs text-red-600 font-semibold">Needs Improvement</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{s.total_orders}</TableCell>
                    <TableCell className="text-right">{s.delivered_orders}</TableCell>
                    <TableCell className="text-right">{s.on_time_pct.toFixed(1)}%</TableCell>
                    <TableCell className="text-right">{s.avg_lead_time}</TableCell>
                    <TableCell className="text-right">
                      ${s.total_value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </PrintableReport>
  );
}
