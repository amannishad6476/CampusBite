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

export interface DeliveryPartnerProfile {
  user_id: string;
  name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  vehicle_number?: string | null;
  rating: number;
  is_active: boolean;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY';
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
  otp: string;
  created_at: string;
  items: OrderItem[];
}

export interface DeliveryEarningSummary {
  today_earnings: number;
  weekly_earnings: number;
  monthly_earnings: number;
  total_deliveries: number;
  delivery_fee_earned: number;
  net_earnings: number;
}
