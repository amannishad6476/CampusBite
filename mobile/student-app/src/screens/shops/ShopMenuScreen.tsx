import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TextInput,
  StatusBar,
  ScrollView,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import apiService from '../../services/apiService';
import { FoodItem } from '../../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import FoodDetailModal from './FoodDetailModal';

export default function ShopMenuScreen({ route, navigation }: any) {
  const { shopId, shopName } = route.params;
  const {
    cartItems,
    addToCart,
    updateQuantity,
    clearCart,
    cartCount,
    subtotal,
    shopId: cartShopId,
  } = useCart();

  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [vegOnly, setVegOnly] = useState(false);

  // Detail Modal state
  const [selectedItemForModal, setSelectedItemForModal] = useState<FoodItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    async function loadMenu() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const menu = await apiService.getShopMenu(shopId);
        setMenuItems(menu);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load canteen menu items.');
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [shopId]);

  // Extract categories dynamically
  const categories = useMemo(() => {
    const catsMap = new Map<number, string>();
    menuItems.forEach((item) => {
      if (!catsMap.has(item.category_id)) {
        catsMap.set(item.category_id, `Category ${item.category_id}`);
      }
    });
    return Array.from(catsMap.entries()).map(([id, label]) => ({ id, label }));
  }, [menuItems]);

  // Filtered menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory !== 'all' && item.category_id !== selectedCategory) return false;
    if (vegOnly && !item.is_veg) return false;
    return true;
  });

  const handleAddToCart = (item: FoodItem, quantity = 1, notes = '') => {
    try {
      addToCart(item, quantity, notes, shopName);
    } catch (err: any) {
      Alert.alert(
        'Cart Conflict',
        err.message || 'Your cart contains food from another canteen.',
        [
          { text: 'Keep Current Cart', style: 'cancel' },
          {
            text: 'Clear & Add',
            style: 'destructive',
            onPress: () => {
              clearCart();
              addToCart(item, quantity, notes, shopName);
            },
          },
        ]
      );
    }
  };

  const getQuantityInCart = (itemId: string): number => {
    const found = cartItems.find((i) => i.food_item.id === itemId);
    return found ? found.quantity : 0;
  };

  const openFoodModal = (item: FoodItem) => {
    setSelectedItemForModal(item);
    setModalVisible(true);
  };

  const renderFoodCard = ({ item }: { item: FoodItem }) => {
    const qty = getQuantityInCart(item.id);

    return (
      <TouchableOpacity
        style={styles.foodCard}
        onPress={() => openFoodModal(item)}
        activeOpacity={0.8}
      >
        <View style={styles.foodInfo}>
          {/* Veg / Non-Veg Indicator */}
          <View style={styles.vegIndicatorRow}>
            <View
              style={[
                styles.vegBadgeBorder,
                { borderColor: item.is_veg ? '#10B981' : '#EF4444' },
              ]}
            >
              <View
                style={[
                  styles.vegBadgeDot,
                  { backgroundColor: item.is_veg ? '#10B981' : '#EF4444' },
                ]}
              />
            </View>
            <Text style={[styles.vegLabel, { color: item.is_veg ? '#047857' : '#B91C1C' }]}>
              {item.is_veg ? 'VEG' : 'NON-VEG'}
            </Text>
          </View>

          <Text style={styles.foodName}>{item.name}</Text>
          <Text style={styles.foodPrice}>₹{Number(item.price).toFixed(2)}</Text>

          {item.description ? (
            <Text style={styles.foodDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}

          {item.preparation_time && (
            <View style={styles.prepRow}>
              <Ionicons name="time-outline" size={12} color="#94A3B8" />
              <Text style={styles.prepText}>{item.preparation_time}m prep</Text>
            </View>
          )}
        </View>

        {/* Action button */}
        <View style={styles.foodActionCol}>
          <View style={styles.foodImagePlaceholder}>
            <Ionicons
              name={item.is_veg ? 'leaf-outline' : 'flame-outline'}
              size={28}
              color={item.is_veg ? '#10B981' : '#EF4444'}
            />
          </View>

          {!item.is_available ? (
            <View style={styles.outOfStockBadge}>
              <Text style={styles.outOfStockText}>SOLD OUT</Text>
            </View>
          ) : qty === 0 ? (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddToCart(item, 1)}
            >
              <Text style={styles.addButtonText}>ADD</Text>
              <Ionicons name="add" size={14} color="#FF5722" />
            </TouchableOpacity>
          ) : (
            <View style={styles.stepperBox}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(item.id, qty - 1)}
              >
                <Ionicons name="remove" size={14} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.stepperText}>{qty}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(item.id, qty + 1)}
              >
                <Ionicons name="add" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Canteen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {shopName || 'Campus Canteen'}
          </Text>
          <Text style={styles.headerSubtitle}>Order freshly prepared food</Text>
        </View>
        <TouchableOpacity
          style={styles.headerCartBtn}
          onPress={() => navigation.navigate('CartTab')}
        >
          <Ionicons name="cart-outline" size={22} color="#1E293B" />
          {cartCount > 0 && (
            <View style={styles.cartCountBadge}>
              <Text style={styles.cartCountText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search & Veg Filter Row */}
      <View style={styles.filterRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#94A3B8" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search in menu..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.vegFilterBtn, vegOnly && styles.vegFilterBtnActive]}
          onPress={() => setVegOnly(!vegOnly)}
        >
          <View
            style={[
              styles.vegBadgeBorder,
              { borderColor: vegOnly ? '#FFFFFF' : '#10B981', marginRight: 4 },
            ]}
          >
            <View
              style={[
                styles.vegBadgeDot,
                { backgroundColor: vegOnly ? '#FFFFFF' : '#10B981' },
              ]}
            />
          </View>
          <Text style={[styles.vegFilterText, vegOnly && styles.vegFilterTextActive]}>
            VEG ONLY
          </Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills if multiple */}
      {categories.length > 1 && (
        <View style={styles.categoriesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <TouchableOpacity
              style={[styles.catPill, selectedCategory === 'all' && styles.catPillActive]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text
                style={[
                  styles.catPillText,
                  selectedCategory === 'all' && styles.catPillTextActive,
                ]}
              >
                All Items ({menuItems.length})
              </Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.catPill, selectedCategory === c.id && styles.catPillActive]}
                onPress={() => setSelectedCategory(c.id)}
              >
                <Text
                  style={[
                    styles.catPillText,
                    selectedCategory === c.id && styles.catPillTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Menu List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Items Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery || vegOnly
              ? 'Try relaxing your search or vegetarian filter.'
              : 'This canteen has not listed menu items yet.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderFoodCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, cartCount > 0 && { paddingBottom: 90 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Floating Cart Bar (if cart has items) */}
      {cartCount > 0 && cartShopId === shopId && (
        <View style={styles.floatingCartBar}>
          <View style={styles.floatingCartCol}>
            <Text style={styles.floatingCartCount}>
              {cartCount} {cartCount > 1 ? 'ITEMS' : 'ITEM'}
            </Text>
            <Text style={styles.floatingCartTotal}>₹{subtotal.toFixed(2)} plus taxes</Text>
          </View>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => navigation.navigate('CartTab')}
          >
            <Text style={styles.floatingCartBtnText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        visible={modalVisible}
        item={selectedItemForModal}
        onClose={() => setModalVisible(false)}
        onAddToCart={handleAddToCart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  headerCartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5722',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  cartCountText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
  },
  vegFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  vegFilterBtnActive: {
    backgroundColor: '#10B981',
  },
  vegFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
  },
  vegFilterTextActive: {
    color: '#FFFFFF',
  },
  categoriesBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  catScroll: {
    paddingHorizontal: 16,
  },
  catPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  catPillActive: {
    backgroundColor: '#FF5722',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  foodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  foodInfo: {
    flex: 1,
    marginRight: 12,
  },
  vegIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegBadgeBorder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  vegBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  foodName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  foodPrice: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FF5722',
    marginBottom: 4,
  },
  foodDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  prepText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 3,
  },
  foodActionCol: {
    alignItems: 'center',
  },
  foodImagePlaceholder: {
    width: 72,
    height: 64,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  outOfStockBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  outOfStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FF5722',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 5,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FF5722',
    marginRight: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 8,
    overflow: 'hidden',
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    paddingHorizontal: 6,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  floatingCartCol: {
    justifyContent: 'center',
  },
  floatingCartCount: {
    fontSize: 11,
    fontWeight: '800',
    color: '#CBD5E1',
    letterSpacing: 0.5,
  },
  floatingCartTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  floatingCartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
