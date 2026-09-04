export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'SHOPKEEPER' | 'DELIVERY_PARTNER' | 'ADMIN';
  is_active: boolean;
}

export interface ShopkeeperProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  shop_id?: string | null;
  shop_name?: string | null;
  campus_id?: number | null;
  campus_name?: string | null;
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
  campus_name?: string | null;
  phone_number?: string | null;
  status: 'PENDING' | 'APPROVED' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  opening_time?: string | null;
  closing_time?: string | null;
  delivery_available?: boolean;
}

export interface ShopUpdatePayload {
  name?: string;
  description?: string;
  logo_url?: string;
  phone_number?: string;
  opening_time?: string;
  closing_time?: string;
  is_open?: boolean;
  delivery_available?: boolean;
}

export interface FoodCategory {
  id: number;
  name: string;
  shop_id: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  is_veg: boolean;
  is_available: boolean;
  category_id?: number | null;
  category_name?: string | null;
  shop_id: string;
  preparation_time?: number | null;
  image_url?: string | null;
  created_at?: string;
}

export interface FoodItemCreatePayload {
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_veg?: boolean;
  is_available?: boolean;
  category_id?: number;
  preparation_time?: number;
}

export interface FoodItemUpdatePayload {
  name?: string;
  price?: number;
  description?: string;
  image_url?: string;
  is_veg?: boolean;
  is_available?: boolean;
  category_id?: number;
  preparation_time?: number;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  order_number: string;
  student_id: string;
  student_name?: string | null;
  shop_id: string;
  shop_name?: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'ASSIGNED' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: 'COD' | 'ONLINE';
  delivery_address: {
    campus_name?: string;
    college_name?: string | null;
    block_name?: string | null;
    hostel_name?: string | null;
    floor_level?: string | null;
    room_number?: string | null;
    phone?: string;
  };
  delivery_partner_id?: string | null;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface EarningSummary {
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  total_orders: number;
  commission_deducted: number;
  net_earnings: number;
}

export interface Notification {
  id: string;
  user_id: string;
  order_id?: string | null;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: string;
}

export interface UnreadCountResponse {
  unread_count: number;
}
