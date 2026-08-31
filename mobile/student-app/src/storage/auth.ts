import * as SecureStore from 'expo-secure-store';
import { User } from '../types';

const TOKEN_KEY = 'campusbite_access_token';
const USER_KEY = 'campusbite_user_data';

// In-memory fallback dictionary for test suites and browser previews
const memoryStore: { [key: string]: string } = {};

async function isSecureStoreAvailable(): Promise<boolean> {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function saveToken(token: string): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } else {
    memoryStore[TOKEN_KEY] = token;
  }
}

export async function getToken(): Promise<string | null> {
  if (await isSecureStoreAvailable()) {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } else {
    return memoryStore[TOKEN_KEY] || null;
  }
}

export async function deleteToken(): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } else {
    delete memoryStore[TOKEN_KEY];
  }
}

export async function saveUser(user: User): Promise<void> {
  const userStr = JSON.stringify(user);
  if (await isSecureStoreAvailable()) {
    await SecureStore.setItemAsync(USER_KEY, userStr);
  } else {
    memoryStore[USER_KEY] = userStr;
  }
}

export async function getUser(): Promise<User | null> {
  let userStr: string | null = null;
  if (await isSecureStoreAvailable()) {
    userStr = await SecureStore.getItemAsync(USER_KEY);
  } else {
    userStr = memoryStore[USER_KEY] || null;
  }
  
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

export async function deleteUser(): Promise<void> {
  if (await isSecureStoreAvailable()) {
    await SecureStore.deleteItemAsync(USER_KEY);
  } else {
    delete memoryStore[USER_KEY];
  }
}

export async function clearAuthSession(): Promise<void> {
  await deleteToken();
  await deleteUser();
}
