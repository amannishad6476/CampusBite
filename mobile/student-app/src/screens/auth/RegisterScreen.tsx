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
  Alert
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import apiService from '../../services/apiService';
import { Campus, College, Block, Hostel } from '../../types';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();

  // Basic Account info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Location selector info (Dynamic)
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);

  // Selected values
  const [selectedCampusId, setSelectedCampusId] = useState<number | null>(null);
  const [isHosteler, setIsHosteler] = useState(false);
  const [selectedCollegeId, setSelectedCollegeId] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null);
  const [selectedHostelId, setSelectedHostelId] = useState<number | null>(null);
  const [floorLevel, setFloorLevel] = useState('');
  const [roomNumber, setRoomNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load campuses on load
  useEffect(() => {
    async function loadCampuses() {
      const data = await apiService.getCampuses();
      setCampuses(data);
      if (data.length > 0) {
        setSelectedCampusId(data[0].id);
      }
    }
    loadCampuses();
  }, []);

  // Reload lists when campus changes
  useEffect(() => {
    if (selectedCampusId === null) return;
    
    async function loadCampusDetails() {
      const colData = await apiService.getColleges(selectedCampusId!);
      setColleges(colData);
      setSelectedCollegeId(colData.length > 0 ? colData[0].id : null);

      const blockData = await apiService.getBlocks(selectedCampusId!);
      setBlocks(blockData);
      setSelectedBlockId(blockData.length > 0 ? blockData[0].id : null);

      const hostelData = await apiService.getHostels(selectedCampusId!);
      setHostels(hostelData);
      setSelectedHostelId(hostelData.length > 0 ? hostelData[0].id : null);
    }
    loadCampusDetails();
  }, [selectedCampusId]);

  const handleRegister = async () => {
    if (!name || !email || !phone || !password || !selectedCampusId) {
      setErrorMsg('Please fill in all basic account fields.');
      return;
    }

    const payload: any = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      role: 'STUDENT',
      student_details: {
        campus_id: selectedCampusId,
        is_hosteler: isHosteler,
        floor_level: floorLevel || null,
        room_number: roomNumber || null,
        college_id: !isHosteler ? selectedCollegeId : null,
        block_id: !isHosteler ? selectedBlockId : null,
        hostel_id: isHosteler ? selectedHostelId : null,
      }
    };

    setErrorMsg(null);
    setLoading(true);
    try {
      await register(payload);
      Alert.alert(
        'Success',
        'Account registered successfully. Please log in.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Verify details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Register</Text>
        <Text style={styles.subtitle}>Join CampusBite food delivery network</Text>

        <View style={styles.form}>
          {/* Account Fields */}
          <Text style={styles.sectionHeader}>Account Information</Text>

          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} placeholder="e.g. Aman Nishad" value={name} onChangeText={setName} />

          <Text style={styles.label}>Email Address</Text>
          <TextInput style={styles.input} placeholder="e.g. student@bbd.ac.in" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} placeholder="e.g. 9876543210" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />

          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} placeholder="Minimum 6 characters" secureTextEntry autoCapitalize="none" value={password} onChangeText={setPassword} />

          {/* Location Fields */}
          <Text style={styles.sectionHeader}>Campus Location Details</Text>

          <Text style={styles.label}>Select Campus</Text>
          <View style={styles.pickerContainer}>
            {campuses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCampusId === c.id && styles.chipSelected]}
                onPress={() => setSelectedCampusId(c.id)}
              >
                <Text style={[styles.chipText, selectedCampusId === c.id && styles.chipTextSelected]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Where do you live?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isHosteler && styles.toggleBtnSelected]}
              onPress={() => setIsHosteler(false)}
            >
              <Text style={[styles.toggleText, !isHosteler && styles.toggleTextSelected]}>Day Scholar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isHosteler && styles.toggleBtnSelected]}
              onPress={() => setIsHosteler(true)}
            >
              <Text style={[styles.toggleText, isHosteler && styles.toggleTextSelected]}>Hosteler</Text>
            </TouchableOpacity>
          </View>

          {/* Conditional Location Lists */}
          {!isHosteler ? (
            <>
              <Text style={styles.label}>Select College</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                {colleges.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, selectedCollegeId === c.id && styles.chipSelected]}
                    onPress={() => setSelectedCollegeId(c.id)}
                  >
                    <Text style={[styles.chipText, selectedCollegeId === c.id && styles.chipTextSelected]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.label}>Select College Block/Building</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                {blocks.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    style={[styles.chip, selectedBlockId === b.id && styles.chipSelected]}
                    onPress={() => setSelectedBlockId(b.id)}
                  >
                    <Text style={[styles.chipText, selectedBlockId === b.id && styles.chipTextSelected]}>
                      {b.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          ) : (
            <>
              <Text style={styles.label}>Select Hostel</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalChips}>
                {hostels.map((h) => (
                  <TouchableOpacity
                    key={h.id}
                    style={[styles.chip, selectedHostelId === h.id && styles.chipSelected]}
                    onPress={() => setSelectedHostelId(h.id)}
                  >
                    <Text style={[styles.chipText, selectedHostelId === h.id && styles.chipTextSelected]}>
                      {h.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <View style={styles.row}>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Floor</Text>
              <TextInput style={styles.input} placeholder="e.g. 3rd" value={floorLevel} onChangeText={setFloorLevel} />
            </View>
            <View style={styles.flexHalf}>
              <Text style={styles.label}>Room/Classroom</Text>
              <TextInput style={styles.input} placeholder="e.g. 302" value={roomNumber} onChangeText={setRoomNumber} />
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.buttonText}>Register Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.footerLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLinkText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF5722',
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 20,
  },
  form: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#37474f',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#fcfcfc',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  horizontalChips: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#fcfcfc',
  },
  chipSelected: {
    borderColor: '#FF5722',
    backgroundColor: '#fff3e0',
  },
  chipText: {
    fontSize: 14,
    color: '#757575',
  },
  chipTextSelected: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  toggleRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 5,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fcfcfc',
  },
  toggleBtnSelected: {
    backgroundColor: '#FF5722',
  },
  toggleText: {
    fontSize: 14,
    color: '#757575',
  },
  toggleTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flexHalf: {
    width: '48%',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FF5722',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    backgroundColor: '#ffab91',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerLink: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerLinkText: {
    color: '#FF5722',
    fontSize: 15,
  },
});
