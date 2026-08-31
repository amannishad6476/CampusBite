import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView
} from 'react-native';
import apiService from '../../services/apiService';
import { FoodCategory, FoodItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function MenuManagementScreen() {
  const [activeTab, setActiveTab] = useState<'ITEMS' | 'CATEGORIES'>('ITEMS');
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals visibility
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);

  // Category Form State
  const [editingCategory, setEditingCategory] = useState<FoodCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');

  // Item Form State
  const [editingItem, setEditingItem] = useState<FoodItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [itemIsVeg, setItemIsVeg] = useState(true);
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemPrepTime, setItemPrepTime] = useState('15');
  const [itemCategoryId, setItemCategoryId] = useState<number | null>(null);

  async function loadMenuData() {
    try {
      setLoading(true);
      const cats = await apiService.getCategories();
      setCategories(cats);

      const items = await apiService.getMenu();
      setMenuItems(items);
    } catch (e) {
      console.error('Failed to load menu details:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMenuData();
  }, []);

  // Category Actions
  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryModalVisible(true);
  };

  const openEditCategory = (cat: FoodCategory) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryModalVisible(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryName.trim()) return;

    try {
      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, categoryName.trim());
      } else {
        await apiService.createCategory(categoryName.trim());
      }
      setCategoryModalVisible(false);
      loadMenuData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save category.');
    }
  };

  const handleDeleteCategory = (catId: number) => {
    Alert.alert(
      'Delete Category',
      'Are you sure? This will delete the category.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteCategory(catId);
              loadMenuData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete.');
            }
          }
        }
      ]
    );
  };

  // Item Actions
  const openAddItem = () => {
    if (categories.length === 0) {
      Alert.alert('Create Category First', 'You must create at least one category before adding food items.');
      return;
    }
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemDesc('');
    setItemImage('');
    setItemIsVeg(true);
    setItemIsAvailable(true);
    setItemPrepTime('15');
    setItemCategoryId(categories[0].id);
    setItemModalVisible(true);
  };

  const openEditItem = (item: FoodItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemDesc(item.description || '');
    setItemImage(item.image_url || '');
    setItemIsVeg(item.is_veg);
    setItemIsAvailable(item.is_available);
    setItemPrepTime(String(item.preparation_time));
    setItemCategoryId(item.category_id);
    setItemModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!itemName || !itemPrice || !itemCategoryId) {
      Alert.alert('Missing Fields', 'Please enter Name, Price, and Category.');
      return;
    }

    const payload = {
      name: itemName.trim(),
      price: Number(itemPrice),
      description: itemDesc.trim() || null,
      image_url: itemImage.trim() || null,
      is_veg: itemIsVeg,
      is_available: itemIsAvailable,
      category_id: itemCategoryId,
      preparation_time: Number(itemPrepTime)
    };

    try {
      if (editingItem) {
        await apiService.updateMenuItem(editingItem.id, payload);
      } else {
        await apiService.createMenuItem(payload);
      }
      setItemModalVisible(false);
      loadMenuData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save item.');
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Food Item',
      'Are you sure you want to delete this menu item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteMenuItem(itemId);
              loadMenuData();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete.');
            }
          }
        }
      ]
    );
  };

  const toggleItemAvailability = async (item: FoodItem, val: boolean) => {
    try {
      await apiService.updateMenuItem(item.id, { is_available: val });
      setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: val } : i));
    } catch (e: any) {
      Alert.alert('Error', 'Failed to toggle availability.');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching menu catalog...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Segmented control tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ITEMS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ITEMS')}
        >
          <Text style={[styles.tabText, activeTab === 'ITEMS' && styles.tabTextActive]}>Menu Items</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'CATEGORIES' && styles.tabBtnActive]}
          onPress={() => setActiveTab('CATEGORIES')}
        >
          <Text style={[styles.tabText, activeTab === 'CATEGORIES' && styles.tabTextActive]}>Categories</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content lists */}
      {activeTab === 'ITEMS' ? (
        <FlatList
          data={menuItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <View style={styles.vegIndicatorRow}>
                  <View style={[styles.vegBadge, { borderColor: item.is_veg ? '#4CAF50' : '#E53935' }]}>
                    <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#E53935' }]} />
                  </View>
                  <Text style={styles.categoryNameTag}>
                    {categories.find(c => c.id === item.category_id)?.name || 'General'}
                  </Text>
                </View>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemPrice}>₹{Number(item.price).toFixed(2)}</Text>
                {item.description && (
                  <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
                )}
                <Text style={styles.prepTime}>Prep Time: {item.preparation_time} mins</Text>
              </View>

              <View style={styles.itemActions}>
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>{item.is_available ? 'Available' : 'Out'}</Text>
                  <Switch
                    value={item.is_available}
                    onValueChange={(val) => toggleItemAvailability(item, val)}
                    trackColor={{ false: '#767577', true: '#ffab91' }}
                    thumbColor={item.is_available ? '#FF5722' : '#f4f3f4'}
                  />
                </View>
                <View style={styles.btnIconsRow}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEditItem(item)}>
                    <Ionicons name="create-outline" size={18} color="#FF5722" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteItem(item.id)}>
                    <Ionicons name="trash-outline" size={18} color="#E53935" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="fast-food-outline" size={48} color="#bdbdbd" />
              <Text style={styles.emptyText}>No food items added yet.</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            <View style={styles.categoryRow}>
              <Text style={styles.catName}>{item.name}</Text>
              <View style={styles.btnIconsRow}>
                <TouchableOpacity style={styles.iconBtn} onPress={() => openEditCategory(item)}>
                  <Ionicons name="create-outline" size={18} color="#FF5722" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteCategory(item.id)}>
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="grid-outline" size={48} color="#bdbdbd" />
              <Text style={styles.emptyText}>No food categories created yet.</Text>
            </View>
          }
        />
      )}

      {/* Add Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={activeTab === 'ITEMS' ? openAddItem : openAddCategory}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Categories CRUD Dialog Modal */}
      <Modal visible={categoryModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingCategory ? 'Edit Category' : 'Add Category'}</Text>
            <TextInput
              style={styles.modalInput}
              value={categoryName}
              onChangeText={setCategoryName}
              placeholder="e.g. Quick Bites"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleSaveCategory}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Menu Item Add/Edit Modal */}
      <Modal visible={itemModalVisible} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <ScrollView contentContainerStyle={styles.scrollModalContainer}>
            <View style={styles.itemModalContent}>
              <Text style={styles.modalTitle}>{editingItem ? 'Edit Food Item' : 'Add Food Item'}</Text>
              
              <Text style={styles.formLabel}>Food Name</Text>
              <TextInput style={styles.modalInput} value={itemName} onChangeText={setItemName} placeholder="e.g. Masala Dosa" />

              <Text style={styles.formLabel}>Price (₹)</Text>
              <TextInput style={styles.modalInput} value={itemPrice} onChangeText={setItemPrice} keyboardType="numeric" placeholder="e.g. 50.00" />

              <Text style={styles.formLabel}>Description</Text>
              <TextInput style={[styles.modalInput, { height: 60 }]} value={itemDesc} onChangeText={setItemDesc} placeholder="Short item description" multiline />

              <Text style={styles.formLabel}>Image URL</Text>
              <TextInput style={styles.modalInput} value={itemImage} onChangeText={setItemImage} placeholder="http://example.com/item.png" autoCapitalize="none" />

              <Text style={styles.formLabel}>Preparation Time (minutes)</Text>
              <TextInput style={styles.modalInput} value={itemPrepTime} onChangeText={setItemPrepTime} keyboardType="numeric" placeholder="e.g. 15" />

              <Text style={styles.formLabel}>Select Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catChipsScroll}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catChip, itemCategoryId === c.id && styles.catChipSelected]}
                    onPress={() => setItemCategoryId(c.id)}
                  >
                    <Text style={[styles.catChipText, itemCategoryId === c.id && styles.catChipTextSelected]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalToggleRow}>
                <Text style={styles.toggleTitleText}>Veg Item</Text>
                <Switch value={itemIsVeg} onValueChange={setItemIsVeg} trackColor={{ false: '#767577', true: '#ffab91' }} thumbColor={itemIsVeg ? '#FF5722' : '#f4f3f4'} />
              </View>

              <View style={styles.modalToggleRow}>
                <Text style={styles.toggleTitleText}>In Stock / Available</Text>
                <Switch value={itemIsAvailable} onValueChange={setItemIsAvailable} trackColor={{ false: '#767577', true: '#ffab91' }} thumbColor={itemIsAvailable ? '#FF5722' : '#f4f3f4'} />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setItemModalVisible(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSave} onPress={handleSaveItem}>
                  <Text style={styles.saveText}>Save Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 15,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fafafa',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  tabText: {
    fontSize: 15,
    color: '#757575',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FF5722',
  },
  listPadding: {
    padding: 16,
    paddingBottom: 100,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemInfo: {
    flex: 1,
    marginRight: 16,
  },
  vegIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegBadge: {
    borderWidth: 1,
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryNameTag: {
    fontSize: 10,
    color: '#9e9e9e',
    fontWeight: 'bold',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  prepTime: {
    fontSize: 11,
    color: '#9e9e9e',
    marginTop: 4,
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 11,
    color: '#757575',
    marginRight: 6,
  },
  btnIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: 8,
    marginLeft: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  catName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#FF5722',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyText: {
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: 8,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#fcfcfc',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 8,
  },
  cancelText: {
    color: '#757575',
    fontWeight: 'bold',
  },
  modalSave: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  scrollModalContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  itemModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 6,
  },
  catChipsScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  catChip: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  catChipSelected: {
    borderColor: '#FF5722',
    backgroundColor: '#fff3e0',
  },
  catChipText: {
    fontSize: 12,
    color: '#757575',
  },
  catChipTextSelected: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  modalToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  toggleTitleText: {
    fontSize: 14,
    color: '#212121',
  },
});
