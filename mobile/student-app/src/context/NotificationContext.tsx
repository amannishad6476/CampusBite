import React, { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { AppNotification } from '../types';
import { getStoredNotifications, saveStoredNotifications } from '../storage/auth';
import apiService from '../services/apiService';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  refreshNotifications: () => Promise<void>;
  addNotification: (title: string, message: string, type?: string, orderId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const normalizeNotification = (n: any): AppNotification => ({
    id: n.id,
    user_id: n.user_id,
    order_id: n.order_id || n.orderId,
    orderId: n.order_id || n.orderId,
    title: n.title,
    message: n.message,
    type: n.type || 'SYSTEM',
    is_read: n.is_read !== undefined ? n.is_read : (n.isRead !== undefined ? n.isRead : false),
    isRead: n.is_read !== undefined ? n.is_read : (n.isRead !== undefined ? n.isRead : false),
    created_at: n.created_at || n.timestamp || new Date().toISOString(),
    timestamp: n.created_at || n.timestamp || new Date().toISOString(),
  });

  const refreshNotifications = useCallback(async () => {
    try {
      const backendNotifs = await apiService.getNotifications();
      if (Array.isArray(backendNotifs)) {
        const normalized = backendNotifs.map(normalizeNotification);
        setNotifications(normalized);
        await saveStoredNotifications(normalized);
        return;
      }
    } catch (err) {
      // Offline fallback: load from local secure storage
    }

    const stored = await getStoredNotifications();
    if (stored && stored.length > 0) {
      setNotifications(stored.map(normalizeNotification));
    } else {
      const welcomeNotif: AppNotification = {
        id: 'welcome-1',
        title: 'Welcome to CampusBite! 🍔',
        message: 'Order delicious meals directly to your hostel or academic block with verified OTP delivery.',
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
        isRead: false,
        is_read: false,
        type: 'SYSTEM',
      };
      setNotifications([welcomeNotif]);
      await saveStoredNotifications([welcomeNotif]);
    }
  }, []);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  const addNotification = async (
    title: string,
    message: string,
    type: string = 'ORDER',
    orderId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      isRead: false,
      is_read: false,
      type,
      orderId,
      order_id: orderId,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await saveStoredNotifications(updated);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true, is_read: true } : n
    );
    setNotifications(updated);
    await saveStoredNotifications(updated);

    try {
      await apiService.markNotificationAsRead(id);
    } catch (err) {
      // Non-blocking sync error
    }
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true, is_read: true }));
    setNotifications(updated);
    await saveStoredNotifications(updated);

    try {
      await apiService.markAllNotificationsAsRead();
    } catch (err) {
      // Non-blocking sync error
    }
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await saveStoredNotifications([]);

    try {
      await apiService.clearNotifications();
    } catch (err) {
      // Non-blocking sync error
    }
  };

  const deleteNotification = async (id: string) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    await saveStoredNotifications(updated);

    try {
      await apiService.deleteNotification(id);
    } catch (err) {
      // Non-blocking sync error
    }
  };

  const unreadCount = notifications.filter((n) => !(n.isRead ?? n.is_read)).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        refreshNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        deleteNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
