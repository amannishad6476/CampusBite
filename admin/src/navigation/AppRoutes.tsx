import { Routes, Route, Navigate } from 'react-router-dom';


import AdminLayout from '../layouts/AdminLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import Campuses from '../pages/campuses/Campuses';
import Shops from '../pages/shops/Shops';
import Users from '../pages/users/Users';
import Orders from '../pages/orders/Orders';
import Finance from '../pages/finance/Finance';
import AuditLogs from '../pages/audit/AuditLogs';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Control Panel Routes */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="campuses" element={<Campuses />} />
        <Route path="shops" element={<Shops />} />
        <Route path="users" element={<Users />} />
        <Route path="orders" element={<Orders />} />
        <Route path="finance" element={<Finance />} />
        <Route path="audit-logs" element={<AuditLogs />} />
      </Route>

      {/* Fallback to Dashboard */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
