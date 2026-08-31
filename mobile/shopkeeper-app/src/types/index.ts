export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'SHOPKEEPER' | 'DELIVERY_PARTNER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string | null;
  logo_url?: string | null;
  rating: number;
  is_open: boolean;
  campus_id: number;
  phone_number?: string | null;
  opening_time?: string | null;
  closing_time?: string | null;
  delivery_available: boolean;
}

export interface FoodCategory {
  id: number;
  name: string;
  shop_id: string;
}

export interface FoodItem {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  is_veg: boolean;
  is_available: boolean;
  category_id: number;
  shop_id: string;
  description?: string | null;
  preparation_time: number;
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
  status: 'PENDING' | 'ACCEPTED' | 'PREPARING' | 'READY_FOR_PICKUP' | 'PICKED_UP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
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
  otp: string;
  created_at: string;
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
