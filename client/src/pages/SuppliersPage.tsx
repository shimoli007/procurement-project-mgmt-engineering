import { useState, useMemo } from "react";
import { Plus, Search, Truck } from "lucide-react";
import type { Supplier } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { SuppliersTable } from "@/components/suppliers/SuppliersTable";
import { SupplierForm } from "@/components/suppliers/SupplierForm";

export default function SuppliersPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const userRole = user?.role ?? "Sales";

  const {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const canEdit = userRole === "Procurement";

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliers;
    const query = search.toLowerCase();
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        (s.contact_email && s.contact_email.toLowerCase().includes(query)) ||
        (s.contact_phone && s.contact_phone.toLowerCase().includes(query))
    );
  }, [suppliers, search]);

  function handleAddSupplier() {
    setEditingSupplier(null);
    setFormOpen(true);
  }

  function handleEditSupplier(supplier: Supplier) {
    setEditingSupplier(supplier);
    setFormOpen(true);
  }

  async function handleDeleteSupplier(supplier: Supplier) {
    if (
      !window.confirm(
        `Are you sure you want to delete "${supplier.name}"?`
      )
    ) {
      return;
    }
    try {
      await deleteSupplier(supplier.id);
      toast("Supplier deleted successfully.", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to delete supplier.",
        "error"
      );
    }
  }

  async function handleFormSubmit(data: Partial<Supplier>) {
    if (editingSupplier) {
      await updateSupplier(editingSupplier.id, data);
      toast("Supplier updated successfully.", "success");
    } else {
      await createSupplier(data);
      toast("Supplier created successfully.", "success");
    }
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Truck className="h-6 w-6" />
            Suppliers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your supplier contacts and information.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleAddSupplier}>
            <Plus className="mr-2 h-4 w-4" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
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
            <p className="text-muted-foreground">Loading suppliers...</p>
          </div>
        ) : (
          <SuppliersTable
            suppliers={filteredSuppliers}
            onEdit={handleEditSupplier}
            onDelete={handleDeleteSupplier}
            userRole={userRole}
          />
        )}
      </Card>

      {/* Form dialog */}
      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editingSupplier}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
