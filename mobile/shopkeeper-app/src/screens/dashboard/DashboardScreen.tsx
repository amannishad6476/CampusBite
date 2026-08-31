import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  RefreshControl
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { Order, EarningSummary, Shop } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadDashboardData() {
    try {
      const shopData = await apiService.getShop();
      setShop(shopData);

      const ordersList = await apiService.getOrders();
      setOrders(ordersList);

      const earningsStats = await apiService.getEarnings();
      setEarnings(earningsStats);
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // Local aggregates from order history
  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const activeOrdersCount = orders.filter(
    (o) => ['ACCEPTED', 'PREPARING', 'READY_FOR_PICKUP', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(o.status)
  ).length;
  const completedOrdersCount = orders.filter((o) => o.status === 'DELIVERED').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Loading canteen dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.canteenLabel}>Canteen Operator</Text>
          <Text style={styles.canteenName}>{shop ? shop.name : 'Canteen'}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ShopTab')}>
          <View style={[styles.statusBadge, { backgroundColor: shop?.is_open ? '#4CAF50' : '#757575' }]}>
            <Text style={styles.statusBadgeText}>{shop?.is_open ? 'OPEN' : 'CLOSED'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}
      >
        {/* Sales Card */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Today's Estimated Payout</Text>
          <Text style={styles.earningsValue}>₹{earnings ? earnings.today_earnings.toFixed(2) : '0.00'}</Text>
          <Text style={styles.earningsSub}>Commission has been pre-deducted server-side</Text>
        </View>

        {/* Orders Stats Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#FFA000' }]}>{pendingOrdersCount}</Text>
            <Text style={styles.statLabel}>New Orders</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#0288D1' }]}>{activeOrdersCount}</Text>
            <Text style={styles.statLabel}>In Preparation</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNum, { color: '#2E7D32' }]}>{completedOrdersCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
        </View>

        {/* Action Quick Links */}
        <Text style={styles.sectionTitle}>Quick Tasks</Text>
        <View style={styles.quickLinksRow}>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('OrdersTab')}>
            <Ionicons name="receipt-outline" size={24} color="#FF5722" />
            <Text style={styles.linkLabel}>Manage Orders</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('MenuTab')}>
            <Ionicons name="restaurant-outline" size={24} color="#FF5722" />
            <Text style={styles.linkLabel}>Edit Menu</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('EarningsTab')}>
            <Ionicons name="bar-chart-outline" size={24} color="#FF5722" />
            <Text style={styles.linkLabel}>My Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders List */}
        <View style={styles.recentSection}>
          <View style={styles.recentHeaderRow}>
            <Text style={styles.recentTitle}>Pending Orders</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrdersTab')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {orders.filter(o => o.status === 'PENDING').length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={40} color="#bdbdbd" />
              <Text style={styles.emptyText}>All orders processed! No pending items.</Text>
            </View>
          ) : (
            orders
              .filter(o => o.status === 'PENDING')
              .slice(0, 3)
              .map((order) => (
                <TouchableOpacity
                  key={order.id}
                  style={styles.orderItemRow}
                  onPress={() => navigation.navigate('OrdersTab', {
                    screen: 'OrderDetail',
                    params: { orderId: order.id }
                  })}
                >
                  <View>
                    <Text style={styles.orderNo}>{order.order_number}</Text>
                    <Text style={styles.orderTarget}>
                      To: {order.delivery_address.block_name || order.delivery_address.hostel_name}
                    </Text>
                  </View>
                  <View style={styles.priceCol}>
                    <Text style={styles.orderVal}>₹{order.total_amount.toFixed(2)}</Text>
                    <Text style={styles.orderTime}>
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
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
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  canteenLabel: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  canteenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  earningsCard: {
    backgroundColor: '#FF5722',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  earningsLabel: {
    color: '#ffe0b2',
    fontSize: 14,
    fontWeight: 'bold',
  },
  earningsValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 8,
  },
  earningsSub: {
    color: '#ffe0b2',
    fontSize: 11,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    width: '31%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  statNum: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  quickLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  linkCard: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  linkLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#37474f',
    marginTop: 8,
  },
  recentSection: {
    marginBottom: 30,
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
  },
  viewAllText: {
    color: '#FF5722',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#757575',
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  orderNo: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  orderTarget: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  orderVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
  },
  orderTime: {
    fontSize: 10,
    color: '#9e9e9e',
    marginTop: 2,
  },
});
