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
  }
};

export default apiService;
