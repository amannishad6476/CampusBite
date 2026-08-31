import { Platform } from 'react-native';

/**
 * CampusBite Student Mobile API Configuration
 * 
 * Development:
 * - Android Emulator: 'http://10.0.2.2:8000/api/v1'
 * - iOS Simulator / Local: 'http://localhost:8000/api/v1'
 * - Physical Device (Expo Go): 'http://<YOUR_LOCAL_IP>:8000/api/v1' (e.g. 'http://192.168.1.100:8000/api/v1')
 * 
 * Production / Pilot Server:
 * Set PROD_API_URL below or inject via Expo extra app.config.js
 */
export const PROD_API_URL: string | null = null; // e.g. 'https://api.campusbite.com/api/v1'

export const API_BASE_URL = PROD_API_URL || Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});
