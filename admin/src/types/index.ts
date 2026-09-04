export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'SHOPKEEPER' | 'DELIVERY_PARTNER' | 'ADMIN';
  is_active: boolean;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  campus_id: number;
  college_id: number;
  created_at: string;
}

export interface Shopkeeper {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_active: boolean;
  vehicle_type: string;
  vehicle_number?: string | null;
  rating: number;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
  created_at: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  shopkeeper_id: string;
  rating: number;
  is_open: boolean;
  campus_id: number;
  phone_number?: string | null;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  opening_time?: string | null;
  closing_time?: string | null;
  delivery_available?: boolean;
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  category_id?: number | null;
  shop_id: string;
  preparation_time?: number | null;
  image_url?: string | null;
}

export interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  student_id: string;
  shop_id: string;
  shop_name: string;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: 'COD' | 'ONLINE';
  delivery_address: {
    campus_name: string;
    college_name?: string | null;
    block_name?: string | null;
    hostel_name?: string | null;
    floor_level?: string | null;
    room_number?: string | null;
    phone: string;
  };
  delivery_partner_id?: string | null;
  otp: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  reason?: string | null;
  timestamp: string;
}

export interface Campus {
  id: number;
  name: string;
  address?: string | null;
  city_id: number;
  latitude?: number | null;
  longitude?: number | null;
}

export interface College {
  id: number;
  name: string;
  campus_id: number;
}

export interface Block {
  id: number;
  name: string;
  campus_id: number;
}

export interface Hostel {
  id: number;
  name: string;
  campus_id: number;
}

export interface DashboardSummary {
  total_students: number;
  total_shopkeepers: number;
  total_delivery_partners: number;
  total_shops: number;
  active_shops: number;
  today_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  today_gmv: number;
  platform_commission: number;
  delivery_fees: number;
  net_platform_earnings: number;
}

export interface FinanceSummary {
  shopkeepers: {
    gross_sales: number;
    commission_deducted: number;
    net_earnings: number;
  };
  delivery_partners: {
    delivery_earnings: number;
    deductions: number;
    net_earnings: number;
  };
  platform: {
    commission_revenue: number;
    delivery_fees_collected: number;
    net_earnings: number;
  };
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  order_number?: string | null;
  amount: number;
  status: string;
  gateway: string;
  transaction_ref?: string | null;
  created_at: string;
  student_name?: string | null;
  shop_name?: string | null;
}

export interface ReportMetrics {
  total_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  gmv: number;
  delivery_fees: number;
}

export interface CanteenReport {
  shop_id: string;
  shop_name: string;
  campus_id: number;
  total_orders: number;
  delivered_orders: number;
  revenue: number;
}

export interface RiderReport {
  rider_id: string;
  rider_name: string;
  vehicle_type: string;
  rating: number;
  completed_deliveries: number;
  is_active: boolean;
}

export interface ReportSummary {
  today: ReportMetrics;
  this_week: ReportMetrics;
  this_month: ReportMetrics;
  all_time: ReportMetrics;
  canteens: CanteenReport[];
  riders: RiderReport[];
}

