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
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import apiService from '../../services/apiService';
import { Ionicons } from '@expo/vector-icons';
import { Campus, College, Block, Hostel } from '../../types';

export default function CheckoutScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { cartItems, cartTotal, shopId, clearCart } = useCart();
  const { subtotal, deliveryFee, tax, total } = route.params || {
    subtotal: cartTotal,
    deliveryFee: 15.00,
    tax: 2.50,
    total: cartTotal + 17.50
  };

  const studentDetails = (user as any)?.student_details;

  // Form Fields (initialized with user profile details)
  const [phone, setPhone] = useState(user?.phone || '');
  const [floorLevel, setFloorLevel] = useState(studentDetails?.floor_level || '');
  const [roomNumber, setRoomNumber] = useState(studentDetails?.room_number || '');
  const [isHosteler, setIsHosteler] = useState(studentDetails?.is_hosteler || false);

  // Dynamic location names (for displaying in checkout summary)
  const [campusName, setCampusName] = useState('BBD University Campus');
  const [collegeName, setCollegeName] = useState('');
  const [blockName, setBlockName] = useState('');
  const [hostelName, setHostelName] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadAddressStrings() {
      if (!studentDetails) return;

      const campuses = await apiService.getCampuses();
      const currentCampus = campuses.find(c => c.id === studentDetails.campus_id);
      if (currentCampus) setCampusName(currentCampus.name);

      if (!studentDetails.is_hosteler) {
        if (studentDetails.college_id) {
          const colleges = await apiService.getColleges(studentDetails.campus_id);
          const col = colleges.find(c => c.id === studentDetails.college_id);
          if (col) setCollegeName(col.name);
        }
        if (studentDetails.block_id) {
          const blocks = await apiService.getBlocks(studentDetails.campus_id);
          const blk = blocks.find(b => b.id === studentDetails.block_id);
          if (blk) setBlockName(blk.name);
        }
      } else {
        if (studentDetails.hostel_id) {
          const hostels = await apiService.getHostels(studentDetails.campus_id);
          const hst = hostels.find(h => h.id === studentDetails.hostel_id);
          if (hst) setHostelName(hst.name);
        }
      }
    }
    loadAddressStrings();
  }, [studentDetails]);

  const handlePlaceOrder = async () => {
    if (!phone) {
      Alert.alert('Missing Field', 'Please provide a valid contact number.');
      return;
    }

    if (paymentMethod === 'ONLINE') {
      Alert.alert(
        'Payment Gateway Inactive',
        'Online Payment (Razorpay/Stripe) is currently disabled. Please select Cash on Delivery (COD) to test order creation.',
        [{ text: 'OK' }]
      );
      return;
    }

    const orderPayload = {
      shop_id: shopId,
      subtotal,
      delivery_fee: deliveryFee,
      discount: 0.00,
      tax,
      total_amount: total,
      payment_method: paymentMethod,
      delivery_address: {
        campus_name: campusName,
        college_name: !isHosteler ? collegeName : null,
        block_name: !isHosteler ? blockName : null,
        hostel_name: isHosteler ? hostelName : null,
        floor_level: floorLevel || null,
        room_number: roomNumber || null,
        phone
      },
      items: cartItems.map(item => ({
        food_item_id: item.food_item.id,
        name: item.food_item.name,
        price: item.food_item.price,
        quantity: item.quantity,
        notes: item.notes || null
      }))
    };

    setLoading(true);
    try {
      await apiService.placeOrder(orderPayload);
      clearCart();
      Alert.alert(
        'Order Placed!',
        'Your food order has been placed successfully.',
        [
          {
            text: 'Track Order',
            onPress: () => {
              // Redirect to Orders tab
              navigation.navigate('OrdersTab');
            }
          }
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to place order.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Delivery Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
          
          <View style={styles.addressBox}>
            <View style={styles.addressLine}>
              <Ionicons name="business" size={16} color="#757575" />
              <Text style={styles.addressText}>{campusName}</Text>
            </View>

            {!isHosteler ? (
              <>
                {collegeName && (
                  <View style={styles.addressLine}>
                    <Ionicons name="school" size={16} color="#757575" />
                    <Text style={styles.addressText}>{collegeName}</Text>
                  </View>
                )}
                {blockName && (
                  <View style={styles.addressLine}>
                    <Ionicons name="grid" size={16} color="#757575" />
                    <Text style={styles.addressText}>{blockName}</Text>
                  </View>
                )}
              </>
            ) : (
              hostelName && (
                <View style={styles.addressLine}>
                  <Ionicons name="home" size={16} color="#757575" />
                  <Text style={styles.addressText}>{hostelName}</Text>
                </View>
              )
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Floor / Level</Text>
              <TextInput
                style={styles.input}
                value={floorLevel}
                onChangeText={setFloorLevel}
                placeholder="e.g. 3rd Floor"
              />
            </View>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Room / Classroom</Text>
              <TextInput
                style={styles.input}
                value={roomNumber}
                onChangeText={setRoomNumber}
                placeholder="e.g. Room 302"
              />
            </View>
          </View>

          <Text style={styles.label}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="Rider will call this number"
          />
        </View>

        {/* Payment Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'COD' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('COD')}
          >
            <Ionicons
              name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'COD' ? '#FF5722' : '#757575'}
            />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>Cash on Delivery (COD)</Text>
              <Text style={styles.paymentDesc}>Pay cash or scan QR code when food arrives.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.paymentOption, paymentMethod === 'ONLINE' && styles.paymentOptionSelected]}
            onPress={() => setPaymentMethod('ONLINE')}
          >
            <Ionicons
              name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={paymentMethod === 'ONLINE' ? '#FF5722' : '#757575'}
            />
            <View style={styles.paymentTextCol}>
              <Text style={styles.paymentName}>Online Payment (Razorpay/Stripe)</Text>
              <Text style={styles.paymentDesc}>Disabled temporarily (Integration pending).</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {cartItems.map((item, idx) => (
            <View key={idx} style={styles.summaryItemRow}>
              <Text style={styles.summaryQty}>{item.quantity}x</Text>
              <Text style={styles.summaryName}>{item.food_item.name}</Text>
              <Text style={styles.summaryPrice}>₹{(item.food_item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.billingSummary}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Charge</Text>
              <Text style={styles.billValue}>₹{deliveryFee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Taxes</Text>
              <Text style={styles.billValue}>₹{tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.billRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>Total Amount</Text>
              <Text style={styles.grandTotalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Place Order Bar */}
      <View style={styles.footerBar}>
        <View style={styles.footerPriceCol}>
          <Text style={styles.footerPriceLabel}>Final Total</Text>
          <Text style={styles.footerPriceValue}>₹{total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, loading && styles.placeBtnDisabled]}
          onPress={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.placeBtnText}>Place Order</Text>
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginLeft: 6 }} />
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
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 6,
  },
  addressBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#37474f',
    marginLeft: 8,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexHalf: {
    width: '48%',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#fafafa',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  paymentOptionSelected: {
    borderColor: '#FF5722',
    backgroundColor: '#fff3e0',
  },
  paymentTextCol: {
    marginLeft: 12,
    flex: 1,
  },
  paymentName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  paymentDesc: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  summaryQty: {
    fontSize: 14,
    color: '#FF5722',
    fontWeight: 'bold',
    width: 30,
  },
  summaryName: {
    fontSize: 14,
    color: '#212121',
    flex: 1,
  },
  summaryPrice: {
    fontSize: 14,
    color: '#37474f',
    fontWeight: 'bold',
  },
  billingSummary: {
    marginTop: 16,
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  billLabel: {
    fontSize: 13,
    color: '#757575',
  },
  billValue: {
    fontSize: 13,
    color: '#212121',
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
    paddingTop: 8,
  },
  grandTotalLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
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
  placeBtn: {
    backgroundColor: '#4CAF50', // Green place order branding
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  placeBtnDisabled: {
    backgroundColor: '#a5d6a7',
  },
  placeBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
