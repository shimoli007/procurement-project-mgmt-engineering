import { useState } from "react";
import {
  Trash2,
  RefreshCw,
  UserPlus,
  Tag,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { ORDER_STATUSES, ITEM_CATEGORIES } from "@/lib/constants";

interface BulkActionsProps {
  selectedCount: number;
  entityType: "items" | "orders";
  onAction: (action: string, params?: Record<string, unknown>) => Promise<void>;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  entityType,
  onAction,
  onClearSelection,
}: BulkActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string>("");
  const [actionValue, setActionValue] = useState("");
  const [executing, setExecuting] = useState(false);
  const { toast } = useToast();

  if (selectedCount === 0) return null;

  function requestAction(action: string) {
    setPendingAction(action);
    setActionValue("");
    setConfirmOpen(true);
  }

  async function executeAction() {
    setExecuting(true);
    try {
      const payload: Record<string, unknown> = {};
      if (pendingAction === "update_status") payload.status = actionValue;
      if (pendingAction === "assign_to") payload.assigned_to = actionValue;
      if (pendingAction === "update_category") payload.category = actionValue;

      await onAction(pendingAction, payload);
      toast(
        `${actionLabel[pendingAction] ?? "Action"} applied to ${selectedCount} ${entityType}`,
        "success",
      );
      onClearSelection();
      setConfirmOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Bulk action failed";
      toast(message, "error");
    } finally {
      setExecuting(false);
    }
  }

  const actionLabel: Record<string, string> = {
    delete: "Delete",
    update_status: "Update Status",
    assign_to: "Assign To",
    update_category: "Update Category",
  };

  return (
    <>
      {/* Floating toolbar at bottom of screen */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/95 backdrop-blur-sm px-5 py-3 shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              {selectedCount}
            </div>
            <span className="text-sm font-medium">selected</span>
          </div>

          <div className="h-6 w-px bg-border" />

          {entityType === "orders" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestAction("update_status")}
              >
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Update Status
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestAction("assign_to")}
              >
                <UserPlus className="mr-1.5 h-3.5 w-3.5" />
                Assign To
              </Button>
            </>
          )}

          {entityType === "items" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => requestAction("update_category")}
            >
              <Tag className="mr-1.5 h-3.5 w-3.5" />
              Update Category
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="text-destructive border-destructive/30 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            onClick={() => requestAction("delete")}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Delete
          </Button>

          <div className="h-6 w-px bg-border" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-muted-foreground"
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === "delete" && (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              )}
              {pendingAction === "delete"
                ? "Confirm Deletion"
                : actionLabel[pendingAction] ?? "Bulk Action"}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === "delete"
                ? `Are you sure you want to delete ${selectedCount} ${entityType}? This action cannot be undone.`
                : `Apply to ${selectedCount} selected ${entityType}.`}
            </DialogDescription>
          </DialogHeader>

          {/* Action-specific inputs */}
          {pendingAction === "update_status" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Status</label>
              <Select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
              >
                <option value="">Select status...</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {pendingAction === "assign_to" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <Select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
              >
                <option value="">Select user...</option>
              </Select>
              <p className="text-xs text-muted-foreground">
                User list is loaded from the server
              </p>
            </div>
          )}

          {pendingAction === "update_category" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">New Category</label>
              <Select
                value={actionValue}
                onChange={(e) => setActionValue(e.target.value)}
              >
                <option value="">Select category...</option>
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={executing}
            >
              Cancel
            </Button>
            <Button
              variant={pendingAction === "delete" ? "destructive" : "default"}
              onClick={executeAction}
              disabled={
                executing ||
                (pendingAction !== "delete" && !actionValue)
              }
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : pendingAction === "delete" ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete {selectedCount} {entityType}
                </>
              ) : (
                "Apply"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
