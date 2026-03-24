import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { useOrders } from "@/hooks/useOrders";
import { useItems } from "@/hooks/useItems";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useUsers } from "@/hooks/useUsers";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { BomEditor } from "@/components/projects/BomEditor";
import { MaterialList } from "@/components/projects/MaterialList";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderForm } from "@/components/orders/OrderForm";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { ArrowRight, ShoppingCart, FolderKanban } from "lucide-react";
import type { Project, Order } from "@/types";

const statusColor: Record<string, string> = {
  Active: "bg-green-100 text-green-800 border-green-300",
  "On Hold": "bg-yellow-100 text-yellow-800 border-yellow-300",
  Completed: "bg-blue-100 text-blue-800 border-blue-300",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString();
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { projects, generateOrders } = useProjects();
  const { items } = useItems();
  const { suppliers } = useSuppliers();
  const { users } = useUsers();

  const projectId = Number(id);
  const {
    orders,
    loading: ordersLoading,
    createOrder,
    updateOrder,
    updateStatus,
    refetch: refetchOrders,
  } = useOrders({ project_id: projectId });

  const [project, setProject] = useState<Project | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("bom");
  const [generating, setGenerating] = useState(false);
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);

  // Order form state (for editing project orders)
  const [orderFormOpen, setOrderFormOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [timelineOrder, setTimelineOrder] = useState<Order | null>(null);

  // Fetch project details
  useEffect(() => {
    if (!projectId || isNaN(projectId)) {
      setProjectLoading(false);
      return;
    }
    // Try from cached list first
    const cached = projects.find((p) => p.id === projectId);
    if (cached) {
      setProject(cached);
      setProjectLoading(false);
    }
    // Also fetch fresh
    api
      .get<Project>(`/projects/${projectId}`)
      .then((p) => {
        setProject(p);
      })
      .catch(() => {
        if (!cached) setProject(null);
      })
      .finally(() => setProjectLoading(false));
  }, [projectId, projects]);

  async function handleGenerateOrders() {
    setGenerating(true);
    try {
      await generateOrders(projectId);
      toast("Orders generated from BOM successfully", "success");
      setGenerateDialogOpen(false);
      refetchOrders();
      setActiveTab("orders");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Failed to generate orders",
        "error"
      );
    } finally {
      setGenerating(false);
    }
  }

  function handleEditOrder(order: Order) {
    setEditOrder(order);
    setOrderFormOpen(true);
  }

  async function handleOrderFormSubmit(data: Partial<Order>) {
    try {
      if (editOrder) {
        await updateOrder(editOrder.id, data);
        toast("Order updated successfully", "success");
      } else {
        await createOrder({ ...data, project_id: projectId });
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

  if (projectLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        Loading project...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg font-medium">Project not found</p>
        <p className="text-sm mb-4">
          The project you're looking for doesn't exist or has been deleted.
        </p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link
          to="/projects"
          className="hover:text-foreground transition-colors"
        >
          Projects
        </Link>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{project.name}</span>
      </nav>

      {/* Project Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <FolderKanban className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">
              {project.name}
            </h1>
            <Badge
              className={cn(
                "font-medium",
                statusColor[project.status] || statusColor.Active
              )}
            >
              {project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground ml-10">
              {project.description}
            </p>
          )}
          <div className="flex items-center gap-6 text-sm text-muted-foreground ml-10 pt-1">
            {project.client_name && (
              <span>
                Client: <span className="text-foreground">{project.client_name}</span>
              </span>
            )}
            <span>
              Start: <span className="text-foreground">{formatDate(project.start_date)}</span>
            </span>
            <span>
              Target: <span className="text-foreground">{formatDate(project.target_date)}</span>
            </span>
          </div>
        </div>

        {user?.role === "Procurement" && (
          <Button onClick={() => setGenerateDialogOpen(true)}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Generate Orders
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="bom">Bill of Materials</TabsTrigger>
          <TabsTrigger value="materials">Material List</TabsTrigger>
          <TabsTrigger value="orders">
            Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bom" className="mt-4">
          <BomEditor projectId={projectId} items={items} />
        </TabsContent>

        <TabsContent value="materials" className="mt-4">
          <MaterialList projectId={projectId} />
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <div className="rounded-lg border border-border bg-card">
            {ordersLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                Loading orders...
              </div>
            ) : (
              <OrdersTable
                orders={orders}
                onEdit={handleEditOrder}
                onStatusChange={handleStatusChange}
                onViewTimeline={handleViewTimeline}
                userRole={user?.role || ""}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Generate Orders Confirmation */}
      <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Orders from BOM</DialogTitle>
            <DialogDescription>
              This will create purchase orders for all items in the bill of
              materials that don't yet have sufficient orders. Existing orders
              will not be duplicated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setGenerateDialogOpen(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button onClick={handleGenerateOrders} disabled={generating}>
              {generating ? "Generating..." : "Generate Orders"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Form Dialog */}
      <OrderForm
        open={orderFormOpen}
        onOpenChange={setOrderFormOpen}
        onSubmit={handleOrderFormSubmit}
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
