import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { DashboardSummary, Order, PaymentRecord, DeliveryPartner, Shop } from '../../types';
import {
  Users,
  Store,
  Bike,
  ShoppingBag,
  TrendingUp,
  RefreshCw,
  Clock,
  CheckCircle2,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dashData, ordersData, paymentsData, ridersData, shopsData] = await Promise.all([
        adminService.getDashboard(),
        adminService.getOrders().catch(() => []),
        adminService.getPayments().catch(() => []),
        adminService.getDeliveryPartners().catch(() => []),
        adminService.getShops().catch(() => [])
      ]);
      setMetrics(dashData);
      setOrders(ordersData);
      setPayments(paymentsData);
      setRiders(ridersData);
      setShops(shopsData);
    } catch (err: any) {
      setError(err.message || 'Failed to load system dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 12, color: '#4b5563', fontWeight: 500 }}>Synchronizing real-time control metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div style={styles.errorBox}>
        <h3 style={{ color: '#b91c1c', margin: '0 0 8px 0' }}>Error Loading Analytics</h3>
        <p style={{ color: '#ef4444', margin: '0 0 16px 0' }}>{error}</p>
        <button onClick={fetchAllData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  // Derived real-time metrics
  const activeOrdersCount = orders.filter(o =>
    ['PLACED', 'ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;

  const activeRidersCount = riders.filter(r => r.is_active && r.status !== 'OFFLINE').length;
  const activeCanteensCount = shops.filter(s => s.status === 'ACTIVE' || s.status === 'APPROVED').length;

  // Order status distribution
  const statusCounts: Record<string, number> = {
    PLACED: 0,
    ACCEPTED: 0,
    PREPARING: 0,
    READY: 0,
    ASSIGNED: 0,
    PICKED_UP: 0,
    OUT_FOR_DELIVERY: 0,
    DELIVERED: 0,
    CANCELLED: 0
  };
  orders.forEach(o => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    } else if (o.status === 'READY_FOR_PICKUP') {
      statusCounts.READY = (statusCounts.READY || 0) + 1;
    }
  });

  const cards = [
    { label: 'Total Students', value: metrics.total_students, icon: Users, color: '#3b82f6', bg: '#eff6ff', link: '/students' },
    { label: 'Active Orders', value: activeOrdersCount, icon: Clock, color: '#f59e0b', bg: '#fffbeb', link: '/orders' },
    { label: "Today's Orders", value: metrics.today_orders, icon: ShoppingBag, color: '#ec4899', bg: '#fdf2f8', link: '/orders' },
    { label: "Today's Revenue (GMV)", value: `₹${Number(metrics.today_gmv).toFixed(2)}`, icon: TrendingUp, color: '#10b981', bg: '#ecfdf5', link: '/reports' },
    { label: 'Active Shopkeepers', value: metrics.total_shopkeepers, icon: Store, color: '#8b5cf6', bg: '#f5f3ff', link: '/shopkeepers' },
    { label: 'Active Riders', value: activeRidersCount, sub: `Total: ${riders.length}`, icon: Bike, color: '#06b6d4', bg: '#ecfeff', link: '/riders' },
    { label: 'Active Canteens', value: activeCanteensCount, sub: `Total: ${shops.length}`, icon: Store, color: '#10b981', bg: '#ecfdf5', link: '/canteens' },
  ];

  const recentOrders = orders.slice(0, 6);
  const recentPayments = payments.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return { bg: '#def7ec', text: '#03543f', border: '#bcf0da' };
      case 'CANCELLED':
        return { bg: '#fde8e8', text: '#9b1c1c', border: '#f8b4b4' };
      case 'PLACED':
      case 'ACCEPTED':
        return { bg: '#e1effe', text: '#1e429f', border: '#b3d7ff' };
      case 'PREPARING':
      case 'READY_FOR_PICKUP':
      case 'READY':
        return { bg: '#fef08a', text: '#713f12', border: '#fde047' };
      default:
        return { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
    }
  };

  return (
    <div style={styles.container}>
      {/* Title & Refresh */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>System Control Dashboard</h2>
          <p style={styles.subtitle}>Real-time metrics, active orders, live dispatch, and revenue stream monitors</p>
        </div>
        <button onClick={fetchAllData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div style={styles.grid}>
        {cards.map((card, idx) => (
          <Link key={idx} to={card.link} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={{ ...styles.iconCircle, backgroundColor: card.bg }}>
                  <card.icon size={22} color={card.color} />
                </div>
                <div style={styles.cardContent}>
                  <span style={styles.cardLabel}>{card.label}</span>
                  <span style={styles.cardValue}>{card.value}</span>
                  {card.sub && <span style={styles.cardSub}>{card.sub}</span>}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Dual Column Layout: Orders & Live Status Breakdown */}
      <div style={styles.twoCol}>
        {/* Left: Recent Orders */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <ShoppingBag size={20} color="#3b82f6" style={{ marginRight: 8 }} />
              <h3 style={styles.sectionTitle}>Recent Orders</h3>
            </div>
            <Link to="/orders" style={styles.viewAllLink}>
              <span>View All</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Canteen</th>
                  <th style={styles.th}>Total</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const badge = getStatusBadge(order.status);
                  const timeStr = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <tr key={order.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>{order.order_number}</td>
                      <td style={styles.td}>{order.shop_name || 'Campus Canteen'}</td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>₹{Number(order.total_amount).toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusBadge, backgroundColor: badge.bg, color: badge.text, borderColor: badge.border }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>{timeStr}</td>
                    </tr>
                  );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No recent orders recorded today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Orders by Status & Rider Activity */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Status Breakdown */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle2 size={20} color="#10b981" style={{ marginRight: 8 }} />
                <h3 style={styles.sectionTitle}>Orders by Lifecycle Status</h3>
              </div>
            </div>

            <div style={styles.statusGrid}>
              {Object.entries(statusCounts).map(([status, count]) => {
                const badge = getStatusBadge(status);
                return (
                  <div key={status} style={styles.statusTile}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: badge.text, marginRight: 8 }}></span>
                      <span style={styles.statusTileName}>{status}</span>
                    </div>
                    <span style={styles.statusTileCount}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rider Activity Snapshot */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Bike size={20} color="#06b6d4" style={{ marginRight: 8 }} />
                <h3 style={styles.sectionTitle}>Delivery Fleet Live Status</h3>
              </div>
              <Link to="/riders" style={styles.viewAllLink}>
                <span>Manage Fleet</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={styles.fleetCard}>
                <span style={styles.fleetNumber}>{riders.filter(r => r.status === 'ONLINE').length}</span>
                <span style={{ ...styles.fleetLabel, color: '#10b981' }}>🟢 Online Ready</span>
              </div>
              <div style={styles.fleetCard}>
                <span style={styles.fleetNumber}>{riders.filter(r => r.status === 'BUSY').length}</span>
                <span style={{ ...styles.fleetLabel, color: '#f59e0b' }}>🟡 Busy on Delivery</span>
              </div>
              <div style={styles.fleetCard}>
                <span style={styles.fleetNumber}>{riders.filter(r => r.status === 'OFFLINE').length}</span>
                <span style={{ ...styles.fleetLabel, color: '#6b7280' }}>⚪ Offline</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Payments Stream */}
      <div style={{ marginTop: '24px' }}>
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CreditCard size={20} color="#8b5cf6" style={{ marginRight: 8 }} />
              <h3 style={styles.sectionTitle}>Recent Payment Transactions (Safe Server Gateway)</h3>
            </div>
            <Link to="/payments" style={styles.viewAllLink}>
              <span>View Full Ledger</span>
              <ChevronRight size={16} />
            </Link>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Payment ID</th>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Gateway</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map(pay => {
                  const isSuccess = pay.status === 'SUCCESS' || pay.status === 'PAID';
                  return (
                    <tr key={pay.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', color: '#4b5563' }}>
                        {pay.id.slice(0, 8)}...
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600 }}>{pay.order_number || pay.order_id.slice(0, 8)}</td>
                      <td style={styles.td}>{pay.student_name || 'Student'}</td>
                      <td style={styles.td}>
                        <span style={styles.gatewayBadge}>{pay.gateway}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>₹{Number(pay.amount).toFixed(2)}</td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: isSuccess ? '#def7ec' : '#fde8e8',
                          color: isSuccess ? '#03543f' : '#9b1c1c'
                        }}>
                          {pay.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                        {new Date(pay.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  );
                })}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No payment transactions recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
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
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '18px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    cursor: 'pointer',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
  },
  iconCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '14px',
    flexShrink: 0,
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  cardLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  cardValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
    marginTop: '2px',
  },
  cardSub: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '16px',
    fontWeight: '700',
    color: '#111827',
  },
  viewAllLink: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    fontWeight: '600',
    color: '#10b981',
    textDecoration: 'none',
    gap: '4px',
  },
  tableContainer: {
    overflowX: 'auto' as const,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  th: {
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#374151',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3px',
    border: '1px solid transparent',
  },
  gatewayBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    color: '#4b5563',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
  },
  statusTile: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #f3f4f6',
  },
  statusTileName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
  },
  statusTileCount: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#111827',
  },
  fleetCard: {
    flex: 1,
    padding: '14px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  fleetNumber: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
  },
  fleetLabel: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '4px',
  },
  center: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #10b981',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    padding: '24px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fee2e2',
    borderRadius: '12px',
    textAlign: 'center' as const,
  },
  retryBtn: {
    padding: '8px 16px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
