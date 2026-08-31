import { Platform } from 'react-native';

/**
 * CampusBite Shopkeeper Mobile API Configuration
 */
export const PROD_API_URL: string | null = null; // e.g. 'https://api.campusbite.com/api/v1'

export const API_BASE_URL = PROD_API_URL || Platform.select({
  android: 'http://10.0.2.2:8000/api/v1',
  ios: 'http://localhost:8000/api/v1',
  default: 'http://localhost:8000/api/v1',
});
