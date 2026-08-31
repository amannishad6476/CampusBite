import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { FinanceSummary } from '../../types';
import { RefreshCw, Landmark, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';

export default function Finance() {
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFinanceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getFinanceOverview();
      setFinance(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial overview ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  if (loading) {
    return <div style={styles.center}>Generating system payout splits ledger...</div>;
  }

  if (error || !finance) {
    return (
      <div style={styles.errorBox}>
        <p style={{ color: '#ef4444' }}>{error}</p>
        <button onClick={fetchFinanceData} style={styles.retryBtn}>Retry</button>
      </div>
    );
  }

  const sections = [
    {
      title: 'Canteens / Shopkeepers Ledger',
      icon: Landmark,
      color: '#3b82f6',
      rows: [
        { label: 'Gross Sales (Food Total)', value: finance.shopkeepers.gross_sales },
        { label: 'Platform Commission (10%)', value: finance.shopkeepers.commission_deducted, isNegative: true },
        { label: 'Net Canteens Share', value: finance.shopkeepers.net_earnings, isHighlight: true },
      ],
    },
    {
      title: 'Delivery Partners Rider Ledger',
      icon: Wallet,
      color: '#10b981',
      rows: [
        { label: 'Delivery Payouts', value: finance.delivery_partners.delivery_earnings },
        { label: 'Platform Deductions', value: finance.delivery_partners.deductions, isNegative: true },
        { label: 'Net Rider Earnings', value: finance.delivery_partners.net_earnings, isHighlight: true },
      ],
    },
    {
      title: 'CampusBite Platform Revenue Ledger',
      icon: Landmark,
      color: '#8b5cf6',
      rows: [
        { label: 'Commission Collections', value: finance.platform.commission_revenue },
        { label: 'Delivery/Service Fees Collected', value: finance.platform.delivery_fees_collected },
        { label: 'Net Platform Earnings', value: finance.platform.net_earnings, isHighlight: true },
      ],
    },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Finance Splits & Commission Ledger</h2>
          <p style={styles.subtitle}>Audit gross platform sales, commission deductions, rider payouts, and net revenues</p>
        </div>
        <button onClick={fetchFinanceData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Ledger</span>
        </button>
      </div>

      <div style={styles.grid}>
        {sections.map((section, idx) => (
          <div key={idx} style={styles.card}>
            <div style={styles.cardHeader}>
              <div style={styles.iconCircle}>
                <section.icon size={22} color={section.color} />
              </div>
              <h3 style={styles.cardTitle}>{section.title}</h3>
            </div>

            <div style={styles.rows}>
              {section.rows.map((row, rIdx) => (
                <div
                  key={rIdx}
                  style={{
                    ...styles.row,
                    ...(row.isHighlight ? styles.highlightRow : {}),
                  }}
                >
                  <span style={styles.rowLabel}>{row.label}</span>
                  <div style={styles.valCol}>
                    {row.isNegative && <ArrowDownRight size={14} color="#ef4444" />}
                    {!row.isNegative && row.isHighlight && <ArrowUpRight size={14} color="#10b981" />}
                    <span
                      style={{
                        ...styles.rowValue,
                        color: row.isNegative
                          ? '#ef4444'
                          : row.isHighlight
                          ? '#111827'
                          : '#4b5563',
                      }}
                    >
                      {row.isNegative ? '-' : ''}₹{Number(row.value).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
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
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '16px',
    marginBottom: '16px',
  },
  iconCircle: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    border: '1px solid #e5e7eb',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0,
  },
  rows: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
  },
  highlightRow: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '16px',
    marginTop: '4px',
    fontWeight: 'bold',
  },
  rowLabel: {
    fontSize: '13px',
    color: '#4b5563',
  },
  valCol: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  rowValue: {
    fontSize: '15px',
    fontWeight: 600,
  },
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    fontSize: '15px',
    color: '#6b7280',
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
