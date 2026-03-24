import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import type { Order, TimelineEntry } from "@/types";

interface OrderTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

const statusColor: Record<string, string> = {
  Pending: "bg-amber-500",
  Ordered: "bg-blue-500",
  Shipped: "bg-purple-500",
  Delivered: "bg-green-500",
  Cancelled: "bg-gray-500",
};

const statusBadgeColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-300",
  Ordered: "bg-blue-100 text-blue-800 border-blue-300",
  Shipped: "bg-purple-100 text-purple-800 border-purple-300",
  Delivered: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderTimeline({ open, onOpenChange, order }: OrderTimelineProps) {
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && order) {
      setLoading(true);
      api
        .get<TimelineEntry[]>(`/orders/${order.id}/timeline`)
        .then(setEntries)
        .catch(() => setEntries([]))
        .finally(() => setLoading(false));
    } else {
      setEntries([]);
    }
  }, [open, order]);

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order #{order.id} Timeline</DialogTitle>
          <DialogDescription>Status history and details for this order.</DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/30">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{order.item_name || `Item #${order.item_id}`}</span>
            <Badge className={cn("font-medium", statusBadgeColor[order.status])}>
              {order.status}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>Supplier: {order.supplier_name || "-"}</span>
            <span>Qty: {order.quantity}</span>
            <span>Project: {order.project_name || "-"}</span>
            <span>
              Price: {order.unit_price ? `$${Number(order.unit_price).toFixed(2)}` : "-"}
            </span>
            <span>Requested: {order.requester_name || "-"}</span>
            <span>Assigned: {order.assignee_name || "-"}</span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-semibold mb-4">Status History</h4>

          {loading && (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              Loading timeline...
            </div>
          )}

          {!loading && entries.length === 0 && (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              No status changes recorded yet.
            </div>
          )}

          {!loading && entries.length > 0 && (
            <div className="relative pl-6">
              {/* Vertical connecting line */}
              <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-6">
                {entries.map((entry, idx) => (
                  <div key={entry.id} className="relative flex gap-4">
                    {/* Colored dot */}
                    <div
                      className={cn(
                        "absolute -left-6 top-1 h-[18px] w-[18px] rounded-full border-2 border-background z-10",
                        statusColor[entry.to_status] || "bg-gray-500"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.from_status && (
                          <>
                            <Badge
                              className={cn(
                                "text-[10px]",
                                statusBadgeColor[entry.from_status]
                              )}
                            >
                              {entry.from_status}
                            </Badge>
                            <span className="text-muted-foreground text-xs">→</span>
                          </>
                        )}
                        <Badge
                          className={cn(
                            "text-[10px]",
                            statusBadgeColor[entry.to_status]
                          )}
                        >
                          {entry.to_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {entry.changer_name || `User #${entry.changed_by}`}
                        <span className="mx-1.5 text-border">|</span>
                        {formatDateTime(entry.changed_at)}
                      </p>
                      {entry.note && (
                        <p className="text-sm mt-1 bg-muted/50 rounded px-2 py-1 text-foreground">
                          {entry.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
