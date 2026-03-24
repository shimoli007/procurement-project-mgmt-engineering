import { useState, useEffect } from "react";
import type { MaterialLine, Order } from "@/types";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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

interface ProjectReportData {
  project: {
    id: number;
    name: string;
    description: string;
    client_name: string;
    status: string;
    start_date: string;
    target_date: string;
  };
  bom: {
    item_name: string;
    item_unit: string;
    item_category: string;
    quantity: number;
    unit_cost: number;
    total_cost: number;
  }[];
  materials: MaterialLine[];
  orders: Order[];
  timeline: {
    date: string;
    event: string;
    details: string;
  }[];
}

interface ProjectReportProps {
  projectId: number;
}

export function ProjectReport({ projectId }: ProjectReportProps) {
  const [data, setData] = useState<ProjectReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .get<ProjectReportData>(`/reports/project/${projectId}/summary`)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load project report: {error}
      </div>
    );
  }

  if (!data) return null;

  const { project, bom, materials, orders, timeline } = data;
  const totalBomCost = bom.reduce((sum, row) => sum + (row.total_cost ?? 0), 0);
  const avgReadiness =
    materials.length > 0
      ? materials.reduce((sum, m) => sum + m.readiness_pct, 0) / materials.length
      : 0;

  return (
    <PrintableReport
      title={`Project Report: ${project.name}`}
      subtitle={`Client: ${project.client_name}`}
    >
      {/* Project details */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant="secondary" className="mt-1">
              {project.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Start Date</p>
            <p className="text-sm font-medium">{project.start_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Target Date</p>
            <p className="text-sm font-medium">{project.target_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total BOM Cost</p>
            <p className="text-sm font-medium">
              ${totalBomCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
        {project.description && (
          <p className="mt-3 text-sm text-muted-foreground">{project.description}</p>
        )}
      </Card>

      {/* BOM table */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Bill of Materials</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Unit Cost</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bom.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No BOM items.
                  </TableCell>
                </TableRow>
              ) : (
                bom.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.item_name}</TableCell>
                    <TableCell>{row.item_category}</TableCell>
                    <TableCell className="text-right">{row.quantity}</TableCell>
                    <TableCell>{row.item_unit}</TableCell>
                    <TableCell className="text-right">
                      ${(row.unit_cost ?? 0).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      ${(row.total_cost ?? 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Material readiness */}
      <div>
        <h2 className="text-lg font-semibold mb-2">
          Material Readiness ({avgReadiness.toFixed(0)}% avg)
        </h2>
        <Card className="p-4 space-y-3">
          {materials.length === 0 ? (
            <p className="text-sm text-muted-foreground">No material data.</p>
          ) : (
            materials.map((m) => (
              <div key={m.item_id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium">{m.item_name}</span>
                  <span className="text-muted-foreground">
                    {m.quantity_delivered}/{m.quantity_needed} {m.unit}
                  </span>
                </div>
                <Progress value={m.readiness_pct} className="h-2" />
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Orders */}
      <div>
        <h2 className="text-lg font-semibold mb-2">Orders ({orders.length})</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No orders.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>#{o.id}</TableCell>
                    <TableCell>{o.item_name}</TableCell>
                    <TableCell>{o.supplier_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{o.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{o.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${(o.quantity * o.unit_price).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Timeline */}
      {timeline && timeline.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Timeline</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {timeline.map((entry, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="shrink-0 text-muted-foreground w-24">
                    {entry.date}
                  </span>
                  <div>
                    <p className="font-medium">{entry.event}</p>
                    {entry.details && (
                      <p className="text-muted-foreground">{entry.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </PrintableReport>
  );
}
