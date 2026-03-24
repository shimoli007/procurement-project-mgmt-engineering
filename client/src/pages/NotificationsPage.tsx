import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ShoppingCart,
  UserCheck,
  FolderKanban,
  Info,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/hooks/useNotifications";

function getNotificationIcon(type: string) {
  switch (type) {
    case "order_status":
      return ShoppingCart;
    case "assignment":
      return UserCheck;
    case "project":
      return FolderKanban;
    default:
      return Info;
  }
}

function relativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 30) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString();
}

function entityRoute(entityType: string, entityId: number): string {
  switch (entityType) {
    case "order":
      return "/orders";
    case "project":
      return `/projects/${entityId}`;
    case "item":
      return "/items";
    default:
      return "/dashboard";
  }
}

export default function NotificationsPage() {
  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const navigate = useNavigate();

  const filtered =
    filter === "unread"
      ? notifications.filter((n) => !n.is_read)
      : notifications;

  function handleClick(id: number, entityType: string, entityId: number) {
    markAsRead(id);
    navigate(entityRoute(entityType, entityId));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on procurement activity
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllAsRead}>
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Bell className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-lg font-medium">No notifications</p>
          <p className="text-sm">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const Icon = getNotificationIcon(n.type);
            const unread = !n.is_read;
            return (
              <Card
                key={n.id}
                className={cn(
                  "flex cursor-pointer items-start gap-4 p-4 transition-colors hover:bg-accent",
                  unread && "border-primary/30 bg-primary/5"
                )}
                onClick={() => handleClick(n.id, n.entity_type, n.entity_id)}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm",
                      unread ? "font-semibold" : "font-medium"
                    )}
                  >
                    {n.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {n.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {relativeTime(n.created_at)}
                  </p>
                </div>
                {unread && (
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
