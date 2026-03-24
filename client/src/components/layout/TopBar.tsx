import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, LogOut, ChevronRight, Bell, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/search/GlobalSearch";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  items: "Items",
  suppliers: "Suppliers",
  orders: "Orders",
  projects: "Projects",
  users: "Users",
  reports: "Reports",
  notifications: "Notifications",
  activity: "Activity",
  settings: "Settings",
  new: "New",
  edit: "Edit",
};

function deriveBreadcrumbs(pathname: string): string[] {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map(
    (segment) => pathLabels[segment] ?? (isNaN(Number(segment)) ? segment : `#${segment}`)
  );
}

interface TopBarProps {
  onToggleSidebar: () => void;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = deriveBreadcrumbs(location.pathname);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "CEO":
        return "default" as const;
      case "Procurement":
        return "default" as const;
      case "Engineer":
        return "secondary" as const;
      case "Sales":
        return "outline" as const;
      default:
        return "secondary" as const;
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onToggleSidebar}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        {breadcrumbs.length === 0 ? (
          <span className="font-medium text-foreground">Home</span>
        ) : (
          breadcrumbs.map((crumb, index) => (
            <span key={index} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-foreground"
                    : ""
                }
              >
                {crumb}
              </span>
            </span>
          ))
        )}
      </nav>

      {/* Search */}
      <button
        onClick={() => setSearchOpen(true)}
        className="ml-auto hidden items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground sm:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none ml-2 inline-flex h-5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Ctrl+K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setSearchOpen(true)}
        title="Search"
      >
        <Search className="h-4 w-4" />
      </Button>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Right side */}
      <div className="flex items-center gap-3">
        {user && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => navigate("/notifications")}
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Button>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-sm font-medium">{user.name}</span>
              <Badge variant={roleBadgeVariant(user.role)} className="text-[10px] px-1.5 py-0">
                {user.role}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="gap-1.5 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}
