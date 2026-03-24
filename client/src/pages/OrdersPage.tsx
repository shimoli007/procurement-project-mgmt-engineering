import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useItems } from "@/hooks/useItems";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useProjects } from "@/hooks/useProjects";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderForm } from "@/components/orders/OrderForm";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ORDER_STATUSES } from "@/lib/constants";
import { Plus, ShoppingCart } from "lucide-react";
import type { Order } from "@/types";

export default function OrdersPage() {
  const { user } = useAuth();
  const { users } = useUsers();
  const { items } = useItems();
  const { suppliers } = useSuppliers();
  const { projects } = useProjects();
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("");

  const filters = useMemo(
    () => ({
      status: statusFilter || undefined,
      project_id: projectFilter ? Number(projectFilter) : undefined,
      assigned_to: assignedFilter ? Number(assignedFilter) : undefined,
    }),
    [statusFilter, projectFilter, assignedFilter]
  );

  const { orders, loading, createOrder, updateOrder, updateStatus, refetch } =
    useOrders(filters);

  const [formOpen, setFormOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  function handleCreate() {
    setEditOrder(null);
    setFormOpen(true);
  }

  function handleEdit(order: Order) {
    setEditOrder(order);
    setFormOpen(true);
  }

  async function handleFormSubmit(data: Partial<Order>) {
    try {
      if (editOrder) {
        await updateOrder(editOrder.id, data);
        toast("Order updated successfully", "success");
      } else {
        await createOrder(data);
        toast("Order created successfully", "success");
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to save order",
        "error"
      );
      throw err;
    }
  }

  async function handleStatusChange(order: Order, status: string) {
    try {
      await updateStatus(order.id, status);
      toast(`Order #${order.id} updated to ${status}`, "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to update status",
        "error"
      );
    }
  }

  function handleViewTimeline(order: Order) {
    setTimelineOrder(order);
    setTimelineOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Orders</h1>
            <p className="text-sm text-muted-foreground">
              Manage purchase orders and track deliveries
            </p>
          </div>
        </div>
        {user?.role === "Procurement" && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 rounded-lg border border-border p-4 bg-card">
        <div className="space-y-1.5">
          <Label htmlFor="filter-status" className="text-xs font-medium">
            Status
          </Label>
          <Select
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-[160px]"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-project" className="text-xs font-medium">
            Project
          </Label>
          <Select
            id="filter-project"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-[200px]"
          >
            <option value="">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="filter-assigned" className="text-xs font-medium">
            Assigned To
          </Label>
          <Select
            id="filter-assigned"
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="w-[180px]"
          >
            <option value="">All Users</option>
            {users
              .filter((u) => u.role === "Procurement")
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </Select>
        </div>

        {(statusFilter || projectFilter || assignedFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter("");
              setProjectFilter("");
              setAssignedFilter("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            Loading orders...
          </div>
        ) : (
          <OrdersTable
            orders={orders}
            onEdit={handleEdit}
            onStatusChange={handleStatusChange}
            onViewTimeline={handleViewTimeline}
            userRole={user?.role || ""}
          />
        )}
      </div>

      {/* Order Form Dialog */}
      <OrderForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        items={items}
        suppliers={suppliers}
        projects={projects}
        users={users}
        editOrder={editOrder}
      />

      {/* Timeline Dialog */}
      <OrderTimeline
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        order={timelineOrder}
      />
    </div>
  );
}
