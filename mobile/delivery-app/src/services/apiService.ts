import apiClient from '../api/client';
import { DeliveryPartnerProfile, Order, DeliveryEarningSummary } from '../types';

export const apiService = {
  async getProfile(): Promise<DeliveryPartnerProfile> {
    const response = await apiClient.get<DeliveryPartnerProfile>('/delivery/me');
    return response.data;
  },

  async updateAvailability(is_active: boolean): Promise<DeliveryPartnerProfile> {
    const response = await apiClient.patch<DeliveryPartnerProfile>('/delivery/me/availability', { is_active });
    return response.data;
  },

  async getAvailableOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/delivery/available-orders');
    return response.data;
  },

  async acceptOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/delivery/orders/${orderId}/accept`);
    return response.data;
  },

  async getActiveOrder(): Promise<Order> {
    const response = await apiClient.get<Order>('/delivery/orders/active');
    return response.data;
  },

  async getHistory(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/delivery/orders/history');
    return response.data;
  },

  async getOrderDetails(orderId: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/delivery/orders/${orderId}`);
    return response.data;
  },

  async pickupOrder(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/delivery/orders/${orderId}/pickup`);
    return response.data;
  },

  async startDelivery(orderId: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/delivery/orders/${orderId}/start`);
    return response.data;
  },

  async verifyOtp(orderId: string, otp: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/delivery/orders/${orderId}/verify-otp`, { otp });
    return response.data;
  },

  async getEarnings(): Promise<DeliveryEarningSummary> {
    const response = await apiClient.get<DeliveryEarningSummary>('/delivery/earnings');
    return response.data;
  },

  async getEarningsHistory(page = 1, limit = 20): Promise<{ total_records: number; items: any[] }> {
    const response = await apiClient.get('/delivery/earnings/history', { params: { page, limit } });
    return response.data;
  },

  async updateLocation(latitude: number, longitude: number): Promise<any> {
    const response = await apiClient.patch('/delivery/me/location', { latitude, longitude });
    return response.data;
  },

  async updateProfile(data: { name?: string; phone?: string; vehicle_type?: string; vehicle_number?: string }): Promise<DeliveryPartnerProfile> {
    const response = await apiClient.put<DeliveryPartnerProfile>('/delivery/me/profile', data);
    return response.data;
  },

  async unassignOrder(orderId: string, reason = 'Rider requested unassignment'): Promise<any> {
    const response = await apiClient.post(`/delivery/orders/${orderId}/unassign`, { reason });
    return response.data;
  },

  async getNotifications(): Promise<any[]> {
    const response = await apiClient.get('/delivery/notifications');
    return response.data;
  },

  async getUnreadNotificationsCount(): Promise<{ unread_count: number }> {
    const response = await apiClient.get('/delivery/notifications/unread-count');
    return response.data;
  },

  async markNotificationRead(notificationId: string): Promise<any> {
    const response = await apiClient.patch(`/delivery/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsRead(): Promise<any> {
    const response = await apiClient.post('/delivery/notifications/read-all');
    return response.data;
  }
};


export default apiService;
