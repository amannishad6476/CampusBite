import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import apiService from '../../services/apiService';
import { Order } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders() {
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '#FFA000'; // Amber
      case 'ACCEPTED':
        return '#0288D1'; // Light Blue
      case 'PREPARING':
        return '#7B1FA2'; // Purple
      case 'READY_FOR_PICKUP':
        return '#388E3C'; // Green
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return '#E65100'; // Dark Orange
      case 'DELIVERED':
        return '#2E7D32'; // Dark Green
      case 'CANCELLED':
        return '#D32F2F'; // Red
      default:
        return '#757575';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.shopName}>{item.shop_name}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        {/* Items list summary */}
        <View style={styles.itemsSummary}>
          {item.items.map((food, idx) => (
            <Text key={idx} style={styles.foodItemLine}>
              {food.quantity}x {food.name} {food.notes ? `(${food.notes})` : ''}
            </Text>
          ))}
        </View>

        {/* Address and Code details */}
        <View style={styles.deliveryDetailsRow}>
          <View style={styles.addressSection}>
            <Ionicons name="location-outline" size={14} color="#757575" />
            <Text style={styles.addressSnippet} numberOfLines={1}>
              {item.delivery_address.block_name || item.delivery_address.hostel_name}, {item.delivery_address.room_number}
            </Text>
          </View>
          
          {item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && (
            <View style={styles.otpSection}>
              <Text style={styles.otpLabel}>Delivery OTP</Text>
              <Text style={styles.otpValue}>{item.otp}</Text>
            </View>
          )}
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.orderNumber}>ID: {item.order_number}</Text>
          <Text style={styles.totalPrice}>Paid: ₹{Number(item.total_amount).toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching order history...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        renderItem={renderOrderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF5722']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#bdbdbd" />
            <Text style={styles.emptyTitle}>No Orders Yet</Text>
            <Text style={styles.emptySubtitle}>You have not placed any orders yet. Try checkout inside your cart!</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  listContent: {
    padding: 16,
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
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 12,
    marginBottom: 12,
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  orderDate: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  itemsSummary: {
    marginBottom: 12,
  },
  foodItemLine: {
    fontSize: 14,
    color: '#37474f',
    marginVertical: 2,
  },
  deliveryDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  addressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  addressSnippet: {
    fontSize: 13,
    color: '#757575',
    marginLeft: 6,
  },
  otpSection: {
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  otpLabel: {
    fontSize: 9,
    color: '#e65100',
    fontWeight: 'bold',
  },
  otpValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
    paddingTop: 12,
  },
  orderNumber: {
    fontSize: 11,
    color: '#9e9e9e',
  },
  totalPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
