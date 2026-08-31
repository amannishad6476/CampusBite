import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Store,
  Users,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Campuses', path: '/campuses', icon: MapPin },
    { name: 'Shops & Canteens', path: '/shops', icon: Store },
    { name: 'Users Management', path: '/users', icon: Users },
    { name: 'Orders Log', path: '/orders', icon: ShoppingBag },
    { name: 'Finance Splits', path: '/finance', icon: DollarSign },
    { name: 'System Audit Logs', path: '/audit-logs', icon: ClipboardList },
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
          <span>Rider Log Out</span>
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
  },
  brand: {
    padding: '24px 24px 4px 24px',
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
    paddingHorizontal: '24px',
    paddingLeft: '24px',
    marginBottom: '28px',
  },
  nav: {
    flex: 1,
    padding: '0 16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#9ca3af',
    fontSize: '14px',
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
