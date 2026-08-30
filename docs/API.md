# CampusBite — API Specifications

All resources are served relative to the API gateway v1 base URL:
`https://api.campusbite.com/api/v1`

---

## 1. Authentication Endpoints (`/auth`)

### 1.1 User Registration
* **Endpoint**: `POST /auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "student@bbd.ac.in",
  "phone": "+919876543210",
  "password": "securepassword123",
  "first_name": "Aman",
  "last_name": "Nishad",
  "role": "STUDENT",
  "student_details": {
    "campus_id": 1,
    "college_id": 3,
    "block_id": 5,
    "floor_level": "3rd",
    "room_number": "302",
    "is_hosteler": false
  }
}
```
* **Success Response** (`201 Created`):
```json
{
  "id": "c3b7a5a1-77bb-4f40-a15d-35759a930777",
  "email": "student@bbd.ac.in",
  "role": "STUDENT",
  "message": "User registered successfully"
}
```

### 1.2 User Login
* **Endpoint**: `POST /auth/login`
* **Access**: Public
* **Request Body**:
```json
{
  "email": "student@bbd.ac.in",
  "password": "securepassword123"
}
```
* **Success Response** (`200 OK`):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "c3b7a5a1-77bb-4f40-a15d-35759a930777",
    "email": "student@bbd.ac.in",
    "role": "STUDENT",
    "first_name": "Aman",
    "last_name": "Nishad"
  }
}
```

---

## 2. Student Endpoints (`/students` — Headers: `Authorization: Bearer <JWT>`)

### 2.1 Fetch Campus Configuration & Shops
* **Endpoint**: `GET /students/shops?campus_id=1`
* **Access**: Authorized Student
* **Success Response** (`200 OK`):
```json
[
  {
    "id": "d1a8e52c-44bc-4e63-a212-32a59a9a3b90",
    "name": "BBD Block A Canteen",
    "description": "Hot samosas, meals and cold beverages.",
    "logo_url": "https://media.campusbite.com/bbd_canteen_a.png",
    "is_open": true,
    "rating": 4.5
  }
]
```

### 2.2 Browse Shop Menu
* **Endpoint**: `GET /students/shops/{shop_id}/menu`
* **Access**: Authorized Student
* **Success Response** (`200 OK`):
```json
[
  {
    "category_id": 101,
    "category_name": "Quick Bites",
    "items": [
      {
        "id": "e5b8d234-9988-4444-baee-99757a3b0922",
        "name": "Samosa Duo",
        "price": 30.00,
        "image_url": "https://media.campusbite.com/samosa.png",
        "is_veg": true,
        "is_available": true
      }
    ]
  }
]
```

### 2.3 Manage Cart
* **Endpoint**: `POST /students/cart/items`
* **Request Body**:
```json
{
  "food_item_id": "e5b8d234-9988-4444-baee-99757a3b0922",
  "quantity": 2,
  "notes": "Serve hot, extra green chutney"
}
```
* **Success Response** (`200 OK`):
```json
{
  "cart_id": "aa3c5e88-9bb2-4f3b-81f1-3323a9a3029f",
  "shop_id": "d1a8e52c-44bc-4e63-a212-32a59a9a3b90",
  "items": [
    {
      "id": "item-uuid",
      "food_item_id": "e5b8d234-9988-4444-baee-99757a3b0922",
      "name": "Samosa Duo",
      "price": 30.00,
      "quantity": 2,
      "subtotal": 60.00
    }
  ],
  "cart_total": 60.00
}
```

### 2.4 Checkout & Payment Init
* **Endpoint**: `POST /students/checkout`
* **Request Body**:
```json
{
  "payment_method": "ONLINE",
  "coupon_code": "BBDNEW50",
  "delivery_notes": "Deliver near the main library reception"
}
```
* **Success Response** (`200 OK`):
```json
{
  "order_id": "fb2b88aa-33b2-4d2a-a92e-99858a742880",
  "order_number": "CB-2026-8910",
  "status": "PLACED",
  "total_amount": 75.00,
  "payment_required": true,
  "payment_gateway_payload": {
    "gateway": "RAZORPAY",
    "reference_order_id": "order_Hj920Kjas",
    "amount": 7500
  }
}
```

---

## 3. Shopkeeper Endpoints (`/shops` — Headers: `Authorization: Bearer <JWT>`)

### 3.1 Fetch Shop Orders
* **Endpoint**: `GET /shops/orders?status=active`
* **Success Response** (`200 OK`):
```json
[
  {
    "order_id": "fb2b88aa-33b2-4d2a-a92e-99858a742880",
    "order_number": "CB-2026-8910",
    "status": "PLACED",
    "total_amount": 75.00,
    "items": [
      {
        "name": "Samosa Duo",
        "quantity": 2,
        "notes": "Serve hot, extra green chutney"
      }
    ],
    "created_at": "2026-08-30T18:10:00Z"
  }
]
```

### 3.2 Update Order Processing State
* **Endpoint**: `POST /shops/orders/{order_id}/status`
* **Request Body**:
```json
{
  "status": "PREPARING"
}
```
* **Success Response** (`200 OK`):
```json
{
  "order_id": "fb2b88aa-33b2-4d2a-a92e-99858a742880",
  "status": "PREPARING",
  "updated_at": "2026-08-30T18:15:30Z"
}
```

---

## 4. Delivery Partner Endpoints (`/delivery` — Headers: `Authorization: Bearer <JWT>`)

### 4.1 Check Available Pickups
* **Endpoint**: `GET /delivery/orders/available`
* **Success Response** (`200 OK`):
```json
[
  {
    "order_id": "fb2b88aa-33b2-4d2a-a92e-99858a742880",
    "shop_name": "BBD Block A Canteen",
    "shop_address": "Block A Ground Floor",
    "delivery_destination": {
      "college": "BBDNIIT",
      "block": "Block B",
      "floor": "3rd",
      "room": "302"
    }
  }
]
```

### 4.2 Complete Delivery (OTP Verification)
* **Endpoint**: `POST /delivery/orders/{order_id}/complete`
* **Request Body**:
```json
{
  "otp": "4892"
}
```
* **Success Response** (`200 OK`):
```json
{
  "status": "DELIVERED",
  "message": "OTP verified successfully. Order completed.",
  "earning_credited": 25.00
}
```

---

## 5. Admin Endpoints (`/admin` — Headers: `Authorization: Bearer <JWT>`)

### 5.1 Configure Campus
* **Endpoint**: `POST /admin/campuses`
* **Request Body**:
```json
{
  "name": "BBD University Campus",
  "address": "Faizabad Road, Lucknow",
  "city_id": 1,
  "latitude": 26.8912,
  "longitude": 81.0628
}
```
* **Success Response** (`201 Created`):
```json
{
  "id": 1,
  "name": "BBD University Campus",
  "message": "Campus registered successfully."
}
```

### 5.2 Configure Colleges in Campus
* **Endpoint**: `POST /admin/colleges`
* **Request Body**:
```json
{
  "name": "BBDNIIT",
  "campus_id": 1
}
```
* **Success Response** (`201 Created`):
```json
{
  "id": 3,
  "name": "BBDNIIT",
  "campus_id": 1
}
```
