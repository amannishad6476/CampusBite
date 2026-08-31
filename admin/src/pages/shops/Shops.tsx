import { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Shop, FoodItem, Order } from '../../types';
import { Search, MapPin, Star, ShieldCheck, ShieldAlert, ArrowRight, RefreshCw, X } from 'lucide-react';

export default function Shops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [campuses, setCampuses] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

  // Tabs within details view
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'MENU' | 'ORDERS'>('DETAILS');
  const [menu, setMenu] = useState<FoodItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Search/Filters states
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');
  
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [showStatusModal, setShowStatusModal] = useState<string | null>(null); // target status

  const loadShopsData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getShops();
      setShops(data);
      const camps = await adminService.getCampuses();
      setCampuses(camps);
    } catch (e) {
      console.error('Failed to load canteens:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShopsData();
  }, []);

  const handleSelectShop = async (shop: Shop) => {
    setSelectedShop(shop);
    setActiveTab('DETAILS');
    setDetailsLoading(true);
    try {
      const menuData = await adminService.getShopMenu(shop.id);
      setMenu(menuData);
      const ordersData = await adminService.getShopOrders(shop.id);
      setOrders(ordersData);
    } catch (e) {
      console.error('Failed to load details for shop:', shop.id);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !showStatusModal) return;

    try {
      const updated = await adminService.changeShopStatus(selectedShop.id, showStatusModal, statusReason);
      setSelectedShop(updated);
      
      // Update in main list
      setShops(shops.map(s => s.id === updated.id ? updated : s));
      
      setShowStatusModal(null);
      setStatusReason('');
      alert(`Shop status successfully changed to ${showStatusModal}.`);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to modify status.');
    }
  };

  const filteredShops = shops.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCampus = campusFilter === 'ALL' || s.campus_id === Number(campusFilter);
    
    return matchesSearch && matchesCampus;
  });

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: '#e8f5e9', text: '#2e7d32' };
      case 'APPROVED': return { bg: '#e3f2fd', text: '#1565c0' };
      case 'PENDING': return { bg: '#fff8e1', text: '#f57f17' };
      case 'SUSPENDED': return { bg: '#ffebee', text: '#c62828' };
      default: return { bg: '#f5f5f5', text: '#757575' };
    }
  };

  if (loading && shops.length === 0) {
    return <div style={styles.center}>Fetching canteens files...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Canteens & Shops Management</h2>
          <p style={styles.subtitle}>Review vendor statuses, food menus, order books, approvals, and suspensions</p>
        </div>
        <button onClick={loadShopsData} style={styles.refreshBtn}>
          <RefreshCw size={16} style={{ marginRight: 8 }} />
          <span>Sync Data</span>
        </button>
      </div>

      <div style={styles.layout}>
        {/* Left Side: Filterable Shops Feed */}
        <div style={styles.leftCol}>
          {/* Filters Area */}
          <div style={styles.searchBar}>
            <Search size={18} color="#9ca3af" />
            <input
              type="text"
              placeholder="Search shops..."
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
              style={styles.filterSelect}
            >
              <option value="ALL">All Campuses</option>
              {campuses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* List */}
          <div style={styles.list}>
            {filteredShops.map((s) => {
              const badge = getStatusBadgeStyle(s.status);
              const isSelected = selectedShop?.id === s.id;
              
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectShop(s)}
                  style={{
                    ...styles.listItem,
                    backgroundColor: isSelected ? '#f3f4f6' : '#ffffff',
                    borderColor: isSelected ? '#10b981' : '#e5e7eb',
                  }}
                >
                  <div style={styles.itemHeader}>
                    <span style={styles.itemName}>{s.name}</span>
                    <span style={{ ...styles.badge, backgroundColor: badge.bg, color: badge.text }}>
                      {s.status}
                    </span>
                  </div>
                  <p style={styles.itemDesc}>
                    {s.description || 'No description provided.'}
                  </p>
                  <div style={styles.itemFooter}>
                    <div style={styles.meta}>
                      <Star size={14} color="#f59e0b" fill="#f59e0b" />
                      <span>{Number(s.rating).toFixed(1)}</span>
                    </div>
                    <div style={styles.meta}>
                      <MapPin size={14} color="#6b7280" />
                      <span>ID: {s.campus_id}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredShops.length === 0 && (
              <div style={styles.emptyFeed}>No canteens found fitting filters.</div>
            )}
          </div>
        </div>

        {/* Right Side: Tabbed Shop Details & Actions */}
        <div style={styles.rightCol}>
          {selectedShop ? (
            <div style={styles.detailsBox}>
              <div style={styles.detailHeader}>
                <div>
                  <h3 style={styles.detailTitle}>{selectedShop.name}</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{
                      ...styles.badge,
                      ...getStatusBadgeStyle(selectedShop.status)
                    }}>
                      {selectedShop.status}
                    </span>
                    <span style={styles.metaText}>Rating: {Number(selectedShop.rating).toFixed(1)} ★</span>
                    <span style={styles.metaText}>{selectedShop.is_open ? '🟢 Open Now' : '🔴 Closed'}</span>
                  </div>
                </div>

                {/* Status transitions actions bar */}
                <div style={styles.actionRow}>
                  {selectedShop.status === 'PENDING' && (
                    <button onClick={() => setShowStatusModal('APPROVED')} style={styles.approveBtn}>
                      <ShieldCheck size={14} style={{ marginRight: 6 }} />
                      <span>Approve Shop</span>
                    </button>
                  )}
                  {selectedShop.status === 'APPROVED' && (
                    <button onClick={() => setShowStatusModal('ACTIVE')} style={styles.activateBtn}>
                      <ShieldCheck size={14} style={{ marginRight: 6 }} />
                      <span>Go Active</span>
                    </button>
                  )}
                  {selectedShop.status !== 'SUSPENDED' && selectedShop.status !== 'PENDING' && (
                    <button onClick={() => setShowStatusModal('SUSPENDED')} style={styles.suspendBtn}>
                      <ShieldAlert size={14} style={{ marginRight: 6 }} />
                      <span>Suspend</span>
                    </button>
                  )}
                  {selectedShop.status === 'SUSPENDED' && (
                    <button onClick={() => setShowStatusModal('ACTIVE')} style={styles.activateBtn}>
                      <ShieldCheck size={14} style={{ marginRight: 6 }} />
                      <span>Re-activate</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div style={styles.tabContainer}>
                <button
                  onClick={() => setActiveTab('DETAILS')}
                  style={{ ...styles.tab, ...(activeTab === 'DETAILS' ? styles.activeTab : {}) }}
                >
                  General Details
                </button>
                <button
                  onClick={() => setActiveTab('MENU')}
                  style={{ ...styles.tab, ...(activeTab === 'MENU' ? styles.activeTab : {}) }}
                >
                  Menu Catalog ({menu.length})
                </button>
                <button
                  onClick={() => setActiveTab('ORDERS')}
                  style={{ ...styles.tab, ...(activeTab === 'ORDERS' ? styles.activeTab : {}) }}
                >
                  Order Book ({orders.length})
                </button>
              </div>

              {/* Tab Contents */}
              {detailsLoading ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Syncing details...</div>
              ) : (
                <div style={styles.tabContent}>
                  {activeTab === 'DETAILS' && (
                    <div style={styles.detailsGrid}>
                      <div style={styles.infoBlock}>
                        <span style={styles.infoLabel}>Canteen ID</span>
                        <span style={styles.infoVal}>{selectedShop.id}</span>
                      </div>
                      <div style={styles.infoBlock}>
                        <span style={styles.infoLabel}>Shopkeeper ID</span>
                        <span style={styles.infoVal}>{selectedShop.shopkeeper_id}</span>
                      </div>
                      <div style={styles.infoBlock}>
                        <span style={styles.infoLabel}>Campus ID Link</span>
                        <span style={styles.infoVal}>{selectedShop.campus_id}</span>
                      </div>
                      <div style={styles.infoBlock}>
                        <span style={styles.infoLabel}>Phone Number</span>
                        <span style={styles.infoVal}>{selectedShop.phone_number || 'Not registered'}</span>
                      </div>
                      <div style={styles.infoBlock}>
                        <span style={styles.infoLabel}>Description</span>
                        <span style={styles.infoVal}>{selectedShop.description || 'N/A'}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'MENU' && (
                    <div style={styles.menuList}>
                      {menu.map(item => (
                        <div key={item.id} style={styles.menuRow}>
                          <div>
                            <span style={styles.menuName}>{item.name}</span>
                            <span style={styles.menuTag}>{item.is_veg ? '🟢 Veg' : '🔴 Non-Veg'}</span>
                          </div>
                          <span style={styles.menuPrice}>₹{Number(item.price).toFixed(2)}</span>
                        </div>
                      ))}
                      {menu.length === 0 && <span style={styles.emptyText}>No food items listed in menu</span>}
                    </div>
                  )}

                  {activeTab === 'ORDERS' && (
                    <div style={styles.ordersTableContainer}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th style={styles.th}>Order Number</th>
                            <th style={styles.th}>Date</th>
                            <th style={styles.th}>Amount</th>
                            <th style={styles.th}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.map(o => (
                            <tr key={o.id} style={styles.tr}>
                              <td style={styles.td}>{o.order_number}</td>
                              <td style={styles.td}>{new Date(o.created_at).toLocaleDateString()}</td>
                              <td style={styles.td}>₹{Number(o.total_amount).toFixed(2)}</td>
                              <td style={styles.td}>
                                <span style={styles.orderStatusBadge}>{o.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {orders.length === 0 && <span style={styles.emptyText}>No orders registered for this shop</span>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div style={styles.selectPrompt}>
              <ArrowRight size={48} color="#d1d5db" style={{ marginBottom: 12 }} />
              <p>Select a canteen from the left feed to view details, active food menus, order history, or update approval credentials.</p>
            </div>
          )}
        </div>
      </div>

      {/* Status Reason Confirmation Modal */}
      {showStatusModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Confirm Shop Status Update</h3>
              <button onClick={() => setShowStatusModal(null)} style={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleUpdateStatus} style={styles.modalForm}>
              <p style={styles.modalText}>
                Are you sure you want to change the status of <strong>{selectedShop?.name}</strong> to <strong>{showStatusModal}</strong>?
              </p>
              
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Justification / Reason (Audited)</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Health code checks passed successfully / Account violation report"
                  style={styles.formTextarea}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowStatusModal(null)} style={styles.cancelBtn}>Cancel</button>
                <button type="submit" style={styles.saveBtn}>Apply Status Change</button>
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
  itemName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#111827',
  },
  badge: {
    fontSize: '10px',
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase' as const,
  },
  itemDesc: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '8px 0',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap' as const,
  },
  itemFooter: {
    display: 'flex',
    gap: '16px',
  },
  meta: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    color: '#4b5563',
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
  metaText: {
    fontSize: '12px',
    color: '#4b5563',
    fontWeight: 500,
  },
  actionRow: {
    display: 'flex',
    gap: '10px',
  },
  approveBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  activateBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  suspendBtn: {
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
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    gap: '16px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '14px',
    color: '#4b5563',
    cursor: 'pointer',
    fontWeight: 500,
  },
  activeTab: {
    borderBottomColor: '#10b981',
    color: '#10b981',
    fontWeight: 'bold',
  },
  tabContent: {},
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  infoBlock: {
    display: 'flex',
    flexDirection: 'column' as const,
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
  },
  infoLabel: {
    fontSize: '11px',
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold',
  },
  infoVal: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '500',
    marginTop: '4px',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
  },
  menuRow: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  menuTag: {
    fontSize: '10px',
    marginLeft: '12px',
    backgroundColor: '#e5e7eb',
    padding: '2px 6px',
    borderRadius: '4px',
    color: '#4b5563',
  },
  menuPrice: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  ordersTableContainer: {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    backgroundColor: '#f9fafb',
    color: '#374151',
    fontWeight: 'bold',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    padding: '12px 16px',
    textAlign: 'left' as const,
    borderBottom: '1px solid #e5e7eb',
  },
  tr: {
    borderBottom: '1px solid #e5e7eb',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#4b5563',
  },
  orderStatusBadge: {
    fontSize: '11px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  emptyText: {
    display: 'block',
    textAlign: 'center' as const,
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
    padding: '20px',
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
  center: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    fontSize: '15px',
    color: '#6b7280',
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
