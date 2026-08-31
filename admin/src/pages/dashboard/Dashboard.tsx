import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { DashboardSummary } from '../../types';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Briefcase,
  Layers,
  RefreshCw
} from 'lucide-react';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getDashboard();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 12, color: '#4b5563' }}>Loading system metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={styles.errorBox}>
        <h3 style={{ color: '#b91c1c' }}>Error Loading Analytics</h3>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={fetchMetrics} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const cards = [
    { label: 'Total Students', value: metrics.total_students, icon: Users, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Total Shopkeepers', value: metrics.total_shopkeepers, icon: Briefcase, color: '#8b5cf6', bg: '#f5f3ff' },
    { label: 'Active Delivery Riders', value: metrics.total_delivery_partners, icon: Bike, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Registered Shops', value: metrics.total_shops, valueSub: `Active: ${metrics.active_shops}`, icon: Store, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Today\'s Placed Orders', value: metrics.today_orders, icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8' },
    { label: 'Completed Deliveries', value: metrics.completed_orders, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Cancelled Orders', value: metrics.cancelled_orders, icon: XCircle, color: '#ef4444', bg: '#fef2f2' },
    { label: 'Today\'s gross GMV', value: `₹${Number(metrics.today_gmv).toFixed(2)}`, icon: TrendingUp, color: '#06b6d4', bg: '#ecfeff' },
    { label: 'Total Commission Earned', value: `₹${Number(metrics.platform_commission).toFixed(2)}`, icon: DollarSign, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Delivery Fees Collected', value: `₹${Number(metrics.delivery_fees).toFixed(2)}`, icon: Bike, color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Net Platform Earnings', value: `₹${Number(metrics.net_platform_earnings).toFixed(2)}`, icon: Layers, color: '#0f766e', bg: '#f0fdfa' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>System Control Dashboard</h2>
          <p style={styles.subtitle}>Real-time metrics, users, shops, and financial transaction monitors</p>
        </div>
        <button onClick={fetchMetrics} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      <div style={styles.grid}>
        {cards.map((card, idx) => (
          <div key={idx} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={{ ...styles.iconCircle, backgroundColor: card.bg }}>
                <card.icon size={24} color={card.color} />
              </div>
              <div style={styles.cardContent}>
                <span style={styles.cardLabel}>{card.label}</span>
                <span style={styles.cardValue}>{card.value}</span>
                {card.valueSub && <span style={styles.cardSub}>{card.valueSub}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#4b5563',
    marginTop: '4px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    fontWeight: 500,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,0.05)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconCircle: {
    width: '48px',
    height: '48px',
    borderRadius: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#111827',
    marginTop: '4px',
  },
  cardSub: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 600,
    marginTop: '2px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fca5a5',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    margin: '40px auto',
    textAlign: 'center' as const,
  },
  retryBtn: {
    padding: '10px 20px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '16px',
  },
};
