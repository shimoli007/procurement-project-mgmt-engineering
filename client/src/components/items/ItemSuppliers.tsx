import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import type { Item, Supplier, ItemSupplier } from "@/types";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface ItemSuppliersProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  suppliers: Supplier[];
}

export function ItemSuppliers({
  open,
  onOpenChange,
  item,
  suppliers,
}: ItemSuppliersProps) {
  const [itemSuppliers, setItemSuppliers] = useState<ItemSupplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add supplier form state
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [isPreferred, setIsPreferred] = useState(false);
  const [adding, setAdding] = useState(false);

  const fetchItemSuppliers = useCallback(async () => {
    if (!item) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.get<ItemSupplier[]>(`/items/${item.id}/suppliers`);
      setItemSuppliers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (open && item) {
      fetchItemSuppliers();
      setSelectedSupplierId("");
      setUnitPrice("");
      setLeadTime("");
      setIsPreferred(false);
    }
  }, [open, item, fetchItemSuppliers]);

  const linkedSupplierIds = new Set(itemSuppliers.map((is) => is.supplier_id));
  const availableSuppliers = suppliers.filter(
    (s) => !linkedSupplierIds.has(s.id)
  );

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!item || !selectedSupplierId) return;

    setAdding(true);
    setError("");
    try {
      await api.post(`/items/${item.id}/suppliers`, {
        supplier_id: Number(selectedSupplierId),
        unit_price: unitPrice ? Number(unitPrice) : 0,
        lead_time_days: leadTime ? Number(leadTime) : 0,
        is_preferred: isPreferred ? 1 : 0,
      });
      setSelectedSupplierId("");
      setUnitPrice("");
      setLeadTime("");
      setIsPreferred(false);
      await fetchItemSuppliers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add supplier.");
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveSupplier(itemSupplierId: number) {
    if (!item) return;
    setError("");
    try {
      await api.delete(`/items/${item.id}/suppliers/${itemSupplierId}`);
      await fetchItemSuppliers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove supplier."
      );
    }
  }

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Suppliers for {item.name}</DialogTitle>
          <DialogDescription>
            Manage which suppliers provide this item along with pricing and lead
            times.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Current suppliers list */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">
            Linked Suppliers
          </h4>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Loading...
            </p>
          ) : itemSuppliers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-md">
              No suppliers linked yet.
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {itemSuppliers.map((is) => (
                <div
                  key={is.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {is.supplier_name ?? `Supplier #${is.supplier_id}`}
                      </span>
                      {is.is_preferred === 1 && (
                        <Badge className="bg-green-100 text-green-800 border-green-200 text-[10px]">
                          Preferred
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Price: ${Number(is.unit_price).toFixed(2)}</span>
                      <span>Lead time: {is.lead_time_days} days</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => handleRemoveSupplier(is.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove</span>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add supplier form */}
        {availableSuppliers.length > 0 && (
          <>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Add Supplier
              </h4>
              <form onSubmit={handleAddSupplier} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="supplier-select">Supplier</Label>
                  <Select
                    id="supplier-select"
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      Select a supplier
                    </option>
                    {availableSuppliers.map((s) => (
                      <option key={s.id} value={String(s.id)}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="unit-price">Unit Price ($)</Label>
                    <Input
                      id="unit-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lead-time">Lead Time (days)</Label>
                    <Input
                      id="lead-time"
                      type="number"
                      min="0"
                      value={leadTime}
                      onChange={(e) => setLeadTime(e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="is-preferred"
                    type="checkbox"
                    checked={isPreferred}
                    onChange={(e) => setIsPreferred(e.target.checked)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <Label htmlFor="is-preferred" className="text-sm font-normal">
                    Mark as preferred supplier
                  </Label>
                </div>

                <Button
                  type="submit"
                  size="sm"
                  disabled={adding || !selectedSupplierId}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {adding ? "Adding..." : "Add Supplier"}
                </Button>
              </form>
            </div>
          </>
        )}

        {availableSuppliers.length === 0 && suppliers.length > 0 && !loading && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            All suppliers are already linked to this item.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
