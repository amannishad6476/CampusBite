import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Check, AlertCircle } from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { Notification } from '../../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shopkeeperService.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      setError(err.message || 'Could not load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notif: Notification) => {
    if (notif.is_read) return;
    try {
      const updated = await shopkeeperService.markNotificationRead(notif.id);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch (err) {
      console.warn('Could not mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await shopkeeperService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err: any) {
      alert(err.message || 'Could not mark all notifications as read');
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Notifications & Alerts</h1>
          <p style={styles.subtitle}>
            Order updates, customer requests, and canteen alerts
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={styles.markAllBtn}>
            <CheckCheck size={16} style={{ marginRight: 6 }} />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Fetching alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div style={styles.emptyCard}>
          <Bell size={44} color="#9ca3af" />
          <p style={styles.emptyTitle}>No notifications yet</p>
          <p style={styles.emptyText}>You are all caught up! New order alerts will notify you here.</p>
        </div>
      ) : (
        <div style={styles.listCard}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => handleMarkRead(notif)}
              style={{
                ...styles.notifItem,
                backgroundColor: notif.is_read ? '#ffffff' : '#fffaf5',
                borderLeftColor: notif.is_read ? 'transparent' : '#ea580c',
                cursor: notif.is_read ? 'default' : 'pointer',
              }}
            >
              <div style={styles.itemHeader}>
                <div style={styles.titleRow}>
                  <span style={styles.itemTitle}>{notif.title}</span>
                  {!notif.is_read && <span style={styles.newBadge}>NEW</span>}
                </div>
                <div style={styles.timeTag}>
                  <Clock size={12} color="#9ca3af" style={{ marginRight: 4 }} />
                  <span>{new Date(notif.created_at).toLocaleString()}</span>
                </div>
              </div>
              <p style={styles.itemMessage}>{notif.message}</p>
              {!notif.is_read && (
                <div style={styles.markReadRow}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(notif);
                    }}
                    style={styles.markReadBtn}
                  >
                    <Check size={12} style={{ marginRight: 4 }} />
                    Mark Read
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40vh',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #ea580c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#6b7280',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  markAllBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '13px',
    marginBottom: '20px',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    marginTop: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6b7280',
    maxWidth: '360px',
  },
  listCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  notifItem: {
    padding: '18px 20px',
    borderBottom: '1px solid #f3f4f6',
    borderLeft: '4px solid',
    transition: 'background-color 0.15s ease',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },
  newBadge: {
    backgroundColor: '#ea580c',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: '10px',
  },
  timeTag: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '11px',
    color: '#9ca3af',
  },
  itemMessage: {
    fontSize: '13px',
    color: '#4b5563',
    margin: '0 0 6px 0',
    lineHeight: '1.4',
  },
  markReadRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  markReadBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#4b5563',
    cursor: 'pointer',
  },
};
