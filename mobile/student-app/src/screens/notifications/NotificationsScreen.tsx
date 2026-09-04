import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  Alert,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNotifications } from '../../context/NotificationContext';
import { AppNotification } from '../../types';

export default function NotificationsScreen({ navigation }: any) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications, deleteNotification, refreshNotifications } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationPress = async (item: AppNotification) => {
    await markAsRead(item.id);
    const targetOrderId = item.order_id || item.orderId;
    if (targetOrderId) {
      try {
        navigation.navigate('OrderTracking', { orderId: targetOrderId });
      } catch (err) {
        Alert.alert('Notice', 'Unable to open order tracking for this notification.');
      }
    }
  };

  const handleDelete = (item: AppNotification) => {
    Alert.alert(
      'Delete Notification',
      'Remove this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteNotification(item.id),
        },
      ]
    );
  };

  const getIcon = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'ORDER_PLACED':
      case 'ORDER':
        return { name: 'fast-food' as const, color: '#FF5722', bg: '#FFF2EE' };
      case 'ORDER_ACCEPTED':
        return { name: 'checkmark-circle' as const, color: '#0284C7', bg: '#E0F2FE' };
      case 'ORDER_PREPARING':
        return { name: 'flame' as const, color: '#7C3AED', bg: '#EDE9FE' };
      case 'ORDER_READY':
        return { name: 'bag-check' as const, color: '#0D9488', bg: '#CCFBF1' };
      case 'ORDER_OUT_FOR_DELIVERY':
        return { name: 'bicycle' as const, color: '#EA580C', bg: '#FFEDD5' };
      case 'ORDER_DELIVERED':
        return { name: 'sparkles' as const, color: '#059669', bg: '#ECFDF5' };
      case 'ORDER_CANCELLED':
        return { name: 'close-circle' as const, color: '#DC2626', bg: '#FEE2E2' };
      case 'PROMOTION':
        return { name: 'pricetag' as const, color: '#0284C7', bg: '#E0F2FE' };
      default:
        return { name: 'notifications' as const, color: '#10B981', bg: '#ECFDF5' };
    }
  };

  const renderNotificationCard = ({ item }: { item: AppNotification }) => {
    const isUnread = !(item.is_read ?? item.isRead);
    const iconTheme = getIcon(item.type);
    const rawTime = item.created_at || item.timestamp;
    const dateFormatted = rawTime
      ? new Date(rawTime).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';

    return (
      <TouchableOpacity
        style={[styles.notifCard, isUnread && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconTheme.bg }]}>
          <Ionicons name={iconTheme.name} size={20} color={iconTheme.color} />
        </View>
        <View style={styles.contentCol}>
          <View style={styles.titleRow}>
            <Text style={[styles.notifTitle, isUnread && styles.unreadTitle]}>
              {item.title}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifMessage}>{item.message}</Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.notifTime}>{dateFormatted}</Text>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>Order alerts & campus announcements</Text>
        </View>
        {notifications.length > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markReadBtn}>
            <Text style={styles.markReadText}>Mark Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {notifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyCircle}>
            <Ionicons name="notifications-off-outline" size={48} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySub}>
            Order status updates, kitchen confirmations, and delivery alerts will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#FF5722']} />
          }
          ListFooterComponent={
            <TouchableOpacity onPress={clearNotifications} style={styles.clearAllBtn}>
              <Ionicons name="trash-outline" size={14} color="#94A3B8" style={{ marginRight: 4 }} />
              <Text style={styles.clearAllText}>Clear all notifications</Text>
            </TouchableOpacity>
          }
        />
      )}
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
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  markReadBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  markReadText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  listContent: {
    padding: 16,
  },
  notifCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  unreadCard: {
    borderColor: '#FFD7CC',
    backgroundColor: '#FFFBF9',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '800',
    color: '#0F172A',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5722',
    marginLeft: 6,
  },
  notifMessage: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 6,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTime: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  clearAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
});
