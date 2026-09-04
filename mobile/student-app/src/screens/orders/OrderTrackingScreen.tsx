import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import apiService from '../../services/apiService';
import { Order, OrderStatus } from '../../types';
import OrderReviewModal from './OrderReviewModal';

interface OrderTrackingScreenProps {
  route: any;
  navigation: any;
}

const ORDER_STEPS: { key: OrderStatus[]; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    key: ['PENDING', 'PLACED'],
    label: 'Order Placed',
    sub: 'Your order was sent to the kitchen',
    icon: 'document-text',
  },
  {
    key: ['ACCEPTED'],
    label: 'Canteen Confirmed',
    sub: 'Kitchen accepted your order ticket',
    icon: 'checkmark-circle',
  },
  {
    key: ['PREPARING'],
    label: 'Preparing Food',
    sub: 'Cook is preparing your fresh meal',
    icon: 'flame',
  },
  {
    key: ['READY_FOR_PICKUP'],
    label: 'Ready for Pickup',
    sub: 'Food is packed and awaiting rider',
    icon: 'bag-check',
  },
  {
    key: ['PICKED_UP', 'OUT_FOR_DELIVERY'],
    label: 'Out for Delivery',
    sub: 'Delivery partner is on the way to you',
    icon: 'bicycle',
  },
  {
    key: ['DELIVERED'],
    label: 'Delivered',
    sub: 'Order completed and verified',
    icon: 'home',
  },
];

