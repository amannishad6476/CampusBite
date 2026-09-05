import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import apiService from '../../services/apiService';
import { AppNotification } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadNotifications() {
    try {
      const data = await apiService.getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error('Failed to load notifications:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (e) {
      console.error('Failed to mark read:', e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.error('Failed to mark all read:', e);
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const timeStr = new Date(item.created_at).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.is_read && styles.unreadCard]}
        onPress={() => !item.is_read && handleMarkRead(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconCol}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: item.is_read ? '#E0E0E0' : '#E8F5E9' },
            ]}
          >
            <Ionicons
              name={item.is_read ? 'notifications-outline' : 'notifications'}
              size={22}
              color={item.is_read ? '#757575' : '#4CAF50'}
            />
          </View>
        </View>
        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !item.is_read && styles.unreadTitle]}>
              {item.title}
            </Text>
            {!item.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <Text style={styles.time}>{timeStr}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  const hasUnread = notifications.some((n) => !n.is_read);

  return (
    <SafeAreaView style={styles.container}>
      {hasUnread && (
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={16} color="#4CAF50" />
            <Text style={styles.markAllText}>Mark all as read</Text>
          </TouchableOpacity>
        </View>
      )}

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={60} color="#BDBDBD" />
          <Text style={styles.emptyTitle}>No Notifications Yet</Text>
          <Text style={styles.emptySub}>
            You will receive order assignment alerts and delivery updates here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4CAF50']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#757575',
    fontSize: 14,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  unreadCard: {
    borderColor: '#C8E6C9',
    backgroundColor: '#FAFCFA',
  },
  iconCol: {
    marginRight: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: '#424242',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
    color: '#1B5E20',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: '#616161',
    marginTop: 4,
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: '#9E9E9E',
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#424242',
    marginTop: 16,
  },
  emptySub: {
    fontSize: 13,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
