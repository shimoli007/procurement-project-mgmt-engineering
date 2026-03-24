import { useState, useEffect } from "react";
import type { ReportSummary } from "@/types";
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

export function OrdersSummaryReport() {
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<ReportSummary>("/reports/orders-summary")
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
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

  if (!data) return null;

  const totalValue = data.total_value ?? 0;

  return (
    <PrintableReport title="Orders Summary Report" subtitle="Overview of all procurement orders">
      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Orders</p>
          <p className="text-2xl font-bold">{data.total_orders}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Procurement Value</p>
          <p className="text-2xl font-bold">
            ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Status Breakdown</p>
          <p className="text-2xl font-bold">{data.by_status.length} statuses</p>
        </Card>
      </div>

      {/* Orders by status */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Orders by Status</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Count</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_status.map((row) => (
                <TableRow key={row.status}>
                  <TableCell className="font-medium">{row.status}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    ${row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Orders by supplier */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Orders by Supplier</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Value</TableHead>
                <TableHead className="text-right">Avg Lead Time (days)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_supplier.map((row) => (
                <TableRow key={row.supplier_name}>
                  <TableCell className="font-medium">{row.supplier_name}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                  <TableCell className="text-right">
                    ${row.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell className="text-right">{row.avg_lead_time}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </PrintableReport>
  );
}
