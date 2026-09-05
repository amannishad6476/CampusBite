import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import apiService from '../../services/apiService';
import { Order, DeliveryPartnerProfile, DeliveryEarningSummary } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function DashboardScreen({ navigation }: any) {
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [earnings, setEarnings] = useState<DeliveryEarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  async function loadDashboardData() {
    try {
      const prof = await apiService.getProfile();
      setProfile(prof);

      const earn = await apiService.getEarnings();
      setEarnings(earn);

      // Only fetch available orders if driver is online
      if (prof.is_active) {
        const ordersList = await apiService.getAvailableOrders();
        setAvailableOrders(ordersList);
      } else {
        setAvailableOrders([]);
      }
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
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

  const toggleAvailability = async (value: boolean) => {
    setLoading(true);
    try {
      const updated = await apiService.updateAvailability(value);
      setProfile(updated);
      if (value) {
        const list = await apiService.getAvailableOrders();
        setAvailableOrders(list);
      } else {
        setAvailableOrders([]);
      }
    } catch (e: any) {
      Alert.alert('Error', 'Failed to toggle availability status.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    if (!profile?.is_active) {
      Alert.alert('Offline', 'Please go ONLINE to accept deliveries.');
      return;
    }
    
    setAcceptingId(orderId);
    try {
      await apiService.acceptOrder(orderId);
      Alert.alert(
        'Delivery Assigned',
        'You have claimed this delivery. Proceeding to Active Route.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Redirect to Active Tab
              navigation.navigate('Active');
            }
          }
        ]
      );
      loadDashboardData();
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Failed to claim delivery. It may have been accepted by another rider.';
      Alert.alert('Assignment Refused', msg);
      loadDashboardData();
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Connecting to rider gateway...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Banner with Toggle */}
      <View style={styles.bannerRow}>
        <View style={styles.bannerLeft}>
          <Text style={styles.welcomeText}>Hello, {profile?.name || 'Rider'}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.dot, { backgroundColor: profile?.is_active ? '#4CAF50' : '#757575' }]} />
            <Text style={styles.statusText}>{profile?.status || 'OFFLINE'}</Text>
          </View>
        </View>
        <View style={styles.toggleContainer}>
          <Text style={styles.toggleLabel}>{profile?.is_active ? 'GO OFFLINE' : 'GO ONLINE'}</Text>
          <Switch
            value={profile?.is_active}
            onValueChange={toggleAvailability}
            trackColor={{ false: '#767577', true: '#a5d6a7' }}
            thumbColor={profile?.is_active ? '#4CAF50' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Today's Earnings</Text>
          <Text style={styles.metricValue}>₹{earnings ? Number(earnings.today_earnings).toFixed(2) : '0.00'}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Deliveries Today</Text>
          <Text style={styles.metricValue}>{earnings ? earnings.total_deliveries : 0}</Text>
        </View>
      </View>

      {/* Deliveries Feed */}
      <View style={styles.feedHeaderRow}>
        <Text style={styles.feedTitle}>Available Deliveries ({availableOrders.length})</Text>
        {!profile?.is_active && (
          <Text style={styles.feedInfo}>Go ONLINE to check requests</Text>
        )}
      </View>

      <FlatList
        data={availableOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderNo}>{item.order_number}</Text>
              <Text style={styles.feeTag}>Earning: ₹{Number(item.delivery_fee).toFixed(2)}</Text>
            </View>

            <View style={styles.locationGroup}>
              <View style={styles.locRow}>
                <Ionicons name="storefront-outline" size={16} color="#4CAF50" />
                <Text style={styles.locText} numberOfLines={1}>
                  Pickup: <Text style={styles.bold}>{item.shop_name || 'Canteen'}</Text>
                </Text>
              </View>
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={16} color="#E53935" />
                <Text style={styles.locText} numberOfLines={1}>
                  Drop: {item.delivery_address.block_name || item.delivery_address.hostel_name}, Room {item.delivery_address.room_number || 'N/A'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.acceptBtn, acceptingId === item.id && styles.btnDisabled]}
              onPress={() => handleAcceptOrder(item.id)}
              disabled={acceptingId !== null}
            >
              {acceptingId === item.id ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.acceptBtnText}>Claim & Accept Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={64} color="#bdbdbd" />
            <Text style={styles.emptyTitle}>No Orders Available</Text>
            <Text style={styles.emptySubtitle}>
              {profile?.is_active
                ? 'All orders are currently claimed. We will notify you when new orders arrive.'
                : 'Please switch your status to ONLINE to receive order requests.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bannerLeft: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#757575',
  },
  toggleContainer: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#757575',
    marginBottom: 4,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#757575',
    fontWeight: 'bold',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 6,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  feedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33691e',
  },
  feedInfo: {
    fontSize: 11,
    color: '#e53935',
    fontWeight: '500',
  },
  listPadding: {
    padding: 16,
    paddingBottom: 80,
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderNo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  feeTag: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  locationGroup: {
    marginBottom: 16,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  locText: {
    fontSize: 13,
    color: '#37474f',
    marginLeft: 8,
    flex: 1,
  },
  bold: {
    fontWeight: 'bold',
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btnDisabled: {
    backgroundColor: '#a5d6a7',
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
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
    lineHeight: 18,
  },
});
