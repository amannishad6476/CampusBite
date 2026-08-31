import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../types';
import { getToken, getUser, saveToken, saveUser, clearAuthSession } from '../storage/auth';
import apiClient from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getToken();
        const storedUser = await getUser();
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
        }
      } catch (e) {
        console.error('Failed to restore delivery auth session:', e);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      if (userData.role !== 'DELIVERY_PARTNER') {
        throw new Error('Access denied: Only delivery partners are authorized to use this application.');
      }
      
      await saveToken(access_token);
      await saveUser(userData);
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      const message = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(message);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await clearAuthSession();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider');
  }
  return context;
};
export default AuthContext;
