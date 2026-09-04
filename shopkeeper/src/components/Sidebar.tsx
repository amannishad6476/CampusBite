import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Store,
  UtensilsCrossed,
  ShoppingBag,
  Bell,
  User,
  LogOut,
  CookingPot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'My Canteen', path: '/canteen', icon: Store },
    { label: 'Menu Catalog', path: '/menu', icon: UtensilsCrossed },
    { label: 'Live Orders', path: '/orders', icon: ShoppingBag },
    { label: 'Notifications', path: '/notifications', icon: Bell },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brand}>
        <div style={styles.logoIconContainer}>
          <CookingPot size={22} color="#ffffff" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>CampusBite</h1>
          <span style={styles.brandSubtitle}>Canteen Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              style={({ isActive }) => ({
                ...styles.navLink,
                backgroundColor: isActive ? '#ea580c' : 'transparent',
                color: isActive ? '#ffffff' : '#9ca3af',
                fontWeight: isActive ? 600 : 500,
              })}
            >
              <Icon size={18} style={{ marginRight: 12, flexShrink: 0 }} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div style={styles.footer}>
        <button onClick={handleLogout} style={styles.logoutButton}>
          <LogOut size={16} style={{ marginRight: 10 }} />
          <span>Sign Out</span>
        </button>
        <div style={styles.versionInfo}>
          CampusBite Partner v1.0.0
        </div>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    backgroundColor: '#111827',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    borderRight: '1px solid #1f2937',
    flexShrink: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px 20px',
    borderBottom: '1px solid #1f2937',
    gap: '12px',
  },
  logoIconContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    backgroundColor: '#ea580c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.3)',
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#ffffff',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#fb923c',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  nav: {
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 14px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.15s ease',
  },
  footer: {
    padding: '16px 16px',
    borderTop: '1px solid #1f2937',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '10px 14px',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  versionInfo: {
    fontSize: '11px',
    color: '#6b7280',
    textAlign: 'center',
    marginTop: '12px',
  },
};
