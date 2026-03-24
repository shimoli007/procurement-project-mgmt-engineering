import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MaterialLine } from "@/types";

interface MaterialListProps {
  projectId: number;
}

function readinessColor(pct: number): string {
  if (pct < 30) return "text-red-600";
  if (pct < 70) return "text-yellow-600";
  return "text-green-600";
}

function progressBarClass(pct: number): string {
  if (pct < 30) return "[&>div]:bg-red-500";
  if (pct < 70) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-green-500";
}

export function MaterialList({ projectId }: MaterialListProps) {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<MaterialLine[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMaterials = useCallback(() => {
    setLoading(true);
    api
      .get<MaterialLine[]>(`/projects/${projectId}/materials`)
      .then(setMaterials)
      .catch((err: Error) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [projectId, toast]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Loading material list...
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
        <p className="text-lg font-medium">No materials</p>
        <p className="text-sm">
          Add items to the BOM first, then generate orders to see material
          readiness.
        </p>
      </div>
    );
  }

  const totalNeeded = materials.reduce((s, m) => s + m.quantity_needed, 0);
  const totalOrdered = materials.reduce((s, m) => s + m.quantity_ordered, 0);
  const totalDelivered = materials.reduce((s, m) => s + m.quantity_delivered, 0);
  const overallReadiness =
    totalNeeded > 0 ? Math.round((totalDelivered / totalNeeded) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center gap-6 rounded-lg border border-border p-4 bg-muted/30">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Overall Readiness</p>
          <div className="flex items-center gap-3 mt-1">
            <Progress
              value={overallReadiness}
              className={cn("h-3 flex-1", progressBarClass(overallReadiness))}
            />
            <span
              className={cn(
                "text-sm font-bold min-w-[3rem] text-right",
                readinessColor(overallReadiness)
              )}
            >
              {overallReadiness}%
            </span>
          </div>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{materials.length}</p>
          <p className="text-xs text-muted-foreground">Items</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{totalOrdered}</p>
          <p className="text-xs text-muted-foreground">Ordered</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{totalDelivered}</p>
          <p className="text-xs text-muted-foreground">Delivered</p>
        </div>
      </div>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead className="text-right">Needed</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Delivered</TableHead>
              <TableHead className="w-[180px]">Readiness</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {materials.map((m) => (
              <TableRow key={m.item_id}>
                <TableCell className="font-medium">{m.item_name}</TableCell>
                <TableCell>{m.category || "-"}</TableCell>
                <TableCell>{m.unit || "-"}</TableCell>
                <TableCell className="text-right">{m.quantity_needed}</TableCell>
                <TableCell className="text-right">{m.quantity_ordered}</TableCell>
                <TableCell className="text-right">{m.quantity_delivered}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={m.readiness_pct}
                      className={cn("h-2 flex-1", progressBarClass(m.readiness_pct))}
                    />
                    <span
                      className={cn(
                        "text-xs font-semibold min-w-[2.5rem] text-right",
                        readinessColor(m.readiness_pct)
                      )}
                    >
                      {m.readiness_pct}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {/* Summary row */}
            <TableRow className="bg-muted/50 font-semibold">
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">{totalNeeded}</TableCell>
              <TableCell className="text-right">{totalOrdered}</TableCell>
              <TableCell className="text-right">{totalDelivered}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={overallReadiness}
                    className={cn("h-2 flex-1", progressBarClass(overallReadiness))}
                  />
                  <span
                    className={cn(
                      "text-xs font-semibold min-w-[2.5rem] text-right",
                      readinessColor(overallReadiness)
                    )}
                  >
                    {overallReadiness}%
                  </span>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
