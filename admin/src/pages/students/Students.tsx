import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Student, Order, Campus } from '../../types';
import { Search, UserCheck, UserMinus, RefreshCw, ShoppingBag, X } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');

  // Status Modal
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; email: string; currentActive: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Order History Modal
  const [historyTarget, setHistoryTarget] = useState<{ id: string; name: string } | null>(null);
  const [historyOrders, setHistoryOrders] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentList, campusList] = await Promise.all([
        adminService.getStudents(),
        adminService.getCampuses().catch(() => [])
      ]);
      setStudents(studentList);
      setCampuses(campusList);
    } catch (err: any) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await adminService.toggleUserStatus(statusTarget.id, !statusTarget.currentActive, statusReason);
      setStudents(students.map(s => s.id === statusTarget.id ? { ...s, is_active: !statusTarget.currentActive } : s));
      setStatusTarget(null);
      setStatusReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update student login access.');
    }
  };

  const handleViewOrders = async (student: Student) => {
    setHistoryTarget({ id: student.id, name: student.name });
    setHistoryLoading(true);
    try {
      const orders = await adminService.getStudentOrders(student.id);
      setHistoryOrders(orders);
    } catch (err) {
      setHistoryOrders([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredStudents = students.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.phone.includes(q);
    const matchesCampus = campusFilter === 'ALL' || s.campus_id === Number(campusFilter);
    return matchesSearch && matchesCampus;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Student Management</h2>
          <p style={styles.subtitle}>Audit registered student customer accounts, order history, and security access</p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Refresh Students</span>
        </button>
      </div>

      {/* Filter Controls */}
      <div style={styles.filterCard}>
        <div style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search students by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Campus</label>
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All Campuses</option>
            {campuses.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading registered students...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Student Name</th>
                  <th style={styles.th}>Contact Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Campus ID</th>
                  <th style={styles.th}>Account Status</th>
                  <th style={styles.th}>Joined Date</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>{student.name}</td>
                    <td style={styles.td}>{student.email}</td>
                    <td style={styles.td}>{student.phone}</td>
                    <td style={styles.td}>Campus #{student.campus_id}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: student.is_active ? '#def7ec' : '#fde8e8',
                        color: student.is_active ? '#03543f' : '#9b1c1c'
                      }}>
                        {student.is_active ? 'Active' : 'Suspended'}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                      {new Date(student.created_at).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleViewOrders(student)}
                          style={styles.historyBtn}
                          title="View Order History"
                        >
                          <ShoppingBag size={14} style={{ marginRight: 4 }} />
                          <span>Orders</span>
                        </button>

                        <button
                          onClick={() => setStatusTarget({
                            id: student.id,
                            name: student.name,
                            email: student.email,
                            currentActive: student.is_active
                          })}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: student.is_active ? '#fee2e2' : '#def7ec',
                            color: student.is_active ? '#b91c1c' : '#03543f'
                          }}
                        >
                          {student.is_active ? (
                            <>
                              <UserMinus size={14} style={{ marginRight: 4 }} />
                              <span>Suspend</span>
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} style={{ marginRight: 4 }} />
                              <span>Activate</span>
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      No students matching your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Status Toggle Modal */}
      {statusTarget && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {statusTarget.currentActive ? 'Suspend Student Access' : 'Reactivate Student Access'}
              </h3>
              <button onClick={() => setStatusTarget(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
              Are you sure you want to {statusTarget.currentActive ? 'suspend' : 'activate'} login access for{' '}
              <strong>{statusTarget.name}</strong> ({statusTarget.email})?
            </p>
            <form onSubmit={handleToggleStatus}>
              <label style={styles.modalLabel}>Action Justification / Reason</label>
              <textarea
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Reason for changing status (logged to immutable audit trail)..."
                required
                rows={3}
                style={styles.modalTextarea}
              />
              <div style={styles.modalActions}>
                <button type="button" onClick={() => setStatusTarget(null)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    ...styles.confirmBtn,
                    backgroundColor: statusTarget.currentActive ? '#dc2626' : '#10b981'
                  }}
                >
                  Confirm Status Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order History Modal */}
      {historyTarget && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '750px', width: '90%' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingBag size={20} color="#3b82f6" style={{ marginRight: 8 }} />
                <h3 style={styles.modalTitle}>Order History — {historyTarget.name}</h3>
              </div>
              <button onClick={() => setHistoryTarget(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {historyLoading ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                Fetching past orders...
              </div>
            ) : historyOrders.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>
                No past orders placed by this student yet.
              </div>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order #</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Payment</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyOrders.map(order => (
                      <tr key={order.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{order.order_number}</td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>₹{Number(order.total_amount).toFixed(2)}</td>
                        <td style={styles.td}>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>{order.payment_method} ({order.payment_status})</span>
                        </td>
                        <td style={styles.td}>
                          <span style={styles.statusBadge}>{order.status}</span>
                        </td>
                        <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                          {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
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
    minWidth: '280px',
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
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  historyBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  centerLoading: {
    padding: '48px',
    textAlign: 'center' as const,
    color: '#6b7280',
    fontSize: '15px',
  },
  modalBackdrop: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '480px',
    width: '95%',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
  },
  modalLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    marginBottom: '16px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '8px 16px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
