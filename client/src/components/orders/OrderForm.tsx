import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Order, Item, Supplier, Project, User } from "@/types";

interface OrderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Order>) => Promise<void>;
  items: Item[];
  suppliers: Supplier[];
  projects: Project[];
  users: User[];
  editOrder?: Order | null;
}

export function OrderForm({
  open,
  onOpenChange,
  onSubmit,
  items,
  suppliers,
  projects,
  users,
  editOrder,
}: OrderFormProps) {
  const [itemId, setItemId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [expectedDate, setExpectedDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const procurementUsers = users.filter((u) => u.role === "Procurement");

  useEffect(() => {
    if (open) {
      if (editOrder) {
        setItemId(String(editOrder.item_id));
        setProjectId(editOrder.project_id ? String(editOrder.project_id) : "");
        setSupplierId(String(editOrder.supplier_id));
        setQuantity(String(editOrder.quantity));
        setUnitPrice(editOrder.unit_price ? String(editOrder.unit_price) : "");
        setExpectedDate(editOrder.expected_date ? editOrder.expected_date.split("T")[0] : "");
        setAssignedTo(editOrder.assigned_to ? String(editOrder.assigned_to) : "");
        setNotes(editOrder.notes || "");
      } else {
        setItemId("");
        setProjectId("");
        setSupplierId("");
        setQuantity("");
        setUnitPrice("");
        setExpectedDate("");
        setAssignedTo("");
        setNotes("");
      }
      setErrors({});
    }
  }, [open, editOrder]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!itemId) newErrors.itemId = "Item is required";
    if (!quantity || Number(quantity) <= 0) newErrors.quantity = "Quantity must be greater than 0";
    if (!supplierId) newErrors.supplierId = "Supplier is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        item_id: Number(itemId),
        project_id: projectId ? Number(projectId) : undefined,
        supplier_id: Number(supplierId),
        quantity: Number(quantity),
        unit_price: unitPrice ? Number(unitPrice) : undefined,
        expected_date: expectedDate || undefined,
        assigned_to: assignedTo ? Number(assignedTo) : undefined,
        notes: notes || undefined,
      } as Partial<Order>);
      onOpenChange(false);
    } catch {
      // error handled by caller
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editOrder ? "Edit Order" : "Create Order"}</DialogTitle>
          <DialogDescription>
            {editOrder
              ? "Update the order details below."
              : "Fill in the details to create a new purchase order."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order-item">Item *</Label>
            <Select
              id="order-item"
              value={itemId}
              onChange={(e) => setItemId(e.target.value)}
            >
              <option value="">Select an item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.unit})
                </option>
              ))}
            </Select>
            {errors.itemId && <p className="text-sm text-destructive">{errors.itemId}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-project">Project</Label>
            <Select
              id="order-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-supplier">Supplier *</Label>
            <Select
              id="order-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            >
              <option value="">Select a supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            {errors.supplierId && <p className="text-sm text-destructive">{errors.supplierId}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="order-qty">Quantity *</Label>
              <Input
                id="order-qty"
                type="number"
                min="1"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
              {errors.quantity && <p className="text-sm text-destructive">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order-price">Unit Price</Label>
              <Input
                id="order-price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-date">Expected Date</Label>
            <Input
              id="order-date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-assignee">Assigned To</Label>
            <Select
              id="order-assignee"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {procurementUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-notes">Notes</Label>
            <Textarea
              id="order-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : editOrder
                  ? "Update Order"
                  : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
