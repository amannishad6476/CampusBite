import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Shop, Campus, Shopkeeper, FoodItem, Order } from '../../types';
import { Search, Plus, Store, MapPin, Star, RefreshCw, Edit2, X } from 'lucide-react';

export default function Canteens() {
  const [canteens, setCanteens] = useState<Shop[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [campusFilter, setCampusFilter] = useState('ALL');

  // Add / Edit Modal
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedCanteen, setSelectedCanteen] = useState<Shop | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formShopkeeperId, setFormShopkeeperId] = useState('');
  const [formCampusId, setFormCampusId] = useState<number>(1);
  const [formPhone, setFormPhone] = useState('');
  const [formOpeningTime, setFormOpeningTime] = useState('08:00 AM');
  const [formClosingTime, setFormClosingTime] = useState('10:00 PM');
  const [formDelivery, setFormDelivery] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Status Change Modal
  const [showStatusModal, setShowStatusModal] = useState<Shop | null>(null);
  const [targetStatus, setTargetStatus] = useState<string>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');

  // Detailed View (Menu & Orders preview)
  const [inspectCanteen, setInspectCanteen] = useState<Shop | null>(null);
  const [inspectTab, setInspectTab] = useState<'DETAILS' | 'MENU' | 'ORDERS'>('DETAILS');
  const [canteenMenu, setCanteenMenu] = useState<FoodItem[]>([]);
  const [canteenOrders, setCanteenOrders] = useState<Order[]>([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [shopsData, campsData, skData] = await Promise.all([
        adminService.getShops(),
        adminService.getCampuses().catch(() => []),
        adminService.getShopkeepers().catch(() => [])
      ]);
      setCanteens(shopsData);
      setCampuses(campsData);
      setShopkeepers(skData);
      if (campsData.length > 0 && !formCampusId) {
        setFormCampusId(campsData[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load canteens:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode('ADD');
    setSelectedCanteen(null);
    setFormName('');
    setFormDescription('');
    setFormShopkeeperId(shopkeepers.length > 0 ? shopkeepers[0].id : '');
    setFormCampusId(campuses.length > 0 ? campuses[0].id : 1);
    setFormPhone('');
    setFormOpeningTime('08:00 AM');
    setFormClosingTime('10:00 PM');
    setFormDelivery(true);
    setFormError(null);
  };

  const openEditModal = (canteen: Shop) => {
    setModalMode('EDIT');
    setSelectedCanteen(canteen);
    setFormName(canteen.name);
    setFormDescription(canteen.description || '');
    setFormShopkeeperId(canteen.shopkeeper_id);
    setFormCampusId(canteen.campus_id);
    setFormPhone(canteen.phone_number || '');
    setFormOpeningTime(canteen.opening_time || '08:00 AM');
    setFormClosingTime(canteen.closing_time || '10:00 PM');
    setFormDelivery(canteen.delivery_available ?? true);
    setFormError(null);
  };

  const handleSaveCanteen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formShopkeeperId || !formCampusId) {
      setFormError('Name, shopkeeper, and campus are required.');
      return;
    }
    setFormLoading(true);
    setFormError(null);

    try {
      if (modalMode === 'ADD') {
        const created = await adminService.createShop({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          shopkeeper_id: formShopkeeperId,
          campus_id: Number(formCampusId),
          phone_number: formPhone.trim() || undefined,
          opening_time: formOpeningTime,
          closing_time: formClosingTime,
          delivery_available: formDelivery
        });
        setCanteens([created, ...canteens]);
      } else if (modalMode === 'EDIT' && selectedCanteen) {
        const updated = await adminService.updateShop(selectedCanteen.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
          shopkeeper_id: formShopkeeperId,
          campus_id: Number(formCampusId),
          phone_number: formPhone.trim() || undefined,
          opening_time: formOpeningTime,
          closing_time: formClosingTime,
          delivery_available: formDelivery
        });
        setCanteens(canteens.map(c => c.id === updated.id ? updated : c));
      }
      setModalMode(null);
    } catch (err: any) {
      setFormError(err.response?.data?.detail || 'Failed to save canteen details.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showStatusModal) return;

    try {
      const updated = await adminService.changeShopStatus(showStatusModal.id, targetStatus, statusReason);
      setCanteens(canteens.map(c => c.id === updated.id ? updated : c));
      setShowStatusModal(null);
      setStatusReason('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to change canteen status.');
    }
  };

  const handleInspectCanteen = async (canteen: Shop) => {
    setInspectCanteen(canteen);
    setInspectTab('DETAILS');
    setInspectLoading(true);
    try {
      const [menu, orders] = await Promise.all([
        adminService.getShopMenu(canteen.id).catch(() => []),
        adminService.getShopOrders(canteen.id).catch(() => [])
      ]);
      setCanteenMenu(menu);
      setCanteenOrders(orders);
    } catch (e) {
      console.error(e);
    } finally {
      setInspectLoading(false);
    }
  };

  const getCampusName = (campusId: number) => {
    const c = campuses.find(c => c.id === campusId);
    return c ? c.name : `Campus #${campusId}`;
  };

  const getShopkeeperName = (skId: string) => {
    const sk = shopkeepers.find(s => s.id === skId);
    return sk ? sk.name : 'Unknown Shopkeeper';
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { bg: '#def7ec', text: '#03543f' };
      case 'APPROVED': return { bg: '#e1effe', text: '#1e429f' };
      case 'PENDING': return { bg: '#fef08a', text: '#713f12' };
      case 'SUSPENDED': return { bg: '#fde8e8', text: '#9b1c1c' };
      default: return { bg: '#f3f4f6', text: '#4b5563' };
    }
  };

  const filteredCanteens = canteens.filter(c => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
    const matchesCampus = campusFilter === 'ALL' || c.campus_id === Number(campusFilter);
    return matchesSearch && matchesCampus;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Canteen Management</h2>
          <p style={styles.subtitle}>Configure campus canteens, assign merchant shopkeepers, set operating hours, and verify approvals</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={openAddModal} style={styles.addBtn}>
            <Plus size={16} style={{ marginRight: 6 }} />
            <span>Add Canteen</span>
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
            placeholder="Search canteens by name or description..."
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

      {/* Canteens Table */}
      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.centerLoading}>Loading canteens catalog...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Canteen Name</th>
                  <th style={styles.th}>Campus</th>
                  <th style={styles.th}>Shopkeeper</th>
                  <th style={styles.th}>Timings</th>
                  <th style={styles.th}>Rating</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCanteens.map(canteen => {
                  const statusStyle = getStatusBadgeStyle(canteen.status);
                  return (
                    <tr key={canteen.id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Store size={18} color="#10b981" style={{ marginRight: 10 }} />
                          <div>
                            <div>{canteen.name}</div>
                            {canteen.description && (
                              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
                                {canteen.description.slice(0, 45)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <MapPin size={13} color="#6b7280" style={{ marginRight: 4 }} />
                          <span>{getCampusName(canteen.campus_id)}</span>
                        </div>
                      </td>
                      <td style={styles.td}>{getShopkeeperName(canteen.shopkeeper_id)}</td>
                      <td style={{ ...styles.td, fontSize: '13px', color: '#4b5563' }}>
                        {canteen.opening_time || '08:00 AM'} - {canteen.closing_time || '10:00 PM'}
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Star size={14} fill="#f59e0b" color="#f59e0b" style={{ marginRight: 4 }} />
                          <span style={{ fontWeight: 600 }}>{Number(canteen.rating).toFixed(1)}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.statusBadge,
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.text
                        }}>
                          {canteen.status}
                        </span>
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => handleInspectCanteen(canteen)}
                            style={styles.actionBtnSecondary}
                            title="Inspect Menu & Orders"
                          >
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => openEditModal(canteen)}
                            style={styles.actionBtnSecondary}
                            title="Edit Canteen Details"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => {
                              setShowStatusModal(canteen);
                              setTargetStatus(canteen.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                            }}
                            style={styles.actionBtnStatus}
                            title="Change Status"
                          >
                            <span>Status</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCanteens.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', padding: '32px', color: '#9ca3af' }}>
                      No canteens match the selected search or campus.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Canteen Modal */}
      {modalMode && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '540px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'ADD' ? 'Register New Canteen' : 'Edit Canteen Settings'}
              </h3>
              <button onClick={() => setModalMode(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {formError && <div style={styles.modalError}>{formError}</div>}

            <form onSubmit={handleSaveCanteen}>
              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Canteen Name</label>
                <input
                  type="text"
                  placeholder="e.g. BBD Central Food Court"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Description / Cuisine Highlights</label>
                <input
                  type="text"
                  placeholder="e.g. North Indian, Fast Food & Fresh Juices"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.twoInputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Campus Location</label>
                  <select
                    value={formCampusId}
                    onChange={(e) => setFormCampusId(Number(e.target.value))}
                    required
                    style={styles.modalSelect}
                  >
                    {campuses.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Assign Shopkeeper</label>
                  <select
                    value={formShopkeeperId}
                    onChange={(e) => setFormShopkeeperId(e.target.value)}
                    required
                    style={styles.modalSelect}
                  >
                    <option value="">Select Shopkeeper</option>
                    {shopkeepers.map(sk => (
                      <option key={sk.id} value={sk.id}>{sk.name} ({sk.email})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.twoInputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Opening Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 08:30 AM"
                    value={formOpeningTime}
                    onChange={(e) => setFormOpeningTime(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Closing Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:30 PM"
                    value={formClosingTime}
                    onChange={(e) => setFormClosingTime(e.target.value)}
                    style={styles.modalInput}
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Phone Number</label>
                <input
                  type="tel"
                  placeholder="e.g. +919876543210"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="deliveryCheckbox"
                  checked={formDelivery}
                  onChange={(e) => setFormDelivery(e.target.checked)}
                />
                <label htmlFor="deliveryCheckbox" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                  Enable Campus Delivery Orders
                </label>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  disabled={formLoading}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  style={styles.submitBtn}
                >
                  {formLoading ? 'Saving...' : modalMode === 'ADD' ? 'Create Canteen' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {showStatusModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Update Status: {showStatusModal.name}</h3>
              <button onClick={() => setShowStatusModal(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleStatusChange}>
              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>New Canteen Status</label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  style={styles.modalSelect}
                >
                  <option value="ACTIVE">ACTIVE (Accepting Orders)</option>
                  <option value="APPROVED">APPROVED (Verified)</option>
                  <option value="PENDING">PENDING (Review Required)</option>
                  <option value="SUSPENDED">SUSPENDED (Temporarily Closed)</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Reason / Justification</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Mandatory reason logged to system audit trail..."
                  required
                  rows={3}
                  style={styles.modalTextarea}
                />
              </div>

              <div style={styles.modalActions}>
                <button type="button" onClick={() => setShowStatusModal(null)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn}>
                  Apply Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Canteen Drawer / Modal */}
      {inspectCanteen && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '800px', width: '92%' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Store size={22} color="#10b981" style={{ marginRight: 10 }} />
                <div>
                  <h3 style={styles.modalTitle}>{inspectCanteen.name}</h3>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    Campus: {getCampusName(inspectCanteen.campus_id)} | Shopkeeper: {getShopkeeperName(inspectCanteen.shopkeeper_id)}
                  </span>
                </div>
              </div>
              <button onClick={() => setInspectCanteen(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Inspect Tabs */}
            <div style={styles.tabHeader}>
              <button
                onClick={() => setInspectTab('DETAILS')}
                style={{ ...styles.tabBtn, borderBottomColor: inspectTab === 'DETAILS' ? '#10b981' : 'transparent' }}
              >
                Profile Details
              </button>
              <button
                onClick={() => setInspectTab('MENU')}
                style={{ ...styles.tabBtn, borderBottomColor: inspectTab === 'MENU' ? '#10b981' : 'transparent' }}
              >
                Food Catalog ({canteenMenu.length})
              </button>
              <button
                onClick={() => setInspectTab('ORDERS')}
                style={{ ...styles.tabBtn, borderBottomColor: inspectTab === 'ORDERS' ? '#10b981' : 'transparent' }}
              >
                Orders Stream ({canteenOrders.length})
              </button>
            </div>

            <div style={{ padding: '16px 0', maxHeight: '420px', overflowY: 'auto' }}>
              {inspectLoading ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>Loading details...</div>
              ) : inspectTab === 'DETAILS' ? (
                <div style={styles.inspectDetails}>
                  <div style={styles.detailRow}><strong>Canteen ID:</strong> {inspectCanteen.id}</div>
                  <div style={styles.detailRow}><strong>Operating Hours:</strong> {inspectCanteen.opening_time || '08:00 AM'} - {inspectCanteen.closing_time || '10:00 PM'}</div>
                  <div style={styles.detailRow}><strong>Delivery Available:</strong> {inspectCanteen.delivery_available ? 'Yes' : 'No'}</div>
                  <div style={styles.detailRow}><strong>Current State:</strong> {inspectCanteen.status}</div>
                  <div style={styles.detailRow}><strong>Customer Rating:</strong> ⭐ {Number(inspectCanteen.rating).toFixed(1)} / 5.0</div>
                  {inspectCanteen.description && (
                    <div style={styles.detailRow}><strong>Description:</strong> {inspectCanteen.description}</div>
                  )}
                </div>
              ) : inspectTab === 'MENU' ? (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Item Name</th>
                      <th style={styles.th}>Price</th>
                      <th style={styles.th}>Veg / Non-Veg</th>
                      <th style={styles.th}>Available</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canteenMenu.map(item => (
                      <tr key={item.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{item.name}</td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>₹{Number(item.price).toFixed(2)}</td>
                        <td style={styles.td}>{item.is_veg ? '🌱 Veg' : '🍗 Non-Veg'}</td>
                        <td style={styles.td}>
                          <span style={{ color: item.is_available ? '#047857' : '#b91c1c', fontWeight: 600 }}>
                            {item.is_available ? 'In Stock' : 'Out of Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {canteenMenu.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>No food items added to this canteen yet.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Order #</th>
                      <th style={styles.th}>Total</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canteenOrders.map(order => (
                      <tr key={order.id} style={styles.tr}>
                        <td style={{ ...styles.td, fontWeight: 600 }}>{order.order_number}</td>
                        <td style={{ ...styles.td, fontWeight: 600 }}>₹{Number(order.total_amount).toFixed(2)}</td>
                        <td style={styles.td}>{order.status}</td>
                        <td style={{ ...styles.td, color: '#6b7280', fontSize: '13px' }}>
                          {new Date(order.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    ))}
                    {canteenOrders.length === 0 && (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af' }}>No orders logged for this canteen yet.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
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
  actionBtnSecondary: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '6px 10px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnStatus: {
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
  tabHeader: {
    display: 'flex',
    borderBottom: '1px solid #e5e7eb',
    gap: '16px',
    marginBottom: '12px',
  },
  tabBtn: {
    padding: '10px 14px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    cursor: 'pointer',
  },
  inspectDetails: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '8px 0',
  },
  detailRow: {
    fontSize: '14px',
    color: '#374151',
  },
};
