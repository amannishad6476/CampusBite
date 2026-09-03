import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { User } from '../types';
import {
  getToken,
  getUser,
  saveToken,
  saveUser,
  clearAuthSession,
  getSelectedCampusId,
  saveSelectedCampusId,
  isOnboardingCompleted,
  setOnboardingCompleted,
} from '../storage/auth';
import apiClient, { parseApiError } from '../api/client';
import apiService from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  selectedCampusId: number | null;
  setSelectedCampus: (campusId: number) => Promise<void>;
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<any>;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCampusId, setSelectedCampusIdState] = useState<number | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session and preferences on application mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const [storedToken, storedUser, storedCampusId, onboardingStatus] = await Promise.all([
          getToken(),
          getUser(),
          getSelectedCampusId(),
          isOnboardingCompleted(),
        ]);

        setHasCompletedOnboarding(onboardingStatus);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(storedUser);
          
          // Determine initial campus
          if (storedCampusId) {
            setSelectedCampusIdState(storedCampusId);
          } else if (storedUser.student_details?.campus_id) {
            setSelectedCampusIdState(storedUser.student_details.campus_id);
          } else {
            setSelectedCampusIdState(1);
          }
        } else {
          setSelectedCampusIdState(storedCampusId || 1);
        }
      } catch (e) {
        console.error('Failed to restore authentication session:', e);
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const setSelectedCampus = async (campusId: number) => {
    setSelectedCampusIdState(campusId);
    await saveSelectedCampusId(campusId);
  };

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    setHasCompletedOnboarding(true);
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await apiService.getMe();
      await saveUser(updatedUser);
      setUser(updatedUser);
    } catch (err) {
      console.warn('Could not refresh user profile:', err);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      const { access_token, user: userData } = response.data;

      if (userData.role !== 'STUDENT') {
        throw new Error('This application is restricted to STUDENTS. Please use the appropriate portal.');
      }

      await saveToken(access_token);
      await saveUser(userData);
      setToken(access_token);
      setUser(userData);

      // Restore or set user campus
      const studentCampus = userData.student?.campus_id || userData.student_details?.campus_id || 1;
      setSelectedCampusIdState(studentCampus);
      await saveSelectedCampusId(studentCampus);
    } catch (error: any) {
      const message = parseApiError(error);
      throw new Error(message);
    }
  };

  const register = async (payload: any) => {
    try {
      const response = await apiClient.post('/auth/register', payload);
      return response.data;
    } catch (error: any) {
      const message = parseApiError(error);
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
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        selectedCampusId,
        setSelectedCampus,
        hasCompletedOnboarding,
        completeOnboarding,
        login,
        register,
        refreshUser,
        logout,
      }}
    >
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
