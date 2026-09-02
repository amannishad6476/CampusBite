import { Platform } from 'react-native';

/**
 * CampusBite Delivery Partner Mobile API Configuration
 * 
 * Railway Live Production API:
 * https://brave-tranquility-production-a3f8.up.railway.app/api/v1
 */
export const PROD_API_URL: string = 'https://brave-tranquility-production-a3f8.up.railway.app/api/v1';

export const API_BASE_URL = PROD_API_URL || Platform.select({
  android: 'https://brave-tranquility-production-a3f8.up.railway.app/api/v1',
  ios: 'https://brave-tranquility-production-a3f8.up.railway.app/api/v1',
  default: 'https://brave-tranquility-production-a3f8.up.railway.app/api/v1',
});