export default function OrderTrackingScreen({ route, navigation }: OrderTrackingScreenProps) {
  const { orderId } = route.params;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);

  const pollIntervalRef = useRef<any>(null);

  const fetchOrder = async (isBackground = false) => {
    if (!isBackground) setErrorMsg(null);
    try {
      const data = await apiService.getOrderDetails(orderId);
      setOrder(data);
    } catch (err: any) {
      if (!isBackground) {
        setErrorMsg(err.message || 'Failed to fetch order tracking status.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrder();

    // Auto-poll every 8 seconds for active status updates
    pollIntervalRef.current = setInterval(() => {
      fetchOrder(true);
    }, 8000);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [orderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrder();
  };

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'CANCELLED') return -1;
    for (let i = ORDER_STEPS.length - 1; i >= 0; i--) {
      if (ORDER_STEPS[i].key.includes(status)) {
        return i;
      }
    }
    return 0;
  };

  if (loading && !order) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching live order status...</Text>
      </SafeAreaView>
    );
  }

  if (errorMsg && !order) {
    return (
      <SafeAreaView style={styles.centeredContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <Ionicons name="alert-circle-outline" size={54} color="#EF4444" />
        <Text style={styles.errorTitle}>Tracking Unavailable</Text>
        <Text style={styles.errorSub}>{errorMsg}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchOrder()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const currentStepIndex = getStepIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isDelivered = order.status === 'DELIVERED';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Order #{order.order_number}</Text>
          <Text style={styles.headerSub}>{order.shop_name || 'Campus Canteen'}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshIconBtn}>
          <Ionicons name="reload" size={18} color="#FF5722" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />
        }
      >
        {/* Delivery OTP Security Card (Only if active) */}
        {!isDelivered && !isCancelled && (
          <View style={styles.otpBanner}>
            <View style={styles.otpBannerRow}>
              <View>
                <Text style={styles.otpBannerLabel}>DELIVERY VERIFICATION OTP</Text>
                <Text style={styles.otpBannerValue}>{order.otp}</Text>
              </View>
              <View style={styles.otpShield}>
                <Ionicons name="shield-checkmark" size={28} color="#FF5722" />
              </View>
            </View>
            <Text style={styles.otpBannerNotice}>
              Provide this confidential OTP to the delivery partner when your order arrives.
            </Text>
          </View>
        )}

        {/* Cancelled Banner */}
        {isCancelled && (
          <View style={styles.cancelledBanner}>
            <Ionicons name="close-circle" size={28} color="#EF4444" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cancelledTitle}>Order Cancelled</Text>
              <Text style={styles.cancelledSub}>
                This order was cancelled. If you were charged, your refund will be processed.
              </Text>
            </View>
          </View>
        )}

        {/* Delivered Success Banner */}
        {isDelivered && (
          <View style={styles.deliveredBanner}>
            <Ionicons name="checkmark-circle" size={32} color="#10B981" style={{ marginRight: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveredTitle}>Order Delivered! 🍽️</Text>
              <Text style={styles.deliveredSub}>Enjoy your hot campus meal. Have a great day!</Text>
            </View>
          </View>
        )}

        {/* Status Stepper Timeline */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Live Order Progress</Text>

          {!isCancelled ? (
            <View style={styles.timelineContainer}>
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                const isFuture = idx > currentStepIndex;

                return (
                  <View key={step.label} style={styles.stepItem}>
                    {/* Icon indicator column */}
                    <View style={styles.stepIndicatorCol}>
                      <View
                        style={[
                          styles.stepDot,
                          isPassed && styles.stepDotPassed,
                          isCurrent && styles.stepDotCurrent,
                          isFuture && styles.stepDotFuture,
                        ]}
                      >
                        <Ionicons
                          name={isPassed ? 'checkmark' : step.icon}
                          size={14}
                          color={isPassed || isCurrent ? '#FFFFFF' : '#94A3B8'}
                        />
                      </View>
                      {idx < ORDER_STEPS.length - 1 && (
                        <View
                          style={[
                            styles.stepConnector,
                            isPassed ? styles.connectorPassed : styles.connectorFuture,
                          ]}
                        />
                      )}
                    </View>

                    {/* Step label column */}
                    <View style={styles.stepTextCol}>
                      <Text
                        style={[
                          styles.stepLabel,
                          isCurrent && styles.stepLabelCurrent,
                          isFuture && styles.stepLabelFuture,
                        ]}
                      >
                        {step.label}
                      </Text>
                      <Text style={styles.stepSub}>{step.sub}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.cancelledTimelineText}>
              Status progression ended due to cancellation.
            </Text>
          )}
        </View>

        {/* Delivery Address Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="location" size={18} color="#FF5722" style={{ marginRight: 6 }} />
            <Text style={styles.cardHeader}>Delivery Location</Text>
          </View>
          <Text style={styles.addressPrimary}>
            {order.delivery_address.hostel_name || order.delivery_address.block_name || 'Hostel/Block'}
            {order.delivery_address.room_number ? `, Room ${order.delivery_address.room_number}` : ''}
          </Text>
          <Text style={styles.addressSecondary}>
            {order.delivery_address.campus_name}
            {order.delivery_address.floor_level ? ` • ${order.delivery_address.floor_level}` : ''}
          </Text>
          <Text style={styles.addressPhone}>Contact: {order.delivery_address.phone}</Text>
        </View>

        {/* Order Items & Bill Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Order Details</Text>
          {order.items.map((it, idx) => (
            <View key={idx} style={styles.itemSummaryRow}>
              <Text style={styles.itemSummaryQty}>{it.quantity}x</Text>
              <Text style={styles.itemSummaryName}>{it.name}</Text>
              <Text style={styles.itemSummaryPrice}>
                ₹{(Number(it.price) * it.quantity).toFixed(2)}
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Item Subtotal</Text>
            <Text style={styles.billVal}>₹{Number(order.subtotal).toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billVal}>₹{Number(order.delivery_fee).toFixed(2)}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Tax & Charges</Text>
            <Text style={styles.billVal}>₹{Number(order.tax).toFixed(2)}</Text>
          </View>
          <View style={[styles.billLine, { marginTop: 6 }]}>
            <Text style={styles.totalLabel}>Total Paid / Due</Text>
            <Text style={styles.totalVal}>₹{Number(order.total_amount).toFixed(2)}</Text>
          </View>
        </View>

        {/* Delivered Order Review Card */}
        {order.status === 'DELIVERED' && (
          <View style={styles.reviewPromptCard}>
            <View style={styles.reviewPromptLeft}>
              <Ionicons name="star" size={24} color="#FF5722" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.reviewPromptTitle}>Rate Your Experience</Text>
                <Text style={styles.reviewPromptSub}>Help us improve canteen food and delivery</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.reviewPromptBtn}
              onPress={() => setReviewModalVisible(true)}
            >
              <Text style={styles.reviewPromptBtnText}>Rate Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Review Modal */}
      <OrderReviewModal
        visible={reviewModalVisible}
        order={order}
        onClose={() => setReviewModalVisible(false)}
        onSubmitted={() => fetchOrder(false)}
      />
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
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
  },
  refreshIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF2EE',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  otpBanner: {
    backgroundColor: '#FFF2EE',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FFCCBC',
    marginBottom: 14,
  },
  otpBannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  otpBannerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FF5722',
    letterSpacing: 0.5,
  },
  otpBannerValue: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FF5722',
    letterSpacing: 6,
    marginTop: 2,
  },
  otpShield: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBannerNotice: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 6,
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 14,
    borderRadius: 14,
    marginBottom: 14,
  },
  cancelledTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B91C1C',
  },
  cancelledSub: {
    fontSize: 12,
    color: '#7F1D1D',
    marginTop: 2,
  },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 16,
    borderRadius: 14,
    marginBottom: 14,
  },
  deliveredTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#065F46',
  },
  deliveredSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
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
    marginBottom: 6,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  timelineContainer: {
    marginTop: 4,
  },
  stepItem: {
    flexDirection: 'row',
    minHeight: 52,
  },
  stepIndicatorCol: {
    alignItems: 'center',
    width: 32,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotPassed: {
    backgroundColor: '#10B981',
  },
  stepDotCurrent: {
    backgroundColor: '#FF5722',
  },
  stepDotFuture: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    marginVertical: 3,
  },
  connectorPassed: {
    backgroundColor: '#10B981',
  },
  connectorFuture: {
    backgroundColor: '#E2E8F0',
  },
  stepTextCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 14,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  stepLabelCurrent: {
    color: '#FF5722',
    fontWeight: '800',
  },
  stepLabelFuture: {
    color: '#94A3B8',
  },
  stepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  cancelledTimelineText: {
    fontSize: 13,
    color: '#EF4444',
    fontStyle: 'italic',
  },
  addressPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  addressSecondary: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addressPhone: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  itemSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  itemSummaryQty: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5722',
    width: 28,
  },
  itemSummaryName: {
    fontSize: 13,
    color: '#334155',
    flex: 1,
  },
  itemSummaryPrice: {
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
  billLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  billVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  totalVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FF5722',
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  errorSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  reviewPromptCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#FED7AA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  reviewPromptLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  reviewPromptTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewPromptSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reviewPromptBtn: {
    backgroundColor: '#FF5722',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  reviewPromptBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
