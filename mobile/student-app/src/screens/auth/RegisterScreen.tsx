import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { Campus, College, Block, Hostel } from '../../types';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();

  // Basic Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Campus & Location selectors (Cascading from backend)
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Selected values
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [isHosteler, setIsHosteler] = useState(true);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [floorLevel, setFloorLevel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [loadingLocations, setLoadingLocations] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load campuses on mount
  useEffect(() => {
    async function loadCampuses() {
      try {
        const data = await apiService.getCampuses();
        setCampuses(data);
        if (data.length > 0) {
          setSelectedCampusId(data[0].id);
        }
      } catch (err) {
        console.warn('Failed to load campuses for registration:', err);
      } finally {
        setLoadingLocations(false);
      }
    }
    loadCampuses();
  }, []);

  // Reload colleges, blocks, and hostels when campus changes
  useEffect(() => {
    if (selectedCampusId === null) return;

    async function loadCampusHierarchy() {
      try {
        const [colData, blockData, hostelData] = await Promise.all([
          apiService.getColleges(selectedCampusId!),
          apiService.getBlocks(selectedCampusId!),
          apiService.getHostels(selectedCampusId!),
        ]);
        setColleges(colData);
        setSelectedCollegeId(colData.length > 0 ? colData[0].id : null);

        setBlocks(blockData);
        setSelectedBlockId(blockData.length > 0 ? blockData[0].id : null);

        setHostels(hostelData);
        setSelectedHostelId(hostelData.length > 0 ? hostelData[0].id : null);
      } catch (err) {
        console.warn('Failed to load campus locations:', err);
      }
    }
    loadCampusHierarchy();
  }, [selectedCampusId]);

  const handleRegister = async () => {
    // Basic validations
    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid college email address.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please check and retry.');
      return;
    }
    if (!selectedCampusId) {
      setErrorMsg('Please select your campus.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'STUDENT',
      student_details: {
        campus_id: selectedCampusId,
        is_hosteler: isHosteler,
        floor_level: floorLevel.trim() || null,
        room_number: roomNumber.trim() || null,
        college_id: !isHosteler ? selectedCollegeId : null,
        block_id: !isHosteler ? selectedBlockId : null,
        hostel_id: isHosteler ? selectedHostelId : null,
      },
    };

    try {
      await register(payload);
      Alert.alert(
        'Registration Successful 🎉',
        'Your student account has been created. Please log in with your email and password.',
        [
          {
            text: 'Proceed to Login',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1E293B" />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Create Student Account</Text>
            <Text style={styles.subtitle}>Join CampusBite to order food on campus</Text>
          </View>
        </View>

        {/* Error Banner */}
        {errorMsg && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={18} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* Section 1: Basic Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>1. Personal Information</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Aman Nishad"
              placeholderTextColor="#94A3B8"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>College Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. student@bbdu.ac.in"
              placeholderTextColor="#94A3B8"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94A3B8"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordWrapper}>
              <TextInput
                style={[styles.input, { flex: 1, borderWidth: 0 }]}
                placeholder="At least 6 characters"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              placeholder="Re-enter your password"
              placeholderTextColor="#94A3B8"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Section 2: Campus & Hostel Information */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>2. Campus & Delivery Location</Text>

          {/* Campus Selector */}
          <Text style={styles.label}>Select Campus *</Text>
          {loadingLocations ? (
            <ActivityIndicator size="small" color="#FF5722" style={{ marginVertical: 10 }} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
              {campuses.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pill, selectedCampusId === c.id && styles.pillSelected]}
                  onPress={() => setSelectedCampusId(c.id)}
                >
                  <Text style={[styles.pillText, selectedCampusId === c.id && styles.pillTextSelected]}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Student Residency Toggle */}
          <Text style={[styles.label, { marginTop: 14 }]}>Student Residency Type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, isHosteler && styles.toggleBtnActive]}
              onPress={() => setIsHosteler(true)}
            >
              <Ionicons
                name="bed-outline"
                size={18}
                color={isHosteler ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleBtnText, isHosteler && styles.toggleBtnTextActive]}>
                Hosteler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toggleBtn, !isHosteler && styles.toggleBtnActive]}
              onPress={() => setIsHosteler(false)}
            >
              <Ionicons
                name="school-outline"
                size={18}
                color={!isHosteler ? '#FFFFFF' : '#64748B'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.toggleBtnText, !isHosteler && styles.toggleBtnTextActive]}>
                Day Scholar
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hosteler specifics */}
          {isHosteler ? (
            <View style={styles.conditionalBox}>
              <Text style={styles.label}>Select Hostel</Text>
              {hostels.length === 0 ? (
                <Text style={styles.noItemsText}>No hostels configured for this campus.</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                  {hostels.map((h) => (
                    <TouchableOpacity
                      key={h.id}
                      style={[styles.pill, selectedHostelId === h.id && styles.pillSelected]}
                      onPress={() => setSelectedHostelId(h.id)}
                    >
                      <Text style={[styles.pillText, selectedHostelId === h.id && styles.pillTextSelected]}>
                        {h.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={styles.conditionalBox}>
              <Text style={styles.label}>College / Institute</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                {colleges.map((col) => (
                  <TouchableOpacity
                    key={col.id}
                    style={[styles.pill, selectedCollegeId === col.id && styles.pillSelected]}
                    onPress={() => setSelectedCollegeId(col.id)}
                  >
                    <Text style={[styles.pillText, selectedCollegeId === col.id && styles.pillTextSelected]}>
                      {col.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.label, { marginTop: 10 }]}>Academic Block</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
                {blocks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.pill, selectedBlockId === b.id && styles.pillSelected]}
                    onPress={() => setSelectedBlockId(b.id)}
                  >
                    <Text style={[styles.pillText, selectedBlockId === b.id && styles.pillTextSelected]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Room & Floor fields */}
          <View style={styles.twoColRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Floor / Level</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 2nd Floor"
                placeholderTextColor="#94A3B8"
                value={floorLevel}
                onChangeText={setFloorLevel}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Room / Lab No.</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Room 204"
                placeholderTextColor="#94A3B8"
                value={roomNumber}
                onChangeText={setRoomNumber}
              />
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.registerButton, submitting && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={submitting}
          activeOpacity={0.8}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.registerButtonText}>Create Student Account</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have a student account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    marginRight: 14,
    padding: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    flex: 1,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#1E293B',
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    height: 46,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  pill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillSelected: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleBtnActive: {
    backgroundColor: '#FF5722',
    borderColor: '#FF5722',
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleBtnTextActive: {
    color: '#FFFFFF',
  },
  conditionalBox: {
    marginTop: 4,
  },
  noItemsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  registerButton: {
    backgroundColor: '#FF5722',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#FF5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#FFAB91',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 13,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF5722',
  },
});
