import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Shopkeeper, Shop } from '../../types';
import { Search, Plus, UserCheck, UserMinus, RefreshCw, Store, X } from 'lucide-react';

export default function Shopkeepers() {
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Shopkeeper Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Status Toggle Modal
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; currentActive: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [skList, shopList] = await Promise.all([
        adminService.getShopkeepers(),
        adminService.getShops().catch(() => [])
      ]);
      setShopkeepers(skList);
      setShops(shopList);
    } catch (err: any) {
      console.error('Failed to load shopkeepers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddShopkeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail || !addPhone || addPassword.length < 6) {
      setAddError('Please fill all fields. Password must be at least 6 characters.');
      return;
    }
    setAddLoading(true);
    setAddError(null);

    try {
      const created = await adminService.createShopkeeper({
        name: addName.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim(),
        password: addPassword
      });

      setShopkeepers([created, ...shopkeepers]);
      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddPassword('');
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to create shopkeeper account.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await adminService.toggleUserStatus(statusTarget.id, !statusTarget.currentActive, statusReason);
      setShopkeepers(shopkeepers.map(s => s.id === statusTarget.id ? { ...s, is_active: !statusTarget.currentActive } : s));
      setStatusTarget(null);
      setStatusReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update shopkeeper account status.');
    }
  };

  const getAssignedShop = (shopkeeperId: string) => {
    return shops.find(s => s.shopkeeper_id === shopkeeperId);
  };

  const filteredShopkeepers = shopkeepers.filter(sk => {
    const q = searchQuery.toLowerCase();
    const assignedShop = getAssignedShop(sk.id);
    const shopName = assignedShop ? assignedShop.name.toLowerCase() : '';
    return sk.name.toLowerCase().includes(q) || sk.email.toLowerCase().includes(q) || sk.phone.includes(q) || shopName.includes(q);
  });

  return (
    <div style={styles.container}>
      {/* Header & Add Button */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Shopkeeper Management</h2>
          <p style={styles.subtitle}>Onboard canteen partners, manage vendor credentials, and monitor merchant performance</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            <Plus size={16} style={{ marginRight: 6 }} />
            <span>Add Shopkeeper</span>
          </button>
          <button onClick={loadData} style={styles.refreshBtn}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search shopkeepers by name, email, phone, or canteen name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Table Card */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading registered shopkeepers...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Vendor Name</th>
                  <th style={styles.th}>Contact Email</th>
                  <th style={styles.th}>Phone Number</th>
                  <th style={styles.th}>Assigned Canteen</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Registered</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredShopkeepers.map(sk => {
                  const assignedShop = getAssignedShop(sk.id);
                  return (
                    <tr key={sk.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>{sk.name}</td>
                      <td style={styles.td}>{sk.email}</td>
                      <td style={styles.td}>{sk.phone}</td>
                      <td style={styles.td}>
                        {assignedShop ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Store size={14} color="#10b981" style={{ marginRight: 6 }} />
                            <span style={{ fontWeight: 600, color: '#047857' }}>{assignedShop.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: sk.is_active ? '#def7ec' : '#fde8e8',
                          color: sk.is_active ? '#03543f' : '#9b1c1c'
                        }}>
                          {sk.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                        {new Date(sk.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setStatusTarget({
                            id: sk.id,
                            name: sk.name,
                            currentActive: sk.is_active
                          })}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: sk.is_active ? '#fee2e2' : '#def7ec',
                            color: sk.is_active ? '#b91c1c' : '#03543f'
                          }}
                        >
                          {sk.is_active ? (
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
                      </td>
                    </tr>
                  );
                })}
                {filteredShopkeepers.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      No shopkeepers found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Shopkeeper Modal */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Onboard New Shopkeeper</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {addError && (
              <div style={styles.modalError}>{addError}</div>
            )}

            <form onSubmit={handleAddShopkeeper}>
              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Full Legal / Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  required
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. ramesh.vendor@bbd.ac.in"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  required
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +919876543210"
                  value={addPhone}
                  onChange={(e) => setAddPhone(e.target.value)}
                  required
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Initial Security Password</label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={addPassword}
                  onChange={(e) => setAddPassword(e.target.value)}
                  required
                  minLength={6}
                  style={styles.modalInput}
                />
                <span style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                  Passwords are encrypted with bcrypt server-side and never stored in plain text.
                </span>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={addLoading}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={styles.submitBtn}
                >
                  {addLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {statusTarget && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {statusTarget.currentActive ? 'Suspend Shopkeeper' : 'Activate Shopkeeper'}
              </h3>
              <button onClick={() => setStatusTarget(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 16px 0' }}>
              Confirm changing status for <strong>{statusTarget.name}</strong>:
            </p>
            <form onSubmit={handleToggleStatus}>
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
                  Confirm Change
                </button>
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
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
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
  },
  searchBar: {
    flex: 1,
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
  modalError: {
    padding: '10px',
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '6px',
    fontSize: '13px',
    marginBottom: '14px',
  },
  formGroup: {
    marginBottom: '14px',
  },
  modalLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  modalInput: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
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
    marginTop: '20px',
  },
  cancelBtn: {
    padding: '9px 16px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '9px 18px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  confirmBtn: {
    padding: '9px 16px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
