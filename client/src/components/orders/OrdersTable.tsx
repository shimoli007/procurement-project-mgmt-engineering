import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Clock, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { ORDER_STATUSES } from "@/lib/constants";
import type { Order } from "@/types";

interface OrdersTableProps {
  orders: Order[];
  onEdit: (order: Order) => void;
  onStatusChange: (order: Order, status: string) => void;
  onViewTimeline: (order: Order) => void;
  userRole: string;
}

const statusColor: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-300",
  Ordered: "bg-blue-100 text-blue-800 border-blue-300",
  Shipped: "bg-purple-100 text-purple-800 border-purple-300",
  Delivered: "bg-green-100 text-green-800 border-green-300",
  Cancelled: "bg-gray-100 text-gray-800 border-gray-300",
};

function isOverdue(order: Order): boolean {
  if (!order.expected_date) return false;
  if (order.status === "Delivered" || order.status === "Cancelled") return false;
  return new Date(order.expected_date) < new Date();
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString();
}

export function OrdersTable({
  orders,
  onEdit,
  onStatusChange,
  onViewTimeline,
  userRole,
}: OrdersTableProps) {
  const isProcurement = userRole === "Procurement";

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No orders found</p>
        <p className="text-sm">Try adjusting your filters or create a new order.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order #</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Supplier</TableHead>
          <TableHead className="text-right">Qty</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requested By</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Expected Date</TableHead>
          <TableHead className="w-[60px]">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => {
          const overdue = isOverdue(order);
          return (
            <TableRow
              key={order.id}
              className={cn(overdue && "bg-red-50 dark:bg-red-950/20")}
            >
              <TableCell className="font-medium">
                #{order.id}
                {overdue && (
                  <span className="ml-2 text-xs text-red-600 font-semibold">
                    OVERDUE
                  </span>
                )}
              </TableCell>
              <TableCell>{order.item_name || `Item #${order.item_id}`}</TableCell>
              <TableCell>{order.project_name || "-"}</TableCell>
              <TableCell>{order.supplier_name || `Supplier #${order.supplier_id}`}</TableCell>
              <TableCell className="text-right">{order.quantity}</TableCell>
              <TableCell>
                <Badge className={cn("font-medium", statusColor[order.status] || statusColor.Pending)}>
                  {order.status}
                </Badge>
              </TableCell>
              <TableCell>{order.requester_name || "-"}</TableCell>
              <TableCell>{order.assignee_name || "-"}</TableCell>
              <TableCell className={cn(overdue && "text-red-600 font-medium")}>
                {formatDate(order.expected_date)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewTimeline(order)}>
                      <Clock className="mr-2 h-4 w-4" />
                      View Timeline
                    </DropdownMenuItem>
                    {isProcurement && order.status !== "Delivered" && order.status !== "Cancelled" && (
                      <>
                        {ORDER_STATUSES.filter((s) => s !== order.status).map((status) => (
                          <DropdownMenuItem
                            key={status}
                            onClick={() => onStatusChange(order, status)}
                          >
                            <Badge className={cn("mr-2 text-[10px]", statusColor[status])}>
                              {status}
                            </Badge>
                            Change to {status}
                          </DropdownMenuItem>
                        ))}
                      </>
                    )}
                    {isProcurement && (
                      <DropdownMenuItem onClick={() => onEdit(order)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
