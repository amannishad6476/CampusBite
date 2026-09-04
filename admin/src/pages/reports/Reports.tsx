import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { ReportSummary, FinanceSummary } from '../../types';
import { RefreshCw, TrendingUp, ShoppingBag, Bike, Store, DollarSign, Calendar } from 'lucide-react';

export default function Reports() {
  const [reports, setReports] = useState<ReportSummary | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'this_week' | 'this_month' | 'all_time'>('this_month');

  const loadData = async () => {
    setLoading(true);
    try {
      const [repData, finData] = await Promise.all([
        adminService.getReports(),
        adminService.getFinanceOverview().catch(() => null)
      ]);
      setReports(repData);
      setFinance(finData);
    } catch (err: any) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading || !reports) {
    return (
      <div style={styles.center}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: 12, color: '#4b5563', fontWeight: 500 }}>Aggregating financial and operational reports...</p>
      </div>
    );
  }

  const periodData = reports[selectedPeriod];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Financial & Operational Reports</h2>
          <p style={styles.subtitle}>Aggregated analytics based strictly on live PostgreSQL production transactions</p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Reports</span>
        </button>
      </div>

      {/* Period Filter Tabs */}
      <div style={styles.tabBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="#6b7280" />
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Time Range:</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSelectedPeriod('today')}
            style={{
              ...styles.tabBtn,
              backgroundColor: selectedPeriod === 'today' ? '#10b981' : '#f3f4f6',
              color: selectedPeriod === 'today' ? '#ffffff' : '#374151',
            }}
          >
            Today
          </button>
          <button
            onClick={() => setSelectedPeriod('this_week')}
            style={{
              ...styles.tabBtn,
              backgroundColor: selectedPeriod === 'this_week' ? '#10b981' : '#f3f4f6',
              color: selectedPeriod === 'this_week' ? '#ffffff' : '#374151',
            }}
          >
            Past 7 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('this_month')}
            style={{
              ...styles.tabBtn,
              backgroundColor: selectedPeriod === 'this_month' ? '#10b981' : '#f3f4f6',
              color: selectedPeriod === 'this_month' ? '#ffffff' : '#374151',
            }}
          >
            Past 30 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('all_time')}
            style={{
              ...styles.tabBtn,
              backgroundColor: selectedPeriod === 'all_time' ? '#10b981' : '#f3f4f6',
              color: selectedPeriod === 'all_time' ? '#ffffff' : '#374151',
            }}
          >
            All-Time Cumulative
          </button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Gross Merchandise Value (GMV)</span>
            <TrendingUp size={20} color="#10b981" />
          </div>
          <span style={{ ...styles.metricValue, color: '#10b981' }}>₹{periodData.gmv.toFixed(2)}</span>
          <span style={styles.metricSub}>Total customer spending</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Total Orders Placed</span>
            <ShoppingBag size={20} color="#3b82f6" />
          </div>
          <span style={styles.metricValue}>{periodData.total_orders}</span>
          <span style={styles.metricSub}>Delivered: {periodData.delivered_orders} | Cancelled: {periodData.cancelled_orders}</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Delivery Fees Collected</span>
            <Bike size={20} color="#06b6d4" />
          </div>
          <span style={styles.metricValue}>₹{periodData.delivery_fees.toFixed(2)}</span>
          <span style={styles.metricSub}>Disbursed to delivery fleet</span>
        </div>

        <div style={styles.metricCard}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={styles.metricLabel}>Platform Commission Revenue</span>
            <DollarSign size={20} color="#8b5cf6" />
          </div>
          <span style={{ ...styles.metricValue, color: '#8b5cf6' }}>
            ₹{finance ? Number(finance.platform.commission_revenue).toFixed(2) : (periodData.gmv * 0.1).toFixed(2)}
          </span>
          <span style={styles.metricSub}>10% standard vendor fee</span>
        </div>
      </div>

      {/* Two Column Section: Canteen Performance & Rider Leaderboard */}
      <div style={styles.twoCol}>
        {/* Canteen Performance */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Store size={20} color="#10b981" style={{ marginRight: 8 }} />
              <h3 style={styles.sectionTitle}>Canteen Performance Rankings</h3>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Canteen Name</th>
                  <th style={styles.th}>Orders</th>
                  <th style={styles.th}>Delivered</th>
                  <th style={styles.th}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {reports.canteens.map((canteen, idx) => (
                  <tr key={canteen.shop_id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                      <span style={{ color: '#9ca3af', marginRight: 8 }}>#{idx + 1}</span>
                      {canteen.shop_name}
                    </td>
                    <td style={styles.td}>{canteen.total_orders}</td>
                    <td style={styles.td}>
                      <span style={{ color: '#047857', fontWeight: 600 }}>{canteen.delivered_orders}</span>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#111827' }}>
                      ₹{canteen.revenue.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {reports.canteens.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No canteen sales recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Rider Leaderboard */}
        <div style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Bike size={20} color="#06b6d4" style={{ marginRight: 8 }} />
              <h3 style={styles.sectionTitle}>Delivery Rider Fulfillment Leaderboard</h3>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rider</th>
                  <th style={styles.th}>Vehicle</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Deliveries Completed</th>
                </tr>
              </thead>
              <tbody>
                {reports.riders.map((rider, idx) => (
                  <tr key={rider.rider_id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                      <span style={{ color: '#9ca3af', marginRight: 8 }}>#{idx + 1}</span>
                      {rider.rider_name}
                    </td>
                    <td style={styles.td}>{rider.vehicle_type}</td>
                    <td style={styles.td}>⭐ {rider.rating.toFixed(1)}</td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#0e7490' }}>
                      {rider.completed_deliveries} deliveries
                    </td>
                  </tr>
                ))}
                {reports.riders.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>
                      No deliveries fulfilled yet.
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
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer',
  },
  tabBar: {
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  tabBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginTop: '4px',
  },
  metricSub: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '24px',
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
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
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '12px',
    fontSize: '14px',
    color: '#374151',
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
};
