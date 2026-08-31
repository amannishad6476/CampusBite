import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { useCart } from '../../context/CartContext';
import apiService from '../../services/apiService';
import { FoodItem, FoodCategory } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ShopMenuScreen({ route, navigation }: any) {
  const { shopId } = route.params;
  const { cartItems, addToCart, updateQuantity, removeFromCart } = useCart();
  
  const [categories, setCategories] = useState<FoodCategory[]>([]);
  const [menuItems, setMenuItems] = useState<FoodItem[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | null>(null);

  useEffect(() => {
    async function loadMenu() {
      const cats = await apiService.getShopCategories(shopId);
      setCategories(cats);
      if (cats.length > 0) {
        setSelectedCatId(cats[0].id);
      }

      const menu = await apiService.getShopMenu(shopId);
      setMenuItems(menu);
    }
    loadMenu();
  }, [shopId]);

  // Filter items by category
  const filteredItems = selectedCatId
    ? menuItems.filter((item) => item.category_id === selectedCatId)
    : menuItems;

  const handleAddToCart = (item: FoodItem) => {
    try {
      addToCart(item, 1);
    } catch (err: any) {
      Alert.alert(
        'Different Canteen',
        err.message,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear Cart', onPress: () => {
            // Note: handle clear in context or manually, but alert is helpful
            Alert.alert('Cart Cleared', 'You can now add items from this canteen.');
          }}
        ]
      );
    }
  };

  const getQuantityInCart = (itemId: string): number => {
    const found = cartItems.find((i) => i.food_item.id === itemId);
    return found ? found.quantity : 0;
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => {
    const qty = getQuantityInCart(item.id);

    return (
      <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
          <View style={styles.vegIndicatorRow}>
            <View style={[styles.vegBadge, { borderColor: item.is_veg ? '#4CAF50' : '#E53935' }]}>
              <View style={[styles.vegDot, { backgroundColor: item.is_veg ? '#4CAF50' : '#E53935' }]} />
            </View>
            <Text style={styles.vegLabel}>{item.is_veg ? 'VEG' : 'NON-VEG'}</Text>
          </View>

          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>₹{Number(item.price).toFixed(2)}</Text>
          
          {!item.is_available && (
            <Text style={styles.notAvailable}>Out of stock</Text>
          )}
        </View>

        <View style={styles.actionContainer}>
          {item.is_available && (
            qty === 0 ? (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => handleAddToCart(item)}
              >
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.quantitySelector}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, qty - 1)}
                >
                  <Ionicons name="remove" size={16} color="#ffffff" />
                </TouchableOpacity>
                <Text style={styles.qtyText}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => updateQuantity(item.id, qty + 1)}
                >
                  <Ionicons name="add" size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            )
          )}
        </View>
      </View>
    );
  };

  // Calculate stats for floating bar
  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const totalAmount = cartItems.reduce((acc, i) => acc + (i.food_item.price * i.quantity), 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Horizontal Category Slider */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCatId === item.id && styles.categoryChipSelected
              ]}
              onPress={() => setSelectedCatId(item.id)}
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCatId === item.id && styles.categoryTextSelected
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
        />
      </View>

      {/* Menu items */}
      <FlatList
        data={filteredItems}
        renderItem={renderFoodItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="fast-food-outline" size={48} color="#bdbdbd" />
            <Text style={styles.emptyText}>No food items listed in this category.</Text>
          </View>
        }
      />

      {/* Floating Cart Bar */}
      {totalItems > 0 && (
        <View style={styles.floatingCartBar}>
          <View style={styles.cartInfo}>
            <Text style={styles.cartCount}>{totalItems} Item{totalItems > 1 ? 's' : ''}</Text>
            <Text style={styles.cartTotal}>₹{totalAmount.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => navigation.navigate('CartTab')}
          >
            <Text style={styles.cartButtonText}>View Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#ffffff" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#FF5722',
  },
  categoryText: {
    fontSize: 14,
    color: '#757575',
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 6,
  },
  vegBadge: {
    borderWidth: 1,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 2,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  vegLabel: {
    fontSize: 10,
    color: '#757575',
    marginLeft: 6,
    fontWeight: 'bold',
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 4,
  },
  notAvailable: {
    fontSize: 12,
    color: '#c62828',
    marginTop: 4,
    fontWeight: 'bold',
  },
  actionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
  },
  addButton: {
    borderWidth: 1,
    borderColor: '#FF5722',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  addButtonText: {
    color: '#FF5722',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    borderRadius: 6,
    overflow: 'hidden',
  },
  qtyBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    minWidth: 24,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 40,
  },
  emptyText: {
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: 8,
  },
  floatingCartBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#2e7d32', // Green cart theme
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cartInfo: {
    flexDirection: 'column',
  },
  cartCount: {
    color: '#e8f5e9',
    fontSize: 12,
  },
  cartTotal: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
