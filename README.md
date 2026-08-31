# CampusBite — Campus Food Delivery Platform

CampusBite is a multi-tenant campus food delivery platform connecting **Students**, **Canteen Shopkeepers**, and **Delivery Partners** within university campuses, managed through an **Admin Control Panel**.

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
│   ├── tests/               # 40 integration, E2E, and security tests
│   └── alembic/             # Database migrations
│
├── docs/                    # Architectural Specifications
│   ├── ARCHITECTURE.md      # Role mappings, dynamic location configurations, system logic
│   ├── DATABASE.md          # PostgreSQL tables, ERD, indexes, SQLAlchemy models
│   └── API.md               # API Endpoints, JSON payloads, responses
│
└── README.md                # Project handbook (this file)
```

---

## 📐 Dynamic Multi-College Location Architecture

To avoid hardcoded buildings or campuses, the platform uses a dynamic database-driven location tree managed from the Admin Panel:

* **Academic Location**: `City ➜ Campus ➜ College ➜ Block ➜ Floor ➜ Room`
* **Residential Location**: `Campus ➜ Hostel ➜ Room`

---

## 🛠️ Verification Commands

### 1. Backend Test Suite (Pytest)
```bash
cd backend
python -m pytest
```
*Result: 40/40 tests passing (Auth, Locations, Student, Shopkeeper, Delivery, Admin, Security Regressions, Full E2E Flow).*

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

## ⚙️ Environment Configuration

Copy `backend/.env.example` to `backend/.env`:
```bash
cd backend
cp .env.example .env
```
Key configuration parameters:
* `DATABASE_URL`: PostgreSQL connection string (e.g., `postgresql://postgres:postgres@localhost:5432/campusbite`).
* `SECRET_KEY`: High-entropy 256-bit secret for signing JWT tokens.
* `ACCESS_TOKEN_EXPIRE_MINUTES`: Token lifetime in minutes.
* `BACKEND_CORS_ORIGINS`: Allowed web and mobile origins.
