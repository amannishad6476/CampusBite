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
import { EarningSummary } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function EarningsScreen() {
  const [earnings, setEarnings] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadEarnings() {
    try {
      const data = await apiService.getEarnings();
      setEarnings(data);
    } catch (e) {
      console.error('Failed to load earnings metrics:', e);
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching financial records...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />}
      >
        {/* Net payout card */}
        <View style={styles.mainEarningCard}>
          <Ionicons name="wallet-outline" size={32} color="#ffffff" />
          <Text style={styles.mainLabel}>Total Net Earnings (All-Time)</Text>
          <Text style={styles.mainValue}>₹{earnings ? earnings.net_earnings.toFixed(2) : '0.00'}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Completed Orders</Text>
              <Text style={styles.metaValue}>{earnings ? earnings.total_orders : 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Commission Paid</Text>
              <Text style={styles.metaValue}>₹{earnings ? earnings.commission_deducted.toFixed(2) : '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Time breakdowns */}
        <Text style={styles.sectionTitle}>Earnings Summary</Text>
        
        <View style={styles.breakdownRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="today-outline" size={20} color="#FF5722" />
          </View>
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Today's Sales</Text>
            <Text style={styles.breakdownValue}>₹{earnings ? earnings.today_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#e1f5fe' }]}>
            <Ionicons name="calendar-outline" size={20} color="#0288D1" />
          </View>
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Weekly Sales (Last 7 Days)</Text>
            <Text style={styles.breakdownValue}>₹{earnings ? earnings.weekly_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        <View style={styles.breakdownRow}>
          <View style={[styles.iconCircle, { backgroundColor: '#e8f5e9' }]}>
            <Ionicons name="analytics-outline" size={20} color="#2e7d32" />
          </View>
          <View style={styles.breakdownDetails}>
            <Text style={styles.breakdownLabel}>Monthly Sales (Last 30 Days)</Text>
            <Text style={styles.breakdownValue}>₹{earnings ? earnings.monthly_earnings.toFixed(2) : '0.00'}</Text>
          </View>
        </View>

        {/* Commission info box */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color="#757575" style={{ marginRight: 8 }} />
          <Text style={styles.infoText}>
            Commission calculations are processed server-side at a flat 10% rate on subtotals, excluding tax and delivery partner fees.
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
  mainEarningCard: {
    backgroundColor: '#FF5722', // Brand Orange
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
  },
  mainLabel: {
    color: '#ffe0b2',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'uppercase',
  },
  mainValue: {
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
    borderTopColor: '#ffab91',
    paddingTop: 16,
    width: '100%',
  },
  metaCol: {
    flex: 1,
    alignItems: 'center',
  },
  metaLabel: {
    color: '#ffe0b2',
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
    backgroundColor: '#ffab91',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  breakdownRow: {
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
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  breakdownDetails: {
    marginLeft: 16,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
  },
  infoCard: {
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
});
