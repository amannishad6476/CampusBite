import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  
  const studentDetails = (user as any)?.student_details;

  return (
    <SafeAreaView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>
            {user ? user.name.charAt(0).toUpperCase() : 'S'}
          </Text>
        </View>
        <Text style={styles.userName}>{user ? user.name : 'Student Name'}</Text>
        <Text style={styles.userRole}>Registered Student Account</Text>
      </View>

      {/* Account Info Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Details</Text>
        
        <View style={styles.detailItem}>
          <Ionicons name="mail-outline" size={20} color="#757575" />
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{user ? user.email : 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.detailItem}>
          <Ionicons name="call-outline" size={20} color="#757575" />
          <View style={styles.detailTextCol}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <Text style={styles.detailValue}>{user ? user.phone : 'N/A'}</Text>
          </View>
        </View>
        
        {studentDetails && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={20} color="#757575" />
            <View style={styles.detailTextCol}>
              <Text style={styles.detailLabel}>Registered Address Location</Text>
              <Text style={styles.detailValue}>
                {studentDetails.is_hosteler ? 'Hostel Delivery' : 'Day Scholar Delivery'} (Floor: {studentDetails.floor_level || 'N/A'}, Room: {studentDetails.room_number || 'N/A'})
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Log out Actions */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerCard: {
    alignItems: 'center',
    paddingVertical: 24,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  userRole: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  detailTextCol: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9e9e9e',
  },
  detailValue: {
    fontSize: 15,
    color: '#212121',
    fontWeight: '500',
    marginTop: 2,
  },
  logoutSection: {
    paddingHorizontal: 20,
    marginTop: 'auto',
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: '#E53935', // Red logout button
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
