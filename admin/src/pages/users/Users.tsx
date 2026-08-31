import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Student, Shopkeeper, DeliveryPartner } from '../../types';
import { Search, UserMinus, UserCheck, RefreshCw, Star } from 'lucide-react';

export default function Users() {
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'SHOPKEEPERS' | 'DRIVERS'>('STUDENTS');
  const [searchQuery, setSearchQuery] = useState('');

  // Lists state
  const [students, setStudents] = useState<Student[]>([]);
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [drivers, setDrivers] = useState<DeliveryPartner[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Status Action overlay
  const [statusTarget, setStatusTarget] = useState<{ id: string, name: string, email: string, currentActive: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const loadUsersData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'STUDENTS') {
        const list = await adminService.getStudents();
        setStudents(list);
      } else if (activeTab === 'SHOPKEEPERS') {
        const list = await adminService.getShopkeepers();
        setShopkeepers(list);
      } else if (activeTab === 'DRIVERS') {
        const list = await adminService.getDeliveryPartners();
        setDrivers(list);
      }
    } catch (e) {
      console.error('Failed to fetch user accounts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsersData();
  }, [activeTab]);

  const handleToggleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await adminService.toggleUserStatus(statusTarget.id, !statusTarget.currentActive, statusReason);
      
      // Update local state
      const targetVal = !statusTarget.currentActive;
      if (activeTab === 'STUDENTS') {
        setStudents(students.map(s => s.id === statusTarget.id ? { ...s, is_active: targetVal } : s));
      } else if (activeTab === 'SHOPKEEPERS') {
        setShopkeepers(shopkeepers.map(s => s.id === statusTarget.id ? { ...s, is_active: targetVal } : s));
      } else if (activeTab === 'DRIVERS') {
        setDrivers(drivers.map(d => d.id === statusTarget.id ? { ...d, is_active: targetVal } : d));
      }
      
      setStatusTarget(null);
      setStatusReason('');
      alert('User login status successfully updated.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user login access.');
    }
  };

  const getFilteredData = () => {
    const q = searchQuery.toLowerCase();
    if (activeTab === 'STUDENTS') {
      return students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    } else if (activeTab === 'SHOPKEEPERS') {
      return shopkeepers.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q));
    } else {
      return drivers.filter(d => d.name.toLowerCase().includes(q) || d.email.toLowerCase().includes(q));
    }
  };

  const getRiderStatusColor = (status: string) => {
    switch (status) {
      case 'ONLINE': return '#10b981';
      case 'BUSY': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>User Accounts Portal</h2>
          <p style={styles.subtitle}>Audit access permissions, suspension flags, and rider duty states across roles</p>
        </div>
        <button onClick={loadUsersData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabsRow}>
        <div style={styles.tabGroup}>
          <button
            onClick={() => { setActiveTab('STUDENTS'); setSearchQuery(''); }}
            style={{ ...styles.tabBtn, ...(activeTab === 'STUDENTS' ? styles.tabBtnActive : {}) }}
          >
            Students
          </button>
          <button
            onClick={() => { setActiveTab('SHOPKEEPERS'); setSearchQuery(''); }}
            style={{ ...styles.tabBtn, ...(activeTab === 'SHOPKEEPERS' ? styles.tabBtnActive : {}) }}
          >
            Canteens Owners
          </button>
          <button
            onClick={() => { setActiveTab('DRIVERS'); setSearchQuery(''); }}
            style={{ ...styles.tabBtn, ...(activeTab === 'DRIVERS' ? styles.tabBtnActive : {}) }}
          >
            Delivery Partners
          </button>
        </div>

        <div style={styles.searchBar}>
          <Search size={16} color="#6b7280" />
          <input
            type="text"
            placeholder="Search by name/email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* List Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.tableLoading}>Syncing user database...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email Address</th>
                <th style={styles.th}>Contact Number</th>
                {activeTab === 'DRIVERS' && <th style={styles.th}>Vehicle Specifications</th>}
                {activeTab === 'DRIVERS' && <th style={styles.th}>Star Rating</th>}
                {activeTab === 'DRIVERS' && <th style={styles.th}>Availability</th>}
                <th style={styles.th}>Account Status</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredData().map((u: any) => (
                <tr key={u.id} style={styles.tr}>
                  <td style={styles.td}>
                    <span style={styles.boldText}>{u.name}</span>
                  </td>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.phone || 'N/A'}</td>
                  
                  {activeTab === 'DRIVERS' && (
                    <td style={styles.td}>
                      {u.vehicle_type} ({u.vehicle_number || 'N/A'})
                    </td>
                  )}
                  {activeTab === 'DRIVERS' && (
                    <td style={styles.td}>
                      <div style={styles.rating}>
                        <Star size={14} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ marginLeft: 4 }}>{Number(u.rating).toFixed(1)}</span>
                      </div>
                    </td>
                  )}
                  {activeTab === 'DRIVERS' && (
                    <td style={styles.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ ...styles.dot, backgroundColor: getRiderStatusColor(u.status) }} />
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: getRiderStatusColor(u.status) }}>
                          {u.status}
                        </span>
                      </div>
                    </td>
                  )}

                  <td style={styles.td}>
                    <span style={{
                      ...styles.statusText,
                      color: u.is_active ? '#10b981' : '#ef4444'
                    }}>
                      {u.is_active ? '🟢 Active' : '🔴 Suspended'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => setStatusTarget({ id: u.id, name: u.name, email: u.email, currentActive: u.is_active })}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: u.is_active ? '#fee2e2' : '#d1fae5',
                        color: u.is_active ? '#b91c1c' : '#065f46'
                      }}
                    >
                      {u.is_active ? (
                        <>
                          <UserMinus size={12} style={{ marginRight: 4 }} />
                          <span>Suspend</span>
                        </>
                      ) : (
                        <>
                          <UserCheck size={12} style={{ marginRight: 4 }} />
                          <span>Activate</span>
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
              {getFilteredData().length === 0 && (
                <tr>
                  <td colSpan={10} style={styles.emptyTd}>No accounts matched search parameters</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Account Suspension justification Dialog Overlay */}
      {statusTarget && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Account State Update</h3>
            </div>
            
            <form onSubmit={handleToggleStatusSubmit} style={styles.modalForm}>
              <p style={styles.modalText}>
                Are you sure you want to <strong>{statusTarget.currentActive ? 'SUSPEND' : 'ACTIVATE'}</strong> access for:
                <br />
                <strong>{statusTarget.name}</strong> ({statusTarget.email})?
              </p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Justification / Reason (Audited)</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Inappropriate rating reports / Repeated cancellation warnings / Cleared ID checks"
                  style={styles.formTextarea}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setStatusTarget(null)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Apply Action</button>
              </div>
            </form>
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
  tabsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tabGroup: {
    display: 'flex',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '4px',
    gap: '4px',
  },
  tabBtn: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    color: '#4b5563',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  tabBtnActive: {
    backgroundColor: '#1f2937',
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px',
    gap: '8px',
    width: '280px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    flex: 1,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  },
  tableLoading: {
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
  boldText: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  rating: {
    display: 'flex',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: '12px',
    fontWeight: 'bold',
  },
  toggleBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  emptyTd: {
    padding: '40px',
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  modalText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '20px',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#374151',
  },
  formTextarea: {
    padding: '10px 14px',
    fontSize: '13px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    outline: 'none',
    height: '80px',
    resize: 'none' as const,
    fontFamily: 'inherit',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#4b5563',
  },
  saveBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};
