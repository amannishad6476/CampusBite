import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { useCart } from '../../context/CartContext';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../../types';

export default function CartScreen({ navigation }: any) {
  const {
    cartItems,
    shopName,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    deliveryFee,
    taxFee,
    grandTotal,
    cartCount,
  } = useCart();

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Are you sure you want to remove all items from your cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const renderCartItem = ({ item }: { item: CartItem }) => {
    const itemSubtotal = (Number(item.food_item.price) * item.quantity).toFixed(2);

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemMain}>
          <View style={styles.itemNameRow}>
            <View
              style={[
                styles.vegDotBorder,
                { borderColor: item.food_item.is_veg ? '#10B981' : '#EF4444' },
              ]}
            >
              <View
                style={[
                  styles.vegDot,
                  { backgroundColor: item.food_item.is_veg ? '#10B981' : '#EF4444' },
                ]}
              />
            </View>
            <Text style={styles.itemName}>{item.food_item.name}</Text>
          </View>

          <Text style={styles.itemRate}>₹{Number(item.food_item.price).toFixed(2)} each</Text>

          {item.notes ? (
            <View style={styles.noteBox}>
              <Ionicons name="chatbubble-ellipses-outline" size={12} color="#64748B" />
              <Text style={styles.noteText}>"{item.notes}"</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.itemControlsCol}>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateQuantity(item.food_item.id, item.quantity - 1)}
            >
              <Ionicons name="remove" size={14} color="#FF5722" />
            </TouchableOpacity>
            <Text style={styles.stepperText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.stepperBtn}
              onPress={() => updateQuantity(item.food_item.id, item.quantity + 1)}
            >
              <Ionicons name="add" size={14} color="#FF5722" />
            </TouchableOpacity>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.itemSubtotal}>₹{itemSubtotal}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => removeFromCart(item.food_item.id)}
            >
              <Ionicons name="trash-outline" size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.emptyIconCircle}>
          <Ionicons name="cart-outline" size={64} color="#FF5722" />
        </View>
        <Text style={styles.emptyTitle}>Your Cart is Empty</Text>
        <Text style={styles.emptySubtitle}>
          Satisfy your cravings! Browse hot snacks, teas, and meals from college canteens.
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate('HomeTab')}
        >
          <Text style={styles.browseBtnText}>Explore Campus Canteens</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.screenHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cartShopName} numberOfLines={1}>
            {shopName || 'Campus Canteen'}
          </Text>
          <Text style={styles.cartItemCount}>
            {cartCount} {cartCount > 1 ? 'items in order' : 'item in order'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClearCart} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        renderItem={renderCartItem}
        keyExtractor={(item) => item.food_item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.footerComponent}>
            {/* Bill Details Box */}
            <View style={styles.billCard}>
              <Text style={styles.billHeader}>Bill Summary</Text>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Item Total</Text>
                <Text style={styles.billVal}>₹{subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <View style={styles.feeInfoRow}>
                  <Text style={styles.billLabel}>Delivery Fee</Text>
                  <Ionicons
                    name="bicycle"
                    size={14}
                    color="#64748B"
                    style={{ marginLeft: 4 }}
                  />
                </View>
                <Text style={styles.billVal}>₹{deliveryFee.toFixed(2)}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Platform & Taxes</Text>
                <Text style={styles.billVal}>₹{taxFee.toFixed(2)}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Grand Total</Text>
                <Text style={styles.totalVal}>₹{grandTotal.toFixed(2)}</Text>
              </View>
            </View>

            {/* Delivery Guarantee Note */}
            <View style={styles.guaranteeBox}>
              <Ionicons name="shield-checkmark" size={18} color="#10B981" style={{ marginRight: 8 }} />
              <Text style={styles.guaranteeText}>
                OTP-verified delivery to your hostel room or academic department.
              </Text>
            </View>
          </View>
        }
      />

      {/* Bottom Checkout CTA */}
      <View style={styles.bottomBar}>
        <View style={styles.priceCol}>
          <Text style={styles.barTotalLabel}>TO PAY</Text>
          <Text style={styles.barTotalVal}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => navigation.navigate('Checkout')}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cartShopName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  cartItemCount: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  clearBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  itemRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemMain: {
    flex: 1,
    marginRight: 10,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  vegDotBorder: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  vegDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  itemRate: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 6,
    marginLeft: 20,
  },
  noteText: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginLeft: 4,
  },
  itemControlsCol: {
    alignItems: 'flex-end',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2EE',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCCBC',
    marginBottom: 6,
  },
  stepperBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stepperText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FF5722',
    paddingHorizontal: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemSubtotal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginRight: 8,
  },
  deleteBtn: {
    padding: 4,
  },
  footerComponent: {
    marginTop: 10,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  billHeader: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  feeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  totalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5722',
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
  },
  guaranteeText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
    fontWeight: '500',
  },
  bottomBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceCol: {
    justifyContent: 'center',
  },
  barTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  barTotalVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  checkoutBtn: {
    backgroundColor: '#FF5722',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  browseBtn: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  browseBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
