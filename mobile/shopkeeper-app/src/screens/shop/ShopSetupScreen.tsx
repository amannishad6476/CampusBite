import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Alert,
  SafeAreaView
} from 'react-native';
import apiService from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Shop } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function ShopSetupScreen() {
  const { logout } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [openingTime, setOpeningTime] = useState('');
  const [closingTime, setClosingTime] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);

  useEffect(() => {
    async function loadShopDetails() {
      try {
        const data = await apiService.getShop();
        setName(data.name);
        setDescription(data.description || '');
        setPhone(data.phone_number || '');
        setLogoUrl(data.logo_url || '');
        setOpeningTime(data.opening_time || '08:00');
        setClosingTime(data.closing_time || '20:00');
        setIsOpen(data.is_open);
        setDeliveryAvailable(data.delivery_available);
      } catch (e) {
        console.error('Failed to load shop configuration details:', e);
      } finally {
        setLoading(false);
      }
    }
    loadShopDetails();
  }, []);

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Missing Field', 'Canteen name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload: Partial<Shop> = {
        name,
        description: description || null,
        phone_number: phone || null,
        logo_url: logoUrl || null,
        opening_time: openingTime || null,
        closing_time: closingTime || null,
        is_open: isOpen,
        delivery_available: deliveryAvailable
      };
      
      await apiService.updateShop(payload);
      Alert.alert('Success', 'Canteen configuration updated successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF5722" />
        <Text style={styles.loadingText}>Fetching profile details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Basic Info</Text>

          <Text style={styles.label}>Canteen Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Block A Main Canteen"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What food do you serve?"
            multiline
            numberOfLines={3}
          />

          <Text style={styles.label}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="e.g. 9876543210"
          />

          <Text style={styles.label}>Shop Logo Image URL</Text>
          <TextInput
            style={styles.input}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="http://example.com/logo.png"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Operating Hours</Text>
          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Opening Time</Text>
              <TextInput
                style={styles.input}
                value={openingTime}
                onChangeText={setOpeningTime}
                placeholder="e.g. 08:00"
              />
            </View>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Closing Time</Text>
              <TextInput
                style={styles.input}
                value={closingTime}
                onChangeText={setClosingTime}
                placeholder="e.g. 21:00"
              />
            </View>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Status & Delivery</Text>
          
          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelCol}>
              <Text style={styles.toggleTitle}>Canteen Operating Status</Text>
              <Text style={styles.toggleDesc}>Toggle whether canteen is currently accepting orders.</Text>
            </View>
            <Switch
              value={isOpen}
              onValueChange={setIsOpen}
              trackColor={{ false: '#767577', true: '#ffab91' }}
              thumbColor={isOpen ? '#FF5722' : '#f4f3f4'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelCol}>
              <Text style={styles.toggleTitle}>Delivery Service</Text>
              <Text style={styles.toggleDesc}>Toggle whether delivery partner delivery is active.</Text>
            </View>
            <Switch
              value={deliveryAvailable}
              onValueChange={setDeliveryAvailable}
              trackColor={{ false: '#767577', true: '#ffab91' }}
              thumbColor={deliveryAvailable ? '#FF5722' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.saveBtnText}>Save Configuration</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Partner Portal</Text>
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
  formSection: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    color: '#212121',
    backgroundColor: '#fcfcfc',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexHalf: {
    width: '48%',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
  },
  toggleLabelCol: {
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
  saveBtn: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  btnDisabled: {
    backgroundColor: '#ffab91',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutBtn: {
    backgroundColor: '#E53935',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  logoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
