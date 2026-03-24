import { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
import { useToast } from "@/components/ui/toast";
import { api } from "@/lib/api";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import type { BomLine, Item } from "@/types";

interface BomEditorProps {
  projectId: number;
  items: Item[];
}

export function BomEditor({ projectId, items }: BomEditorProps) {
  const { toast } = useToast();
  const [bomLines, setBomLines] = useState<BomLine[]>([]);
  const [loading, setLoading] = useState(true);

  // Add dialog state
  const [addOpen, setAddOpen] = useState(false);
  const [addItemId, setAddItemId] = useState("");
  const [addQuantity, setAddQuantity] = useState("");
  const [addNotes, setAddNotes] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editLine, setEditLine] = useState<BomLine | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLine, setDeleteLine] = useState<BomLine | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchBom = useCallback(() => {
    setLoading(true);
    api
      .get<BomLine[]>(`/projects/${projectId}/bom`)
      .then(setBomLines)
      .catch((err: Error) => toast(err.message, "error"))
      .finally(() => setLoading(false));
  }, [projectId, toast]);

  useEffect(() => {
    fetchBom();
  }, [fetchBom]);

  // Items already in BOM (exclude from add dialog)
  const bomItemIds = new Set(bomLines.map((l) => l.item_id));
  const availableItems = items.filter((i) => !bomItemIds.has(i.id));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!addItemId || !addQuantity || Number(addQuantity) <= 0) {
      toast("Please select an item and enter a valid quantity", "error");
      return;
    }
    setAddSubmitting(true);
    try {
      await api.post(`/projects/${projectId}/bom`, {
        item_id: Number(addItemId),
        quantity: Number(addQuantity),
        notes: addNotes || undefined,
      });
      toast("Item added to BOM", "success");
      setAddOpen(false);
      setAddItemId("");
      setAddQuantity("");
      setAddNotes("");
      fetchBom();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add item", "error");
    } finally {
      setAddSubmitting(false);
    }
  }

  function openEdit(line: BomLine) {
    setEditLine(line);
    setEditQuantity(String(line.quantity));
    setEditNotes(line.notes || "");
    setEditOpen(true);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editLine || !editQuantity || Number(editQuantity) <= 0) {
      toast("Please enter a valid quantity", "error");
      return;
    }
    setEditSubmitting(true);
    try {
      await api.patch(`/projects/${projectId}/bom/${editLine.id}`, {
        quantity: Number(editQuantity),
        notes: editNotes || undefined,
      });
      toast("BOM line updated", "success");
      setEditOpen(false);
      fetchBom();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to update", "error");
    } finally {
      setEditSubmitting(false);
    }
  }

  function openDelete(line: BomLine) {
    setDeleteLine(line);
    setDeleteOpen(true);
  }

  async function handleDelete() {
    if (!deleteLine) return;
    setDeleteSubmitting(true);
    try {
      await api.delete(`/projects/${projectId}/bom/${deleteLine.id}`);
      toast("Item removed from BOM", "success");
      setDeleteOpen(false);
      fetchBom();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete", "error");
    } finally {
      setDeleteSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {bomLines.length} unique item{bomLines.length !== 1 ? "s" : ""} in BOM
          </span>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading BOM...
        </div>
      ) : bomLines.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-lg">
          <Package className="h-10 w-10 mb-2 opacity-40" />
          <p className="text-lg font-medium">No items in BOM</p>
          <p className="text-sm">Add items to define this project's bill of materials.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bomLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">
                    {line.item_name || `Item #${line.item_id}`}
                  </TableCell>
                  <TableCell>{line.item_category || "-"}</TableCell>
                  <TableCell>{line.item_unit || "-"}</TableCell>
                  <TableCell className="text-right">{line.quantity}</TableCell>
                  <TableCell className="max-w-[200px] truncate text-muted-foreground">
                    {line.notes || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                        onClick={() => openEdit(line)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted text-destructive"
                        onClick={() => openDelete(line)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add Item Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Item to BOM</DialogTitle>
            <DialogDescription>
              Select an item and specify the required quantity.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bom-add-item">Item *</Label>
              <Select
                id="bom-add-item"
                value={addItemId}
                onChange={(e) => setAddItemId(e.target.value)}
              >
                <option value="">Select an item</option>
                {availableItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.category} - {item.unit})
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bom-add-qty">Quantity *</Label>
              <Input
                id="bom-add-qty"
                type="number"
                min="1"
                step="any"
                value={addQuantity}
                onChange={(e) => setAddQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bom-add-notes">Notes</Label>
              <Textarea
                id="bom-add-notes"
                value={addNotes}
                onChange={(e) => setAddNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddOpen(false)}
                disabled={addSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit BOM Line</DialogTitle>
            <DialogDescription>
              Update quantity and notes for{" "}
              <span className="font-semibold text-foreground">
                {editLine?.item_name}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bom-edit-qty">Quantity *</Label>
              <Input
                id="bom-edit-qty"
                type="number"
                min="1"
                step="any"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bom-edit-notes">Notes</Label>
              <Textarea
                id="bom-edit-notes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                placeholder="Optional notes..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={editSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editSubmitting}>
                {editSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Item from BOM</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                {deleteLine?.item_name}
              </span>{" "}
              from the bill of materials?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleteSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteSubmitting}
            >
              {deleteSubmitting ? "Removing..." : "Remove Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
