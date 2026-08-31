# CampusBite — API Specifications

All resources are served relative to the API gateway v1 base URL:
`http://localhost:8000/api/v1`

---

## 1. System Health Checks

### 1.1 Service Liveness Check
* **Endpoint**: `GET /health`
* **Access**: Public
* **Success Response** (`200 OK`):
```json
{
  "status": "healthy",
  "service": "CampusBite",
  "api_version": "/api/v1"
}
```

### 1.2 Database Connectivity Check
* **Endpoint**: `GET /health/db`
* **Access**: Public
* **Success Response** (`200 OK`):
```json
{
  "status": "healthy",
  "database": "connected",
  "service": "CampusBite"
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

### 2.1 User Registration
* **Endpoint**: `POST /auth/register`
* **Access**: Public
* **Request Body**:
```json
{
  "name": "Aman Nishad",
  "email": "student@bbd.ac.in",
  "phone": "+919876543210",
  "password": "securepassword123",
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
  "name": "Aman Nishad",
  "phone": "+919876543210",
  "role": "STUDENT",
  "is_active": true,
  "created_at": "2026-08-30T18:00:00Z"
}
```

### 2.2 User Login
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
    "name": "Aman Nishad",
    "email": "student@bbd.ac.in",
    "phone": "+919876543210",
    "role": "STUDENT",
    "is_active": true,
    "created_at": "2026-08-30T18:00:00Z"
  }
}
```

### 2.3 Current User Profile
* **Endpoint**: `GET /auth/me`
* **Access**: Authorized (`Bearer <token>`)
* **Success Response** (`200 OK`): User object.

---

## 3. Location Hierarchy Endpoints (`/api/v1`)

* `GET /campuses` — List active university campuses.
* `GET /colleges?campus_id={id}` — List colleges belonging to a campus.
* `GET /blocks?campus_id={id}` — List academic buildings/blocks.
* `GET /hostels?campus_id={id}` — List hostels/residential blocks.

---

## 4. Student Operations (`/api/v1/students` — Role: `STUDENT`)

### 4.1 Browse Canteens
* **Endpoint**: `GET /students/shops?campus_id={id}`
* Returns canteens operating on the specified campus.

### 4.2 Browse Food Menu
* **Endpoint**: `GET /students/shops/{shop_id}/menu`
* Returns available menu catalog items for a canteen.

### 4.3 Place Delivery Order
* **Endpoint**: `POST /students/orders`
* **Request Body**:
```json
{
  "shop_id": "shop-uuid",
  "payment_method": "COD",
  "delivery_address": {
    "campus_name": "BBD Campus",
    "college_name": "BBDNIIT",
    "block_name": "Block B",
    "floor_level": "3rd",
    "room_number": "302",
    "phone": "+919876543210"
  },
  "items": [
    {
      "food_item_id": "item-uuid",
      "quantity": 2,
      "notes": "Extra chutney"
    }
  ]
}
```
* **Success Response** (`201 Created` — `StudentOrderResponse`): Includes `subtotal`, `delivery_fee`, `tax`, `total_amount`, and `otp` (4-digit verification code).

### 4.4 Order Tracking
* `GET /students/orders` — List active and historical orders.
* `GET /students/orders/{order_id}` — View single order tracking details and OTP code.

---

## 5. Shopkeeper Operations (`/api/v1/shopkeepers` — Role: `SHOPKEEPER`)

### 5.1 Profile & Catalog
* `GET /shopkeepers/me/shop` — Retrieve shop profile.
* `PUT /shopkeepers/me/shop` — Update shop metadata (phone, opening hours).
* `GET /shopkeepers/me/categories` / `POST /shopkeepers/me/categories` / `PUT /shopkeepers/me/categories/{id}` / `DELETE /shopkeepers/me/categories/{id}` — Manage food categories.
* `GET /shopkeepers/me/menu` / `POST /shopkeepers/me/menu` / `PUT /shopkeepers/me/menu/{id}` / `DELETE /shopkeepers/me/menu/{id}` — Manage food items.

