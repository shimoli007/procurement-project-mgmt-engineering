import type { Order } from "@/types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Ordered: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  Shipped: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  Delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  Cancelled: "bg-gray-500/10 text-gray-500 border-gray-500/20",
};

interface RecentOrdersProps {
  orders: Order[];
  loading: boolean;
}

export default function RecentOrders({ orders, loading }: RecentOrdersProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <CardTitle className="text-base">Recent Orders</CardTitle>
        </div>
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order #</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead className="text-right">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 10).map((order) => (
                  <TableRow key={order.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-sm font-medium">
                      #{order.id}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {order.item_name ?? `Item ${order.item_id}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.project_name ?? `Project ${order.project_id}`}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-medium",
                          STATUS_STYLES[order.status] ?? STATUS_STYLES.Pending
                        )}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.requester_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {new Date(order.order_date || order.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
