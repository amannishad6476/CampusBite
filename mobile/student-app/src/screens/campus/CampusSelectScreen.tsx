import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Campus } from '../../types';

export default function CampusSelectScreen({ navigation }: any) {
  const { selectedCampusId, setSelectedCampus } = useAuth();
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadCampuses();
  }, []);

  async function loadCampuses() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const list = await apiService.getCampuses();
      setCampuses(list);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch campuses. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const filteredCampuses = campuses.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectCampus = async (campus: Campus) => {
    await setSelectedCampus(campus.id);
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace('App');
    }
  };

  const renderCampusCard = ({ item }: { item: Campus }) => {
    const isSelected = selectedCampusId === item.id;

    return (
      <TouchableOpacity
        style={[styles.campusCard, isSelected && styles.selectedCard]}
        onPress={() => handleSelectCampus(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="school" size={24} color={isSelected ? '#FF5722' : '#64748B'} />
          </View>
          <View style={styles.cardTextCol}>
            <Text style={styles.campusName}>{item.name}</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={13} color="#94A3B8" />
              <Text style={styles.campusAddress} numberOfLines={2}>
                {item.address}
              </Text>
            </View>
          </View>
          <View style={[styles.radioCircle, isSelected && styles.radioSelected]}>
            {isSelected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
        </View>

        <View style={styles.badgeRow}>
          <View style={styles.cityBadge}>
            <Ionicons name="business-outline" size={12} color="#0284C7" />
            <Text style={styles.cityBadgeText}>Active Campus</Text>
          </View>
          {isSelected && (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Currently Selected</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Header */}
      <View style={styles.header}>
        {navigation.canGoBack() && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Select Your Campus</Text>
          <Text style={styles.subtitle}>Choose your college to browse nearby food</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search campus or location..."
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

      {/* Content */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF5722" />
          <Text style={styles.loadingText}>Loading campuses...</Text>
        </View>
      ) : errorMsg ? (
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{errorMsg}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCampuses}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredCampuses.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="search" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>No campuses found matching "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCampuses}
          renderItem={renderCampusCard}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    marginRight: 14,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  listContent: {
    padding: 16,
  },
  campusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  selectedCard: {
    borderColor: '#FF5722',
    backgroundColor: '#FFFBF9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTextCol: {
    flex: 1,
  },
  campusName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  campusAddress: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 4,
    flex: 1,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  radioSelected: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  cityBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
    marginLeft: 4,
  },
  currentBadge: {
    backgroundColor: '#FFEDE8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  currentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FF5722',
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
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#FF5722',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
});
