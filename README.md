# CampusBite — Campus Food Delivery Platform

CampusBite is a multi-tenant campus food delivery platform connecting **Students**, **Canteen Shopkeepers**, and **Delivery Partners** across university colleges, managed through a central **Admin Web Portal**.

---

## 🚀 Technology Stack

* **Backend API Gateway**: Python 3.10+ & FastAPI (REST API)
* **Database & ORM**: PostgreSQL & SQLAlchemy (2.0) with Alembic migration engine
* **Mobile Clients**: React Native & TypeScript (Android targets for Student, Shopkeeper, and Delivery apps)
* **Web Admin Portal**: React 18 & TypeScript (Vite Single Page Application)
* **Authentication**: Stateless JWT-based Role-Based Access Control (RBAC) with bcrypt password hashing

---

## 📂 Project Structure

```
CampusBite/
├── mobile/                  # React Native Android Apps
│   ├── student-app/         # Student browsing & checkout
│   ├── shopkeeper-app/      # Menu management & order processing
│   └── delivery-app/        # Rider coordination & OTP delivery completion
│
├── admin/                   # React + TypeScript Web App for Administrators
│
├── backend/                 # Python / FastAPI Gateway
│   ├── app/
│   │   ├── api/             # REST Routers (auth, locations, student, shopkeeper, delivery, admin)
│   │   ├── core/            # Configuration, database session, security tools
│   │   ├── models/          # PostgreSQL SQLAlchemy models
│   │   ├── schemas/         # Pydantic schemas
│   │   ├── services/        # Services (PaymentService, NotificationService, RateLimiter)
│   │   └── scripts/         # Pilot seed scripts (seed_controlled_pilot.py & seed_pilot_data.py)
│   ├── tests/               # 49 integration, E2E, pilot, and security tests
│   └── alembic/             # Database migrations
│
├── docs/                    # Architectural Specifications & Runbooks
│   ├── PILOT_CHECKLIST.md   # Pre-launch, launch day, and post-launch operational gates
│   ├── SECURITY_CHECKLIST.md# 12-point production security audit checklist
│   ├── PILOT_OPERATIONS.md  # Pilot setup, shop onboarding, delivery dispatch, emergency procedures
│   ├── DEPLOYMENT.md        # Production deployment, Gunicorn, PostgreSQL, Nginx, backups
│   ├── ARCHITECTURE.md      # Role mappings, dynamic location configurations, system logic
│   ├── DATABASE.md          # PostgreSQL tables, ERD, indexes, SQLAlchemy models
│   └── API.md               # API Endpoints, JSON payloads, responses
│
└── README.md                # Project handbook (this file)
```

---

## 📐 Dynamic Multi-College Pilot Architecture

The platform operates across academic colleges, blocks, and residential hostels without hardcoding in frontend or backend logic:

* **Academic Location**: `City ➜ Campus ➜ College ➜ Block ➜ Floor ➜ Room`
* **Residential Location**: `Campus ➜ Hostel ➜ Room`

### Seeding Pilot Datasets
* **Controlled Pilot (Recommended for initial launch)**:
  ```bash
  cd backend
  python -m app.scripts.seed_controlled_pilot
  ```
* **Full Multi-College Pilot (6 Colleges)**:
  ```bash
  cd backend
  python -m app.scripts.seed_pilot_data
  ```

---

## 🛠️ Verification & Test Commands

### 1. Backend Test Suite (Pytest)
```bash
cd backend
python -m pytest
```
*Result: 49/49 tests passing.*

### 2. Student Mobile App Check
```bash
cd mobile/student-app
npx tsc --noEmit
```

### 3. Shopkeeper Mobile App Check
```bash
cd mobile/shopkeeper-app
npx tsc --noEmit
```

### 4. Delivery Partner Mobile App Check
```bash
cd mobile/delivery-app
npx tsc --noEmit
```

### 5. Admin Panel Build
```bash
cd admin
npm run build
```

---

## 📚 Operational Documentation

* [Pilot Operational Checklist](file:///d:/CampusBite/docs/PILOT_CHECKLIST.md)
* [Production Security Checklist](file:///d:/CampusBite/docs/SECURITY_CHECKLIST.md)
* [Pilot Operations & Shop Onboarding Guide](file:///d:/CampusBite/docs/PILOT_OPERATIONS.md)
* [Deployment Runbook & PostgreSQL Backups](file:///d:/CampusBite/docs/DEPLOYMENT.md)
* [System Architecture Specification](file:///d:/CampusBite/docs/ARCHITECTURE.md)
* [API Reference & Route Specs](file:///d:/CampusBite/docs/API.md)
* [Database ERD & Schema Specs](file:///d:/CampusBite/docs/DATABASE.md)
