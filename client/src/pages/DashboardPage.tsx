import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/hooks/useDashboard";
import SummaryCards from "@/components/dashboard/SummaryCards";
import OrdersChart from "@/components/dashboard/OrdersChart";
import ProjectReadiness from "@/components/dashboard/ProjectReadiness";
import RecentOrders from "@/components/dashboard/RecentOrders";

export default function DashboardPage() {
  const { user } = useAuth();
  const { summary, recentOrders, projectReadiness, loading } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}. Here is an overview of your procurement activity.
        </p>
      </div>

      {/* KPI Summary Cards */}
      <SummaryCards summary={summary} loading={loading} />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OrdersChart summary={summary} loading={loading} />
        <ProjectReadiness projects={projectReadiness} loading={loading} />
      </div>

      {/* Recent Orders table */}
      <RecentOrders orders={recentOrders} loading={loading} />
    </div>
  );
}
