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
  PaymentSessionResponse,
  PaymentVerificationResponse,
  OrderReview,
  AppNotification,
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

  /**
   * Initialize a server-side Cashfree payment session for an order
   */
  async createPaymentSession(orderId: string): Promise<PaymentSessionResponse> {
    try {
      const response = await apiClient.post<PaymentSessionResponse>(
        `/students/orders/${orderId}/create-payment`
      );
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Verify order payment status with Cashfree via backend
   */
  async verifyPayment(orderId: string): Promise<PaymentVerificationResponse> {
    try {
      const response = await apiClient.post<PaymentVerificationResponse>(
        `/students/orders/${orderId}/verify-payment`
      );
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Submit an in-app review for a delivered order
   */
  async submitOrderReview(
    orderId: string,
    rating: number,
    comment?: string
  ): Promise<OrderReview> {
    try {
      const response = await apiClient.post<OrderReview>(
        `/students/orders/${orderId}/review`,
        {
          rating,
          comment: comment?.trim() || undefined,
          rating_shop: rating,
          review_text_shop: comment?.trim() || undefined,
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Retrieve existing review for a specific order (or null if not yet reviewed)
   */
  async getOrderReview(orderId: string): Promise<OrderReview | null> {
    try {
      const response = await apiClient.get<OrderReview | null>(
        `/students/orders/${orderId}/review`
      );
      return response.data;
    } catch (error) {
      // If 404, order has not been reviewed yet
      return null;
    }
  },

  /**
   * Fetch all reviews submitted by the current authenticated student
   */
  async getStudentReviews(): Promise<OrderReview[]> {
    try {
      const response = await apiClient.get<OrderReview[]>('/students/reviews');
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Retrieve all in-app notifications for the authenticated student
   */
  async getNotifications(): Promise<AppNotification[]> {
    try {
      const response = await apiClient.get<AppNotification[]>('/students/notifications');
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Retrieve unread notification count for badge counters
   */
  async getUnreadNotificationCount(): Promise<number> {
    try {
      const response = await apiClient.get<{ unread_count: number }>(
        '/students/notifications/unread-count'
      );
      return response.data.unread_count;
    } catch (error) {
      return 0;
    }
  },

  /**
   * Mark a single notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<AppNotification> {
    try {
      const response = await apiClient.patch<AppNotification>(
        `/students/notifications/${notificationId}/read`
      );
      return response.data;
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllNotificationsAsRead(): Promise<void> {
    try {
      await apiClient.post('/students/notifications/read-all');
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Clear / delete all student notifications
   */
  async clearNotifications(): Promise<void> {
    try {
      await apiClient.delete('/students/notifications');
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await apiClient.delete(`/students/notifications/${notificationId}`);
    } catch (error) {
      throw new Error(parseApiError(error));
    }
  },
};

export default apiService;

