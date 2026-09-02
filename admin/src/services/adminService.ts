import apiClient from '../api/client';
import {
  DashboardSummary, Campus, College, Block, Hostel,
  Shop, FoodItem, Order, Student, Shopkeeper, DeliveryPartner,
  AuditLog, FinanceSummary
} from '../types';

export const adminService = {
  // 1. Dashboard
  async getDashboard(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/admin/dashboard');
    return response.data;
  },

  // 2. Locations (Campuses)
  async getCampuses(): Promise<Campus[]> {
    const response = await apiClient.get<Campus[]>('/campuses');
    return response.data;
  },
  async createCampus(data: Partial<Campus>): Promise<Campus> {
    const response = await apiClient.post<Campus>('/admin/campuses', data);
    return response.data;
  },
  async updateCampus(id: number, data: Partial<Campus>): Promise<Campus> {
    const response = await apiClient.put<Campus>(`/admin/campuses/${id}`, data);
    return response.data;
  },
  async deleteCampus(id: number): Promise<void> {
    await apiClient.delete(`/admin/campuses/${id}`);
  },

  // 3. Locations (Colleges)
  async getColleges(campusId: number): Promise<College[]> {
    const response = await apiClient.get<College[]>(`/colleges?campus_id=${campusId}`);
    return response.data;
  },
  async createCollege(name: string, campusId: number): Promise<College> {
    const response = await apiClient.post<College>('/admin/colleges', { name, campus_id: campusId });
    return response.data;
  },
  async updateCollege(id: number, name: string, campusId: number): Promise<College> {
    const response = await apiClient.put<College>(`/admin/colleges/${id}`, { name, campus_id: campusId });
    return response.data;
  },
  async deleteCollege(id: number): Promise<void> {
    await apiClient.delete(`/admin/colleges/${id}`);
  },

  // 4. Locations (Blocks)
  async getBlocks(campusId: number): Promise<Block[]> {
    const response = await apiClient.get<Block[]>(`/blocks?campus_id=${campusId}`);
    return response.data;
  },
  async createBlock(name: string, campusId: number): Promise<Block> {
    const response = await apiClient.post<Block>('/admin/blocks', { name, campus_id: campusId });
    return response.data;
  },
  async updateBlock(id: number, name: string, campusId: number): Promise<Block> {
    const response = await apiClient.put<Block>(`/admin/blocks/${id}`, { name, campus_id: campusId });
    return response.data;
  },
  async deleteBlock(id: number): Promise<void> {
    await apiClient.delete(`/admin/blocks/${id}`);
  },

  // 5. Locations (Hostels)
  async getHostels(campusId: number): Promise<Hostel[]> {
    const response = await apiClient.get<Hostel[]>(`/hostels?campus_id=${campusId}`);
    return response.data;
  },
  async createHostel(name: string, campusId: number): Promise<Hostel> {
    const response = await apiClient.post<Hostel>('/admin/hostels', { name, campus_id: campusId });
    return response.data;
  },
  async updateHostel(id: number, name: string, campusId: number): Promise<Hostel> {
    const response = await apiClient.put<Hostel>(`/admin/hostels/${id}`, { name, campus_id: campusId });
    return response.data;
  },
  async deleteHostel(id: number): Promise<void> {
    await apiClient.delete(`/admin/hostels/${id}`);
  },

  // 6. Shops
  async getShops(): Promise<Shop[]> {
    const response = await apiClient.get<Shop[]>('/admin/shops');
    return response.data;
  },
  async getShopDetails(id: string): Promise<Shop> {
    const response = await apiClient.get<Shop>(`/admin/shops/${id}`);
    return response.data;
  },
  async changeShopStatus(id: string, status: string, reason?: string): Promise<Shop> {
    const response = await apiClient.patch<Shop>(`/admin/shops/${id}/status`, { status, reason });
    return response.data;
  },
  async getShopMenu(id: string): Promise<FoodItem[]> {
    const response = await apiClient.get<FoodItem[]>(`/admin/shops/${id}/menu`);
    return response.data;
  },
  async getShopOrders(id: string): Promise<Order[]> {
    const response = await apiClient.get<Order[]>(`/admin/shops/${id}/orders`);
    return response.data;
  },

  // 7. User Profiles
  async getStudents(): Promise<Student[]> {
    const response = await apiClient.get<Student[]>('/admin/students');
    return response.data;
  },
  async getShopkeepers(): Promise<Shopkeeper[]> {
    const response = await apiClient.get<Shopkeeper[]>('/admin/shopkeepers');
    return response.data;
  },
  async getDeliveryPartners(): Promise<DeliveryPartner[]> {
    const response = await apiClient.get<DeliveryPartner[]>('/admin/delivery-partners');
    return response.data;
  },
  async toggleUserStatus(id: string, is_active: boolean, reason?: string): Promise<void> {
    await apiClient.patch(`/admin/users/${id}/status`, { is_active, reason });
  },

  // 8. Orders override operations
  async getOrders(): Promise<Order[]> {
    const response = await apiClient.get<Order[]>('/admin/orders');
    return response.data;
  },
  async getOrderById(id: string): Promise<Order> {
    const response = await apiClient.get<Order>(`/admin/orders/${id}`);
    return response.data;
  },
  async overrideOrderStatus(id: string, status: string, reason: string): Promise<Order> {
    const response = await apiClient.post<Order>(`/admin/orders/${id}/override`, { status, reason });
    return response.data;
  },

  // 9. Finance reports
  async getFinanceOverview(): Promise<FinanceSummary> {
    const response = await apiClient.get<FinanceSummary>('/admin/finance');
    return response.data;
  },

  // 10. Audit log history feed
  async getAuditLogs(): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>('/admin/audit-logs');
    return response.data;
  }
};

export default adminService;
