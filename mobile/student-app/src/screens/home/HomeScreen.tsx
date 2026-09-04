import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import apiService from '../../services/apiService';
import { Shop, Campus } from '../../types';

const CATEGORIES = [
  { id: 'all', name: 'All Canteens', icon: 'restaurant' },
  { id: 'quick', name: 'Quick Bites', icon: 'fast-food' },
  { id: 'meals', name: 'Meals & Thalis', icon: 'nutrition' },
  { id: 'beverages', name: 'Chai & Drinks', icon: 'cafe' },
  { id: 'snacks', name: 'Evening Snacks', icon: 'pizza' },
];

export default function HomeScreen({ navigation }: any) {
  const { user, selectedCampusId } = useAuth();
  const { unreadCount } = useNotifications();

  const [campus, setCampus] = useState<Campus | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setErrorMsg(null);
    try {
      const campuses = await apiService.getCampuses();
      const current = campuses.find((c) => c.id === selectedCampusId) || campuses[0] || null;
      setCampus(current);

      const shopsData = await apiService.getShops(selectedCampusId);
      setShops(shopsData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to load campus canteens.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCampusId]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter canteens based on search and category
  const filteredShops = shops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (shop.description && shop.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'quick') {
      return (
        shop.name.toLowerCase().includes('bite') ||
        shop.name.toLowerCase().includes('fast') ||
        shop.name.toLowerCase().includes('snack')
      );
    }
    if (selectedCategory === 'beverages') {
      return (
        shop.name.toLowerCase().includes('cafe') ||
        shop.name.toLowerCase().includes('tea') ||
        shop.name.toLowerCase().includes('juice')
      );
    }
    return true;
  });

  const renderShopCard = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('ShopMenu', { shopId: item.id, shopName: item.name })}
      activeOpacity={0.8}
    >
      <View style={styles.shopImageArea}>
        <View style={styles.canteenIconCircle}>
          <Ionicons name="storefront" size={36} color="#FF5722" />
        </View>
        <View style={[styles.statusBadge, item.is_open ? styles.openBadge : styles.closedBadge]}>
          <View style={[styles.statusDot, { backgroundColor: item.is_open ? '#10B981' : '#EF4444' }]} />
          <Text style={[styles.statusBadgeText, { color: item.is_open ? '#047857' : '#B91C1C' }]}>
            {item.is_open ? 'OPEN NOW' : 'CLOSED'}
          </Text>
        </View>
      </View>

      <View style={styles.shopInfo}>
        <View style={styles.shopTitleRow}>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={13} color="#FFFFFF" />
            <Text style={styles.ratingText}>{Number(item.rating || 5.0).toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.shopDescription} numberOfLines={2}>
          {item.description || 'Fresh food, quick campus delivery & hygienic preparation.'}
        </Text>

        <View style={styles.shopMetaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>15-25 mins</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={14} color="#64748B" />
            <Text style={styles.metaText}>Hostel & Class</Text>
          </View>
          <View style={styles.metaDivider} />
          <View style={styles.metaItem}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#10B981" />
            <Text style={[styles.metaText, { color: '#047857', fontWeight: '600' }]}>OTP Verified</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.locationSelector}
          onPress={() => navigation.navigate('CampusSelect')}
          activeOpacity={0.7}
        >
          <View style={styles.locationIconCircle}>
            <Ionicons name="location" size={18} color="#FF5722" />
          </View>
          <View style={styles.locationTextCol}>
            <View style={styles.deliverToRow}>
              <Text style={styles.deliverToLabel}>Deliver to</Text>
              <Ionicons name="chevron-down" size={14} color="#FF5722" style={{ marginLeft: 2 }} />
            </View>
            <Text style={styles.campusNameText} numberOfLines={1}>
              {campus ? campus.name : 'Select Campus'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.notifButton}
          onPress={() => navigation.navigate('Notifications')}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={22} color="#1E293B" />
          {unreadCount > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Student Greeting Banner */}
      <View style={styles.greetingBar}>
        <Text style={styles.greetingText}>
          Hello, <Text style={styles.greetingName}>{user?.name?.split(' ')[0] || 'Student'}!</Text> 👋
        </Text>
        <Text style={styles.greetingSub}>Hungry? Discover college canteens ready to serve.</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search canteens, tea points, snacks..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Horizontal Slider */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, isSelected && styles.categoryChipSelected]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={16}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Section Title */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all' ? 'Nearby Campus Canteens' : 'Filtered Canteens'}
        </Text>
        <Text style={styles.shopCount}>{filteredShops.length} available</Text>
      </View>

      {/* Main List */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingText}>Fetching delicious canteens...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={54} color="#EF4444" />
          <Text style={styles.errorTitle}>Connection Error</Text>
          <Text style={styles.errorSubtitle}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredShops.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="restaurant-outline" size={54} color="#CBD5E1" />
          <Text style={styles.emptyTitle}>No Canteens Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No canteen matches "${searchQuery}". Try another search.`
              : 'No food joints currently listed for this campus.'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredShops}
          renderItem={renderShopCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF5722']} />
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
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF2EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  locationTextCol: {
    flex: 1,
  },
  deliverToRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deliverToLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FF5722',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  campusNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },
  notifButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF5722',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  greetingBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#FFFFFF',
  },
  greetingText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
  },
  greetingName: {
    color: '#FF5722',
    fontWeight: '800',
  },
  greetingSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  categoriesSection: {
    marginTop: 10,
    marginBottom: 4,
  },
  categoriesList: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryChipSelected: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  shopCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  shopCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shopImageArea: {
    height: 110,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  canteenIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  statusBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  openBadge: {
    backgroundColor: '#D1FAE5',
  },
  closedBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  shopInfo: {
    padding: 14,
  },
  shopTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shopName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 3,
  },
  shopDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 10,
  },
  shopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 10,
  },
  centered: {
    flex: 1,
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
  errorSubtitle: {
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
    fontSize: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  clearSearchBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  clearSearchBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF5722',
  },
});
