import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import apiClient from '../api/client';
import { User, ShopkeeperProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: ShopkeeperProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ShopkeeperProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/shopkeepers/me');
      setProfile(res.data);
    } catch (err) {
      console.warn('Could not fetch shopkeeper profile:', err);
    }
  };

  useEffect(() => {
    const storedToken = localStorage.getItem('campusbite_shopkeeper_token');
    const storedUser = localStorage.getItem('campusbite_shopkeeper_user');

    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'SHOPKEEPER') {
          setToken(storedToken);
          setUser(parsedUser);
          // Refresh profile in background
          fetchProfile();
        } else {
          localStorage.removeItem('campusbite_shopkeeper_token');
          localStorage.removeItem('campusbite_shopkeeper_user');
        }
      } catch {
        localStorage.removeItem('campusbite_shopkeeper_token');
        localStorage.removeItem('campusbite_shopkeeper_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;

      if (userData.role !== 'SHOPKEEPER') {
        throw new Error('Access denied: Unauthorized role. This portal is exclusively for Canteen Shopkeepers.');
      }

      localStorage.setItem('campusbite_shopkeeper_token', access_token);
      localStorage.setItem('campusbite_shopkeeper_user', JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);

      // Fetch profile
      try {
        const profRes = await apiClient.get('/shopkeepers/me', {
          headers: { Authorization: `Bearer ${access_token}` },
        });
        setProfile(profRes.data);
      } catch (profErr) {
        console.warn('Could not load profile after login:', profErr);
      }
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('campusbite_shopkeeper_token');
    localStorage.removeItem('campusbite_shopkeeper_user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};

export default AuthContext;
