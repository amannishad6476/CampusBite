import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { DeliveryPartner } from '../../types';
import { Search, Plus, UserCheck, UserMinus, RefreshCw, Bike, Star, X } from 'lucide-react';

export default function Riders() {
  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add Rider Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addPhone, setAddPhone] = useState('');
  const [addPassword, setAddPassword] = useState('');
  const [addVehicleType, setAddVehicleType] = useState('BIKE');
  const [addVehicleNumber, setAddVehicleNumber] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Status Toggle Modal
  const [statusTarget, setStatusTarget] = useState<{ id: string; name: string; currentActive: boolean } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const riderList = await adminService.getDeliveryPartners();
      setRiders(riderList);
    } catch (err: any) {
      console.error('Failed to load delivery riders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName || !addEmail || !addPhone || addPassword.length < 6) {
      setAddError('Please fill all fields. Password must be at least 6 characters.');
      return;
    }
    setAddLoading(true);
    setAddError(null);

    try {
      const created = await adminService.createDeliveryPartner({
        name: addName.trim(),
        email: addEmail.trim(),
        phone: addPhone.trim(),
        password: addPassword,
        vehicle_type: addVehicleType,
        vehicle_number: addVehicleNumber.trim() || undefined
      });

      setRiders([created, ...riders]);
      setShowAddModal(false);
      setAddName('');
      setAddEmail('');
      setAddPhone('');
      setAddPassword('');
      setAddVehicleNumber('');
    } catch (err: any) {
      setAddError(err.response?.data?.detail || 'Failed to onboard delivery rider.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      await adminService.toggleUserStatus(statusTarget.id, !statusTarget.currentActive, statusReason);
      setRiders(riders.map(r => r.id === statusTarget.id ? { ...r, is_active: !statusTarget.currentActive } : r));
      setStatusTarget(null);
      setStatusReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update rider access.');
    }
  };

  const getDutyBadge = (status: string) => {
    switch (status) {
      case 'ONLINE':
        return { bg: '#def7ec', text: '#03543f', label: '🟢 Online Ready' };
      case 'BUSY':
        return { bg: '#fef08a', text: '#713f12', label: '🟡 Busy (Delivering)' };
      default:
        return { bg: '#f3f4f6', text: '#6b7280', label: '⚪ Offline' };
    }
  };

  const filteredRiders = riders.filter(r => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.phone.includes(q) || (r.vehicle_number && r.vehicle_number.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Delivery Fleet Management</h2>
          <p style={styles.subtitle}>Track delivery riders, active campus deliveries, live duty states, and performance ratings</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setShowAddModal(true)} style={styles.addBtn}>
            <Plus size={16} style={{ marginRight: 6 }} />
            <span>Onboard Rider</span>
          </button>
          <button onClick={loadData} style={styles.refreshBtn}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            <span>Refresh Fleet</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div style={styles.filterCard}>
        <div style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search riders by name, email, phone, or vehicle number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterGroup}>
          <label style={styles.filterLabel}>Duty State</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.select}
          >
            <option value="ALL">All States</option>
            <option value="ONLINE">Online Ready</option>
            <option value="BUSY">Busy on Order</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Fleet Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading delivery riders fleet...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Rider Name</th>
                  <th style={styles.th}>Contact Phone</th>
                  <th style={styles.th}>Vehicle Details</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Duty Status</th>
                  <th style={styles.th}>Account Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRiders.map(rider => {
                  const duty = getDutyBadge(rider.status);
                  return (
                    <tr key={rider.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Bike size={16} color="#06b6d4" style={{ marginRight: 8 }} />
                          <div>
                            <div>{rider.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>{rider.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>{rider.phone}</td>
                      <td style={styles.td}>
                        <span style={styles.vehicleBadge}>{rider.vehicle_type}</span>
                        {rider.vehicle_number && (
                          <div style={{ fontSize: '12px', color: '#4b5563', marginTop: '2px' }}>{rider.vehicle_number}</div>
                        )}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 4 }} />
                          <span style={{ fontWeight: 600 }}>{Number(rider.rating).toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: duty.bg,
                          color: duty.text,
                        }}>
                          {duty.label}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: rider.is_active ? '#def7ec' : '#fde8e8',
                          color: rider.is_active ? '#03543f' : '#9b1c1c'
                        }}>
                          {rider.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <button
                          onClick={() => setStatusTarget({
                            id: rider.id,
                            name: rider.name,
                            currentActive: rider.is_active
                          })}
                          style={{
                            ...styles.actionBtn,
                            backgroundColor: rider.is_active ? '#fee2e2' : '#def7ec',
                            color: rider.is_active ? '#b91c1c' : '#03543f'
                          }}
                        >
                          {rider.is_active ? (
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
                {filteredRiders.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      No riders found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Rider Modal */}
      {showAddModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Onboard Delivery Rider</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {addError && <div style={styles.modalError}>{addError}</div>}

            <form onSubmit={handleAddRider}>
              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Rider Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amit Verma"
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
                  placeholder="e.g. amit.rider@bbd.ac.in"
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

              <div style={styles.twoInputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Vehicle Type</label>
                  <select
                    value={addVehicleType}
                    onChange={(e) => setAddVehicleType(e.target.value)}
                    style={styles.modalSelect}
                  >
                    <option value="BIKE">Motorcycle / Bike</option>
                    <option value="SCOOTER">Scooter / Activa</option>
                    <option value="EV_BIKE">Electric Bike / EV</option>
                    <option value="CYCLE">Bicycle</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Vehicle Plate #</label>
                  <input
                    type="text"
                    placeholder="e.g. UP-32-AB-1234"
                    value={addVehicleNumber}
                    onChange={(e) => setAddVehicleNumber(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
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
                  {addLoading ? 'Onboarding...' : 'Onboard Rider'}
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
                {statusTarget.currentActive ? 'Suspend Rider' : 'Activate Rider'}
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
    backgroundColor: '#06b6d4',
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
  vehicleBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#ecfeff',
    color: '#0891b2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
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
  twoInputRow: {
    display: 'flex',
    gap: '12px',
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
  modalSelect: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#06b6d4',
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
