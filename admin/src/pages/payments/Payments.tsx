import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { PaymentRecord } from '../../types';
import { Search, RefreshCw, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [gatewayFilter, setGatewayFilter] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPayments();
      setPayments(data);
    } catch (err: any) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SUCCESS' || s === 'PAID') {
      return { bg: '#def7ec', text: '#03543f', icon: CheckCircle2 };
    } else if (s === 'FAILED' || s === 'CANCELLED') {
      return { bg: '#fde8e8', text: '#9b1c1c', icon: XCircle };
    } else {
      return { bg: '#fef08a', text: '#713f12', icon: Clock };
    }
  };

  const totalCollected = payments
    .filter(p => p.status === 'SUCCESS' || p.status === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount), 0);

  const filteredPayments = payments.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.id.toLowerCase().includes(q) ||
      (p.order_number && p.order_number.toLowerCase().includes(q)) ||
      (p.student_name && p.student_name.toLowerCase().includes(q)) ||
      (p.shop_name && p.shop_name.toLowerCase().includes(q)) ||
      (p.transaction_ref && p.transaction_ref.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'ALL' || p.status.toUpperCase() === statusFilter;
    const matchesGateway = gatewayFilter === 'ALL' || p.gateway.toUpperCase() === gatewayFilter;

    return matchesSearch && matchesStatus && matchesGateway;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Payment Management & Transactions</h2>
          <p style={styles.subtitle}>Audit payment transactions, reconciliation records, and gateway statuses</p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Transactions</span>
        </button>
      </div>

      {/* Security Info Banner */}
      <div style={styles.securityBanner}>
        <ShieldCheck size={20} color="#047857" style={{ marginRight: 12, flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#065f46', fontSize: '14px' }}>Server-Side Payment Security Guarantee</strong>
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#047857' }}>
            Cashfree PG secret keys and payment webhook signatures are handled strictly by the backend FastAPI environment. No sensitive secrets are stored or exposed in the admin client.
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Total Settled Collections</span>
          <span style={{ ...styles.summaryValue, color: '#10b981' }}>₹{totalCollected.toFixed(2)}</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Total Transactions</span>
          <span style={styles.summaryValue}>{payments.length}</span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Successful Payments</span>
          <span style={{ ...styles.summaryValue, color: '#047857' }}>
            {payments.filter(p => p.status === 'SUCCESS' || p.status === 'PAID').length}
          </span>
        </div>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>Pending / Incomplete</span>
          <span style={{ ...styles.summaryValue, color: '#d97706' }}>
            {payments.filter(p => p.status === 'PENDING').length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterCard}>
        <div style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by Payment ID, Order #, Canteen, or Transaction Reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS / PAID</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Gateway:</label>
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Gateways</option>
            <option value="CASHFREE">Cashfree UPI/Cards</option>
            <option value="COD">Cash on Delivery (COD)</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading payment transactions...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Payment Reference</th>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Canteen</th>
                  <th style={styles.th}>Gateway</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map(pay => {
                  const badge = getStatusBadge(pay.status);
                  return (
                    <tr key={pay.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px' }}>
                        <div>{pay.id.slice(0, 10)}...</div>
                        {pay.transaction_ref && (
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>Ref: {pay.transaction_ref}</div>
                        )}
                      </td>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                        {pay.order_number || pay.order_id.slice(0, 8)}
                      </td>
                      <td style={styles.td}>{pay.student_name || 'Student'}</td>
                      <td style={styles.td}>{pay.shop_name || 'Canteen'}</td>
                      <td style={styles.td}>
                        <span style={styles.gatewayBadge}>{pay.gateway}</span>
                      </td>
                      <td style={{ ...styles.td, fontWeight: 700, fontSize: '15px' }}>
                        ₹{Number(pay.amount).toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: badge.bg,
                          color: badge.text
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
                {filteredPayments.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', padding: '36px', color: '#9ca3af' }}>
                      No payment transactions found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  securityBanner: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    padding: '18px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  summaryLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  summaryValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#111827',
  },
  filterCard: {
    backgroundColor: '#ffffff',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
  },
  searchBar: {
    flex: 1,
    minWidth: '260px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '0 12px',
  },
  searchInput: {
    width: '100%',
    border: 'none',
    backgroundColor: 'transparent',
    padding: '10px 8px',
    fontSize: '14px',
    outline: 'none',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4b5563',
  },
  select: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#374151',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    textAlign: 'left' as const,
  },
  th: {
    padding: '12px 16px',
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
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
  },
  gatewayBadge: {
    display: 'inline-block',
    padding: '3px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  centerLoading: {
    padding: '48px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '15px',
  },
};
