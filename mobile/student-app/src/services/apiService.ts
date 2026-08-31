import apiClient from '../api/client';
import {
  MOCK_CITIES,
  MOCK_CAMPUSES,
  MOCK_COLLEGES,
  MOCK_BLOCKS,
  MOCK_HOSTELS,
  MOCK_SHOPS,
  MOCK_FOOD_ITEMS,
  MOCK_CATEGORIES,
  MOCK_ORDERS
} from './mockData';
import { City, Campus, College, Block, Hostel, Shop, FoodItem, FoodCategory, Order } from '../types';

// Global local memory cache for simulation updates (e.g., placing new orders)
const localOrders: Order[] = [...MOCK_ORDERS];

export const apiService = {
  async getCities(): Promise<City[]> {
    try {
      const response = await apiClient.get<City[]>('/cities');
      return response.data;
    } catch (error) {
      console.warn('API getCities missing or failed. Falling back to local memory.');
      return MOCK_CITIES;
    }
  },

  async getCampuses(cityId?: number): Promise<Campus[]> {
    try {
      const response = await apiClient.get<Campus[]>(`/campuses?city_id=${cityId}`);
      return response.data;
    } catch (error) {
      console.warn('API getCampuses missing or failed. Falling back to local memory.');
      return cityId ? MOCK_CAMPUSES.filter(c => c.city_id === cityId) : MOCK_CAMPUSES;
    }
  },

  async getColleges(campusId: number): Promise<College[]> {
    try {
      const response = await apiClient.get<College[]>(`/colleges?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      console.warn('API getColleges missing or failed. Falling back to local memory.');
      return MOCK_COLLEGES.filter(c => c.campus_id === campusId);
    }
  },

  async getBlocks(campusId: number): Promise<Block[]> {
    try {
      const response = await apiClient.get<Block[]>(`/blocks?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      console.warn('API getBlocks missing or failed. Falling back to local memory.');
      return MOCK_BLOCKS.filter(b => b.campus_id === campusId);
    }
  },

  async getHostels(campusId: number): Promise<Hostel[]> {
    try {
      const response = await apiClient.get<Hostel[]>(`/hostels?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      console.warn('API getHostels missing or failed. Falling back to local memory.');
      return MOCK_HOSTELS.filter(h => h.campus_id === campusId);
    }
  },

  async getShops(campusId: number): Promise<Shop[]> {
    try {
      const response = await apiClient.get<Shop[]>(`/students/shops?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      console.warn('API getShops missing or failed. Falling back to local memory.');
      return MOCK_SHOPS.filter(s => s.campus_id === campusId);
    }
  },

  async getShopCategories(shopId: string): Promise<FoodCategory[]> {
    try {
      const response = await apiClient.get<FoodCategory[]>(`/students/shops/${shopId}/categories`);
      return response.data;
    } catch (error) {
      console.warn('API getShopCategories missing. Falling back to local memory.');
      return MOCK_CATEGORIES.filter(c => c.shop_id === shopId);
    }
  },

  async getShopMenu(shopId: string): Promise<FoodItem[]> {
    try {
      const response = await apiClient.get<FoodItem[]>(`/students/shops/${shopId}/menu`);
      return response.data;
    } catch (error) {
      console.warn('API getShopMenu missing or failed. Falling back to local memory.');
      return MOCK_FOOD_ITEMS.filter(item => item.shop_id === shopId);
    }
  },

  async placeOrder(orderPayload: any): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/students/orders', orderPayload);
      return response.data;
    } catch (error) {
      console.warn('API placeOrder missing or failed. Simulating order placement in local memory.');
      
      const newOrder: Order = {
        id: `order-${Math.floor(Math.random() * 1000) + 100}`,
        order_number: `CB-2026-${Math.floor(Math.random() * 9000) + 1000}`,
        student_id: 'student-uuid',
        shop_id: orderPayload.shop_id,
        shop_name: MOCK_SHOPS.find(s => s.id === orderPayload.shop_id)?.name || 'Campus Canteen',
        status: 'PENDING',
        subtotal: orderPayload.subtotal,
        delivery_fee: orderPayload.delivery_fee,
        discount: orderPayload.discount,
        tax: orderPayload.tax,
        total_amount: orderPayload.total_amount,
        payment_status: orderPayload.payment_method === 'ONLINE' ? 'PAID' : 'PENDING',
        payment_method: orderPayload.payment_method,
        delivery_address: {
          campus_name: orderPayload.delivery_address.campus_name,
          college_name: orderPayload.delivery_address.college_name,
          block_name: orderPayload.delivery_address.block_name,
          hostel_name: orderPayload.delivery_address.hostel_name,
          floor_level: orderPayload.delivery_address.floor_level,
          room_number: orderPayload.delivery_address.room_number,
          phone: orderPayload.delivery_address.phone
        },
        otp: String(Math.floor(Math.random() * 9000) + 1000),
        created_at: new Date().toISOString(),
        items: orderPayload.items.map((item: any) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          notes: item.notes
        }))
      };
      
      localOrders.unshift(newOrder);
      return newOrder;
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<Order[]>('/students/orders');
      return response.data;
    } catch (error) {
      console.warn('API getOrders missing or failed. Falling back to local simulated memory.');
      return localOrders;
    }
  }
};
export default apiService;
