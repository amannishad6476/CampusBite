import { City, Campus, College, Block, Hostel, Shop, FoodCategory, FoodItem, Order } from '../types';

export const MOCK_CITIES: City[] = [
  { id: 1, name: 'Lucknow', state: 'Uttar Pradesh' }
];

export const MOCK_CAMPUSES: Campus[] = [
  { id: 1, name: 'BBD University Campus', address: 'Faizabad Road, Lucknow', city_id: 1 },
  { id: 2, name: 'Integral University Campus', address: 'Kursi Road, Lucknow', city_id: 1 },
  { id: 3, name: 'Amity Lucknow Campus', address: 'Malhaur Road, Lucknow', city_id: 1 }
];

export const MOCK_COLLEGES: College[] = [
  { id: 1, name: 'BBDNIIT (BBD Northern India Inst of Tech)', campus_id: 1 },
  { id: 2, name: 'BBDNITM (BBD Inst of Tech & Mgmt)', campus_id: 1 },
  { id: 3, name: 'BBDCOE (BBD College of Engineering)', campus_id: 1 },
  { id: 4, name: 'BBD University School of Mgmt', campus_id: 1 }
];

export const MOCK_BLOCKS: Block[] = [
  { id: 1, name: 'Block A (Main Block)', college_id: 1, campus_id: 1 },
  { id: 2, name: 'Block B (CS/IT Block)', college_id: 1, campus_id: 1 },
  { id: 3, name: 'Block C (Mechanical Block)', college_id: 1, campus_id: 1 },
  { id: 4, name: 'Block D (Pharmacy Block)', college_id: 2, campus_id: 1 },
  { id: 5, name: 'Block E (MBA Block)', college_id: 4, campus_id: 1 },
  { id: 6, name: 'Block F (Dental College Block)', college_id: null, campus_id: 1 }
];

export const MOCK_HOSTELS: Hostel[] = [
  { id: 1, name: 'Shastri Boys Hostel', campus_id: 1 },
  { id: 2, name: 'Sarojini Girls Hostel', campus_id: 1 },
  { id: 3, name: 'Tagore Boys Hostel', campus_id: 1 }
];

export const MOCK_SHOPS: Shop[] = [
  {
    id: 'shop-1',
    name: 'Block A Main Canteen',
    description: 'Hot Samosas, tea, coffee, and delicious quick meals.',
    logo_url: null,
    rating: 4.3,
    is_open: true,
    campus_id: 1
  },
  {
    id: 'shop-2',
    name: 'BBD Central Cafeteria',
    description: 'Premium wood-fired pizzas, shakes, wraps, and burgers.',
    logo_url: null,
    rating: 4.6,
    is_open: true,
    campus_id: 1
  },
  {
    id: 'shop-3',
    name: 'Boys Hostel 1 Mess Canteen',
    description: 'Home-style meals, parathas, and late-night snacks.',
    logo_url: null,
    rating: 3.9,
    is_open: true,
    campus_id: 1
  },
  {
    id: 'shop-4',
    name: 'Block D Juice & Shake Corner',
    description: 'Fresh fruit juices, protein shakes, and healthy snacks.',
    logo_url: null,
    rating: 4.5,
    is_open: false,
    campus_id: 1
  }
];

export const MOCK_CATEGORIES: FoodCategory[] = [
  { id: 1, name: 'Quick Bites', shop_id: 'shop-1' },
  { id: 2, name: 'Beverages', shop_id: 'shop-1' },
  { id: 3, name: 'Pizzas & Burgers', shop_id: 'shop-2' },
  { id: 4, name: 'Thalis & Meals', shop_id: 'shop-3' },
  { id: 5, name: 'Late Night Snacks', shop_id: 'shop-3' }
];

export const MOCK_FOOD_ITEMS: FoodItem[] = [
  // Shop 1 Items
  {
    id: 'item-101',
    name: 'Samosa (Single)',
    price: 15.00,
    is_veg: true,
    is_available: true,
    category_id: 1,
    shop_id: 'shop-1'
  },
  {
    id: 'item-102',
    name: 'Paneer Patty',
    price: 25.00,
    is_veg: true,
    is_available: true,
    category_id: 1,
    shop_id: 'shop-1'
  },
  {
    id: 'item-103',
    name: 'Masala Chai',
    price: 10.00,
    is_veg: true,
    is_available: true,
    category_id: 2,
    shop_id: 'shop-1'
  },
  {
    id: 'item-104',
    name: 'Cold Coffee',
    price: 40.00,
    is_veg: true,
    is_available: true,
    category_id: 2,
    shop_id: 'shop-1'
  },

  // Shop 2 Items
  {
    id: 'item-201',
    name: 'Veg Cheese Pizza (8 inch)',
    price: 120.00,
    is_veg: true,
    is_available: true,
    category_id: 3,
    shop_id: 'shop-2'
  },
  {
    id: 'item-202',
    name: 'Double Patty Veg Burger',
    price: 70.00,
    is_veg: true,
    is_available: true,
    category_id: 3,
    shop_id: 'shop-2'
  },

  // Shop 3 Items
  {
    id: 'item-301',
    name: 'Special Veg Thali',
    price: 80.00,
    is_veg: true,
    is_available: true,
    category_id: 4,
    shop_id: 'shop-3'
  },
  {
    id: 'item-302',
    name: 'Aloo Paratha (2 pcs + Curd)',
    price: 50.00,
    is_veg: true,
    is_available: true,
    category_id: 4,
    shop_id: 'shop-3'
  },
  {
    id: 'item-303',
    name: 'Egg Maggie',
    price: 45.00,
    is_veg: false,
    is_available: true,
    category_id: 5,
    shop_id: 'shop-3'
  }
];

// Seed active order storage on device memory
export const MOCK_ORDERS: Order[] = [
  {
    id: 'order-901',
    order_number: 'CB-2026-901',
    student_id: 'student-uuid',
    shop_id: 'shop-1',
    shop_name: 'Block A Main Canteen',
    status: 'DELIVERED',
    subtotal: 55.00,
    delivery_fee: 15.00,
    discount: 0.00,
    tax: 2.00,
    total_amount: 72.00,
    payment_status: 'PAID',
    payment_method: 'ONLINE',
    delivery_address: {
      campus_name: 'BBD University Campus',
      college_name: 'BBDNIIT',
      block_name: 'Block B (CS/IT Block)',
      floor_level: '2nd Floor',
      room_number: 'Lab 3',
      phone: '+919876543210'
    },
    otp: '1122',
    created_at: '2026-08-30T14:30:00Z',
    items: [
      { name: 'Paneer Patty', price: 25.00, quantity: 1, notes: 'Crispy' },
      { name: 'Cold Coffee', price: 40.00, quantity: 1, notes: 'Less sugar' }
    ]
  }
];
