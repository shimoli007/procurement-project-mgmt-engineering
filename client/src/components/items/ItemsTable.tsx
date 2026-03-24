import { Package, MoreHorizontal, Edit, Trash2, Link } from "lucide-react";
import type { Item } from "@/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

const categoryColors: Record<string, string> = {
  Electrical: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Mechanical: "bg-blue-100 text-blue-800 border-blue-200",
  Civil: "bg-green-100 text-green-800 border-green-200",
  Piping: "bg-purple-100 text-purple-800 border-purple-200",
  Safety: "bg-red-100 text-red-800 border-red-200",
  General: "bg-gray-100 text-gray-800 border-gray-200",
};

interface ItemsTableProps {
  items: Item[];
  onEdit: (item: Item) => void;
  onDelete: (item: Item) => void;
  onManageSuppliers: (item: Item) => void;
  userRole: string;
}

export function ItemsTable({
  items,
  onEdit,
  onDelete,
  onManageSuppliers,
  userRole,
}: ItemsTableProps) {
  const canEdit = userRole === "Engineer" || userRole === "Procurement";

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No items found
        </h3>
        <p className="text-sm text-muted-foreground/70 mt-1">
          {canEdit
            ? "Get started by adding your first item."
            : "No items match your current filters."}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Unit</TableHead>
          <TableHead className="hidden md:table-cell">Description</TableHead>
          <TableHead className="text-center"># Suppliers</TableHead>
          {canEdit && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.name}</TableCell>
            <TableCell>
              <Badge
                className={
                  categoryColors[item.category] ??
                  "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {item.category}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground">{item.unit}</TableCell>
            <TableCell className="hidden md:table-cell max-w-[200px] truncate text-muted-foreground">
              {item.description || "-"}
            </TableCell>
            <TableCell className="text-center">
              {item.suppliers?.length ?? 0}
            </TableCell>
            {canEdit && (
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Actions</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onManageSuppliers(item)}>
                      <Link className="mr-2 h-4 w-4" />
                      Manage Suppliers
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive hover:!text-destructive"
                      onClick={() => onDelete(item)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
