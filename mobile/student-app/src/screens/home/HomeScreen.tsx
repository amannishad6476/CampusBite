import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  SafeAreaView,
  StatusBar,
  Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { Shop, Campus } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [campus, setCampus] = useState<Campus | null>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Dynamic Categories list
  const categories = ['All', 'Quick Bites', 'Beverages', 'Pizzas & Burgers', 'Thalis & Meals'];

  useEffect(() => {
    async function loadHomeDetails() {
      // Find campus ID from user profile or default to 1
      const studentDetails = (user as any)?.student_details;
      const campusId = studentDetails?.campus_id || 1;
      
      const campusData = await apiService.getCampuses();
      const current = campusData.find((c) => c.id === campusId);
      if (current) {
        setCampus(current);
      }

      const shopsData = await apiService.getShops(campusId);
      setShops(shopsData);
    }
    loadHomeDetails();
  }, [user]);

  // Filter canteens based on search and category filters
  const filteredShops = shops.filter((shop) => {
    const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (shop.description && shop.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // In a real application, category matches items, but here we can list all open ones or filter
    return matchesSearch;
  });

  const renderShopItem = ({ item }: { item: Shop }) => (
    <TouchableOpacity
      style={styles.shopCard}
      onPress={() => navigation.navigate('ShopMenu', { shopId: item.id, shopName: item.name })}
    >
      <View style={styles.shopImagePlaceholder}>
        <Ionicons name="restaurant-outline" size={40} color="#FF5722" />
        {!item.is_open && (
          <View style={styles.closedOverlay}>
            <Text style={styles.closedText}>CLOSED</Text>
          </View>
        )}
      </View>
      <View style={styles.shopDetails}>
        <View style={styles.shopHeaderRow}>
          <Text style={styles.shopName}>{item.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={14} color="#FFC107" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        
        <Text style={styles.shopDescription} numberOfLines={1}>
          {item.description || 'No description available.'}
        </Text>
        
        <View style={styles.shopFooterRow}>
          <View style={styles.infoLabel}>
            <Ionicons name="time-outline" size={14} color="#757575" />
            <Text style={styles.infoValue}>15-20 mins</Text>
          </View>
          <View style={[styles.infoLabel, { marginLeft: 16 }]}>
            <Ionicons name="bicycle-outline" size={14} color="#757575" />
            <Text style={styles.infoValue}>Free Delivery</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.topHeader}>
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={20} color="#FF5722" />
          <View style={styles.locationTextContainer}>
            <Text style={styles.locationLabel}>Delivering To</Text>
            <Text style={styles.campusName} numberOfLines={1}>
              {campus ? campus.name : 'Loading location...'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>
              {user ? user.name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#757575" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search canteens or meals..."
            placeholderTextColor="#9e9e9e"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Hungry In Class?</Text>
            <Text style={styles.promoSubtitle}>Hot meals delivered right to your classroom or hostel block.</Text>
          </View>
          <Ionicons name="fast-food" size={70} color="#ffe0b2" style={styles.promoIcon} />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipSelected
                ]}
                onPress={() => setSelectedCategory(cat === 'All' ? null : cat)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat && styles.categoryTextSelected
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Shops */}
        <View style={[styles.section, { marginBottom: 30 }]}>
          <Text style={styles.sectionTitle}>Available Canteens</Text>
          {filteredShops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#bdbdbd" />
              <Text style={styles.emptyText}>No active canteens found on this campus.</Text>
            </View>
          ) : (
            <FlatList
              data={filteredShops}
              renderItem={renderShopItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 16,
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  locationLabel: {
    fontSize: 10,
    color: '#9e9e9e',
    textTransform: 'uppercase',
  },
  campusName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
    color: '#212121',
  },
  promoBanner: {
    backgroundColor: '#FF5722',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  promoTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  promoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  promoSubtitle: {
    fontSize: 13,
    color: '#ffe0b2',
    marginTop: 4,
    lineHeight: 18,
  },
  promoIcon: {
    opacity: 0.8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 12,
  },
  categoriesScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#FF5722',
  },
  categoryText: {
    color: '#757575',
    fontSize: 14,
  },
  categoryTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  shopCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    padding: 12,
    marginBottom: 12,
  },
  shopImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#fff3e0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  closedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  shopDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  shopHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shopName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8e1',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffa000',
    marginLeft: 4,
  },
  shopDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  shopFooterRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 11,
    color: '#757575',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#9e9e9e',
    textAlign: 'center',
    marginTop: 8,
  },
});
