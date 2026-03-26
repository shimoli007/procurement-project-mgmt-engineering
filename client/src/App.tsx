import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui/toast'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/pages/LoginPage'
import DashboardPage from '@/pages/DashboardPage'
import ItemsPage from '@/pages/ItemsPage'
import SuppliersPage from '@/pages/SuppliersPage'
import OrdersPage from '@/pages/OrdersPage'
import ProjectsPage from '@/pages/ProjectsPage'
import ProjectDetailPage from '@/pages/ProjectDetailPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ReportsPage from '@/pages/ReportsPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ActivityPage from '@/pages/ActivityPage'
import SettingsPage from '@/pages/SettingsPage'
import UsersPage from '@/pages/UsersPage'
import AIInsightsPage from '@/pages/AIInsightsPage'
import ApiKeysPage from '@/pages/ApiKeysPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/items" element={<ItemsPage />} />
                <Route path="/suppliers" element={<SuppliersPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetailPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/ai-insights" element={<AIInsightsPage />} />
                {/* Admin routes - restricted */}
                <Route element={<ProtectedRoute allowedRoles={["CEO", "Procurement"]} />}>
                  <Route path="/activity" element={<ActivityPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/users" element={<UsersPage />} />
                </Route>
                <Route element={<ProtectedRoute allowedRoles={["CEO"]} />}>
                  <Route path="/api-keys" element={<ApiKeysPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
