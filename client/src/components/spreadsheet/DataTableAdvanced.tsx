import { useState, useMemo, useCallback } from "react";
import { ChevronUp, ChevronDown, ChevronsUpDown, Inbox } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { InlineEdit } from "./InlineEdit";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  editType?: "text" | "number" | "select";
  editOptions?: { value: string; label: string }[];
  render?: (row: T) => React.ReactNode;
  width?: string;
}

interface DataTableAdvancedProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
  selectable?: boolean;
  selectedIds?: Set<number>;
  onSelectionChange?: (ids: Set<number>) => void;
  onCellEdit?: (
    rowId: number,
    field: string,
    value: string | number,
  ) => Promise<void>;
  onSort?: (column: string, direction: "asc" | "desc") => void;
  emptyMessage?: string;
  loading?: boolean;
}

export function DataTableAdvanced<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = "id",
  selectable = false,
  selectedIds,
  onSelectionChange,
  onCellEdit,
  onSort,
  emptyMessage = "No data found.",
  loading = false,
}: DataTableAdvancedProps<T>) {
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );
  const [internalSortCol, setInternalSortCol] = useState<string>("");
  const [internalSortDir, setInternalSortDir] = useState<"asc" | "desc">(
    "asc",
  );

  const hasFilters = columns.some((c) => c.filterable);

  function handleSort(key: string) {
    if (onSort) {
      const newDir =
        internalSortCol === key && internalSortDir === "asc" ? "desc" : "asc";
      setInternalSortCol(key);
      setInternalSortDir(newDir);
      onSort(key, newDir);
    } else {
      if (internalSortCol === key) {
        setInternalSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setInternalSortCol(key);
        setInternalSortDir("asc");
      }
    }
  }

  function handleFilterChange(key: string, value: string) {
    setColumnFilters((prev) => ({ ...prev, [key]: value }));
  }

  const selectedSet = selectedIds ?? new Set<number>();

  const filteredData = useMemo(() => {
    let result = data;

    // Apply column filters (client-side)
    const activeFilters = Object.entries(columnFilters).filter(
      ([, v]) => v.trim() !== "",
    );
    if (activeFilters.length > 0) {
      result = result.filter((row) =>
        activeFilters.every(([key, filterVal]) => {
          const cellValue = row[key];
          return String(cellValue ?? "")
            .toLowerCase()
            .includes(filterVal.toLowerCase());
        }),
      );
    }

    // Apply internal sorting when no external handler
    if (internalSortCol && !onSort) {
      result = [...result].sort((a, b) => {
        const aVal = a[internalSortCol];
        const bVal = b[internalSortCol];
        const aStr = String(aVal ?? "");
        const bStr = String(bVal ?? "");
        const cmp = aStr.localeCompare(bStr, undefined, { numeric: true });
        return internalSortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [data, columnFilters, internalSortCol, internalSortDir, onSort]);

  const allFilteredIds = useMemo(
    () => new Set(filteredData.map((row) => Number(row[keyField]))),
    [filteredData, keyField],
  );

  const allSelected =
    filteredData.length > 0 &&
    filteredData.every((row) => selectedSet.has(Number(row[keyField])));

  const someSelected =
    !allSelected &&
    filteredData.some((row) => selectedSet.has(Number(row[keyField])));

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      // Deselect all filtered rows
      const next = new Set(selectedSet);
      allFilteredIds.forEach((id) => next.delete(id));
      onSelectionChange(next);
    } else {
      // Select all filtered rows
      const next = new Set(selectedSet);
      allFilteredIds.forEach((id) => next.add(id));
      onSelectionChange(next);
    }
  }, [allSelected, allFilteredIds, selectedSet, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: number) => {
      if (!onSelectionChange) return;
      const next = new Set(selectedSet);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onSelectionChange(next);
    },
    [selectedSet, onSelectionChange],
  );

  const totalCols = columns.length + (selectable ? 1 : 0);

  // Loading skeleton
  if (loading) {
    return (
      <div className="rounded-lg border overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                {selectable && (
                  <TableHead className="w-12">
                    <Skeleton className="h-4 w-4" />
                  </TableHead>
                )}
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 8 }).map((_, rowIdx) => (
                <TableRow key={rowIdx}>
                  {selectable && (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  )}
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      <Skeleton
                        className="h-4"
                        style={{
                          width: `${50 + Math.random() * 50}%`,
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background shadow-[0_1px_0_0_hsl(var(--border))]">
            {/* Header row */}
            <TableRow className="hover:bg-transparent">
              {selectable && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    col.sortable &&
                      "cursor-pointer select-none hover:bg-muted/50 transition-colors",
                  )}
                  onClick={
                    col.sortable ? () => handleSort(col.key) : undefined
                  }
                >
                  <div className="flex items-center gap-1">
                    <span className="font-semibold">{col.label}</span>
                    {col.sortable && (
                      <span className="ml-0.5 shrink-0">
                        {internalSortCol === col.key ? (
                          internalSortDir === "asc" ? (
                            <ChevronUp className="h-4 w-4 text-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-foreground" />
                          )
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>

            {/* Filter row */}
            {hasFilters && (
              <TableRow className="hover:bg-transparent border-b-2">
                {selectable && <TableHead className="py-1" />}
                {columns.map((col) => (
                  <TableHead key={`filter-${col.key}`} className="py-1.5 px-2">
                    {col.filterable ? (
                      <Input
                        placeholder="Filter..."
                        value={columnFilters[col.key] ?? ""}
                        onChange={(e) =>
                          handleFilterChange(col.key, e.target.value)
                        }
                        className="h-7 text-xs bg-background"
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>

          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={totalCols}
                  className="text-center py-16"
                >
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <Inbox className="h-10 w-10 opacity-40" />
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((row) => {
                const rowId = Number(row[keyField]);
                const isSelected = selectedSet.has(rowId);
                return (
                  <TableRow
                    key={rowId}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(
                      "transition-colors",
                      isSelected && "bg-primary/5 hover:bg-primary/10",
                    )}
                  >
                    {selectable && (
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(rowId)}
                          className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => {
                      const rawValue = row[col.key];

                      // Editable cell
                      if (col.editable && onCellEdit) {
                        return (
                          <TableCell key={col.key}>
                            <InlineEdit
                              value={(rawValue as string | number) ?? ""}
                              type={col.editType ?? "text"}
                              options={col.editOptions}
                              onSave={(val) =>
                                onCellEdit(rowId, col.key, val)
                              }
                            />
                          </TableCell>
                        );
                      }

                      // Custom render
                      if (col.render) {
                        return (
                          <TableCell key={col.key}>
                            {col.render(row)}
                          </TableCell>
                        );
                      }

                      // Default render
                      return (
                        <TableCell key={col.key}>
                          {String(rawValue ?? "")}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
