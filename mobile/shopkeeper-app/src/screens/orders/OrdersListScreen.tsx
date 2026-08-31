import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView
} from 'react-native';
import apiService from '../../services/apiService';
import { Order } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function OrdersListScreen({ navigation }: any) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusTab, setStatusTab] = useState<'NEW' | 'ACTIVE' | 'HISTORY'>('NEW');

  async function loadOrders() {
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (e) {
      console.error('Failed to load orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
    
    // Auto-refresh orders list every 15 seconds to simulate push hooks
    const interval = setInterval(() => {
      loadOrders();
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  // Filter orders by segment
  const getFilteredOrders = () => {
    if (statusTab === 'NEW') {
      return orders.filter(o => o.status === 'PENDING');
    } else if (statusTab === 'ACTIVE') {
      return orders.filter(o => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status));
    } else {
      return orders.filter(o => ['DELIVERED', 'CANCELLED'].includes(o.status));
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#FFA000';
      case 'ACCEPTED': return '#0288D1';
      case 'PREPARING': return '#7B1FA2';
      case 'READY_FOR_PICKUP': return '#388E3C';
      case 'DELIVERED': return '#2E7D32';
      case 'CANCELLED': return '#D32F2F';
      default: return '#757575';
    }
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const totalItemsCount = item.items.reduce((acc, i) => acc + i.quantity, 0);

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNo}>{item.order_number}</Text>
            <Text style={styles.orderTime}>{timeStr} • {totalItemsCount} Item{totalItemsCount > 1 ? 's' : ''}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Ionicons name="location-outline" size={16} color="#757575" />
          <Text style={styles.addressSnippet} numberOfLines={1}>
            Deliver to: {item.delivery_address.block_name || item.delivery_address.hostel_name}, Room {item.delivery_address.room_number || 'N/A'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.totalLabel}>Total Bill</Text>
          <Text style={styles.totalValue}>₹{item.total_amount.toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Tab Selectors */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, statusTab === 'NEW' && styles.tabBtnActive]}
          onPress={() => setStatusTab('NEW')}
        >
          <Text style={[styles.tabText, statusTab === 'NEW' && styles.tabTextActive]}>
            New ({orders.filter(o => o.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, statusTab === 'ACTIVE' && styles.tabBtnActive]}
          onPress={() => setStatusTab('ACTIVE')}
        >
          <Text style={[styles.tabText, statusTab === 'ACTIVE' && styles.tabTextActive]}>
            Active ({orders.filter(o => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, statusTab === 'HISTORY' && styles.tabBtnActive]}
          onPress={() => setStatusTab('HISTORY')}
        >
          <Text style={[styles.tabText, statusTab === 'HISTORY' && styles.tabTextActive]}>History</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF5722" />
        </View>
      ) : (
        <FlatList
          data={getFilteredOrders()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={renderOrderItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#bdbdbd" />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptySubtitle}>There are no orders listed in this tab currently.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#FF5722',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#FF5722',
  },
  listPadding: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 12,
  },
  orderNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
  },
  orderTime: {
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
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  addressSnippet: {
    fontSize: 13,
    color: '#37474f',
    marginLeft: 8,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: '#757575',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#757575',
    textAlign: 'center',
    marginTop: 8,
  },
});
