import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Truck,
  ShoppingCart,
  FolderKanban,
  Users,
  LogOut,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/constants";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  allowedRoles?: Role[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Items", href: "/items", icon: Package },
  { label: "Suppliers", href: "/suppliers", icon: Truck },
  { label: "Orders", href: "/orders", icon: ShoppingCart },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Users", href: "/users", icon: Users, allowedRoles: ["Procurement"] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const filteredItems = navItems.filter(
    (item) =>
      !item.allowedRoles || (user?.role && item.allowedRoles.includes(user.role))
  );

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
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">ProcureEng</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const isActive =
                location.pathname === item.href ||
                (item.href !== "/dashboard" &&
                  location.pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info */}
        {user && (
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-muted-foreground">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <Badge
                  variant={roleBadgeVariant(user.role)}
                  className="mt-0.5 text-[10px] px-1.5 py-0"
                >
                  {user.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
