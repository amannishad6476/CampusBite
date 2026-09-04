import React, { useEffect, useState } from 'react';
import adminService from '../../services/adminService';
import { Shop, FoodItem } from '../../types';
import { Search, Plus, Edit2, Trash2, RefreshCw, X, Store } from 'lucide-react';

export default function MenuManagement() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [items, setItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vegFilter, setVegFilter] = useState<'ALL' | 'VEG' | 'NON_VEG'>('ALL');

  // Modal states
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT' | null>(null);
  const [selectedItem, setSelectedItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemVeg, setItemVeg] = useState(true);
  const [itemPrepTime, setItemPrepTime] = useState(15);
  const [itemAvailable, setItemAvailable] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<FoodItem | null>(null);

  const loadShops = async () => {
    setLoading(true);
    try {
      const shopList = await adminService.getShops();
      setShops(shopList);
      if (shopList.length > 0) {
        setSelectedShopId(shopList[0].id);
        fetchMenuItems(shopList[0].id);
      }
    } catch (e) {
      console.error('Failed to load shops:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async (shopId: string) => {
    setItemsLoading(true);
    try {
      const menu = await adminService.getShopMenu(shopId);
      setItems(menu);
    } catch (e) {
      console.error('Failed to load menu:', e);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  const handleSelectShop = (shopId: string) => {
    setSelectedShopId(shopId);
    fetchMenuItems(shopId);
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      const updated = await adminService.updateFoodItem(item.id, {
        is_available: !item.is_available,
      });
      setItems(items.map(i => (i.id === item.id ? updated : i)));
    } catch (e) {
      alert('Failed to toggle availability.');
    }
  };

  const openAddModal = () => {
    setSelectedItem(null);
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemVeg(true);
    setItemPrepTime(15);
    setItemAvailable(true);
    setFormError(null);
    setModalMode('ADD');
  };

  const openEditModal = (item: FoodItem) => {
    setSelectedItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(item.price.toString());
    setItemVeg(item.is_veg);
    setItemPrepTime(item.preparation_time || 15);
    setItemAvailable(item.is_available);
    setFormError(null);
    setModalMode('EDIT');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice || !selectedShopId) {
      setFormError('Item name and price are required.');
      return;
    }
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Price must be a valid positive number.');
      return;
    }

    setFormLoading(true);
    setFormError(null);
    try {
      if (modalMode === 'ADD') {
        const created = await adminService.createFoodItem(selectedShopId, {
          name: itemName,
          description: itemDescription || undefined,
          price: priceNum,
          is_veg: itemVeg,
          preparation_time: Number(itemPrepTime),
          is_available: itemAvailable,
        });
        setItems([created, ...items]);
      } else if (modalMode === 'EDIT' && selectedItem) {
        const updated = await adminService.updateFoodItem(selectedItem.id, {
          name: itemName,
          description: itemDescription || undefined,
          price: priceNum,
          is_veg: itemVeg,
          preparation_time: Number(itemPrepTime),
          is_available: itemAvailable,
        });
        setItems(items.map(i => (i.id === selectedItem.id ? updated : i)));
      }
      setModalMode(null);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || 'Failed to save food item.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteTarget) return;
    try {
      await adminService.deleteFoodItem(deleteTarget.id);
      setItems(items.filter(i => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert('Failed to delete food item.');
    }
  };

  const selectedShop = shops.find(s => s.id === selectedShopId);

  const filteredItems = items.filter(item => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = item.name.toLowerCase().includes(q) || (item.description && item.description.toLowerCase().includes(q));
    const matchesVeg = vegFilter === 'ALL' || (vegFilter === 'VEG' && item.is_veg) || (vegFilter === 'NON_VEG' && !item.is_veg);
    return matchesSearch && matchesVeg;
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
        Loading canteen catalog...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.titleRow}>
        <div>
          <h2 style={styles.title}>Menu & Food Catalog</h2>
          <p style={styles.subtitle}>
            Manage menu items for <strong>{selectedShop ? selectedShop.name : 'all canteens'}</strong>, prices, veg/non-veg tags, and live order availability
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={openAddModal} disabled={!selectedShopId} style={styles.addBtn}>
            <Plus size={16} style={{ marginRight: 6 }} />
            <span>Add Food Item</span>
          </button>
          <button onClick={() => selectedShopId && fetchMenuItems(selectedShopId)} style={styles.refreshBtn}>
            <RefreshCw size={16} style={{ marginRight: 6 }} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Canteen Selector & Filters */}
      <div style={styles.filterCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Store size={18} color="#10b981" />
          <label style={styles.filterLabel}>Select Canteen:</label>
          <select
            value={selectedShopId}
            onChange={(e) => handleSelectShop(e.target.value)}
            style={styles.select}
          >
            {shops.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div style={styles.searchBar}>
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setVegFilter('ALL')}
            style={{ ...styles.filterChip, backgroundColor: vegFilter === 'ALL' ? '#1f2937' : '#f3f4f6', color: vegFilter === 'ALL' ? '#ffffff' : '#374151' }}
          >
            All Items
          </button>
          <button
            onClick={() => setVegFilter('VEG')}
            style={{ ...styles.filterChip, backgroundColor: vegFilter === 'VEG' ? '#047857' : '#f3f4f6', color: vegFilter === 'VEG' ? '#ffffff' : '#374151' }}
          >
            🌱 Veg Only
          </button>
          <button
            onClick={() => setVegFilter('NON_VEG')}
            style={{ ...styles.filterChip, backgroundColor: vegFilter === 'NON_VEG' ? '#b91c1c' : '#f3f4f6', color: vegFilter === 'NON_VEG' ? '#ffffff' : '#374151' }}
          >
            🍗 Non-Veg
          </button>
        </div>
      </div>

      {/* Food Items Table */}
      <div style={styles.tableCard}>
        {itemsLoading ? (
          <div style={styles.centerLoading}>Fetching menu items...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Item Name</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>Dietary</th>
                  <th style={styles.th}>Availability Toggle</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => (
                  <tr key={item.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontWeight: 600, color: '#111827' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8, fontSize: '16px' }}>
                          {item.is_veg ? '🟢' : '🔴'}
                        </span>
                        <div>
                          <div>{item.name}</div>
                          {item.description && (
                            <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 400 }}>
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, fontSize: '15px' }}>
                      ₹{Number(item.price).toFixed(2)}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: item.is_veg ? '#def7ec' : '#fee2e2',
                        color: item.is_veg ? '#03543f' : '#991b1b'
                      }}>
                        {item.is_veg ? 'Pure Veg' : 'Non-Veg'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        style={{
                          ...styles.toggleBtn,
                          backgroundColor: item.is_available ? '#def7ec' : '#f3f4f6',
                          color: item.is_available ? '#03543f' : '#6b7280',
                          borderColor: item.is_available ? '#31c48d' : '#d1d5db'
                        }}
                      >
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: item.is_available ? '#10b981' : '#9ca3af',
                          marginRight: 6
                        }}></span>
                        <span>{item.is_available ? 'In Stock (Available)' : 'Out of Stock'}</span>
                      </button>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(item)}
                          style={styles.actionBtnSecondary}
                          title="Edit Item"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          style={styles.actionBtnDanger}
                          title="Delete Item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ ...styles.td, textAlign: 'center', padding: '36px', color: '#9ca3af' }}>
                      No food items found in this canteen catalog. Click "Add Food Item" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalMode && (
        <div style={styles.modalBackdrop}>
          <div style={{ ...styles.modalCard, maxWidth: '480px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {modalMode === 'ADD' ? 'Add Food Item' : 'Edit Food Item'}
              </h3>
              <button onClick={() => setModalMode(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {formError && <div style={styles.modalError}>{formError}</div>}

            <form onSubmit={handleSaveItem}>
              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Item Name</label>
                <input
                  type="text"
                  placeholder="e.g. Masala Dosa"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  required
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.modalLabel}>Description</label>
                <input
                  type="text"
                  placeholder="e.g. Served with coconut chutney and sambar"
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  style={styles.modalInput}
                />
              </div>

              <div style={styles.twoInputRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Price (₹)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="e.g. 70.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    required
                    style={styles.modalInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.modalLabel}>Dietary Preference</label>
                  <select
                    value={itemVeg ? 'VEG' : 'NON_VEG'}
                    onChange={(e) => setItemVeg(e.target.value === 'VEG')}
                    style={styles.modalSelect}
                  >
                    <option value="VEG">🌱 Pure Vegetarian</option>
                    <option value="NON_VEG">🍗 Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <input
                  type="checkbox"
                  id="availCheckbox"
                  checked={itemAvailable}
                  onChange={(e) => setItemAvailable(e.target.checked)}
                />
                <label htmlFor="availCheckbox" style={{ fontSize: '14px', color: '#374151', cursor: 'pointer' }}>
                  Mark Item Immediately Available for Ordering
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
                  {formLoading ? 'Saving...' : modalMode === 'ADD' ? 'Add Item' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h3 style={{ ...styles.modalTitle, color: '#b91c1c' }}>Confirm Deletion</h3>
              <button onClick={() => setDeleteTarget(null)} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>
            <p style={{ color: '#4b5563', fontSize: '14px', margin: '0 0 20px 0' }}>
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={styles.modalActions}>
              <button type="button" onClick={() => setDeleteTarget(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
                style={{ ...styles.confirmBtn, backgroundColor: '#dc2626' }}
              >
                Delete Item
              </button>
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
    minWidth: '220px',
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
    padding: '9px 8px',
    fontSize: '14px',
    outline: 'none',
  },
  filterLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#4b5563',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    fontSize: '14px',
    color: '#374151',
    fontWeight: '500',
  },
  filterChip: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
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
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    padding: '6px 10px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  actionBtnDanger: {
    padding: '6px 10px',
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '6px',
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
