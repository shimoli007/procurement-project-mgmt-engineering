import { useLocation } from "react-router-dom";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const pathLabels: Record<string, string> = {
  dashboard: "Dashboard",
  items: "Items",
  suppliers: "Suppliers",
  orders: "Orders",
  projects: "Projects",
  users: "Users",
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
  const location = useLocation();
  const breadcrumbs = deriveBreadcrumbs(location.pathname);

  const roleBadgeVariant = (role: string) => {
    switch (role) {
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

      {/* Right side */}
      <div className="ml-auto flex items-center gap-3">
        {user && (
          <>
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
