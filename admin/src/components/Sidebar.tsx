import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  Bike,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  MapPin,
  BarChart3,
  Bell,
  Settings,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: GraduationCap },
    { name: 'Shopkeepers', path: '/shopkeepers', icon: UserCheck },
    { name: 'Delivery Riders', path: '/riders', icon: Bike },
    { name: 'Canteens', path: '/canteens', icon: Store },
    { name: 'Menu / Food', path: '/menu', icon: UtensilsCrossed },
    { name: 'Orders', path: '/orders', icon: ShoppingBag },
    { name: 'Payments', path: '/payments', icon: CreditCard },
    { name: 'Campuses', path: '/campuses', icon: MapPin },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Notifications', path: '/notifications', icon: Bell },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Audit Logs', path: '/audit-logs', icon: ClipboardList },
  ];

  const activeStyle = {
    backgroundColor: '#374151',
    color: '#ffffff',
  };

  return (
    <aside style={styles.sidebar}>
      {/* App Branding Header */}
      <div style={styles.brand}>
        <span style={styles.brandLogo}>🍔</span>
        <h1 style={styles.brandName}>CampusBite</h1>
      </div>
      <div style={styles.brandSub}>ADMIN CONSOLE</div>

      {/* Nav Menu */}
      <nav style={styles.nav}>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? activeStyle : {}),
            })}
          >
            <item.icon size={18} style={styles.navIcon} />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div style={styles.footer}>
        <button onClick={logout} style={styles.logoutBtn}>
          <LogOut size={16} style={{ marginRight: 8 }} />
          <span>Admin Log Out</span>
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    display: 'flex',
    flexDirection: 'column' as const,
    borderRight: '1px solid #374151',
    height: '100vh',
    position: 'sticky' as const,
    top: 0,
    overflow: 'hidden' as const,
  },
  brand: {
    padding: '20px 20px 4px 20px',
    display: 'flex',
    alignItems: 'center',
  },
  brandLogo: {
    fontSize: '24px',
    marginRight: '12px',
  },
  brandName: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#ffffff',
    margin: 0,
  },
  brandSub: {
    fontSize: '10px',
    letterSpacing: '1.5px',
    color: '#10b981',
    fontWeight: 'bold',
    paddingLeft: '20px',
    marginBottom: '16px',
  },
  nav: {
    flex: 1,
    padding: '0 12px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '3px',
    overflowY: 'auto' as const,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s, color 0.2s',
  },
  navIcon: {
    marginRight: '12px',
  },
  footer: {
    padding: '20px 16px',
    borderTop: '1px solid #374151',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '10px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
};
