import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Eye,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { Order } from '../../types';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Detail Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await shopkeeperService.getOrders(activeTab);
      setOrders(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch canteen orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // 15s poll
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setIsUpdating(true);
    try {
      const updated = await shopkeeperService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Could not update order status');
    } finally {
      setIsUpdating(false);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'All Orders' },
    { key: 'PENDING', label: 'Pending' },
    { key: 'ACCEPTED', label: 'Accepted' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'READY_FOR_PICKUP', label: 'Ready' },
    { key: 'DELIVERED', label: 'Delivered' },
    { key: 'CANCELLED', label: 'Cancelled' },
  ];

  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase();
    const matchNum = o.order_number.toLowerCase().includes(q);
    const matchStudent = o.student_name ? o.student_name.toLowerCase().includes(q) : false;
    const matchPhone = o.delivery_address?.phone ? o.delivery_address.phone.includes(q) : false;
    return matchNum || matchStudent || matchPhone;
  });

  return (
    <div style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Canteen Orders</h1>
          <p style={styles.subtitle}>Process live student food orders through the preparation workflow</p>
        </div>
        <button onClick={fetchOrders} style={styles.refreshBtn}>
          <RefreshCw size={15} style={{ marginRight: 6 }} />
          <span>Refresh Orders</span>
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs Row */}
      <div style={styles.tabsContainer}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              ...styles.tabBtn,
              backgroundColor: activeTab === t.key ? '#ea580c' : '#ffffff',
              color: activeTab === t.key ? '#ffffff' : '#4b5563',
              borderColor: activeTab === t.key ? '#ea580c' : '#e5e7eb',
              fontWeight: activeTab === t.key ? 700 : 500,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search Input */}
      <div style={styles.searchRow}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by order #, student name, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Fetching orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={styles.emptyCard}>
          <ShoppingBag size={44} color="#9ca3af" />
          <p style={styles.emptyTitle}>No orders found</p>
          <p style={styles.emptyText}>
            {activeTab !== 'ALL'
              ? `No orders currently in "${activeTab.replace('_', ' ')}" state.`
              : 'When students place orders at your canteen, they will be listed here in real-time.'}
          </p>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Order #</th>
                <th style={styles.th}>Customer</th>
                <th style={styles.th}>Destination</th>
                <th style={styles.th}>Items</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.thRight}>Workflow Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.tdBold}>
                    #{order.order_number}
                    <div style={styles.orderTime}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.studentName}>{order.student_name || 'Student'}</div>
                    <div style={styles.phoneSmall}>{order.delivery_address?.phone || ''}</div>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.destText}>
                      {[
                        order.delivery_address?.hostel_name || order.delivery_address?.block_name,
                        order.delivery_address?.room_number ? `Rm ${order.delivery_address.room_number}` : ''
                      ].filter(Boolean).join(', ') || 'Campus Area'}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.itemCountBadge}>
                      {order.items?.length || 0} items
                    </span>
                  </td>
                  <td style={styles.tdBold}>
                    ₹{Number(order.total_amount).toFixed(2)}
                    <div style={styles.paySub}>
                      {order.payment_method} • {order.payment_status}
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={getStatusBadgeStyle(order.status)}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td style={styles.tdRight}>
                    <div style={styles.actionsGroup}>
                      {order.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ACCEPTED')}
                            disabled={isUpdating}
                            style={styles.btnAccept}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                            disabled={isUpdating}
                            style={styles.btnCancel}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {order.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                          disabled={isUpdating}
                          style={styles.btnPrepare}
                        >
                          Start Cooking
                        </button>
                      )}
                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                          disabled={isUpdating}
                          style={styles.btnReady}
                        >
                          Mark Ready
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        style={styles.btnDetail}
                        title="View Full Order"
                      >
                        <Eye size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Order #{selectedOrder.order_number}</h3>
                <span style={getStatusBadgeStyle(selectedOrder.status)}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Student & Delivery Contact */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Delivery Details</h4>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Student Name:</span>
                  <span style={styles.infoValue}>{selectedOrder.student_name || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Contact Number:</span>
                  <span style={styles.infoValue}>{selectedOrder.delivery_address?.phone || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Full Delivery Address:</span>
                  <span style={styles.infoValue}>
                    {[
                      selectedOrder.delivery_address?.campus_name,
                      selectedOrder.delivery_address?.college_name,
                      selectedOrder.delivery_address?.block_name,
                      selectedOrder.delivery_address?.hostel_name,
                      selectedOrder.delivery_address?.room_number ? `Room ${selectedOrder.delivery_address.room_number}` : ''
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Items Ordered</h4>
                <div style={styles.itemsList}>
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <div>
                        <div style={styles.itemName}>{it.name}</div>
                        {it.notes && <div style={styles.itemNote}>Note: {it.notes}</div>}
                      </div>
                      <div style={styles.itemAmount}>
                        {it.quantity} × ₹{Number(it.price).toFixed(2)} = ₹{(it.quantity * Number(it.price)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Details */}
              <div style={styles.modalSection}>
                <div style={styles.billRow}>
                  <span>Subtotal:</span>
                  <span>₹{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div style={styles.billRow}>
                  <span>Delivery Fee:</span>
                  <span>₹{Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                </div>
                <div style={styles.billRow}>
                  <span>Tax:</span>
                  <span>₹{Number(selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Total Bill Amount:</span>
                  <span>₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={styles.modalFooter}>
              {selectedOrder.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'ACCEPTED')}
                    disabled={isUpdating}
                    style={styles.btnAccept}
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    disabled={isUpdating}
                    style={styles.btnCancel}
                  >
                    Reject Order
                  </button>
                </>
              )}
              {selectedOrder.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  disabled={isUpdating}
                  style={styles.btnPrepare}
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                  disabled={isUpdating}
                  style={styles.btnReady}
                >
                  Mark Ready for Pickup
                </button>
              )}
              <button onClick={() => setSelectedOrder(null)} style={styles.btnSecondary}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStatusBadgeStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'PENDING':
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#fff7ed',
        color: '#c2410c',
        border: '1px solid #ffedd5',
      };
    case 'ACCEPTED':
    case 'PREPARING':
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#eff6ff',
        color: '#1d4ed8',
        border: '1px solid #dbeafe',
      };
    case 'READY_FOR_PICKUP':
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#f0fdf4',
        color: '#15803d',
        border: '1px solid #bbf7d0',
      };
    case 'DELIVERED':
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#ecfdf5',
        color: '#065f46',
        border: '1px solid #a7f3d0',
      };
    case 'CANCELLED':
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 700,
        backgroundColor: '#fef2f2',
        color: '#b91c1c',
        border: '1px solid #fecaca',
      };
    default:
      return {
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: '#f3f4f6',
        color: '#4b5563',
      };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40vh',
  },
  spinner: {
    width: '36px',
    height: '36px',
    border: '3px solid #e5e7eb',
    borderTop: '3px solid #ea580c',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#6b7280',
  },
  pageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#111827',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginTop: '4px',
  },
  refreshBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    cursor: 'pointer',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    padding: '12px 16px',
    borderRadius: '8px',
    color: '#b91c1c',
    fontSize: '13px',
    marginBottom: '16px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  tabBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  searchRow: {
    marginBottom: '20px',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 14px 10px 38px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
  },
  thRow: {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  },
  th: {
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thRight: {
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '14px 20px',
    fontSize: '13px',
    color: '#374151',
  },
  tdBold: {
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#111827',
  },
  tdRight: {
    padding: '14px 20px',
    textAlign: 'right',
  },
  orderTime: {
    fontSize: '11px',
    color: '#9ca3af',
    fontWeight: 400,
  },
  studentName: {
    fontWeight: 600,
    color: '#111827',
  },
  phoneSmall: {
    fontSize: '11px',
    color: '#6b7280',
  },
  destText: {
    fontSize: '12px',
    color: '#4b5563',
    maxWidth: '200px',
  },
  itemCountBadge: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  paySub: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: 400,
  },
  actionsGroup: {
    display: 'inline-flex',
    gap: '6px',
  },
  btnAccept: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnCancel: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnPrepare: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnReady: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  btnDetail: {
    padding: '6px 8px',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    color: '#4b5563',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondary: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    color: '#374151',
    cursor: 'pointer',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '48px 24px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    marginTop: '12px',
  },
  emptyText: {
    fontSize: '13px',
    color: '#6b7280',
    maxWidth: '360px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111827',
    margin: '0 0 6px 0',
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  modalSection: {
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '16px',
  },
  modalSectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#4b5563',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '10px',
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    marginBottom: '6px',
  },
  infoLabel: {
    color: '#6b7280',
  },
  infoValue: {
    fontWeight: 600,
    color: '#111827',
    textAlign: 'right',
  },
  itemsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  itemName: {
    fontWeight: 600,
    color: '#111827',
  },
  itemNote: {
    fontSize: '11px',
    color: '#ea580c',
    fontStyle: 'italic',
  },
  itemAmount: {
    fontWeight: 600,
    color: '#374151',
  },
  billRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '6px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '15px',
    fontWeight: 800,
    color: '#111827',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '6px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '16px 24px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
  },
};
