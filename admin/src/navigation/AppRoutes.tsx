import { Routes, Route, Navigate } from 'react-router-dom';

import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import Students from '../pages/students/Students';
import Shopkeepers from '../pages/shopkeepers/Shopkeepers';
import Riders from '../pages/riders/Riders';
import Canteens from '../pages/canteens/Canteens';
import MenuManagement from '../pages/menu/MenuManagement';
import Orders from '../pages/orders/Orders';
import Payments from '../pages/payments/Payments';
import Campuses from '../pages/campuses/Campuses';
import Reports from '../pages/reports/Reports';
import Notifications from '../pages/notifications/Notifications';
import Settings from '../pages/settings/Settings';
import AuditLogs from '../pages/audit/AuditLogs';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Control Panel Routes */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="students" element={<Students />} />
        <Route path="shopkeepers" element={<Shopkeepers />} />
        <Route path="riders" element={<Riders />} />
        <Route path="canteens" element={<Canteens />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="payments" element={<Payments />} />
        <Route path="campuses" element={<Campuses />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        {/* Legacy / Alias path redirects */}
        <Route path="shops" element={<Canteens />} />
        <Route path="users" element={<Students />} />
        <Route path="finance" element={<Payments />} />
      </Route>

      {/* Fallback to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
