import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { shopkeeperService } from '../services/shopkeeperService';
import { Store, Bell, LogOut, Power, CheckCircle, XCircle } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar?: () => void;
}

export default function Header({}: HeaderProps) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  const fetchHeaderData = async () => {
    try {
      const [shopData, notifCount] = await Promise.all([
        shopkeeperService.getMyShop(),
        shopkeeperService.getUnreadNotificationsCount()
      ]);
      setIsOpen(shopData.is_open);
      setUnreadCount(notifCount.unread_count);
    } catch (err) {
      // Ignored if unmounted or unauthorized
    }
  };

  useEffect(() => {
    fetchHeaderData();
    const interval = setInterval(fetchHeaderData, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, []);

  const handleToggleShopStatus = async () => {
    if (isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      const updated = await shopkeeperService.updateMyShop({ is_open: !isOpen });
      setIsOpen(updated.is_open);
    } catch (err: any) {
      alert(err.message || 'Failed to update canteen status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.canteenTag}>
          <Store size={18} color="#ea580c" style={{ marginRight: 8 }} />
          <span style={styles.canteenName}>{profile?.shop_name || 'My Canteen'}</span>
          {profile?.campus_name && (
            <span style={styles.campusBadge}>{profile.campus_name}</span>
          )}
        </div>
      </div>

      <div style={styles.right}>
        {/* Canteen Online / Offline Quick Toggle */}
        <button
          onClick={handleToggleShopStatus}
          disabled={isUpdatingStatus}
          style={{
            ...styles.statusToggleBtn,
            backgroundColor: isOpen ? '#ecfdf5' : '#fef2f2',
            borderColor: isOpen ? '#a7f3d0' : '#fecaca',
            color: isOpen ? '#065f46' : '#991b1b',
          }}
          title="Toggle canteen open / closed state"
        >
          {isOpen ? (
            <>
              <CheckCircle size={15} color="#059669" style={{ marginRight: 6 }} />
              <span>Canteen Open</span>
            </>
          ) : (
            <>
              <XCircle size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <span>Canteen Closed</span>
            </>
          )}
          <Power size={13} style={{ marginLeft: 6, opacity: 0.7 }} />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => navigate('/notifications')}
          style={styles.notifBtn}
          title="Notifications"
        >
          <Bell size={18} color="#4b5563" />
          {unreadCount > 0 && (
            <span style={styles.notifBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
          )}
        </button>

        {/* User Profile Pill */}
        <div
          onClick={() => navigate('/profile')}
          style={styles.profileBadge}
          title="View profile"
        >
          <div style={styles.avatar}>
            {(user?.name || 'S').charAt(0).toUpperCase()}
          </div>
          <div style={styles.profileInfo}>
            <span style={styles.userName}>{user?.name || 'Shopkeeper'}</span>
            <span style={styles.userRole}>Canteen Owner</span>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={styles.logoutBtn}
          title="Sign out of Canteen Panel"
        >
          <LogOut size={16} color="#dc2626" />
        </button>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '64px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 20,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  canteenTag: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    border: '1px solid #ffedd5',
    padding: '6px 14px',
    borderRadius: '10px',
  },
  canteenName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#9a3412',
  },
  campusBadge: {
    marginLeft: '10px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#ea580c',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '12px',
    letterSpacing: '0.02em',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  statusToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  notifBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
    borderRadius: '10px',
    padding: '1px 5px',
    minWidth: '18px',
    textAlign: 'center',
  },
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    padding: '4px 12px 4px 6px',
    borderRadius: '24px',
    cursor: 'pointer',
  },
  avatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    textAlign: 'left',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#1f2937',
    lineHeight: '1.2',
  },
  userRole: {
    fontSize: '11px',
    color: '#6b7280',
    lineHeight: '1.1',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    cursor: 'pointer',
  },
};