### 5.2 Order Processing
* `GET /shopkeepers/me/orders?status_filter=PENDING` — Browse active orders.
* `GET /shopkeepers/me/orders/{id}` — Retrieve order details (OTP is stripped).
* `PATCH /shopkeepers/me/orders/{id}/status` — Transition order lifecycle (`PENDING` -> `ACCEPTED` -> `PREPARING` -> `READY_FOR_PICKUP` or `CANCELLED`).

### 5.3 Earnings
* `GET /shopkeepers/me/earnings` — Aggregate daily, weekly, monthly, and all-time earnings.

---

## 6. Delivery Partner Operations (`/api/v1/delivery` — Role: `DELIVERY_PARTNER`)

### 6.1 Profile & Duty Availability
* `GET /delivery/me` — Rider profile, vehicle specs, and dynamic duty status (`ONLINE`, `OFFLINE`, `BUSY`).
* `PATCH /delivery/me/availability` — Toggle duty status (`{"is_active": true/false}`).

### 6.2 Order Claims & Progression
* `GET /delivery/available-orders` — List unclaimed orders with status `READY_FOR_PICKUP` (OTP is stripped).
* `POST /delivery/orders/{order_id}/accept` — Claim order atomically (transitions to `ASSIGNED`).
* `GET /delivery/orders/active` — Active delivery task.
* `GET /delivery/orders/history` — Completed & cancelled delivery records.
* `GET /delivery/orders/{order_id}` — Order destination details.
* `POST /delivery/orders/{order_id}/pickup` — Mark picked up (`PICKED_UP`).
* `POST /delivery/orders/{order_id}/start` — Mark in transit (`OUT_FOR_DELIVERY`), generating hashed short-lived OTP.
* `POST /delivery/orders/{order_id}/verify-otp` — Verify student OTP code (`{"otp": "1234"}`). Transitions to `DELIVERED`, logs driver payout, shopkeeper share, and platform commission.

### 6.3 Earnings
* `GET /delivery/earnings` — Rider payouts breakdown.

---

## 7. Admin Control Console (`/api/v1/admin` — Role: `ADMIN`)

### 7.1 Dashboard & Analytics
* `GET /admin/dashboard` — Platform statistics (students, shops, riders, GMV, commissions, delivery fees).

### 7.2 Location Architecture Management
* `POST /admin/campuses`, `PUT /admin/campuses/{id}`, `DELETE /admin/campuses/{id}`
* `POST /admin/colleges`, `PUT /admin/colleges/{id}`, `DELETE /admin/colleges/{id}`
* `POST /admin/blocks`, `PUT /admin/blocks/{id}`, `DELETE /admin/blocks/{id}`
* `POST /admin/hostels`, `PUT /admin/hostels/{id}`, `DELETE /admin/hostels/{id}`

### 7.3 Canteen & Vendor Controls
* `GET /admin/shops` — Browse all registered canteens.
* `GET /admin/shops/{id}` / `/menu` / `/orders` — Inspect canteen catalogs and transaction books.
* `PATCH /admin/shops/{id}/status` — Modify shop status (`PENDING`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `INACTIVE`) with mandatory audit reason.

### 7.4 User Access & Suspension
* `GET /admin/students`, `/admin/shopkeepers`, `/admin/delivery-partners` — Audit user accounts and rider availability.
* `PATCH /admin/users/{user_id}/status` — Enable or suspend login credentials (`is_active: true/false`) with audit reason.

### 7.5 Order Auditing & Emergency Overrides
* `GET /admin/orders` & `GET /admin/orders/{order_id}` — Inspect order records across all canteens.
* `POST /admin/orders/{order_id}/override` — Force order status transition with mandatory audited reason.

### 7.6 Finance & Audit Trail
* `GET /admin/finance` — Payout ledger splits for shopkeepers, riders, and platform revenue.
* `GET /admin/audit-logs` — Immutable server-side log of administrative actions.

---

## 8. Security & Global Error Responses

* `401 Unauthorized` — Invalid, expired, or missing JWT Bearer token.
* `403 Forbidden` — Insufficient role permissions or horizontal object ownership boundary violation.
* `404 Not Found` — Resource does not exist or unauthorized access.
* `422 Unprocessable Entity` — Request input validation failure.
* `500 Internal Server Error` — Database transaction or connection error.
