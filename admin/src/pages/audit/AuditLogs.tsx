import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { AuditLog } from '../../types';
import { RefreshCw, Shield } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setLogs(data);
    } catch (e) {
      console.error('Failed to load system audit logs:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>System Control Audit Trail</h2>
          <p style={styles.subtitle}>Immutable list of administrator logs, status changes, and order status overrides</p>
        </div>
        <button onClick={onRefresh} style={styles.refreshBtn} disabled={refreshing}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Log Trail</span>
        </button>
      </div>

      <div style={styles.infoBox}>
        <Shield size={18} color="#0f766e" style={{ marginRight: 10, marginTop: 2 }} />
        <span style={styles.infoText}>
          <strong>Immutable Audit Trail</strong>: These action logs are captured automatically server-side and cannot be modified, deleted, or cleared from the console interface.
        </span>
      </div>

      <div style={styles.tableCard}>
        {loading && !refreshing ? (
          <div style={styles.loading}>Querying security log database...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Administrator</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Target Type</th>
                <th style={styles.th}>Target ID</th>
                <th style={styles.th}>Override Reason / Justification</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const dateStr = new Date(log.timestamp).toLocaleString([], {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                });

                return (
                  <tr key={log.id} style={styles.tr}>
                    <td style={{ ...styles.td, ...styles.timeCol }}>{dateStr}</td>
                    <td style={styles.td}>
                      <span style={styles.adminName}>{log.admin_name}</span>
                      <br />
                      <span style={styles.adminId}>ID: {log.admin_id.slice(0, 8)}...</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.actionTag}>{log.action}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.targetTypeTag}>{log.target_type}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.targetId}>{log.target_id || 'N/A'}</span>
                    </td>
                    <td style={{ ...styles.td, ...styles.reasonCol }}>{log.reason || 'N/A'}</td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={10} style={styles.emptyTd}>No audit records logged yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
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
  infoBox: {
    display: 'flex',
    backgroundColor: '#f0fdfa',
    border: '1px solid #ccfbf1',
    borderRadius: '8px',
    padding: '12px 16px',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: '13px',
    color: '#0f766e',
    lineHeight: '18px',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  },
  loading: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#6b7280',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontSize: '11px',
    fontWeight: 'bold',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    padding: '14px 20px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#4b5563',
  },
  timeCol: {
    whiteSpace: 'nowrap' as const,
    color: '#6b7280',
    fontWeight: 500,
  },
  adminName: {
    fontWeight: 'bold',
    color: '#111827',
  },
  adminId: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  actionTag: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  targetTypeTag: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  targetId: {
    fontFamily: 'monospace',
    color: '#475569',
    fontSize: '12px',
  },
  reasonCol: {
    maxWidth: '300px',
    wordWrap: 'break-word' as const,
    lineHeight: '18px',
  },
  emptyTd: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
};
