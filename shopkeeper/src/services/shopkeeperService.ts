import apiClient from '../api/client';
import {
  Shop,
  ShopUpdatePayload,
  ShopkeeperProfile,
  FoodCategory,
  FoodItem,
  FoodItemCreatePayload,
  FoodItemUpdatePayload,
  Order,
  EarningSummary,
  Notification,
  UnreadCountResponse
} from '../types';

export const shopkeeperService = {
  // Profile & Assigned Canteen
  getMyProfile: async (): Promise<ShopkeeperProfile> => {
    const res = await apiClient.get<ShopkeeperProfile>('/shopkeepers/me');
    return res.data;
  },

  // Canteen Information
  getMyShop: async (): Promise<Shop> => {
    const res = await apiClient.get<Shop>('/shopkeepers/me/shop');
    return res.data;
  },

  updateMyShop: async (payload: ShopUpdatePayload): Promise<Shop> => {
    const res = await apiClient.put<Shop>('/shopkeepers/me/shop', payload);
    return res.data;
  },

  // Categories
  getCategories: async (): Promise<FoodCategory[]> => {
    const res = await apiClient.get<FoodCategory[]>('/shopkeepers/me/categories');
    return res.data;
  },

  createCategory: async (name: string): Promise<FoodCategory> => {
    const res = await apiClient.post<FoodCategory>('/shopkeepers/me/categories', { name });
    return res.data;
  },

  updateCategory: async (id: number, name: string): Promise<FoodCategory> => {
    const res = await apiClient.put<FoodCategory>(`/shopkeepers/me/categories/${id}`, { name });
    return res.data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await apiClient.delete(`/shopkeepers/me/categories/${id}`);
  },

  // Menu Items
  getMenu: async (): Promise<FoodItem[]> => {
    const res = await apiClient.get<FoodItem[]>('/shopkeepers/me/menu');
    return res.data;
  },

  createMenuItem: async (payload: FoodItemCreatePayload): Promise<FoodItem> => {
    const res = await apiClient.post<FoodItem>('/shopkeepers/me/menu', payload);
    return res.data;
  },

  updateMenuItem: async (id: string, payload: FoodItemUpdatePayload): Promise<FoodItem> => {
    const res = await apiClient.put<FoodItem>(`/shopkeepers/me/menu/${id}`, payload);
    return res.data;
  },

  toggleItemAvailability: async (id: string, is_available: boolean): Promise<FoodItem> => {
    const res = await apiClient.patch<FoodItem>(`/shopkeepers/me/menu/${id}/availability`, { is_available });
    return res.data;
  },

  deleteMenuItem: async (id: string): Promise<void> => {
    await apiClient.delete(`/shopkeepers/me/menu/${id}`);
  },

  // Orders
  getOrders: async (statusFilter?: string): Promise<Order[]> => {
    const params = statusFilter && statusFilter !== 'ALL' ? { status_filter: statusFilter } : {};
    const res = await apiClient.get<Order[]>('/shopkeepers/me/orders', { params });
    return res.data;
  },

  getOrderDetails: async (id: string): Promise<Order> => {
    const res = await apiClient.get<Order>(`/shopkeepers/me/orders/${id}`);
    return res.data;
  },

  updateOrderStatus: async (id: string, status: string): Promise<Order> => {
    const res = await apiClient.patch<Order>(`/shopkeepers/me/orders/${id}/status`, { status });
    return res.data;
  },

  // Revenue & Earnings
  getEarnings: async (): Promise<EarningSummary> => {
    const res = await apiClient.get<EarningSummary>('/shopkeepers/me/earnings');
    return res.data;
  },

  // In-App Notifications
  getNotifications: async (): Promise<Notification[]> => {
    const res = await apiClient.get<Notification[]>('/shopkeepers/me/notifications');
    return res.data;
  },

  getUnreadNotificationsCount: async (): Promise<UnreadCountResponse> => {
    const res = await apiClient.get<UnreadCountResponse>('/shopkeepers/me/notifications/unread-count');
    return res.data;
  },

  markNotificationRead: async (id: string): Promise<Notification> => {
    const res = await apiClient.patch<Notification>(`/shopkeepers/me/notifications/${id}/read`);
    return res.data;
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await apiClient.post('/shopkeepers/me/notifications/read-all');
  }
};
