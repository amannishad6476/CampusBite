import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Order, DeliveryPartner } from '../../types';
import { Search, Eye, ShieldAlert, RefreshCw, Bike, X, MapPin } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [riders, setRiders] = useState<DeliveryPartner[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Override Form modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('CANCELLED');
  const [overrideReason, setOverrideReason] = useState('');

  // Assign Rider modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRiderId, setSelectedRiderId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ordersData, ridersData] = await Promise.all([
        adminService.getOrders(),
        adminService.getDeliveryPartners().catch(() => [])
      ]);
      setOrders(ordersData);
      setRiders(ridersData);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectOrder = async (order: Order) => {
    try {
      const details = await adminService.getOrderById(order.id);
      setSelectedOrder(details);
    } catch (e) {
      setSelectedOrder(order);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || overrideReason.length < 5) {
      alert('Please enter a valid justification (minimum 5 characters).');
      return;
    }

    try {
      const updated = await adminService.overrideOrderStatus(selectedOrder.id, overrideStatus, overrideReason);
      setSelectedOrder(updated);
      setOrders(orders.map(o => o.id === updated.id ? updated : o));
      setShowOverrideModal(false);
      setOverrideReason('');
      alert('Order status successfully overridden by administrator.');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Override failed.');
    }
  };

  const handleAssignRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !selectedRiderId) return;

    setAssignLoading(true);
    try {
      const updated = await adminService.assignOrderRider(selectedOrder.id, selectedRiderId);
      setSelectedOrder(updated);
      setOrders(orders.map(o => o.id === updated.id ? updated : o));
      setShowAssignModal(false);
      setSelectedRiderId('');
      alert(`Rider successfully assigned to order ${updated.order_number}.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to assign rider to order.');
    } finally {
      setAssignLoading(false);
    }
  };

  const getRiderName = (riderId?: string | null) => {
    if (!riderId) return null;
    const r = riders.find(rider => rider.id === riderId);
    return r ? r.name : `Rider (${riderId.slice(0, 6)}...)`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED': return { bg: '#def7ec', text: '#03543f' };
      case 'CANCELLED': return { bg: '#fee2e2', text: '#991b1b' };
      case 'ASSIGNED':
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY': return { bg: '#e0e7ff', text: '#3730a3' };
      case 'PREPARING':
      case 'READY':
      case 'READY_FOR_PICKUP': return { bg: '#fef08a', text: '#713f12' };
      default: return { bg: '#e1effe', text: '#1e429f' };
    }
  };

  const filteredOrders = orders.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = o.order_number.toLowerCase().includes(q) ||
                          o.shop_name.toLowerCase().includes(q) ||
                          (o.student_id && o.student_id.toLowerCase().includes(q));
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Order Management & Dispatch</h2>
          <p style={styles.subtitle}>Audit active campus orders, assign delivery riders, and issue emergency overrides</p>
        </div>
        <button onClick={loadData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Orders</span>
        </button>
      </div>

      {/* Filter bar */}
      <div style={styles.filterCard}>
        <div style={styles.searchBar}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by order #, canteen name, or student ID..."
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
            <option value="ALL">All Order States</option>
            <option value="PLACED">PLACED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="PREPARING">PREPARING</option>
            <option value="READY">READY FOR PICKUP</option>
            <option value="ASSIGNED">ASSIGNED TO RIDER</option>
            <option value="PICKED_UP">PICKED UP</option>
            <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading orders stream...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Canteen</th>
                  <th style={styles.th}>Total Amount</th>
                  <th style={styles.th}>Payment Method</th>
                  <th style={styles.th}>Assigned Rider</th>
                  <th style={styles.th}>Order Status</th>
                  <th style={styles.th}>Created Time</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const badge = getStatusBadge(order.status);
                  const riderName = getRiderName(order.delivery_partner_id);
                  return (
                    <tr key={order.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#111827' }}>
                        {order.order_number}
                      </td>
                      <td style={styles.td}>{order.shop_name}</td>
                      <td style={{ ...styles.td, fontWeight: 700 }}>
                        ₹{Number(order.total_amount).toFixed(2)}
                      </td>
                      <td style={styles.td}>
                        <span style={styles.methodBadge}>{order.payment_method}</span>
                        <span style={{ fontSize: '11px', color: '#6b7280', marginLeft: '6px' }}>({order.payment_status})</span>
                      </td>
                      <td style={styles.td}>
                        {riderName ? (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Bike size={14} color="#06b6d4" style={{ marginRight: 6 }} />
                            <span style={{ fontWeight: 500, color: '#0e7490' }}>{riderName}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: badge.bg,
                          color: badge.text
                        }}>
                          {order.status}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                        {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleSelectOrder(order)}
                            style={styles.actionBtnPrimary}
                            title="View Full Order Details"
                          >
                            <Eye size={13} style={{ marginRight: 4 }} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setSelectedRiderId(order.delivery_partner_id || '');
                              setShowAssignModal(true);
                            }}
                            style={styles.actionBtnSecondary}
                            title="Assign Delivery Rider"
                          >
                            <Bike size={13} style={{ marginRight: 4 }} />
                            <span>Rider</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', padding: '36px', color: '#9ca3af' }}>
                      No orders found matching the filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && !showAssignModal && !showOverrideModal && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '650px', width: '92%' }}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Order {selectedOrder.order_number}</h3>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>
                  Shop: {selectedOrder.shop_name} | OTP: <strong>{selectedOrder.otp}</strong>
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.detailGrid}>
              <div style={styles.detailBox}>
                <span style={styles.detailBoxLabel}>Status</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{selectedOrder.status}</span>
              </div>
              <div style={styles.detailBox}>
                <span style={styles.detailBoxLabel}>Total Amount</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
              <div style={styles.detailBox}>
                <span style={styles.detailBoxLabel}>Payment</span>
                <span style={{ fontWeight: 600 }}>{selectedOrder.payment_method} ({selectedOrder.payment_status})</span>
              </div>
              <div style={styles.detailBox}>
                <span style={styles.detailBoxLabel}>Rider</span>
                <span style={{ fontWeight: 600 }}>{getRiderName(selectedOrder.delivery_partner_id) || 'Unassigned'}</span>
              </div>
            </div>

            {/* Delivery Address */}
            <div style={{ margin: '16px 0', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                <MapPin size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <strong style={{ fontSize: '13px' }}>Delivery Destination:</strong>
              </div>
              <div style={{ fontSize: '14px', color: '#374151' }}>
                {selectedOrder.delivery_address?.campus_name}
                {selectedOrder.delivery_address?.hostel_name && ` — Hostel: ${selectedOrder.delivery_address.hostel_name}`}
                {selectedOrder.delivery_address?.room_number && `, Room: ${selectedOrder.delivery_address.room_number}`}
                {selectedOrder.delivery_address?.phone && ` (Phone: ${selectedOrder.delivery_address.phone})`}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                onClick={() => setShowOverrideModal(true)}
                style={styles.overrideBtn}
              >
                <ShieldAlert size={14} style={{ marginRight: 6 }} />
                <span>Admin Status Override</span>
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAssignModal(true)}
                  style={styles.assignBtn}
                >
                  <Bike size={14} style={{ marginRight: 6 }} />
                  <span>Assign / Reassign Rider</span>
                </button>
                <button
                  onClick={() => setSelectedOrder(null)}
                  style={styles.closeModalBtn}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Rider Modal */}
      {showAssignModal && selectedOrder && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Bike size={20} color="#06b6d4" style={{ marginRight: 8 }} />
                <h3 style={styles.modalTitle}>Assign Rider to {selectedOrder.order_number}</h3>
              </div>
              <button onClick={() => setShowAssignModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAssignRider}>
              <div style={{ marginBottom: '16px' }}>
                <label style={styles.modalLabel}>Select Available Delivery Rider:</label>
                <select
                  value={selectedRiderId}
                  onChange={(e) => setSelectedRiderId(e.target.value)}
                  required
                  style={styles.modalSelect}
                >
                  <option value="">-- Choose Rider --</option>
                  {riders.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.vehicle_type}) — Status: {r.status}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || !selectedRiderId}
                  style={{ ...styles.confirmBtn, backgroundColor: '#06b6d4' }}
                >
                  {assignLoading ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Status Override Modal */}
      {showOverrideModal && selectedOrder && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <ShieldAlert size={20} color="#dc2626" style={{ marginRight: 8 }} />
                <h3 style={styles.modalTitle}>Emergency Status Override</h3>
              </div>
              <button onClick={() => setShowOverrideModal(false)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 16px 0' }}>
              Override current status (<strong>{selectedOrder.status}</strong>) for order {selectedOrder.order_number}. This will be permanently recorded in the system audit logs.
            </p>

            <form onSubmit={handleOverrideSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={styles.modalLabel}>Target Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="CANCELLED">CANCELLED (Refund/Abort)</option>
                  <option value="DELIVERED">DELIVERED (Force Complete)</option>
                  <option value="READY">READY (Ready for Pickup)</option>
                  <option value="PREPARING">PREPARING (In Kitchen)</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={styles.modalLabel}>Mandatory Reason / Justification</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Provide complete explanation for this manual intervention (min 5 chars)..."
                  required
                  rows={3}
                  style={styles.modalTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ ...styles.confirmBtn, backgroundColor: '#dc2626' }}
                >
                  Force Status Override
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
  statusBadge: {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  methodBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    backgroundColor: '#f3f4f6',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#4b5563',
  },
  actionBtnPrimary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    color: '#0891b2',
    border: '1px solid #a5f3fc',
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
    maxWidth: '500px',
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
  detailGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
  },
  detailBox: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  detailBoxLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    fontWeight: '600',
  },
  overrideBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  assignBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#06b6d4',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  closeModalBtn: {
    padding: '8px 14px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  modalLabel: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  modalSelect: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    backgroundColor: '#ffffff',
  },
  modalTextarea: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    boxSizing: 'border-box' as const,
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
  confirmBtn: {
    padding: '9px 18px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
