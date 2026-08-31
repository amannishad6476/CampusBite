# CampusBite — Controlled Pilot Go / No-Go Decision Gate

This document defines the formal **Go / No-Go criteria** for approving the live launch of the **CampusBite Controlled College Pilot**.

---

## 1. Mandatory Go / No-Go Decision Matrix

All 14 criteria must be evaluated before authorization of live pilot operations:

| # | Evaluation Category | Mandatory Go Criterion | Verification Method | Status |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **Backend Gateway** | `GET /health` returns `200 OK` with zero startup errors. | HTTP probe on backend gateway | **PASS (Verified)** |
| **2** | **Database Connectivity** | `GET /health/db` returns `200 OK (connected)`. | DB health query `SELECT 1` | **PASS (Verified)** |
| **3** | **Database Migrations** | `alembic upgrade head` applies all PostgreSQL schemas cleanly. | Alembic migration runner | **PASS (Verified)** |
| **4** | **Admin Portal Access** | Superadmin can log in and view live dashboard, canteens, and users. | Web portal UI test | **PASS (Verified)** |
| **5** | **Canteen Activation** | At least one participating canteen is reviewed and set to `ACTIVE`. | Admin Shops module & API | **PASS (Verified)** |
| **6** | **Menu Catalog Accuracy** | Menu items, prices, preparation times, and stock flags verified. | Menu management API & UI | **PASS (Verified)** |
| **7** | **Student Authentication** | Students can register, log in, and view assigned campus/blocks. | Auth API & Student App | **PASS (Verified)** |
| **8** | **Price Protection** | Server enforces catalog prices; client cannot tamper with totals. | Automated Pytest suite | **PASS (Verified)** |
| **9** | **Shopkeeper Lifecycle** | Shopkeeper can transition order: `PENDING` $\rightarrow$ `READY_FOR_PICKUP`. | Shopkeeper API & App | **PASS (Verified)** |
| **10** | **Atomic Dispatch** | Only one rider can claim a `READY_FOR_PICKUP` order (race-safe). | Concurrent claim test | **PASS (Verified)** |
| **11** | **OTP Verification** | Handover requires valid 4-digit OTP; locked after 5 failed attempts. | OTP security test | **PASS (Verified)** |
| **12** | **Ledger Integrity** | 10% platform commission, 90% vendor payout, 100% rider fee logged. | Ledger settlement test | **PASS (Verified)** |
| **13** | **Security Boundaries** | Cross-role privilege escalation and object isolation verified. | Security regression suite | **PASS (Verified)** |
| **14** | **Backup & Runbooks** | Documented daily backup cron, restore runbook, and incident playbook. | DEPLOYMENT.md & PILOT_OPERATIONS.md | **PASS (Verified)** |

---

## 2. Hard No-Go Triggers

If ANY of the following conditions occur on launch day, the launch is automatically declared **NO-GO**:

1. **Backend or Database Unreachable**: `GET /health` or `GET /health/db` fails to respond with `200 OK`.
2. **Zero Active Delivery Fleet**: No verified delivery partners logged in and marked **ONLINE** in the pilot zone.
3. **Canteen Offline / No Active Menu**: Canteens have not populated menu items or marked all items out of stock.
4. **OTP Verification Failure**: Legitimate OTP codes fail verification or lock out riders incorrectly.
5. **Double Ledger Logging**: Multiple ledger entries or phantom earnings generated for a single order.
6. **Unhandled Server Exceptions**: Raw Python stack traces exposed to students or vendors in API responses.

---

## 3. Remediation Protocols for No-Go Scenarios

* **If Backend or DB stalls**:
  1. Restart systemd unit: `sudo systemctl restart campusbite-backend`.
  2. Check PostgreSQL connection pool: `sudo systemctl status postgresql`.
  3. Verify database credentials in `/etc/campusbite/backend.env`.
* **If Rider cannot claim order**:
  1. Check order status under `/orders` in Admin Web Portal.
  2. Verify order is in `READY_FOR_PICKUP` state.
  3. Use Admin Emergency Override if an order is stuck in a dead state.
* **If Canteen is overwhelmed**:
  1. Administrator immediately toggles shop status to `INACTIVE` under `/shops`.
  2. Clears existing order backlog before re-enabling.

---

## 4. Final Decision Authorization

* **Controlled Pilot Code Base**: **GO (All 49 backend automated tests passing, 0 TypeScript errors, clean Admin build)**.
* **Operational Readiness**: **GO (12-step pilot-day sequence and incident response playbook established)**.
* **External Deployment Prerequisite**: Provision external PostgreSQL database host and point `DATABASE_URL` in environment configuration.
