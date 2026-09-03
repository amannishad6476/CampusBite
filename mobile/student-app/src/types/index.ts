export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'STUDENT' | 'SHOPKEEPER' | 'DELIVERY_PARTNER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  student?: Student | null;
  student_details?: Student | null;
}

export interface Student {
  user_id?: string;
  campus_id: number;
  college_id?: number | null;
  block_id?: number | null;
  hostel_id?: number | null;
  room_number?: string | null;
  floor_level?: string | null;
  is_hosteler: boolean;
}

export interface City {
  id: number;
  name: string;
  state: string;
  is_active?: boolean;
}

export interface Campus {
  id: number;
  name: string;
  address: string;
  city_id: number;
  is_active?: boolean;
}

export interface College {
  id: number;
  name: string;
  campus_id: number;
}

export interface Block {
  id: number;
  name: string;
  college_id?: number | null;
  campus_id: number;
}

export interface Hostel {
  id: number;
  name: string;
  campus_id: number;
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
  delivery_available?: boolean;
  status?: string;
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
  preparation_time?: number;
}

export interface CartItem {
  food_item: FoodItem;
  quantity: number;
  notes?: string;
}

export interface DeliveryAddress {
  campus_name: string;
  college_name?: string | null;
  block_name?: string | null;
  hostel_name?: string | null;
  floor_level?: string | null;
  room_number?: string | null;
  phone: string;
}

export interface OrderItemCreate {
  food_item_id: string;
  quantity: number;
  notes?: string | null;
}

export interface OrderCreatePayload {
  shop_id: string;
  delivery_address: DeliveryAddress;
  payment_method: 'COD' | 'ONLINE';
  items: OrderItemCreate[];
}

export interface OrderItem {
  id?: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string | null;
}

export type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface Order {
  id: string;
  order_number: string;
  student_id: string;
  shop_id: string;
  shop_name?: string | null;
  status: OrderStatus;
  subtotal: number;
  delivery_fee: number;
  discount: number;
  tax: number;
  total_amount: number;
  payment_status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  payment_method: 'COD' | 'ONLINE';
  delivery_address: DeliveryAddress;
  otp: string;
  created_at: string;
  updated_at?: string;
  items: OrderItem[];
}

export interface OrderReview {
  order_id: string;
  shop_id: string;
  rating_shop: number;
  review_text_shop?: string;
  created_at: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  type: 'ORDER' | 'SYSTEM' | 'PROMOTION';
  orderId?: string;
}
