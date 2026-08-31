# CampusBite — Production Security Verification Checklist

This document details the security controls, access barriers, data isolation rules, and cryptographic safeguards implemented across the **CampusBite** platform.

---

## 1. Transport Security & Network Boundaries
* [x] **HTTPS Everywhere**: All client-to-gateway traffic forced over TLS 1.3/1.2 (HTTP redirected to HTTPS port 443).
* [x] **Strict CORS Whitelist**: Production origins explicitly defined in `BACKEND_CORS_ORIGINS`; wildcard `*` disabled in production.
* [x] **Security Headers**: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `Strict-Transport-Security` configured at Nginx proxy.

---

## 2. Secrets Management & Environment Isolation
* [x] **Zero Hardcoded Secrets**: All private keys, JWT signing secrets, and database passwords reside exclusively in environment variables / `.env`.
* [x] **Git Ignored Credentials**: `.gitignore` strictly excludes `.env`, `*.db`, `*.sqlite`, `node_modules/`, `dist/`, `.expo/`, and keystore files.
* [x] **Template Hygiene**: `.env.example` provides clean parameter templates with zero production secrets.

---

## 3. Authentication & Session Security
* [x] **Password Hashing**: Bcrypt with salted rounds implemented in `app/core/security.py`. Plaintext passwords are never persisted.
* [x] **Stateless JWT Tokens**: Signed using HS256 with 256-bit entropy keys. Includes `sub` (User ID), `role`, and expiration timestamp (`exp`).
* [x] **Secure Client Storage**: Mobile clients persist JWTs using hardware-backed `expo-secure-store`.

---

## 4. Role-Based Access Control (RBAC) & Vertical Boundary Enforcement
* [x] **Server-Side Enforcement**: All protected endpoints protected by FastAPI dependency `RoleChecker`.
* [x] **Student Boundary**: Attempting to access `/admin` or `/shopkeepers` returns `403 Forbidden`.
* [x] **Shopkeeper Boundary**: Attempting to access `/admin` or `/delivery` returns `403 Forbidden`.
* [x] **Delivery Partner Boundary**: Attempting to access `/admin` or `/shopkeepers` returns `403 Forbidden`.

---

## 5. Horizontal Data Isolation & Object Ownership
* [x] **Canteen Data Isolation**: Shopkeeper A cannot view, modify, or delete Shopkeeper B's categories, food items, or orders (returns `403/404`).
* [x] **Delivery Isolation**: Delivery Partner A cannot view delivery instructions or verify OTPs for orders assigned to Delivery Partner B.
* [x] **Student Order Privacy**: Student A cannot access the tracking details or OTP of Student B's order.

---

## 6. Server-Side Price & Financial Protection
* [x] **Zero Trust Client Pricing**: Subtotals are calculated server-side directly from verified `FoodItem.price` records in the database.
* [x] **Fixed Billing Rules**: Platform delivery fee (₹15.00) and tax are enforced server-side.
* [x] **Single-Source Ledgering**: Financial earnings (`SHOP_SALE`, `DELIVERY_PAY`, and `Commission`) are finalized strictly once upon verified delivery completion.

---

## 7. OTP Delivery Verification & Anti-Brute-Force
* [x] **Cryptographic Hash Storage**: Delivery record stores SHA-256 hash of the 4-digit OTP; plain OTP is not stored in the `Delivery` table.
* [x] **Information Disclosure Prevention**: OTP is stripped from `OrderResponse` for delivery partners, shopkeepers, and public APIs. Only the student receives OTP via `StudentOrderResponse`.
* [x] **Time Expiration**: OTP expires automatically after 30 minutes.
* [x] **Brute-Force Lockout**: Account locked for that delivery task after 5 consecutive incorrect OTP verification attempts.

---

## 8. Rate Limiting & Abuse Prevention
* [x] **Sliding-Window Throttling**: `InMemoryRateLimiter` throttles authentication and checkout attempts.
* [x] **Nginx Connection Rate Limiting**: `limit_req_zone` applied to `/api/v1/auth/` and general API gateways.

---

## 9. Error Handling & Information Leak Prevention
* [x] **Sanitized Global Error Responses**: Custom FastAPI exception handlers capture database errors and validation failures, returning structured JSON without exposing internal stack traces.
* [x] **Safe Health Probes**: `GET /health` and `GET /health/db` confirm service health without leaking connection strings.

---

## 10. Payment Gateway Security
* [x] **Server-Side HMAC-SHA256 Verification**: Webhooks verify signature (`PaymentService.verify_razorpay_signature`) before updating order status to `PAID`.
* [x] **State Machine Synchronization**: Order and Payment models synchronized to prevent inconsistent or ghost payments.

---

## 11. Immutable Audit Logging
* [x] **Administrative Audit Trail**: Every status modification (shop approval, user suspension, order emergency override) is logged with `admin_id`, `action`, `target_id`, `timestamp`, and mandatory audited `reason` in the `AuditLog` table.

---

## 12. Automated Backups & Disaster Recovery
* [x] **PostgreSQL Nightly Dump**: Automated `pg_dump` cron jobs with 30-day retention.
* [x] **Documented Restore Runbook**: Step-by-step `pg_restore` verification instructions detailed in [`docs/DEPLOYMENT.md`](file:///d:/CampusBite/docs/DEPLOYMENT.md).
