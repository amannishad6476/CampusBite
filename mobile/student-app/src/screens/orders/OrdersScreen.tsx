import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import apiService from '../../services/apiService';
import { useCart } from '../../context/CartContext';
import { Order, OrderStatus } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import OrderReviewModal from './OrderReviewModal';

const ACTIVE_STATUSES: OrderStatus[] = [
  'PENDING',
  'PLACED',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'PICKED_UP',
  'OUT_FOR_DELIVERY',
];

export default function OrdersScreen({ navigation }: any) {
  const { reorderItems } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'past'>('active');

  // Review modal state
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const loadOrders = useCallback(async () => {
    try {
      const data = await apiService.getOrders();
      setOrders(data);
    } catch (e) {
      console.warn('Failed to load orders:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
  const pastOrders = orders.filter((o) => !ACTIVE_STATUSES.includes(o.status));

  const displayedOrders = selectedTab === 'active' ? activeOrders : pastOrders;

  const getStatusTheme = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
      case 'PLACED':
        return { bg: '#FEF3C7', text: '#B45309', label: 'PLACED' };
      case 'ACCEPTED':
        return { bg: '#E0F2FE', text: '#0369A1', label: 'CONFIRMED' };
      case 'PREPARING':
        return { bg: '#EDE9FE', text: '#6D28D9', label: 'PREPARING' };
      case 'READY_FOR_PICKUP':
        return { bg: '#CCFBF1', text: '#0F766E', label: 'READY' };
      case 'PICKED_UP':
      case 'OUT_FOR_DELIVERY':
        return { bg: '#FFEDD5', text: '#C2410C', label: 'ON THE WAY' };
      case 'DELIVERED':
        return { bg: '#D1FAE5', text: '#047857', label: 'DELIVERED' };
      case 'CANCELLED':
        return { bg: '#FEE2E2', text: '#B91C1C', label: 'CANCELLED' };
      default:
        return { bg: '#F1F5F9', text: '#475569', label: status };
    }
  };

  const handleReorder = (order: Order) => {
    Alert.alert(
      'Reorder Items',
      `Add items from ${order.shop_name || 'this canteen'} to your cart?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add to Cart',
          onPress: () => {
            const reorderPayload = order.items.map((it) => ({
              food_item: {
                id: (it as any).food_item_id || it.id || `reorder-${it.name}`,
                name: it.name,
                price: it.price,
                is_veg: true,
                is_available: true,
                category_id: 1,
                shop_id: order.shop_id,
              },
              quantity: it.quantity,
              notes: it.notes || undefined,
            }));
            reorderItems(reorderPayload, order.shop_id, order.shop_name || 'Campus Canteen');
            navigation.navigate('CartTab');
          },
        },
      ]
    );
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const theme = getStatusTheme(item.status);
    const dateFormatted = new Date(item.created_at).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });

    const isDelivered = item.status === 'DELIVERED';
    const isActive = ACTIVE_STATUSES.includes(item.status);

    return (
      <View style={styles.orderCard}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.shopName} numberOfLines={1}>
              {item.shop_name || 'Campus Canteen'}
            </Text>
            <Text style={styles.orderNumber}>#{item.order_number}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: theme.bg }]}>
            <Text style={[styles.statusText, { color: theme.text }]}>{theme.label}</Text>
          </View>
        </View>

        {/* Date & Location */}
        <View style={styles.metaRow}>
          <Text style={styles.metaDate}>{dateFormatted}</Text>
          <Text style={styles.metaAddress} numberOfLines={1}>
            📍 {item.delivery_address.hostel_name || item.delivery_address.block_name || 'Campus'}
            {item.delivery_address.room_number ? ` • Room ${item.delivery_address.room_number}` : ''}
          </Text>
        </View>

        {/* Items list */}
        <View style={styles.itemsList}>
          {item.items.map((food, idx) => (
            <Text key={idx} style={styles.itemLine}>
              <Text style={{ fontWeight: '700' }}>{food.quantity}x</Text> {food.name}
            </Text>
          ))}
        </View>

        {/* OTP banner if active */}
        {isActive && item.otp && (
          <View style={styles.cardOtpRow}>
            <Ionicons name="shield-checkmark" size={14} color="#FF5722" />
            <Text style={styles.cardOtpText}>
              Delivery OTP: <Text style={{ fontWeight: '800' }}>{item.otp}</Text>
            </Text>
          </View>
        )}

        {/* Total and Actions */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>TOTAL AMOUNT</Text>
            <Text style={styles.totalAmount}>₹{Number(item.total_amount).toFixed(2)}</Text>
          </View>

          <View style={styles.actionsRow}>
            {isActive ? (
              <TouchableOpacity
                style={styles.trackBtn}
                onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
              >
                <Text style={styles.trackBtnText}>Track Order</Text>
                <Ionicons name="navigate" size={12} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            ) : (
              <>
                {isDelivered && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => {
                      setReviewOrder(item);
                      setReviewModalVisible(true);
                    }}
                  >
                    <Ionicons name="star-outline" size={13} color="#FF5722" style={{ marginRight: 3 }} />
                    <Text style={styles.reviewBtnText}>Rate</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.reorderBtn}
                  onPress={() => handleReorder(item)}
                >
                  <Ionicons name="repeat" size={14} color="#475569" style={{ marginRight: 3 }} />
                  <Text style={styles.reorderBtnText}>Reorder</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewDetailsBtn}
                  onPress={() => navigation.navigate('OrderTracking', { orderId: item.id })}
                >
                  <Text style={styles.viewDetailsText}>Bill</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Title */}
      <View style={styles.screenHeader}>
        <Text style={styles.title}>My Orders</Text>
        <Text style={styles.subtitle}>Track active deliveries and view dining history</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text style={[styles.tabText, selectedTab === 'active' && styles.tabTextActive]}>
            Active Deliveries ({activeOrders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTab === 'past' && styles.tabActive]}
          onPress={() => setSelectedTab('past')}
        >
          <Text style={[styles.tabText, selectedTab === 'past' && styles.tabTextActive]}>
            Past Orders ({pastOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingText}>Loading your orders...</Text>
        </View>
      ) : displayedOrders.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons
            name={selectedTab === 'active' ? 'bicycle-outline' : 'receipt-outline'}
            size={54}
            color="#CBD5E1"
          />
          <Text style={styles.emptyTitle}>
            {selectedTab === 'active' ? 'No Active Deliveries' : 'No Past Orders Yet'}
          </Text>
          <Text style={styles.emptySub}>
            {selectedTab === 'active'
              ? 'You have no orders currently in preparation or transit.'
              : 'Your completed orders will appear here for easy reordering.'}
          </Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => navigation.navigate('HomeTab')}
          >
            <Text style={styles.browseBtnText}>Explore Canteens</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF5722']} />
          }
        />
      )}

      {/* Review Modal */}
      <OrderReviewModal
        visible={reviewModalVisible}
        order={reviewOrder}
        onClose={() => setReviewModalVisible(false)}
        onSubmitted={() => loadOrders()}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  screenHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginHorizontal: 4,
    backgroundColor: '#F1F5F9',
  },
  tabActive: {
    backgroundColor: '#FF5722',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  orderNumber: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  metaDate: {
    fontSize: 12,
    color: '#64748B',
  },
  metaAddress: {
    fontSize: 12,
    color: '#64748B',
    maxWidth: '55%',
  },
  itemsList: {
    marginBottom: 10,
  },
  itemLine: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 3,
  },
  cardOtpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2EE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardOtpText: {
    fontSize: 12,
    color: '#FF5722',
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  trackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  reviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2EE',
    borderWidth: 1,
    borderColor: '#FFCCBC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5722',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  reorderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  viewDetailsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 20,
  },
  browseBtn: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  browseBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
