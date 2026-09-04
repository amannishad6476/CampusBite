import { useEffect, useState } from 'react';
import apiClient from '../../api/client';
import { Bell, RefreshCw, ShieldCheck } from 'lucide-react';

interface NotificationLog {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  order_id?: string | null;
  is_read: boolean;
  created_at: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // Fetch system audit logs or notifications
      const auditRes = await apiClient.get<any[]>('/admin/audit-logs');
      // Format as notifications feed
      const mapped = auditRes.data.map((l: any) => ({
        id: l.id,
        user_id: l.admin_id,
        title: `Audit Event: ${l.action}`,
        message: l.reason || `Action performed on ${l.target_type} (${l.target_id || 'Global'})`,
        type: l.action,
        order_id: l.target_type === 'ORDER' ? l.target_id : null,
        is_read: true,
        created_at: l.timestamp
      }));
      setNotifications(mapped);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>System Alerts & Notifications Log</h2>
          <p style={styles.subtitle}>Audit automated order lifecycle dispatches and platform administrative events</p>
        </div>
        <button onClick={fetchNotifications} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Alerts</span>
        </button>
      </div>

      <div style={styles.card}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <Bell size={20} color="#10b981" style={{ marginRight: 8 }} />
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Real-Time Automated Lifecycle Triggers</h3>
        </div>

        <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 20px 0' }}>
          Notifications are automatically dispatched to student in-app notification centers and delivery partners whenever order states change: <code>PLACED</code>, <code>PREPARING</code>, <code>READY</code>, <code>ASSIGNED</code>, <code>DELIVERED</code>, or <code>CANCELLED</code>.
        </p>

        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading system feed...</div>
        ) : (
          <div style={styles.timeline}>
            {notifications.map(item => (
              <div key={item.id} style={styles.timelineItem}>
                <div style={styles.iconColumn}>
                  <div style={styles.timelineCircle}>
                    <ShieldCheck size={14} color="#10b981" />
                  </div>
                  <div style={styles.timelineLine}></div>
                </div>
                <div style={styles.timelineContent}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={styles.timelineTitle}>{item.title}</span>
                    <span style={styles.timelineTime}>
                      {new Date(item.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p style={styles.timelineMessage}>{item.message}</p>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                No alerts recorded in the system feed yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '14px',
    color: '#6b7280',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  timelineItem: {
    display: 'flex',
    gap: '16px',
    minHeight: '60px',
  },
  iconColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  timelineCircle: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: '#ecfdf5',
    border: '2px solid #10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    flex: 1,
    width: '2px',
    backgroundColor: '#e5e7eb',
    margin: '4px 0',
  },
  timelineContent: {
    flex: 1,
    paddingBottom: '20px',
  },
  timelineTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  timelineTime: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  timelineMessage: {
    fontSize: '13px',
    color: '#4b5563',
    margin: '4px 0 0 0',
  },
};
