import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import apiClient from '../api/client';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('campusbite_admin_token');
    const storedUser = localStorage.getItem('campusbite_admin_user');
    
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('campusbite_admin_token');
        localStorage.removeItem('campusbite_admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      if (userData.role !== 'ADMIN') {
        throw new Error('Access denied: Unauthorized access. Administrators only.');
      }
      
      localStorage.setItem('campusbite_admin_token', access_token);
      localStorage.setItem('campusbite_admin_user', JSON.stringify(userData));
      
      setToken(access_token);
      setUser(userData);
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message || 'Login failed';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('campusbite_admin_token');
    localStorage.removeItem('campusbite_admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
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
