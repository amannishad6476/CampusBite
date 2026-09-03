import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { Campus, College, Block, Hostel, OrderCreatePayload } from '../../types';

export default function CheckoutScreen({ navigation }: any) {
  const { user, selectedCampusId } = useAuth();
  const { cartItems, shopId, shopName, subtotal, deliveryFee, taxFee, grandTotal, clearCart } = useCart();
  const { addNotification } = useNotifications();

  const studentDetails = user?.student || user?.student_details;

  // Address selection state
  const [campus, setCampus] = useState<Campus | null>(null);
  const [isHosteler, setIsHosteler] = useState(studentDetails?.is_hosteler ?? true);
  const [phone, setPhone] = useState(user?.phone || '');
  const [floorLevel, setFloorLevel] = useState(studentDetails?.floor_level || '');
  const [roomNumber, setRoomNumber] = useState(studentDetails?.room_number || '');

  // Lists from backend
  const [colleges, setColleges] = useState<College[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Selected names/IDs
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(studentDetails?.college_id || null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(studentDetails?.block_id || null);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(studentDetails?.hostel_id || null);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCampusHierarchy() {
      try {
        const campuses = await apiService.getCampuses();
        const currentCampus = campuses.find((c) => c.id === selectedCampusId) || campuses[0] || null;
        setCampus(currentCampus);

        const targetCampusId = currentCampus ? currentCampus.id : 1;
        const [cols, blks, hsts] = await Promise.all([
          apiService.getColleges(targetCampusId),
          apiService.getBlocks(targetCampusId),
          apiService.getHostels(targetCampusId),
        ]);

        setColleges(cols);
        setBlocks(blks);
        setHostels(hsts);

        if (!selectedHostelId && hsts.length > 0) {
          setSelectedHostelId(hsts[0].id);
        }
        if (!selectedCollegeId && cols.length > 0) {
          setSelectedCollegeId(cols[0].id);
        }
        if (!selectedBlockId && blks.length > 0) {
          setSelectedBlockId(blks[0].id);
        }
      } catch (err) {
        console.warn('Could not load checkout campus hierarchy:', err);
      }
    }
    loadCampusHierarchy();
  }, [selectedCampusId]);

  const handlePlaceOrder = async () => {
    if (!shopId) {
      Alert.alert('Empty Cart', 'Please add items to your cart before proceeding.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit delivery contact number.');
      return;
    }

    const selectedHostel = hostels.find((h) => h.id === selectedHostelId);
    const selectedCollege = colleges.find((c) => c.id === selectedCollegeId);
    const selectedBlock = blocks.find((b) => b.id === selectedBlockId);

    const deliveryAddress = {
      campus_name: campus?.name || 'Campus',
      college_name: !isHosteler && selectedCollege ? selectedCollege.name : null,
      block_name: !isHosteler && selectedBlock ? selectedBlock.name : null,
      hostel_name: isHosteler && selectedHostel ? selectedHostel.name : null,
      floor_level: floorLevel.trim() || 'Ground Floor',
      room_number: roomNumber.trim() || 'Main Gate / Reception',
      phone: phone.trim(),
    };

    const payload: OrderCreatePayload = {
      shop_id: shopId,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      items: cartItems.map((item) => ({
        food_item_id: item.food_item.id,
        quantity: item.quantity,
        notes: item.notes || null,
      })),
    };

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const createdOrder = await apiService.placeOrder(payload);

      // Add student notification
      await addNotification(
        'Order Placed Successfully! 🎉',
        `Your order #${createdOrder.order_number} has been submitted to ${shopName || 'the canteen'}. Share your OTP upon delivery!`,
        'ORDER',
        createdOrder.id
      );

      // Clear the cart
      clearCart();

      // Navigate to order confirmation
      navigation.replace('OrderConfirmation', {
        order: createdOrder,
        shopName: shopName || createdOrder.shop_name,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Checkout Order</Text>
          <Text style={styles.headerSub}>{shopName || 'Campus Canteen'}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Section 1: Delivery Location */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location" size={20} color="#FF5722" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Delivery Location</Text>
          </View>

          <Text style={styles.campusBadgeText}>
            Campus: <Text style={{ fontWeight: '700' }}>{campus?.name || 'Loading...'}</Text>
          </Text>

          {/* Toggle: Hostel vs Academic Block */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isHosteler && styles.toggleBtnActive]}
              onPress={() => setIsHosteler(true)}
            >
              <Ionicons
                name="bed-outline"
                size={16}
                color={isHosteler ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.toggleBtnText, isHosteler && styles.toggleBtnTextActive]}>
                Hostel Room
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, !isHosteler && styles.toggleBtnActive]}
              onPress={() => setIsHosteler(false)}
            >
              <Ionicons
                name="school-outline"
                size={16}
                color={!isHosteler ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.toggleBtnText, !isHosteler && styles.toggleBtnTextActive]}>
                Academic Block
              </Text>
            </TouchableOpacity>
          </View>

          {isHosteler ? (
            <View style={styles.dropdownSection}>
              <Text style={styles.inputLabel}>Hostel Name</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                {hostels.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.pill, selectedHostelId === h.id && styles.pillActive]}
                    onPress={() => setSelectedHostelId(h.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedHostelId === h.id && styles.pillTextActive,
                      ]}
                    >
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.dropdownSection}>
              <Text style={styles.inputLabel}>Academic Block / Department</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                {blocks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.pill, selectedBlockId === b.id && styles.pillActive]}
                    onPress={() => setSelectedBlockId(b.id)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        selectedBlockId === b.id && styles.pillTextActive,
                      ]}
                    >
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Floor & Room */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Floor / Level</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2nd Floor"
                placeholderTextColor="#94A3B8"
                value={floorLevel}
                onChangeText={setFloorLevel}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Room / Lab No.</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Room 204"
                placeholderTextColor="#94A3B8"
                value={roomNumber}
                onChangeText={setRoomNumber}
              />
            </View>
          </View>

          {/* Contact Phone */}
          <View style={{ marginTop: 12 }}>
            <Text style={styles.inputLabel}>Contact Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
        </View>

        {/* Section 2: Payment Method */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="card" size={20} color="#FF5722" style={{ marginRight: 8 }} />
            <Text style={styles.cardTitle}>Payment Method</Text>
          </View>

          {/* COD Option */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('COD')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioDotCircle}>
                {paymentMethod === 'COD' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentTitle}>Cash on Delivery (COD)</Text>
                <Text style={styles.paymentSub}>Pay with cash or UPI QR directly to rider</Text>
              </View>
            </View>
            <View style={styles.recBadge}>
              <Text style={styles.recBadgeText}>Recommended</Text>
            </View>
          </TouchableOpacity>

          {/* Online Option */}
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('ONLINE')}
            activeOpacity={0.8}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.radioDotCircle}>
                {paymentMethod === 'ONLINE' && <View style={styles.radioDotInner} />}
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.paymentTitle}>Pay Online (UPI / Cards)</Text>
                <Text style={styles.paymentSub}>UPI / Netbanking payment gateway</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Section 3: Order Items Summary */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary ({cartItems.length} items)</Text>
          {cartItems.map((ci) => (
            <View key={ci.food_item.id} style={styles.summaryItemRow}>
              <Text style={styles.summaryItemName}>
                {ci.quantity}x {ci.food_item.name}
              </Text>
              <Text style={styles.summaryItemPrice}>
                ₹{(Number(ci.food_item.price) * ci.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Subtotal</Text>
            <Text style={styles.billLineVal}>₹{subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Delivery Fee</Text>
            <Text style={styles.billLineVal}>₹{deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLineLabel}>Taxes & Fees</Text>
            <Text style={styles.billLineVal}>₹{taxFee.toFixed(2)}</Text>
          </View>
          <View style={[styles.billLine, { marginTop: 6 }]}>
            <Text style={styles.finalTotalLabel}>Grand Total</Text>
            <Text style={styles.finalTotalVal}>₹{grandTotal.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Submit Button Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barPayLabel}>TOTAL AMOUNT</Text>
          <Text style={styles.barPayVal}>₹{grandTotal.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeOrderBtn, submitting && styles.btnDisabled]}
          onPress={handlePlaceOrder}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text style={styles.placeOrderText}>Place Order Now</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </>
          )}
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
  backBtn: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  campusBadgeText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  dropdownSection: {
    marginBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  twoColRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  paymentOptionSelected: {
    borderColor: '#FF5722',
    backgroundColor: '#FFFBF9',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioDotCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF5722',
  },
  paymentTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  paymentSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  recBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryItemName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billLineLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billLineVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  finalTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  finalTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF5722',
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
  barPayLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  barPayVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  placeOrderBtn: {
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
  btnDisabled: {
    backgroundColor: '#FFAB91',
  },
  placeOrderText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
