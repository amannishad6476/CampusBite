import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { AppNotification } from '../types';
import { getStoredNotifications, saveStoredNotifications } from '../storage/auth';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type?: 'ORDER' | 'SYSTEM' | 'PROMOTION', orderId?: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    async function loadNotifications() {
      const stored = await getStoredNotifications();
      if (stored && stored.length > 0) {
        setNotifications(stored);
      } else {
        const welcomeNotif: AppNotification = {
          id: 'welcome-1',
          title: 'Welcome to CampusBite! 🍔',
          message: 'Order delicious meals directly to your hostel or academic block with verified OTP delivery.',
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'SYSTEM',
        };
        setNotifications([welcomeNotif]);
        await saveStoredNotifications([welcomeNotif]);
      }
    }
    loadNotifications();
  }, []);

  const addNotification = async (
    title: string,
    message: string,
    type: 'ORDER' | 'SYSTEM' | 'PROMOTION' = 'ORDER',
    orderId?: string
  ) => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      timestamp: new Date().toISOString(),
      isRead: false,
      type,
      orderId,
    };
    const updated = [newNotif, ...notifications];
    setNotifications(updated);
    await saveStoredNotifications(updated);
  };

  const markAsRead = async (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    setNotifications(updated);
    await saveStoredNotifications(updated);
  };

  const markAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    await saveStoredNotifications(updated);
  };

  const clearNotifications = async () => {
    setNotifications([]);
    await saveStoredNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
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
