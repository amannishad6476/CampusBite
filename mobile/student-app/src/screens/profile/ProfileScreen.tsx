import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import apiService from '../../services/apiService';
import { Campus } from '../../types';
import { APP_CONFIG } from '../../utils/config';

export default function ProfileScreen({ navigation }: any) {
  const { user, selectedCampusId, logout, refreshUser } = useAuth();
  const [campus, setCampus] = useState<Campus | null>(null);
  const [supportModalVisible, setSupportModalVisible] = useState(false);

  const studentDetails = user?.student || user?.student_details;

  useEffect(() => {
    refreshUser();
    async function loadCampus() {
      try {
        const campuses = await apiService.getCampuses();
        const current = campuses.find((c) => c.id === selectedCampusId) || campuses[0] || null;
        setCampus(current);
      } catch (err) {
        console.warn('Could not load campus for profile:', err);
      }
    }
    loadCampus();
  }, [selectedCampusId]);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of your CampusBite account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Screen Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
            </Text>
          </View>
          <Text style={styles.userName}>{user?.name || 'Student'}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name="school" size={12} color="#0284C7" style={{ marginRight: 4 }} />
            <Text style={styles.roleBadgeText}>Verified Student Account</Text>
          </View>
        </View>

        {/* Section: Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail-outline" size={18} color="#64748B" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>College Email</Text>
              <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="call-outline" size={18} color="#64748B" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>{user?.phone || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Section: Campus & Delivery Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Campus & Delivery Info</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CampusSelect')}>
              <Text style={styles.changeText}>Switch Campus</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoIconBox}>
              <Ionicons name="business-outline" size={18} color="#64748B" />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Active Campus</Text>
              <Text style={styles.infoValue}>{campus ? campus.name : 'BBD Educational Campus'}</Text>
            </View>
          </View>

          {studentDetails && (
            <View style={styles.infoItem}>
              <View style={styles.infoIconBox}>
                <Ionicons
                  name={studentDetails.is_hosteler ? 'bed-outline' : 'business-outline'}
                  size={18}
                  color="#64748B"
                />
              </View>
              <View style={styles.infoTextCol}>
                <Text style={styles.infoLabel}>Delivery Location Type</Text>
                <Text style={styles.infoValue}>
                  {studentDetails.is_hosteler ? 'Hostel Room Delivery' : 'Academic Block / Day Scholar'}
                  {studentDetails.room_number ? ` (Room ${studentDetails.room_number})` : ''}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Section: Quick Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences & Support</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('OrdersTab')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="receipt-outline" size={18} color="#FF5722" />
            </View>
            <Text style={styles.menuTitle}>My Order History</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="notifications-outline" size={18} color="#0284C7" />
            </View>
            <Text style={styles.menuTitle}>Order Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => setSupportModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.menuIconBox}>
              <Ionicons name="help-circle-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.menuTitle}>Help & FAQs</Text>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* App Info Banner */}
        <View style={styles.appInfoBox}>
          <Text style={styles.appInfoName}>{APP_CONFIG.appName} Student App</Text>
          <Text style={styles.appInfoVersion}>Version {APP_CONFIG.appVersion} • Production Build</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
          <Text style={styles.logoutBtnText}>Log Out Account</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Help & Support Modal */}
      <Modal visible={supportModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Help & Support 💬</Text>
              <TouchableOpacity onPress={() => setSupportModalVisible(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.faqTitle}>Frequently Asked Questions</Text>

              <View style={styles.faqItem}>
                <Text style={styles.faqQ}>How does food delivery work on campus?</Text>
                <Text style={styles.faqA}>
                  Once you place an order, the campus canteen kitchen prepares your meal. A verified
                  delivery partner picks it up and brings it to your hostel or academic department.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQ}>What is the 4-digit Delivery OTP?</Text>
                <Text style={styles.faqA}>
                  The delivery OTP is a security code generated by CampusBite server. Only share this
                  code with the delivery partner after you receive and verify your food.
                </Text>
              </View>

              <View style={styles.faqItem}>
                <Text style={styles.faqQ}>Can I cancel my order?</Text>
                <Text style={styles.faqA}>
                  Orders can be cancelled before the canteen kitchen accepts the order ticket.
                </Text>
              </View>

              <View style={styles.contactCard}>
                <Text style={styles.contactTitle}>Need Direct Assistance?</Text>
                <Text style={styles.contactText}>Email: {APP_CONFIG.supportEmail}</Text>
                <Text style={styles.contactText}>Helpline: {APP_CONFIG.supportPhone}</Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  infoIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  appInfoBox: {
    alignItems: 'center',
    marginVertical: 16,
  },
  appInfoName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  appInfoVersion: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    height: 48,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#EF4444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  faqTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  faqItem: {
    marginBottom: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  faqA: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  contactCard: {
    backgroundColor: '#FFF2EE',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FFCCBC',
  },
  contactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
});
