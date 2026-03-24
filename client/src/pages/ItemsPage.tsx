import { useState, useMemo } from "react";
import { Plus, Search, Package, Upload } from "lucide-react";
import type { Item } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useItems } from "@/hooks/useItems";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useToast } from "@/components/ui/toast";
import { ITEM_CATEGORIES } from "@/lib/constants";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ItemsTable } from "@/components/items/ItemsTable";
import { ItemForm } from "@/components/items/ItemForm";
import { ItemSuppliers } from "@/components/items/ItemSuppliers";
import { ImportDialog } from "@/components/spreadsheet/ImportDialog";
import { ExportButton } from "@/components/spreadsheet/ExportButton";
import { BulkActions } from "@/components/spreadsheet/BulkActions";

export default function ItemsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = user?.role ?? "Sales";

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { items, loading, error, createItem, updateItem, deleteItem, refetch } =
    useItems(debouncedSearch, categoryFilter);
  const { suppliers } = useSuppliers();

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // Supplier management dialog state
  const [suppliersOpen, setSuppliersOpen] = useState(false);
  const [managingItem, setManagingItem] = useState<Item | null>(null);

  // Import dialog state
  const [importOpen, setImportOpen] = useState(false);

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const canEdit = userRole === "CEO" || userRole === "Engineer" || userRole === "Procurement";

  // Debounce search input
  const debounceTimeout = useMemo(() => {
    let timeout: ReturnType<typeof setTimeout>;
    return (value: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setDebouncedSearch(value), 300);
    };
  }, []);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    debounceTimeout(e.target.value);
  }

  function handleAddItem() {
    setEditingItem(null);
    setFormOpen(true);
  }

  function handleEditItem(item: Item) {
    setEditingItem(item);
    setFormOpen(true);
  }

  function handleManageSuppliers(item: Item) {
    setManagingItem(item);
    setSuppliersOpen(true);
  }

  async function handleDeleteItem(item: Item) {
    if (!window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      return;
    }
    try {
      await deleteItem(item.id);
      toast("Item deleted successfully.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete item.",
        "error"
      );
    }
  }

  async function handleFormSubmit(data: Partial<Item>) {
    if (editingItem) {
      await updateItem(editingItem.id, data);
      toast("Item updated successfully.", "success");
    } else {
      await createItem(data);
      toast("Item created successfully.", "success");
    }
  }

  function handleToggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleToggleSelectAll() {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  }

  async function handleBulkAction(action: string, params?: Record<string, unknown>) {
    const ids = Array.from(selectedIds);
    if (action === "delete") {
      await api.delete("/bulk/items", { itemIds: ids });
    } else if (action === "update_category") {
      await api.post("/bulk/items/category", { itemIds: ids, category: params?.category });
    }
    refetch();
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-6 w-6" />
            Items
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your inventory items and their supplier relationships.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton
            data={items as unknown as Record<string, unknown>[]}
            filename="items"
          />
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          {canEdit && (
            <Button onClick={handleAddItem}>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="sm:w-48"
        >
          <option value="">All Categories</option>
          {ITEM_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </Select>
      </div>

      {/* Content */}
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-muted-foreground">Loading items...</p>
          </div>
        ) : (
          <ItemsTable
            items={items}
            onEdit={handleEditItem}
            onDelete={handleDeleteItem}
            onManageSuppliers={handleManageSuppliers}
            userRole={userRole}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
          />
        )}
      </Card>

      {/* Bulk actions toolbar */}
      <BulkActions
        selectedCount={selectedIds.size}
        entityType="items"
        onAction={handleBulkAction}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      {/* Dialogs */}
      <ItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editingItem}
        onSubmit={handleFormSubmit}
      />

      <ItemSuppliers
        open={suppliersOpen}
        onOpenChange={setSuppliersOpen}
        item={managingItem}
        suppliers={suppliers}
      />

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entityType="items"
        onSuccess={refetch}
      />
    </div>
  );
}
