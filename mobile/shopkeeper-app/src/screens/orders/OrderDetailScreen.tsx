import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import apiService from '../../services/apiService';
import { Order } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function OrderDetailScreen({ route, navigation }: any) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function loadOrderDetails() {
    try {
      const data = await apiService.getOrderDetails(orderId);
      setOrder(data);
    } catch (e) {
      console.error('Failed to load order details:', e);
      Alert.alert('Error', 'Failed to retrieve order details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrderDetails();
  }, [orderId]);

  const handleUpdateStatus = async (targetStatus: string) => {
    setUpdating(true);
    try {
      const updated = await apiService.updateOrderStatus(orderId, targetStatus);
      setOrder(updated);
      Alert.alert('Status Updated', `Order status successfully transitioned to ${targetStatus.replace(/_/g, ' ')}.`);
    } catch (e: any) {
      Alert.alert('Transition Refused', e.response?.data?.detail || 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const confirmReject = () => {
    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject & Cancel',
          style: 'destructive',
          onPress: () => handleUpdateStatus('CANCELLED')
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching order details...</Text>
      </View>
    );
  }

  if (!order) return null;

  const dateStr = new Date(order.created_at).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Order Header Summary */}
        <View style={styles.section}>
          <View style={styles.headerRow}>
            <Text style={styles.orderNo}>{order.order_number}</Text>
            <Text style={styles.orderDate}>{dateStr}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <Text style={[styles.statusValue, { color: '#FF5722' }]}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Deliver Address Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{order.delivery_address.campus_name}</Text>
            {order.delivery_address.college_name && (
              <Text style={styles.addressSub}>{order.delivery_address.college_name}</Text>
            )}
            <Text style={styles.addressSub}>
              {order.delivery_address.block_name || order.delivery_address.hostel_name}
              {order.delivery_address.floor_level ? `, Floor: ${order.delivery_address.floor_level}` : ''}
              {order.delivery_address.room_number ? `, Room: ${order.delivery_address.room_number}` : ''}
            </Text>
            <Text style={styles.addressPhone}>Contact Phone: {order.delivery_address.phone}</Text>
          </View>
        </View>

        {/* Items Listing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items Ordered</Text>
          {order.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <View style={styles.itemDetailCol}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.notes && <Text style={styles.itemNotes}>Note: "{item.notes}"</Text>}
              </View>
              <Text style={styles.itemQty}>{item.quantity}x</Text>
              <Text style={styles.itemPrice}>₹{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Bill Splits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bill Breakdown</Text>
          <View style={styles.billBox}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Subtotal</Text>
              <Text style={styles.billValue}>₹{order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Delivery Fee</Text>
              <Text style={styles.billValue}>₹{order.delivery_fee.toFixed(2)}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Tax & Platform Fee</Text>
              <Text style={styles.billValue}>₹{order.tax.toFixed(2)}</Text>
            </View>
            <View style={[styles.billRow, styles.totalRow]}>
              <Text style={styles.grandTotalLabel}>Grand Total</Text>
              <Text style={styles.grandTotalValue}>₹{order.total_amount.toFixed(2)}</Text>
            </View>
          </View>
          <View style={styles.paymentInfo}>
            <Text style={styles.payLabel}>Payment Method: {order.payment_method} ({order.payment_status})</Text>
          </View>
        </View>

        {/* Order tracking notes / verification codes */}
        {order.status === 'READY_FOR_PICKUP' && (
          <View style={styles.infoAlert}>
            <Ionicons name="bicycle" size={20} color="#2e7d32" />
            <Text style={styles.infoAlertText}>
              Food is ready. Waiting for delivery rider verification. Provide OTP code when requested.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Floating Action Buttons based on status */}
      {updating ? (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color="#FF5722" />
          <Text style={styles.loaderLabel}>Updating order status...</Text>
        </View>
      ) : (
        order.status === 'PENDING' && (
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.rejectBtn} onPress={confirmReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={() => handleUpdateStatus('ACCEPTED')}>
              <Text style={styles.acceptBtnText}>Accept Order</Text>
            </TouchableOpacity>
          </View>
        )
      )}

      {!updating && order.status === 'ACCEPTED' && (
        <View style={styles.footerSingleAction}>
          <TouchableOpacity style={styles.prepareBtn} onPress={() => handleUpdateStatus('PREPARING')}>
            <Text style={styles.prepareBtnText}>Start Preparing Food</Text>
          </TouchableOpacity>
        </View>
      )}

      {!updating && order.status === 'PREPARING' && (
        <View style={styles.footerSingleAction}>
          <TouchableOpacity style={styles.readyBtn} onPress={() => handleUpdateStatus('READY_FOR_PICKUP')}>
            <Text style={styles.readyBtnText}>Mark Ready for Pickup</Text>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
  section: {
    marginBottom: 24,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderNo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  orderDate: {
    fontSize: 13,
    color: '#9e9e9e',
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: '#757575',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 6,
  },
  addressBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#212121',
    fontWeight: 'bold',
  },
  addressSub: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 13,
    color: '#FF5722',
    fontWeight: 'bold',
    marginTop: 6,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  itemDetailCol: {
    flex: 1,
    marginRight: 16,
  },
  itemName: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    color: '#e65100',
    fontStyle: 'italic',
    marginTop: 2,
  },
  itemQty: {
    fontSize: 14,
    color: '#757575',
    width: 30,
    textAlign: 'center',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
    width: 80,
    textAlign: 'right',
  },
  billBox: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
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
  totalRow: {
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
  paymentInfo: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  payLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: '500',
  },
  infoAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
  },
  infoAlertText: {
    fontSize: 12,
    color: '#2e7d32',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  footerLoader: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderLabel: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 8,
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rejectBtn: {
    width: '32%',
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  rejectBtnText: {
    color: '#c62828',
    fontWeight: 'bold',
    fontSize: 16,
  },
  acceptBtn: {
    width: '64%',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  footerSingleAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
  },
  prepareBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  prepareBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  readyBtn: {
    backgroundColor: '#2e7d32',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  readyBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
