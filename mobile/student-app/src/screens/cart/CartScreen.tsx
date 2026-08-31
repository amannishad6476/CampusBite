import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../../types';

export default function CartScreen({ navigation }: any) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

  // Pricing Parameters
  const deliveryFee = cartTotal > 0 ? 15.00 : 0.00;
  const taxFee = cartTotal > 0 ? 2.50 : 0.00;
  const grandTotal = cartTotal + deliveryFee + taxFee;

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const itemSubtotal = item.food_item.price * item.quantity;
    
    return (
      <View style={styles.itemRow}>
        <View style={styles.itemHeader}>
          <Text style={styles.itemName}>{item.food_item.name}</Text>
          <Text style={styles.itemRate}>₹{Number(item.food_item.price).toFixed(2)} each</Text>
        </View>

        <View style={styles.controlsRow}>
          {/* Quantity selector */}
          <View style={styles.quantitySelector}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.food_item.id, item.quantity - 1)}
            >
              <Ionicons name="remove" size={14} color="#757575" />
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.food_item.id, item.quantity + 1)}
            >
              <Ionicons name="add" size={14} color="#757575" />
            </TouchableOpacity>
          </View>

          {/* Subtotal */}
          <Text style={styles.itemSubtotal}>₹{itemSubtotal.toFixed(2)}</Text>
          
          {/* Delete */}
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => removeFromCart(item.food_item.id)}
          >
            <Ionicons name="trash-outline" size={18} color="#E53935" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={80} color="#bdbdbd" />
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>Explore active canteens and add items to satisfy your cravings.</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.browseBtnText}>Browse Food</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.food_item.id}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.headerTitle}>Order Items</Text>
            <TouchableOpacity onPress={clearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          <View style={styles.billContainer}>
            <Text style={styles.billTitle}>Bill Details</Text>
            
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Item Total</Text>
              <Text style={styles.billValue}>₹{cartTotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charge</Text>
              <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes & Fees</Text>
              <Text style={styles.billValue}>₹{taxFee.toFixed(2)}</Text>
            </View>

            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
            </View>

            <View style={styles.notesBox}>
              <Ionicons name="shield-checkmark" size={16} color="#4CAF50" />
              <Text style={styles.notesBoxText}>
                No contact delivery active. Food will be delivered to your selected drop-off point.
              </Text>
            </View>
          </View>
        }
        contentContainerStyle={styles.scrollContent}
      />

      {/* Floating proceed button */}
      <View style={styles.footerBar}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerPriceLabel}>To Pay</Text>
          <Text style={styles.footerPriceValue}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('HomeTab', {
            screen: 'Checkout',
            params: { subtotal: cartTotal, deliveryFee, tax: taxFee, total: grandTotal }
          })}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
  },
  clearText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemHeader: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemRate: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 6,
    backgroundColor: '#fcfcfc',
  },
  qtyBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  qtyText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
    minWidth: 20,
    textAlign: 'center',
  },
  itemSubtotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#37474f',
    flex: 1,
    textAlign: 'right',
    marginRight: 16,
  },
  deleteBtn: {
    padding: 4,
  },
  billContainer: {
    marginTop: 24,
    backgroundColor: '#fafafa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  billTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 14,
    color: '#757575',
  },
  billValue: {
    fontSize: 14,
    color: '#212121',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 10,
    paddingTop: 10,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  notesBoxText: {
    fontSize: 12,
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#ffffff',
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  browseBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 40,
    marginTop: 24,
  },
  browseBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerPriceCol: {
    flexDirection: 'column',
  },
  footerPriceLabel: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  checkoutBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
