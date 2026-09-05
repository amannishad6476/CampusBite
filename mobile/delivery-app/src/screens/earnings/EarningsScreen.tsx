import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  RefreshControl
} from 'react-native';
import apiService from '../../services/apiService';
import { DeliveryEarningSummary, EarningHistoryItem } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<DeliveryEarningSummary | null>(null);
  const [historyItems, setHistoryItems] = useState<EarningHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadEarnings() {
    try {
      const data = await apiService.getEarnings();
      setEarnings(data);

      try {
        const hist = await apiService.getEarningsHistory(1, 20);
        setHistoryItems(hist.items || []);
      } catch (histErr) {
        console.warn('Could not load detailed earnings history:', histErr);
      }
    } catch (e) {
      console.error('Failed to load rider earnings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadEarnings();
  }, []);


  const onRefresh = () => {
    setRefreshing(true);
    loadEarnings();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Fetching rider payouts ledger...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />}
      >
        {/* Wallet balance */}
        <View style={styles.walletCard}>
          <Ionicons name="wallet-outline" size={32} color="#ffffff" />
          <Text style={styles.walletLabel}>All-Time Delivery Payouts</Text>
          <Text style={styles.walletValue}>₹{earnings ? earnings.net_earnings.toFixed(2) : '0.00'}</Text>
          
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Completed Deliveries</Text>
              <Text style={styles.metaValue}>{earnings ? earnings.total_deliveries : 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Active Status</Text>
              <Text style={styles.metaValue}>Verified</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Earnings Summary</Text>

        <View style={styles.rowItem}>
          <View style={styles.iconCircle}>
            <Ionicons name="today-outline" size={20} color="#4CAF50" />
          </View>
          <View style={styles.rowDetails}>
            <Text style={styles.rowLabel}>Today's Earnings</Text>
            <Text style={styles.rowValue}>₹{earnings ? earnings.today_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <View style={styles.rowItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
          </View>
          <View style={styles.rowDetails}>
            <Text style={styles.rowLabel}>Weekly Earnings (Last 7 Days)</Text>
            <Text style={styles.rowValue}>₹{earnings ? earnings.weekly_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <View style={styles.rowItem}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="analytics-outline" size={20} color="#1b5e20" />
          </View>
          <View style={styles.rowDetails}>
            <Text style={styles.rowLabel}>Monthly Earnings (Last 30 Days)</Text>
            <Text style={styles.rowValue}>₹{earnings ? earnings.monthly_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        {/* Recent Payouts List */}
        <Text style={styles.sectionTitle}>Recent Payouts</Text>
        {historyItems.length === 0 ? (
          <View style={styles.emptyHistoryBox}>
            <Text style={styles.emptyHistoryText}>No delivery payouts recorded yet.</Text>
          </View>
        ) : (
          historyItems.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <Text style={styles.historyOrder}>{item.order_number || 'Delivery Trip'}</Text>
                {item.shop_name && <Text style={styles.historyShop}>{item.shop_name}</Text>}
                <Text style={styles.historyDate}>
                  {item.created_at
                    ? new Date(item.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ''}
                </Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>+₹{Number(item.amount).toFixed(2)}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{item.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}

        {/* Info card */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#757575" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Payout calculations are processed server-side upon successful customer OTP verification. Delivery fee is flat ₹15.00 per campus route.
          </Text>
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
  walletCard: {
    backgroundColor: '#4CAF50', // Driver Green
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  walletLabel: {
    color: '#e8f5e9',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  walletValue: {
    color: '#ffffff',
    fontSize: 38,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#81c784',
    paddingTop: 16,
    width: '100%',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    color: '#e8f5e9',
    fontSize: 11,
  },
  metaValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#81c784',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#33691e',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowDetails: {
    marginLeft: 16,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginTop: 30,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
    lineHeight: 16,
  },
  emptyHistoryBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 13,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyLeft: {
    flex: 1,
  },
  historyOrder: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212121',
  },
  historyShop: {
    fontSize: 12,
    color: '#616161',
    marginTop: 2,
  },
  historyDate: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 2,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
  },
  statusPill: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2E7D32',
    textTransform: 'uppercase',
  },
});

