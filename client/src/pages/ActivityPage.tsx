import { useState, useEffect } from "react";
import type { AuditEntry } from "@/types";
import { api } from "@/lib/api";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectOption } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function actionBadgeVariant(action: string) {
  if (action.includes("create")) return "default" as const;
  if (action.includes("update")) return "secondary" as const;
  if (action.includes("delete")) return "destructive" as const;
  return "outline" as const;
}

function actionBadgeClass(action: string) {
  if (action.includes("create")) return "bg-green-600 hover:bg-green-700";
  if (action.includes("update")) return "bg-blue-600 hover:bg-blue-700";
  if (action.includes("delete")) return "bg-red-600 hover:bg-red-700";
  return "";
}

function tryParseJson(val: string): Record<string, unknown> | null {
  if (!val) return null;
  try {
    return JSON.parse(val);
  } catch {
    return null;
  }
}

export default function ActivityPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (entityFilter && entityFilter !== "all") params.append("entity_type", entityFilter);
    if (dateFrom) params.append("from", dateFrom);
    if (dateTo) params.append("to", dateTo);
    const qs = params.toString();
    api
      .get<AuditEntry[]>(`/audit${qs ? `?${qs}` : ""}`)
      .then(setEntries)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [entityFilter, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load audit log: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Activity Log</h1>
        <p className="text-muted-foreground">
          Track all system changes and actions
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1">
            <Label>Entity Type</Label>
            <Select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-[160px]"
            >
              <SelectOption value="all">All</SelectOption>
              <SelectOption value="order">Orders</SelectOption>
              <SelectOption value="project">Projects</SelectOption>
              <SelectOption value="item">Items</SelectOption>
              <SelectOption value="supplier">Suppliers</SelectOption>
              <SelectOption value="user">Users</SelectOption>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>From Date</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-1">
            <Label>To Date</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-[160px]"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEntityFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      </Card>

      {/* Audit table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity Type</TableHead>
              <TableHead>Entity ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No audit entries found.
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const oldVals = tryParseJson(entry.old_values);
                const newVals = tryParseJson(entry.new_values);
                return (
                  <>
                    <TableRow
                      key={entry.id}
                      className="cursor-pointer hover:bg-accent"
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(entry.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>{entry.user_name ?? `User #${entry.user_id}`}</TableCell>
                      <TableCell>
                        <Badge
                          variant={actionBadgeVariant(entry.action)}
                          className={actionBadgeClass(entry.action)}
                        >
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{entry.entity_type}</TableCell>
                      <TableCell>#{entry.entity_id}</TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${entry.id}-details`}>
                        <TableCell colSpan={6} className="bg-muted/50 p-4">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                Old Values
                              </p>
                              {oldVals ? (
                                <pre className="text-xs bg-background rounded p-2 overflow-auto max-h-40">
                                  {JSON.stringify(oldVals, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-xs text-muted-foreground">None</p>
                              )}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1">
                                New Values
                              </p>
                              {newVals ? (
                                <pre className="text-xs bg-background rounded p-2 overflow-auto max-h-40">
                                  {JSON.stringify(newVals, null, 2)}
                                </pre>
                              ) : (
                                <p className="text-xs text-muted-foreground">None</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
