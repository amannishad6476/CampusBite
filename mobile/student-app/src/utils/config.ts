import { Platform } from 'react-native';

// Dynamically resolve loopback mapping based on OS environment
// For Android Emulator, 10.0.2.2 routes to the host's localhost port.
// For physical devices running Expo Go, update this to your machine's local IP (e.g., 192.168.1.X).
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});
