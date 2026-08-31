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

export default apiClient;
