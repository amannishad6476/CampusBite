import apiClient, { parseApiError } from '../api/client';
import {
  Campus,
  College,
  Block,
  Hostel,
  Shop,
  FoodItem,
  Order,
  OrderCreatePayload,
  User,
} from '../types';

export const apiService = {
  /**
   * Health check to confirm API gateway availability
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Campuses discovery, optionally filtered by city
   */
  async getCampuses(cityId?: number): Promise<Campus[]> {
    try {
      const url = cityId ? `/campuses?city_id=${cityId}` : '/campuses';
      const response = await apiClient.get<Campus[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Colleges associated with a campus
   */
  async getColleges(campusId: number): Promise<College[]> {
    try {
      const response = await apiClient.get<College[]>(`/colleges?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Academic blocks / buildings for a campus, optionally filtered by college
   */
  async getBlocks(campusId: number, collegeId?: number | null): Promise<Block[]> {
    try {
      let url = `/blocks?campus_id=${campusId}`;
      if (collegeId) {
        url += `&college_id=${collegeId}`;
      }
      const response = await apiClient.get<Block[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Hostels located on a campus
   */
  async getHostels(campusId: number): Promise<Hostel[]> {
    try {
      const response = await apiClient.get<Hostel[]>(`/hostels?campus_id=${campusId}`);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Canteens / food shops operating on a campus
   */
  async getShops(campusId?: number | null): Promise<Shop[]> {
    try {
      const url = campusId ? `/students/shops?campus_id=${campusId}` : '/students/shops';
      const response = await apiClient.get<Shop[]>(url);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Menu catalog items for a canteen
   */
  async getShopMenu(shopId: string): Promise<FoodItem[]> {
    try {
      const response = await apiClient.get<FoodItem[]>(`/students/shops/${shopId}/menu`);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Place a new student food delivery order
   * Submits shop_id, delivery_address, payment_method, and items array.
   */
  async placeOrder(payload: OrderCreatePayload): Promise<Order> {
    try {
      const response = await apiClient.post<Order>('/students/orders', payload);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Retrieve historical and active orders placed by the student
   */
  async getOrders(): Promise<Order[]> {
    try {
      const response = await apiClient.get<Order[]>('/students/orders');
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Retrieve live tracking details for a specific order
   */
  async getOrderDetails(orderId: string): Promise<Order> {
    try {
      const response = await apiClient.get<Order>(`/students/orders/${orderId}`);
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Fetch current authenticated student profile
   */
  async getMe(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },
};

export default apiService;
