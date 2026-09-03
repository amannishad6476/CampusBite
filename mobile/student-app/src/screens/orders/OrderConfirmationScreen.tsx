import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Order } from '../../types';

export default function OrderConfirmationScreen({ route, navigation }: any) {
  const { order, shopName }: { order: Order; shopName?: string } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Celebration Icon */}
        <View style={styles.successCircle}>
          <Ionicons name="checkmark-done" size={54} color="#10B981" />
        </View>

        <Text style={styles.title}>Order Placed! 🎉</Text>
        <Text style={styles.subtitle}>
          Your order has been sent to the kitchen at{' '}
          <Text style={{ fontWeight: '700', color: '#1E293B' }}>{shopName || order.shop_name || 'Canteen'}</Text>.
        </Text>

        {/* Secure OTP Card */}
        <View style={styles.otpCard}>
          <View style={styles.otpHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#FF5722" />
            <Text style={styles.otpHeaderTitle}>Delivery Verification Code (OTP)</Text>
          </View>
          <Text style={styles.otpValue}>{order.otp}</Text>
          <Text style={styles.otpNotice}>
            🔒 Share this 4-digit code with your delivery partner only when you receive your food package.
          </Text>
        </View>

        {/* Summary Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeader}>Order Information</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Order Number</Text>
            <Text style={styles.infoValue}>{order.order_number}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Estimated Delivery</Text>
            <Text style={[styles.infoValue, { color: '#059669', fontWeight: '700' }]}>
              20 - 30 minutes
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount</Text>
            <Text style={[styles.infoValue, { color: '#FF5722', fontWeight: '800' }]}>
              ₹{Number(order.total_amount).toFixed(2)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Method</Text>
            <Text style={styles.infoValue}>{order.payment_method} ({order.payment_status})</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.addressTitle}>Delivery Destination</Text>
          <Text style={styles.addressLine}>
            {order.delivery_address.hostel_name || order.delivery_address.block_name || 'Hostel/Block'}
            {order.delivery_address.room_number ? `, Room ${order.delivery_address.room_number}` : ''}
          </Text>
          <Text style={styles.addressLineSub}>
            {order.delivery_address.campus_name}
            {order.delivery_address.floor_level ? ` • ${order.delivery_address.floor_level}` : ''}
          </Text>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.trackBtn}
          onPress={() => navigation.replace('OrderTracking', { orderId: order.id })}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.trackBtnText}>Track Order Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.replace('App')}
          activeOpacity={0.8}
        >
          <Text style={styles.homeBtnText}>Back to Campus Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 24,
    alignItems: 'center',
  },
  successCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  otpCard: {
    width: '100%',
    backgroundColor: '#FFF2EE',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FFCCBC',
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  otpHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5722',
    marginLeft: 6,
  },
  otpValue: {
    fontSize: 38,
    fontWeight: '900',
    color: '#FF5722',
    letterSpacing: 8,
    marginVertical: 4,
  },
  otpNotice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  addressTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  addressLine: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
  },
  addressLineSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  trackBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF5722',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  trackBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  homeBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
});
