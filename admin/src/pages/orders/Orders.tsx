import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Order } from '../../types';
import { Search, Eye, ShieldAlert, RefreshCw, X } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  
  // Override Form modal
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('CANCELLED');
  const [overrideReason, setOverrideReason] = useState('');

  const loadOrders = async () => {
    try {
      const data = await adminService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    }
  };

  useEffect(() => {
    loadOrders();
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

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          o.shop_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>System Orders Monitor</h2>
          <p style={styles.subtitle}>Audit order books, delivery status checkpoints, and issue emergency overrides</p>
        </div>
        <button onClick={loadOrders} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Orders</span>
        </button>
      </div>

      <div style={styles.layout}>
        {/* Left Side: Order List Feed */}
        <div style={styles.leftCol}>
          {/* Filters Area */}
          <div style={styles.searchBar}>
            <Search size={16} color="#6b7280" />
            <input
              type="text"
              placeholder="Search order # or shop..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Order Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="PREPARING">PREPARING</option>
              <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
              <option value="ASSIGNED">ASSIGNED</option>
              <option value="PICKED_UP">PICKED UP</option>
              <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
              <option value="DELIVERED">DELIVERED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          {/* List */}
          <div style={styles.list}>
            {filteredOrders.map((o) => (
              <div
                key={o.id}
                onClick={() => handleSelectOrder(o)}
                style={{
                  ...styles.listItem,
                  backgroundColor: selectedOrder?.id === o.id ? '#f3f4f6' : '#ffffff',
                  borderColor: selectedOrder?.id === o.id ? '#10b981' : '#e5e7eb',
                }}
              >
                <div style={styles.itemHeader}>
                  <span style={styles.orderNo}>{o.order_number}</span>
                  <span style={styles.statusBadge}>{o.status.replace(/_/g, ' ')}</span>
                </div>
                <div style={styles.itemBody}>
                  <span style={styles.shopName}>{o.shop_name}</span>
                  <span style={styles.price}>₹{Number(o.total_amount).toFixed(2)}</span>
                </div>
                <span style={styles.dateText}>{new Date(o.created_at).toLocaleString()}</span>
              </div>
            ))}
            {filteredOrders.length === 0 && (
              <div style={styles.emptyFeed}>No matching orders found.</div>
            )}
          </div>
        </div>

        {/* Right Side: Order details */}
        <div style={styles.rightCol}>
          {selectedOrder ? (
            <div style={styles.detailsBox}>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={styles.detailTitle}>Order {selectedOrder.order_number}</h3>
                  <span style={styles.detailDate}>Placed: {new Date(selectedOrder.created_at).toLocaleString()}</span>
                </div>
                
                {/* Emergency Override trigger */}
                <button onClick={() => setShowOverrideModal(true)} style={styles.overrideBtn}>
                  <ShieldAlert size={14} style={{ marginRight: 6 }} />
                  <span>Admin Override</span>
                </button>
              </div>

              {/* Status and payment summaries */}
              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Workflow Status</span>
                  <span style={styles.summaryVal}>{selectedOrder.status.replace(/_/g, ' ')}</span>
                </div>
                <div style={styles.summaryCard}>
                  <span style={styles.summaryLabel}>Payment Status</span>
                  <span style={styles.summaryVal}>{selectedOrder.payment_status} ({selectedOrder.payment_method})</span>
                </div>
              </div>

              {/* Delivery destination target details */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Delivery Destination</h4>
                <div style={styles.destInfo}>
                  <span style={styles.destText}><strong>Campus:</strong> {selectedOrder.delivery_address.campus_name}</span>
                  <span style={styles.destText}><strong>Block/Hostel:</strong> {selectedOrder.delivery_address.block_name || selectedOrder.delivery_address.hostel_name || 'N/A'}</span>
                  <span style={styles.destText}><strong>Room / Floor:</strong> Room {selectedOrder.delivery_address.room_number || 'N/A'}, Floor {selectedOrder.delivery_address.floor_level || 'N/A'}</span>
                  <span style={styles.destText}><strong>Phone:</strong> {selectedOrder.delivery_address.phone}</span>
                </div>
              </div>

              {/* Billing Breakdown */}
              <div style={styles.section}>
                <h4 style={styles.sectionTitle}>Receipt Breakdown</h4>
                <div style={styles.pricingRow}>
                  <span>Subtotal</span>
                  <span>₹{Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div style={styles.pricingRow}>
                  <span>Delivery Fee</span>
                  <span>₹{Number(selectedOrder.delivery_fee).toFixed(2)}</span>
                </div>
                <div style={styles.pricingRow}>
                  <span>Tax</span>
                  <span>₹{Number(selectedOrder.tax).toFixed(2)}</span>
                </div>
                <div style={{ ...styles.pricingRow, ...styles.boldRow }}>
                  <span>Total Bill Amount</span>
                  <span>₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.selectPrompt}>
              <Eye size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p>Select an order from the left pane to audit item lists, billing splits, drop destinations, or issue status overrides.</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Override Modal */}
      {showOverrideModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Issue Administrative Override</h3>
              <button onClick={() => setShowOverrideModal(false)} style={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleOverrideSubmit} style={styles.modalForm}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Target Override Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  style={styles.formSelect}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY_FOR_PICKUP">READY FOR PICKUP</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="PICKED_UP">PICKED UP</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Justification Reason (Mandatory - Audited)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g. Canteen electricity failure - refunding customer / Support override requested"
                  style={styles.formTextarea}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowOverrideModal(false)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Force Override</button>
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
  layout: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start',
  },
  leftCol: {
    flex: '0 0 350px',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
  },
  rightCol: {
    flex: 1,
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0,0,0,0.05)',
    minHeight: '500px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '8px 12px',
    gap: '8px',
    marginBottom: '16px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    flex: 1,
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    marginBottom: '20px',
  },
  filterLabel: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#4b5563',
    textTransform: 'uppercase' as const,
  },
  filterSelect: {
    padding: '8px',
    borderRadius: '6px',
    borderColor: '#d1d5db',
    fontSize: '13px',
    outline: 'none',
  },
  list: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  listItem: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNo: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#111827',
  },
  statusBadge: {
    fontSize: '10px',
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    padding: '2px 8px',
    borderRadius: '12px',
  },
  itemBody: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: '8px 0 4px 0',
  },
  shopName: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
  },
  price: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  dateText: {
    fontSize: '10px',
    color: '#9ca3af',
  },
  emptyFeed: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#9ca3af',
    fontSize: '13px',
  },
  detailsBox: {},
  detailHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  detailTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  detailDate: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
    display: 'block',
  },
  overrideBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
  },
  summaryVal: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111827',
    marginTop: '6px',
    display: 'block',
  },
  section: {
    marginBottom: '24px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '16px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  destInfo: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  destText: {
    fontSize: '13px',
    color: '#4b5563',
  },
  pricingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#4b5563',
    marginVertical: '6px',
  },
  boldRow: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#111827',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '10px',
    marginTop: '10px',
  },
  selectPrompt: {
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px',
    color: '#9ca3af',
    textAlign: 'center' as const,
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
    maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '12px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#9ca3af',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
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
  formSelect: {
    padding: '10px',
    borderRadius: '6px',
    borderColor: '#d1d5db',
    fontSize: '13px',
    outline: 'none',
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
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 'bold',
  },
};
