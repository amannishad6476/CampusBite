import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  DollarSign,
  ShoppingBag,
  Clock,
  AlertCircle,
  TrendingUp,
  ChefHat,
  PackageCheck,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { Shop, Order, EarningSummary } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [shop, setShop] = useState<Shop | null>(null);
  const [earnings, setEarnings] = useState<EarningSummary | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Order Details
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState<boolean>(false);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [shopData, earningsData, ordersData] = await Promise.all([
        shopkeeperService.getMyShop(),
        shopkeeperService.getEarnings(),
        shopkeeperService.getOrders()
      ]);
      setShop(shopData);
      setEarnings(earningsData);
      setOrders(ordersData);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 20000); // 20s live polling
    return () => clearInterval(interval);
  }, []);

  // Compute Order Pipeline counts
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING' || o.status === 'ACCEPTED');
  const readyOrders = orders.filter((o) => o.status === 'READY_FOR_PICKUP');
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    setIsUpdatingOrder(true);
    try {
      const updated = await shopkeeperService.updateOrderStatus(orderId, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      if (selectedOrder && selectedOrder.id === updated.id) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || 'Could not update order status');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  if (isLoading && !shop) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Loading Canteen Overview...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Title & Canteen Identity */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Canteen Operations Dashboard</h1>
          <p style={styles.subtitle}>
            Live order processing and revenue summary for{' '}
            <strong style={{ color: '#ea580c' }}>{shop?.name || 'Your Canteen'}</strong>
          </p>
        </div>
        <button onClick={() => navigate('/orders')} style={styles.viewOrdersBtn}>
          <span>View All Orders</span>
          <ChevronRight size={16} />
        </button>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Today's Sales</span>
            <div style={{ ...styles.iconBadge, backgroundColor: '#ecfdf5' }}>
              <DollarSign size={20} color="#059669" />
            </div>
          </div>
          <div style={styles.metricValue}>₹{Number(earnings?.today_earnings || 0).toFixed(2)}</div>
          <div style={styles.metricSub}>
            <TrendingUp size={14} color="#059669" style={{ marginRight: 4 }} />
            <span>Net revenue for today</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Total Delivered</span>
            <div style={{ ...styles.iconBadge, backgroundColor: '#eff6ff' }}>
              <ShoppingBag size={20} color="#2563eb" />
            </div>
          </div>
          <div style={styles.metricValue}>{earnings?.total_orders || deliveredOrders.length}</div>
          <div style={styles.metricSub}>
            <span>Completed deliveries to date</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Platform Commission</span>
            <div style={{ ...styles.iconBadge, backgroundColor: '#fef3c7' }}>
              <TrendingUp size={20} color="#d97706" />
            </div>
          </div>
          <div style={styles.metricValue}>₹{Number(earnings?.commission_deducted || 0).toFixed(2)}</div>
          <div style={styles.metricSub}>
            <span>Deducted automatically</span>
          </div>
        </div>

        <div style={styles.metricCard}>
          <div style={styles.metricHeader}>
            <span style={styles.metricLabel}>Canteen Status</span>
            <div style={{ ...styles.iconBadge, backgroundColor: shop?.is_open ? '#ecfdf5' : '#fef2f2' }}>
              <Store size={20} color={shop?.is_open ? '#059669' : '#dc2626'} />
            </div>
          </div>
          <div style={{ ...styles.metricValue, color: shop?.is_open ? '#059669' : '#dc2626' }}>
            {shop?.is_open ? 'Accepting Orders' : 'Store Closed'}
          </div>
          <div style={styles.metricSub}>
            <span>Hours: {shop?.opening_time || '08:00'} - {shop?.closing_time || '20:00'}</span>
          </div>
        </div>
      </div>

      {/* Active Pipeline Status Row */}
      <h2 style={styles.sectionTitle}>Active Order Pipeline</h2>
      <div style={styles.pipelineGrid}>
        <div style={{ ...styles.pipelineCard, borderColor: '#fed7aa', backgroundColor: '#fffaf5' }}>
          <div style={styles.pipelineHeader}>
            <div style={{ ...styles.pipelineIcon, backgroundColor: '#ea580c' }}>
              <Clock size={18} color="#ffffff" />
            </div>
            <div>
              <span style={styles.pipelineTitle}>Pending Orders</span>
              <div style={styles.pipelineDesc}>Requires canteen confirmation</div>
            </div>
          </div>
          <div style={{ ...styles.pipelineCount, color: '#c2410c' }}>{pendingOrders.length}</div>
        </div>

        <div style={{ ...styles.pipelineCard, borderColor: '#bfdbfe', backgroundColor: '#f8faff' }}>
          <div style={styles.pipelineHeader}>
            <div style={{ ...styles.pipelineIcon, backgroundColor: '#2563eb' }}>
              <ChefHat size={18} color="#ffffff" />
            </div>
            <div>
              <span style={styles.pipelineTitle}>In Preparation</span>
              <div style={styles.pipelineDesc}>Currently cooking / packing</div>
            </div>
          </div>
          <div style={{ ...styles.pipelineCount, color: '#1d4ed8' }}>{preparingOrders.length}</div>
        </div>

        <div style={{ ...styles.pipelineCard, borderColor: '#bbf7d0', backgroundColor: '#f6fef9' }}>
          <div style={styles.pipelineHeader}>
            <div style={{ ...styles.pipelineIcon, backgroundColor: '#16a34a' }}>
              <PackageCheck size={18} color="#ffffff" />
            </div>
            <div>
              <span style={styles.pipelineTitle}>Ready for Pickup</span>
              <div style={styles.pipelineDesc}>Waiting for delivery rider</div>
            </div>
          </div>
          <div style={{ ...styles.pipelineCount, color: '#15803d' }}>{readyOrders.length}</div>
        </div>
      </div>

      {/* Live / Recent Orders Section */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <div>
            <h3 style={styles.tableTitle}>Recent Canteen Orders</h3>
            <p style={styles.tableSubtitle}>Incoming orders placed by students at your canteen</p>
          </div>
          <button onClick={loadDashboardData} style={styles.refreshBtn}>
            Refresh Live
          </button>
        </div>

        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            <ShoppingBag size={40} color="#9ca3af" />
            <p style={styles.emptyTitle}>No orders placed yet</p>
            <p style={styles.emptyText}>When students order from your canteen, they will appear here instantly.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Order #</th>
                  <th style={styles.th}>Student</th>
                  <th style={styles.th}>Items</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Payment</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.thRight}>Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((order) => (
                  <tr key={order.id} style={styles.tr}>
                    <td style={styles.tdBold}>#{order.order_number}</td>
                    <td style={styles.td}>
                      <div style={styles.studentName}>{order.student_name || 'Student'}</div>
                      <div style={styles.studentPhone}>{order.delivery_address?.phone || ''}</div>
                    </td>
                    <td style={styles.td}>
                      {order.items?.length || 0} item(s)
                    </td>
                    <td style={styles.tdBold}>₹{Number(order.total_amount).toFixed(2)}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.paymentBadge,
                        backgroundColor: order.payment_status === 'PAID' ? '#ecfdf5' : '#fef3c7',
                        color: order.payment_status === 'PAID' ? '#065f46' : '#92400e',
                      }}>
                        {order.payment_method} • {order.payment_status}
                      </span>
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
                              disabled={isUpdatingOrder}
                              style={styles.btnAccept}
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'CANCELLED')}
                              disabled={isUpdatingOrder}
                              style={styles.btnCancel}
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {order.status === 'ACCEPTED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
                            disabled={isUpdatingOrder}
                            style={styles.btnPrepare}
                          >
                            Start Cooking
                          </button>
                        )}
                        {order.status === 'PREPARING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'READY_FOR_PICKUP')}
                            disabled={isUpdatingOrder}
                            style={styles.btnReady}
                          >
                            Mark Ready
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedOrder(order)}
                          style={styles.btnDetail}
                          title="View order details"
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
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>Order Details #{selectedOrder.order_number}</h3>
                <span style={getStatusBadgeStyle(selectedOrder.status)}>
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
              <button onClick={() => setSelectedOrder(null)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <div style={styles.modalBody}>
              {/* Delivery Info */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Delivery Destination</h4>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Student:</span>
                  <span style={styles.infoValue}>{selectedOrder.student_name || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Phone:</span>
                  <span style={styles.infoValue}>{selectedOrder.delivery_address?.phone || 'N/A'}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>Campus / Block:</span>
                  <span style={styles.infoValue}>
                    {[
                      selectedOrder.delivery_address?.campus_name,
                      selectedOrder.delivery_address?.block_name,
                      selectedOrder.delivery_address?.hostel_name,
                      selectedOrder.delivery_address?.room_number ? `Room ${selectedOrder.delivery_address.room_number}` : ''
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div style={styles.modalSection}>
                <h4 style={styles.modalSectionTitle}>Ordered Items</h4>
                <div style={styles.itemsList}>
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} style={styles.itemRow}>
                      <div>
                        <div style={styles.itemName}>{item.name}</div>
                        {item.notes && <div style={styles.itemNotes}>Note: {item.notes}</div>}
                      </div>
                      <div style={styles.itemPrice}>
                        {item.quantity} × ₹{Number(item.price).toFixed(2)} = ₹{(item.quantity * Number(item.price)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
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
                  <span>Total Amount:</span>
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
                    disabled={isUpdatingOrder}
                    style={styles.btnAccept}
                  >
                    Accept Order
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    disabled={isUpdatingOrder}
                    style={styles.btnCancel}
                  >
                    Reject Order
                  </button>
                </>
              )}
              {selectedOrder.status === 'ACCEPTED' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'PREPARING')}
                  disabled={isUpdatingOrder}
                  style={styles.btnPrepare}
                >
                  Start Preparing
                </button>
              )}
              {selectedOrder.status === 'PREPARING' && (
                <button
                  onClick={() => handleUpdateStatus(selectedOrder.id, 'READY_FOR_PICKUP')}
                  disabled={isUpdatingOrder}
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
  centerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
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
    marginBottom: '24px',
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
  viewOrdersBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 16px',
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
    marginBottom: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  metricCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
  },
  metricHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  metricLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#6b7280',
  },
  iconBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '26px',
    fontWeight: 800,
    color: '#111827',
    letterSpacing: '-0.02em',
  },
  metricSub: {
    display: 'flex',
    alignItems: 'center',
    marginTop: '6px',
    fontSize: '12px',
    color: '#6b7280',
  },
  sectionTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#1f2937',
    marginBottom: '14px',
  },
  pipelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  pipelineCard: {
    padding: '16px 20px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pipelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  pipelineIcon: {
    width: '34px',
    height: '34px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pipelineTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },
  pipelineDesc: {
    fontSize: '11px',
    color: '#6b7280',
  },
  pipelineCount: {
    fontSize: '26px',
    fontWeight: 800,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
    overflow: 'hidden',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid #f3f4f6',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  tableSubtitle: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0 0 0',
  },
  refreshBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#374151',
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
  studentName: {
    fontWeight: 600,
    color: '#111827',
  },
  studentPhone: {
    fontSize: '11px',
    color: '#6b7280',
  },
  paymentBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '2px 8px',
    borderRadius: '10px',
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
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 20px',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#374151',
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
  itemNotes: {
    fontSize: '11px',
    color: '#ea580c',
    fontStyle: 'italic',
  },
  itemPrice: {
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
