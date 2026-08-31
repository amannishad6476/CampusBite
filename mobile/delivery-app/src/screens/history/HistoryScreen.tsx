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

export default function HistoryScreen() {
  const [deliveries, setDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'TODAY' | 'WEEK' | 'ALL'>('ALL');

  async function loadHistory() {
    try {
      const data = await apiService.getHistory();
      setDeliveries(data);
    } catch (e) {
      console.error('Failed to load rider history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const getFilteredDeliveries = () => {
    const now = new Date();
    
    return deliveries.filter(d => {
      const deliveryDate = new Date(d.created_at);
      
      if (timeFilter === 'TODAY') {
        return (
          deliveryDate.getDate() === now.getDate() &&
          deliveryDate.getMonth() === now.getMonth() &&
          deliveryDate.getFullYear() === now.getFullYear()
        );
      } else if (timeFilter === 'WEEK') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return deliveryDate >= oneWeekAgo;
      }
      return true;
    });
  };

  const renderHistoryItem = ({ item }: { item: Order }) => {
    const dateStr = new Date(item.created_at).toLocaleDateString([], {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNo}>{item.order_number}</Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'DELIVERED' ? '#e8f5e9' : '#ffebee' }]}>
            <Text style={[styles.statusText, { color: item.status === 'DELIVERED' ? '#2e7d32' : '#c62828' }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.shopLabel}>Canteen: <Text style={styles.bold}>{item.shop_name}</Text></Text>
          <Text style={styles.dropLabel}>Drop-off: {item.delivery_address.block_name || item.delivery_address.hostel_name}</Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.earningLabel}>Fee Earned</Text>
          <Text style={styles.earningVal}>₹{item.delivery_fee.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Time Filters */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, timeFilter === 'TODAY' && styles.filterBtnActive]}
          onPress={() => setTimeFilter('TODAY')}
        >
          <Text style={[styles.filterText, timeFilter === 'TODAY' && styles.filterTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, timeFilter === 'WEEK' && styles.filterBtnActive]}
          onPress={() => setTimeFilter('WEEK')}
        >
          <Text style={[styles.filterText, timeFilter === 'WEEK' && styles.filterTextActive]}>This Week</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, timeFilter === 'ALL' && styles.filterBtnActive]}
          onPress={() => setTimeFilter('ALL')}
        >
          <Text style={[styles.filterText, timeFilter === 'ALL' && styles.filterTextActive]}>All Time</Text>
        </TouchableOpacity>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <FlatList
          data={getFilteredDeliveries()}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listPadding}
          renderItem={renderHistoryItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4CAF50']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="time-outline" size={64} color="#bdbdbd" />
              <Text style={styles.emptyTitle}>No Deliveries Found</Text>
              <Text style={styles.emptySubtitle}>There are no delivery records fitting this time filter.</Text>
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
  filterRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  filterBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: '#4CAF50',
  },
  filterText: {
    fontSize: 14,
    color: '#757575',
    fontWeight: 'bold',
  },
  filterTextActive: {
    color: '#4CAF50',
  },
  listPadding: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
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
    paddingBottom: 10,
    marginBottom: 10,
  },
  orderNo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  dateText: {
    fontSize: 11,
    color: '#9e9e9e',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardBody: {
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 10,
    marginBottom: 10,
  },
  shopLabel: {
    fontSize: 13,
    color: '#37474f',
  },
  bold: {
    fontWeight: 'bold',
  },
  dropLabel: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningLabel: {
    fontSize: 12,
    color: '#9e9e9e',
    fontWeight: 'bold',
  },
  earningVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4CAF50',
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
