import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import apiService from '../../services/apiService';
import { Order } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveDeliveryScreen({ navigation }: any) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpInput, setOtpInput] = useState('');

  async function loadActiveOrder() {
    try {
      const active = await apiService.getActiveOrder();
      setOrder(active);
    } catch (e: any) {
      // 404 is returned if there's no active delivery
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadActiveOrder();

    // Auto refresh active delivery every 10 seconds
    const interval = setInterval(() => {
      loadActiveOrder();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadActiveOrder();
  };

  const handlePickup = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await apiService.pickupOrder(order.id);
      setOrder(updated);
      Alert.alert('Picked Up', 'Order successfully marked as picked up. Proceed to customer.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartDelivery = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const updated = await apiService.startDelivery(order.id);
      setOrder(updated);
      Alert.alert('In Transit', 'Order is now Out for Delivery. The student has been notified.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to start delivery.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!order || !otpInput) {
      Alert.alert('Missing Code', 'Please enter the verification OTP.');
      return;
    }
    setActionLoading(true);
    try {
      await apiService.verifyOtp(order.id, otpInput.trim());
      Alert.alert('Delivery Completed', 'OTP Verified! Earnings have been credited to your wallet.', [
        {
          text: 'Great',
          onPress: () => {
            setOrder(null);
            setOtpInput('');
            loadActiveOrder();
          }
        }
      ]);
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Invalid verification OTP code. Please try again.';
      Alert.alert('Verification Failed', msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnassign = () => {
    if (!order) return;
    Alert.alert(
      'Unassign Order',
      'Are you experiencing an issue? This will release the order back to the pickup pool so another rider can deliver it.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release Order',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              await apiService.unassignOrder(order.id, 'Rider requested emergency unassign before pickup');
              Alert.alert('Order Released', 'The order has been returned to the available pickup pool.');
              setOrder(null);
              loadActiveOrder();
            } catch (e: any) {
              Alert.alert('Error', e.response?.data?.detail || 'Failed to unassign order.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };


  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Fetching active delivery route...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.centerContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
        >
          <Ionicons name="bicycle-outline" size={80} color="#bdbdbd" />
          <Text style={styles.emptyTitle}>No Active Delivery</Text>
          <Text style={styles.emptySubtitle}>
            Go to the Dashboard to look for and claim new food orders waiting for delivery.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const itemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
      >
        {/* Status Indicator */}
        <View style={styles.statusBox}>
          <Text style={styles.orderNo}>{order.order_number}</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Maps Navigation Placeholder */}
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={32} color="#757575" />
          <Text style={styles.mapText}>Maps & Navigation Module</Text>
          <Text style={styles.mapDesc}>Pickup: {order.shop_name} ➔ Drop: {order.delivery_address.block_name || order.delivery_address.hostel_name}</Text>
          <Text style={styles.configAlert}>Configuration: Build handles maps integration via Mapbox/Google Maps keys.</Text>
        </View>

        {/* Addresses Section */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>1. Pickup Canteen</Text>
          <Text style={styles.canteenName}>{order.shop_name}</Text>
          <Text style={styles.detailText}>Location: Block A Academic Building</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>2. Drop-off Location</Text>
          <Text style={styles.dropName}>{order.delivery_address.campus_name}</Text>
          {order.delivery_address.college_name && (
            <Text style={styles.detailText}>{order.delivery_address.college_name}</Text>
          )}
          <Text style={styles.detailText}>
            {order.delivery_address.block_name || order.delivery_address.hostel_name}
            {order.delivery_address.floor_level ? `, Floor: ${order.delivery_address.floor_level}` : ''}
            {order.delivery_address.room_number ? `, Room: ${order.delivery_address.room_number}` : ''}
          </Text>
          <Text style={styles.phoneText}>Call Student: {order.delivery_address.phone}</Text>
        </View>

        {/* Order Items summary */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Items Details</Text>
          <Text style={styles.detailText}>{itemsCount} Item{itemsCount > 1 ? 's' : ''} • ₹{order.total_amount.toFixed(2)}</Text>
          <Text style={styles.payMethodText}>Payment: {order.payment_method} ({order.payment_status})</Text>
        </View>

        {/* Payout Earning details */}
        <View style={styles.payoutCard}>
          <View style={styles.payoutCol}>
            <Text style={styles.payoutLabel}>Rider Earnings</Text>
            <Text style={styles.payoutVal}>₹{order.delivery_fee.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.payoutCol}>
            <Text style={styles.payoutLabel}>Est. Distance</Text>
            <Text style={styles.payoutVal}>1.2 km</Text>
          </View>
        </View>

        {/* Step details actions */}
        <View style={styles.actionContainer}>
          {actionLoading ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <>
              {order.status === 'ASSIGNED' && (
                <>
                  <TouchableOpacity style={styles.primaryBtn} onPress={handlePickup}>
                    <Ionicons name="bag-handle-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Mark Picked Up at Canteen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.unassignBtn} onPress={handleUnassign}>
                    <Ionicons name="close-circle-outline" size={18} color="#D32F2F" style={{ marginRight: 6 }} />
                    <Text style={styles.unassignBtnText}>Release / Unassign Order</Text>
                  </TouchableOpacity>
                </>
              )}

              {order.status === 'PICKED_UP' && (
                <TouchableOpacity style={styles.transitBtn} onPress={handleStartDelivery}>
                  <Ionicons name="navigate-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnText}>Start Delivery Route</Text>
                </TouchableOpacity>
              )}

              {order.status === 'OUT_FOR_DELIVERY' && (
                <View style={styles.otpBox}>
                  <Text style={styles.otpLabel}>Enter Customer Verification OTP</Text>
                  <TextInput
                    style={styles.otpInput}
                    value={otpInput}
                    onChangeText={setOtpInput}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="e.g. 1234"
                  />
                  <TouchableOpacity style={styles.verifyBtn} onPress={handleVerifyOtp}>
                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnText}>Verify & Complete Delivery</Text>
                  </TouchableOpacity>

                  <View style={styles.otpNoticeBox}>
                    <Ionicons name="shield-checkmark-outline" size={18} color="#2E7D32" style={{ marginRight: 6 }} />
                    <Text style={styles.otpNoticeText}>
                      Ask the student for their 4-digit Delivery OTP shown in their app to finalize delivery.
                    </Text>
                  </View>
                </View>
              )}

            </>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 15,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  orderNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mapPlaceholder: {
    backgroundColor: '#e8f5e9',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#c5e1a5',
  },
  mapText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33691e',
    marginTop: 8,
  },
  mapDesc: {
    fontSize: 12,
    color: '#558b2f',
    marginTop: 4,
    textAlign: 'center',
  },
  configAlert: {
    fontSize: 10,
    color: '#757575',
    marginTop: 10,
    textAlign: 'center',
  },
  cardSection: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757575',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  canteenName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  dropName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  detailText: {
    fontSize: 14,
    color: '#37474f',
    marginTop: 4,
  },
  phoneText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginTop: 8,
  },
  payMethodText: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  payoutCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 28,
  },
  payoutCol: {
    flex: 1,
    alignItems: 'center',
  },
  payoutLabel: {
    fontSize: 12,
    color: '#757575',
  },
  payoutVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
  },
  actionContainer: {
    marginBottom: 20,
  },
  primaryBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  transitBtn: {
    backgroundColor: '#0288D1',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otpBox: {
    alignItems: 'stretch',
  },
  otpLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
    textAlign: 'center',
    marginBottom: 12,
  },
  otpInput: {
    borderWidth: 1,
    borderColor: '#c5e1a5',
    borderRadius: 8,
    padding: 12,
    fontSize: 22,
    color: '#212121',
    backgroundColor: '#fafafa',
    textAlign: 'center',
    letterSpacing: 8,
    marginBottom: 16,
  },
  verifyBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  debugAlert: {
    flexDirection: 'row',
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffe0b2',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  debugText: {
    fontSize: 12,
    color: '#e65100',
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  unassignBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unassignBtnText: {
    color: '#D32F2F',
    fontSize: 14,
    fontWeight: '600',
  },
  otpNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  otpNoticeText: {
    color: '#2E7D32',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
});

