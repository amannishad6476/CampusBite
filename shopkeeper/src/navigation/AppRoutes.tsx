import { Routes, Route, Navigate } from 'react-router-dom';
import ShopkeeperLayout from '../layouts/ShopkeeperLayout';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import MyCanteen from '../pages/canteen/MyCanteen';
import MenuManagement from '../pages/menu/MenuManagement';
import Orders from '../pages/orders/Orders';
import Notifications from '../pages/notifications/Notifications';
import Profile from '../pages/profile/Profile';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ShopkeeperLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="canteen" element={<MyCanteen />} />
        <Route path="menu" element={<MenuManagement />} />
        <Route path="orders" element={<Orders />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
