import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { DeliveryPartnerProfile } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { logout } = useAuth();
  
  const [profile, setProfile] = useState<DeliveryPartnerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile() {
    try {
      const data = await apiService.getProfile();
      setProfile(data);
    } catch (e) {
      console.error('Failed to load profile details:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  const toggleAvailability = async (value: boolean) => {
    setLoading(true);
    try {
      const updated = await apiService.updateAvailability(value);
      setProfile(updated);
      Alert.alert('Status Changed', `You are now ${value ? 'ONLINE' : 'OFFLINE'}.`);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to toggle status.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Fetching profile details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={40} color="#4CAF50" />
          </View>
          <Text style={styles.nameText}>{profile?.name || 'Rider'}</Text>
          <Text style={styles.roleText}>CAMPUSBITE DELIVERY PARTNER</Text>
          
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color="#FFD54F" />
            <Text style={styles.ratingText}> {profile ? Number(profile.rating).toFixed(1) : '5.0'} Rating</Text>
          </View>
        </View>

        {/* Toggles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Availability Status</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={styles.toggleTitle}>Duty Status</Text>
              <Text style={styles.toggleDesc}>Toggles whether you can claim new available deliveries.</Text>
            </View>
            <Switch
              value={profile?.is_active}
              onValueChange={toggleAvailability}
              trackColor={{ false: '#767577', true: '#a5d6a7' }}
              thumbColor={profile?.is_active ? '#4CAF50' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Vehicle details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rider Metadata</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{profile?.email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone Contact</Text>
            <Text style={styles.infoValue}>{profile?.phone}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vehicle Type</Text>
            <Text style={styles.infoValue}>{profile?.vehicle_type}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>License Plate / Number</Text>
            <Text style={styles.infoValue}>{profile?.vehicle_number || 'N/A'}</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Rider Portal</Text>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    marginBottom: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#c5e1a5',
  },
  nameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  roleText: {
    fontSize: 11,
    color: '#757575',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#37474f',
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  toggleDesc: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#757575',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  logoutBtn: {
    backgroundColor: '#D32F2F',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
