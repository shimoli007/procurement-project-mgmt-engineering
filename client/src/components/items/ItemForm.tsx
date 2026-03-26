import { useState, useEffect } from "react";
import type { Item } from "@/types";
import { ITEM_CATEGORIES, ITEM_UNITS } from "@/lib/constants";
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

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  onSubmit: (data: Partial<Item>) => Promise<void>;
}

export function ItemForm({ open, onOpenChange, item, onSubmit }: ItemFormProps) {
  const [name, setName] = useState("");
  const [itemCode, setItemCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(ITEM_CATEGORIES[0]);
  const [unit, setUnit] = useState<string>(ITEM_UNITS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isEdit = item !== null;

  useEffect(() => {
    if (open) {
      if (item) {
        setName(item.name);
        setItemCode(item.item_code || "");
        setDescription(item.description || "");
        setCategory(item.category);
        setUnit(item.unit);
      } else {
        setName("");
        setItemCode("");
        setDescription("");
        setCategory(ITEM_CATEGORIES[0]);
        setUnit(ITEM_UNITS[0]);
      }
      setError("");
    }
  }, [open, item]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Item name is required.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ name: trimmedName, item_code: itemCode.trim() || undefined, description, category, unit });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save item.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Item" : "Add Item"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the item details below."
              : "Fill in the details for the new item."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name *</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter item name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-code">Item Code / Part No.</Label>
            <Input
              id="item-code"
              value={itemCode}
              onChange={(e) => setItemCode(e.target.value)}
              placeholder="e.g. MCB-3P-32A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-category">Category</Label>
              <Select
                id="item-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {ITEM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-unit">Unit</Label>
              <Select
                id="item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {ITEM_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

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
              {submitting ? "Saving..." : isEdit ? "Update Item" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
