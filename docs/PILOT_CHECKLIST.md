# CampusBite — Pilot Deployment Operational Checklist

This checklist outlines the mandatory stage gates for conducting a successful, controlled college pilot rollout.

---

## 1. PRE-LAUNCH STAGE GATE

### A. Infrastructure & Backend
- [x] **Backend Health Probes**: `GET /health` returns `200 OK` and `GET /health/db` returns `200 OK (connected)`.
- [x] **Database Migrations**: `alembic upgrade head` executed cleanly against PostgreSQL.
- [x] **Environment Configuration**: `/etc/campusbite/backend.env` configured with production `DATABASE_URL`, strong `SECRET_KEY`, and non-wildcard `BACKEND_CORS_ORIGINS`.
- [x] **Process Supervision**: Systemd unit `campusbite-backend.service` running under Gunicorn/Uvicorn with autorestart.
- [x] **HTTPS / TLS Certificate**: Valid Let's Encrypt SSL active on `api.campusbite.com` and `admin.campusbite.com`.

### B. Admin Web Portal
- [x] **Build Integrity**: `npm run build` completed with 0 errors.
- [x] **Endpoint Configuration**: `VITE_API_URL` pointing to live backend HTTPS gateway.
- [x] **Admin Authentication**: Verified Admin login and role enforcement (`role = ADMIN`).
- [x] **Location Seed**: Pilot college, academic blocks, and residential hostels initialized.

### C. Canteen & Menu Setup
- [x] **Vendor Onboarding**: Canteen shopkeeper accounts registered and verified by Admin.
- [x] **Canteen Activation**: Canteen status transitioned to `ACTIVE` with audited approval.
- [x] **Menu Catalog**: Food categories and food items created with verified prices and preparation times.
- [x] **In-Stock Availability**: All pilot items marked available.

### D. Delivery Partner Fleet
- [x] **Rider Registration**: 2–3 delivery partners registered with vehicle specifications.
- [x] **Duty Status**: Riders verified active and able to toggle **ONLINE** / **OFFLINE**.
- [x] **Handover Protocol Training**: Riders briefed on the 4-digit verbal OTP handover protocol.

### E. End-to-End Test Verification
- [x] **Sandbox Test Order**: Pilot test order executed through the full lifecycle (`PENDING` $\rightarrow$ `DELIVERED` $\rightarrow$ ledger finalized).
- [x] **Price Protection**: Verified client cannot tamper with prices, tax, or fees.
- [x] **OTP Verification**: Verified valid OTP succeeds, wrong OTP fails, and 5-attempt brute-force lock triggers.

---

## 2. LAUNCH DAY MONITORING

### A. Real-Time Operations Monitoring
- [ ] **Live Order Stream**: Admin monitoring incoming orders under `/orders` in the Admin Web Portal.
- [ ] **Canteen Preparation Times**: Verify canteens accept and prepare orders promptly.
- [ ] **Rider Dispatch**: Monitor order pickups upon transitioning to `READY_FOR_PICKUP`.
- [ ] **OTP Delivery Completion**: Ensure orders are marked `DELIVERED` with OTP without stalls.

### B. Exception & Failure Handling
- [ ] **Payment Reconciliation**: Monitor payment status synchronization (`PAID` / `PENDING`).
- [ ] **Cancellation Management**: Verify cancellations follow approved refund rules.
- [ ] **Emergency Admin Overrides**: Standby to use emergency status overrides if a rider vehicle breakdown occurs.
- [ ] **System Logs**: Tail `/var/log/campusbite/error.log` for unhandled exceptions.

---

## 3. POST-LAUNCH EVALUATION & REVIEW

### A. Financial Settlement
- [ ] **Gross Merchandise Value (GMV)**: Tally daily GMV in Admin Finance Console.
- [ ] **Platform Commission**: Verify 10% platform cut correctly recorded in `Commission` table.
- [ ] **Vendor Payouts**: Review 90% net earnings credited to shopkeeper ledgers.
- [ ] **Rider Payouts**: Review 100% delivery fees credited to rider ledgers.

### B. Quality & Operations Review
- [ ] **Average Delivery Time**: Calculate average order placement to delivery completion duration.
- [ ] **Cancellation Rate**: Audit reasons for any cancelled orders.
- [ ] **Customer Feedback**: Review student ratings and complaints.
- [ ] **College Expansion Gate**: Assess system stability before expanding pilot from 1 College to all 6 Campus colleges.
