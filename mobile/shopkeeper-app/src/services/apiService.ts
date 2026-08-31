import apiClient from '../api/client';
import { Shop, FoodCategory, FoodItem, Order, EarningSummary } from '../types';

export const apiService = {
  async getShop(): Promise<Shop> {
    const response = await apiClient.get<Shop>('/shopkeepers/me/shop');
    return response.data;
  },

  async updateShop(payload: Partial<Shop>): Promise<Shop> {
    const response = await apiClient.put<Shop>('/shopkeepers/me/shop', payload);
    return response.data;
  },

  async getCategories(): Promise<FoodCategory[]> {
    const response = await apiClient.get<FoodCategory[]>('/shopkeepers/me/categories');
    return response.data;
  },

  async createCategory(name: string): Promise<FoodCategory> {
    const response = await apiClient.post<FoodCategory>('/shopkeepers/me/categories', { name });
    return response.data;
  },

  async updateCategory(id: number, name: string): Promise<FoodCategory> {
    const response = await apiClient.put<FoodCategory>(`/shopkeepers/me/categories/${id}`, { name });
    return response.data;
  },

  async deleteCategory(id: number): Promise<void> {
    await apiClient.delete(`/shopkeepers/me/categories/${id}`);
  },

  async getMenu(): Promise<FoodItem[]> {
    const response = await apiClient.get<FoodItem[]>('/shopkeepers/me/menu');
    return response.data;
  },

  async createMenuItem(payload: Omit<FoodItem, 'id' | 'shop_id'>): Promise<FoodItem> {
    const response = await apiClient.post<FoodItem>('/shopkeepers/me/menu', payload);
    return response.data;
  },

  async updateMenuItem(id: string, payload: Partial<FoodItem>): Promise<FoodItem> {
    const response = await apiClient.put<FoodItem>(`/shopkeepers/me/menu/${id}`, payload);
    return response.data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await apiClient.delete(`/shopkeepers/me/menu/${id}`);
  },

  async getOrders(statusFilter?: string): Promise<Order[]> {
    const url = statusFilter ? `/shopkeepers/me/orders?status_filter=${statusFilter}` : '/shopkeepers/me/orders';
    const response = await apiClient.get<Order[]>(url);
    return response.data;
  },

  async getOrderDetails(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/shopkeepers/me/orders/${id}`);
    return response.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await apiClient.patch<Order>(`/shopkeepers/me/orders/${id}/status`, { status });
    return response.data;
  },

  async getEarnings(): Promise<EarningSummary> {
    const response = await apiClient.get<EarningSummary>('/shopkeepers/me/earnings');
    return response.data;
  }
};

export default apiService;
