import axios from 'axios';
import { API_BASE_URL } from '../utils/config';
import { getToken, clearAuthSession } from '../storage/auth';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to automatically attach authorization header
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration or general gateway errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local auth session on unauthorized token states
      await clearAuthSession();
    }
    return Promise.reject(error);
  }
);

/**
 * Parses axios errors and FastAPI validation errors into a human-friendly string.
 */
export function parseApiError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';
  if (error.response) {
    const data = error.response.data;
    if (typeof data?.detail === 'string') {
      return data.detail;
    }
    if (Array.isArray(data?.detail)) {
      // FastAPI 422 validation errors array
      return data.detail.map((err: any) => err.msg || `${err.loc?.slice(-1)[0] || 'Field'} is invalid`).join(', ');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
    if (error.response.status === 404) {
      return 'Requested resource was not found.';
    }
    if (error.response.status === 403) {
      return 'Access denied. You do not have permission for this action.';
    }
    if (error.response.status >= 500) {
      return 'Server is currently unavailable. Please try again in a few moments.';
    }
  }
  if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
    return 'Unable to connect to CampusBite server. Please check your internet connection.';
  }
  return error.message || 'Something went wrong. Please retry.';
}

export default apiClient;
