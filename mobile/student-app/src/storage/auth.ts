import * as SecureStore from 'expo-secure-store';
import { User, OrderReview, AppNotification } from '../types';

const TOKEN_KEY = 'campusbite_access_token';
const USER_KEY = 'campusbite_user_data';
const CAMPUS_KEY = 'campusbite_selected_campus';
const ONBOARDING_KEY = 'campusbite_onboarding_completed';
const REVIEWS_KEY = 'campusbite_order_reviews';
const NOTIFICATIONS_KEY = 'campusbite_notifications';

// In-memory fallback dictionary for test suites and browser previews
const memoryStore: { [key: string]: string } = {};

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function setItem(key: string, value: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
  } else {
    memoryStore[key] = value;
  }
}

async function getItem(key: string): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return await SecureStore.getItemAsync(key);
  } else {
    return memoryStore[key] || null;
  }
}

async function deleteItem(key: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
  } else {
    delete memoryStore[key];
  }
}

export async function saveToken(token: string): Promise<void> {
  await setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return await getItem(TOKEN_KEY);
}

export async function deleteToken(): Promise<void> {
  await deleteItem(TOKEN_KEY);
}

export async function saveUser(user: User): Promise<void> {
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<User | null> {
  const userStr = await getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  await deleteItem(USER_KEY);
}

export async function saveSelectedCampusId(campusId: number): Promise<void> {
  await setItem(CAMPUS_KEY, String(campusId));
}

export async function getSelectedCampusId(): Promise<number | null> {
  const val = await getItem(CAMPUS_KEY);
  return val ? parseInt(val, 10) : null;
}

export async function setOnboardingCompleted(): Promise<void> {
  await setItem(ONBOARDING_KEY, 'true');
}

export async function isOnboardingCompleted(): Promise<boolean> {
  const val = await getItem(ONBOARDING_KEY);
  return val === 'true';
}

export async function getStoredReviews(): Promise<OrderReview[]> {
  const val = await getItem(REVIEWS_KEY);
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

export async function saveOrderReview(review: OrderReview): Promise<void> {
  const current = await getStoredReviews();
  const existingIdx = current.findIndex(r => r.order_id === review.order_id);
  if (existingIdx >= 0) {
    current[existingIdx] = review;
  } else {
    current.push(review);
  }
  await setItem(REVIEWS_KEY, JSON.stringify(current));
}

export async function getStoredNotifications(): Promise<AppNotification[]> {
  const val = await getItem(NOTIFICATIONS_KEY);
  if (!val) return [];
  try {
    return JSON.parse(val);
  } catch {
    return [];
  }
}

export async function saveStoredNotifications(notifs: AppNotification[]): Promise<void> {
  await setItem(NOTIFICATIONS_KEY, JSON.stringify(notifs));
}

export async function clearAuthSession(): Promise<void> {
  await deleteToken();
  await deleteUser();
  await deleteItem(CAMPUS_KEY);
}
