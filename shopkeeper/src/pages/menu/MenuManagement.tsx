import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Clock,
  FolderPlus,
  AlertCircle
} from 'lucide-react';
import { shopkeeperService } from '../../services/shopkeeperService';
import { FoodItem, FoodCategory } from '../../types';

export default function MenuManagement() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterVegOnly, setFilterVegOnly] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal State for Add / Edit Item
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Item Form Fields
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemCategoryId, setItemCategoryId] = useState<number | undefined>(undefined);
  const [itemPrepTime, setItemPrepTime] = useState('15');

  // Category Quick Add Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const loadCatalog = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [menuData, catData] = await Promise.all([
        shopkeeperService.getMenu(),
        shopkeeperService.getCategories(),
      ]);
      setItems(menuData);
      setCategories(catData);
    } catch (err: any) {
      setError(err.message || 'Failed to load food menu catalog');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemDescription('');
    setItemImageUrl('');
    setItemIsVeg(true);
    setItemIsAvailable(true);
    setItemCategoryId(categories.length > 0 ? categories[0].id : undefined);
    setItemPrepTime('15');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: FoodItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemDescription(item.description || '');
    setItemImageUrl(item.image_url || '');
    setItemIsVeg(item.is_veg);
    setItemIsAvailable(item.is_available);
    setItemCategoryId(item.category_id || undefined);
    setItemPrepTime(String(item.preparation_time || 15));
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: itemName.trim(),
        price: parseFloat(itemPrice),
        description: itemDescription.trim() || undefined,
        image_url: itemImageUrl.trim() || undefined,
        is_veg: itemIsVeg,
        is_available: itemIsAvailable,
        category_id: itemCategoryId,
        preparation_time: parseInt(itemPrepTime) || 15,
      };

      if (editingItem) {
        const updated = await shopkeeperService.updateMenuItem(editingItem.id, payload);
        setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      } else {
        const created = await shopkeeperService.createMenuItem(payload);
        setItems((prev) => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (item: FoodItem) => {
    try {
      const updated = await shopkeeperService.toggleItemAvailability(item.id, !item.is_available);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
    } catch (err: any) {
      alert(err.message || 'Could not update item availability');
    }
  };

  const handleDeleteItem = async (item: FoodItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from your canteen menu?`)) {
      return;
    }
    try {
      await shopkeeperService.deleteMenuItem(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
    } catch (err: any) {
      alert(err.message || 'Could not delete food item');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      const cat = await shopkeeperService.createCategory(newCatName.trim());
      setCategories((prev) => [...prev, cat]);
      setNewCatName('');
      setIsCatModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Could not create category');
    }
  };

  // Filter Items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' ||
      (item.category_id && String(item.category_id) === selectedCategory);
    const matchesVeg = !filterVegOnly || item.is_veg;
    return matchesSearch && matchesCategory && matchesVeg;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.title}>Menu & Food Catalog</h1>
          <p style={styles.subtitle}>Manage your canteen items, categories, pricing, and live availability</p>
        </div>
        <div style={styles.headerBtnGroup}>
          <button onClick={() => setIsCatModalOpen(true)} style={styles.btnSecondary}>
            <FolderPlus size={16} style={{ marginRight: 6 }} />
            <span>Add Category</span>
          </button>
          <button onClick={handleOpenAddModal} style={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 6 }} />
            <span>Add Food Item</span>
          </button>
        </div>
      </div>

      {error && (
        <div style={styles.errorAlert}>
          <AlertCircle size={18} color="#dc2626" style={{ marginRight: 8 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter / Search Controls Bar */}
      <div style={styles.filterBar}>
        <div style={styles.searchWrapper}>
          <Search size={18} color="#9ca3af" style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search items by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersGroup}>
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={styles.categorySelect}
          >
            <option value="ALL">All Categories ({items.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Veg Only Switch */}
          <button
            onClick={() => setFilterVegOnly(!filterVegOnly)}
            style={{
              ...styles.vegFilterBtn,
              backgroundColor: filterVegOnly ? '#ecfdf5' : '#ffffff',
              borderColor: filterVegOnly ? '#10b981' : '#d1d5db',
              color: filterVegOnly ? '#065f46' : '#374151',
            }}
          >
            <span style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: '#16a34a',
              marginRight: '6px'
            }} />
            <span>Pure Veg Only</span>
          </button>
        </div>
      </div>

      {/* Menu Items Table / Cards */}
      {isLoading ? (
        <div style={styles.center}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Loading menu catalog...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div style={styles.emptyState}>
          <UtensilsCrossed size={48} color="#9ca3af" />
          <p style={styles.emptyTitle}>No menu items found</p>
          <p style={styles.emptyText}>
            {searchQuery || selectedCategory !== 'ALL' || filterVegOnly
              ? 'Try adjusting your search or category filters.'
              : 'Add delicious food items to start taking orders from students!'}
          </p>
          {!searchQuery && selectedCategory === 'ALL' && !filterVegOnly && (
            <button onClick={handleOpenAddModal} style={styles.btnPrimary}>
              <Plus size={16} style={{ marginRight: 6 }} />
              <span>Add Your First Item</span>
            </button>
          )}
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Item</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Diet</th>
                <th style={styles.th}>Price</th>
                <th style={styles.th}>Prep Time</th>
                <th style={styles.th}>Availability</th>
                <th style={styles.thRight}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} style={styles.tr}>
                  <td style={styles.td}>
                    <div style={styles.itemInfoCell}>
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} style={styles.itemThumb} />
                      ) : (
                        <div style={styles.thumbPlaceholder}>
                          <UtensilsCrossed size={16} color="#9ca3af" />
                        </div>
                      )}
                      <div>
                        <div style={styles.itemName}>{item.name}</div>
                        {item.description && (
                          <div style={styles.itemDesc}>{item.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.catBadge}>
                      {item.category_name || categories.find((c) => c.id === item.category_id)?.name || 'General'}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.vegBadge,
                      backgroundColor: item.is_veg ? '#ecfdf5' : '#fef2f2',
                      borderColor: item.is_veg ? '#a7f3d0' : '#fecaca',
                      color: item.is_veg ? '#065f46' : '#991b1b',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: item.is_veg ? '#16a34a' : '#dc2626',
                        marginRight: '5px'
                      }} />
                      {item.is_veg ? 'Veg' : 'Non-Veg'}
                    </span>
                  </td>
                  <td style={styles.tdBold}>₹{Number(item.price).toFixed(2)}</td>
                  <td style={styles.td}>
                    <div style={styles.prepTime}>
                      <Clock size={14} color="#6b7280" style={{ marginRight: 4 }} />
                      <span>{item.preparation_time || 15} mins</span>
                    </div>
                  </td>
                  <td style={styles.td}>
                    {/* 1-Click Availability Toggle */}
                    <button
                      onClick={() => handleToggleAvailability(item)}
                      style={{
                        ...styles.toggleBtn,
                        backgroundColor: item.is_available ? '#ecfdf5' : '#fef2f2',
                        borderColor: item.is_available ? '#a7f3d0' : '#fecaca',
                        color: item.is_available ? '#065f46' : '#991b1b',
                      }}
                      title="Click to toggle availability"
                    >
                      {item.is_available ? (
                        <>
                          <CheckCircle size={14} color="#059669" style={{ marginRight: 6 }} />
                          <span>In Stock</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={14} color="#dc2626" style={{ marginRight: 6 }} />
                          <span>Out of Stock</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td style={styles.tdRight}>
                    <div style={styles.actionBtns}>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        style={styles.iconBtnEdit}
                        title="Edit Item"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        style={styles.iconBtnDelete}
                        title="Delete Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Food Item Modal */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Dish / Item Name *</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Masala Dosa, Paneer Roll"
                  style={styles.input}
                />
              </div>

              <div style={styles.row2}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    placeholder="50.00"
                    style={styles.input}
                  />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Preparation Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemPrepTime}
                    onChange={(e) => setItemPrepTime(e.target.value)}
                    placeholder="15"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Food Category</label>
                <select
                  value={itemCategoryId !== undefined ? String(itemCategoryId) : ''}
                  onChange={(e) => setItemCategoryId(e.target.value ? Number(e.target.value) : undefined)}
                  style={styles.input}
                >
                  <option value="">Auto-assign to General Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Description</label>
                <textarea
                  rows={2}
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  placeholder="Brief description of taste, ingredients, or portions..."
                  style={styles.textarea}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Image URL (optional)</label>
                <input
                  type="url"
                  value={itemImageUrl}
                  onChange={(e) => setItemImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  style={styles.input}
                />
              </div>

              <div style={styles.row2}>
                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={itemIsVeg}
                    onChange={(e) => setItemIsVeg(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Vegetarian Item</span>
                </label>

                <label style={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={itemIsAvailable}
                    onChange={(e) => setItemIsAvailable(e.target.checked)}
                    style={styles.checkbox}
                  />
                  <span>Available in Stock</span>
                </label>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} style={styles.btnPrimary}>
                  {isSubmitting ? 'Saving...' : editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCatModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '400px' }}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add Food Category</h3>
              <button onClick={() => setIsCatModalOpen(false)} style={styles.modalCloseBtn}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCategory} style={styles.modalBody}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. South Indian, Beverages, Snacks"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  style={styles.btnSecondary}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
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
  headerBtnGroup: {
    display: 'flex',
    gap: '12px',
  },
  btnPrimary: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 18px',
    backgroundColor: '#ea580c',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(234, 88, 12, 0.2)',
  },
  btnSecondary: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
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
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  searchWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: '1',
    minWidth: '240px',
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
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  filtersGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  categorySelect: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#374151',
    outline: 'none',
  },
  vegFilterBtn: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 14px',
    borderRadius: '8px',
    border: '1px solid',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
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
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },
  tdRight: {
    padding: '14px 20px',
    textAlign: 'right',
  },
  itemInfoCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemThumb: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    objectFit: 'cover',
  },
  thumbPlaceholder: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
  },
  itemDesc: {
    fontSize: '11px',
    color: '#6b7280',
    marginTop: '2px',
    maxWidth: '260px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  catBadge: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
  },
  vegBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid',
    padding: '3px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 700,
  },
  prepTime: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6b7280',
  },
  toggleBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    border: '1px solid',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  actionBtns: {
    display: 'inline-flex',
    gap: '8px',
  },
  iconBtnEdit: {
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    backgroundColor: '#ffffff',
    color: '#2563eb',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDelete: {
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #fecaca',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
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
    marginBottom: '16px',
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
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb',
  },
  modalTitle: {
    fontSize: '17px',
    fontWeight: 700,
    color: '#111827',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
  },
  modalBody: {
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    outline: 'none',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  row2: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    alignItems: 'center',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#374151',
    fontWeight: 600,
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#ea580c',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '12px',
  },
};
