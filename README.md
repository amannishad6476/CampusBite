# CampusBite — Campus Food Delivery Platform

CampusBite is a highly scalable, multi-tenant campus food delivery platform designed to connect **Students**, **Food Shops/Canteens**, and **Delivery Partners** within university campuses, administered via a central platform.

---

## 🚀 Final Technology Stack

* **Backend API Gateway**: Python 3.10+ & FastAPI
* **Database & ORM**: PostgreSQL & SQLAlchemy (2.0) with Alembic migration engine
* **Mobile Clients**: React Native (Android targets for Student, Shopkeeper, and Delivery apps)
* **Web Admin Portal**: React.js (responsive SPA with CSS3)
* **Authentication**: Stateless JWT-based Role-Based Access Control (RBAC)

---

## 📂 Project Structure

```
CampusBite/
├── mobile/                  # React Native Android Apps
│   ├── student-app/         # Student browsing & checkout
│   ├── shopkeeper-app/      # Menu management & order processing
│   └── delivery-app/        # Rider coordination & OTP delivery completion
│
├── admin/                   # React Web App for Administrators
│
├── backend/                 # Python / FastAPI Gateway
│
├── docs/                    # Architectural Specifications
│   ├── ARCHITECTURE.md      # Role mappings, dynamic location configurations, system logic
│   ├── DATABASE.md          # PostgreSQL tables, ERD, indexes, SQLAlchemy models
│   └── API.md               # API Endpoints, JSON payloads, responses
│
└── README.md                # Project handbook (this file)
```

---

## 📐 Dynamic Location Tree

To avoid hardcoded buildings, blocks, or campuses (such as BBD campus), the system supports fully customizable, database-driven configurations managed from the Admin Panel. 

The structure supports both Academic and Residential pathways:
* **Academic**: `City ➜ Campus ➜ College ➜ Block ➜ Floor ➜ Room`
* **Residential**: `Campus ➜ Hostel ➜ Hostel Block ➜ Floor ➜ Room`

---

## 🛠️ Development Phases

1. **Phase 1 (Completed)**: Repository architecture, folder scaffolding, and database/API documentation.
2. **Phase 2**: FastAPI backend setup, PostgreSQL database connection, SQLAlchemy schemas, and JWT user authentication routes.
3. **Phase 3**: Student React Native App development (browsing shops, ordering, checkout).
4. **Phase 4**: Shopkeeper React Native App development (receiving, accepting, and preparing orders).
5. **Phase 5**: Delivery Partner React Native App development (availability state, order pickup, and OTP dropoff verification).
6. **Phase 6**: Admin React Web Panel (managing campuses, commission rates, coupons, reports, and complaints).
7. **Phase 7**: End-to-end integration and complete lifecycle simulation.
8. **Phase 8**: Production polish (payment integration, real-time push notifications, map trackers, and deployment scripts).

---

## 📚 Technical Documentation

For more in-depth blueprints of the system, please refer to:
* [Architecture Guide](file:///d:/CampusBite/docs/ARCHITECTURE.md)
* [Database Schema and Indexing Specs](file:///d:/CampusBite/docs/DATABASE.md)
* [API Routes and Payload Structures](file:///d:/CampusBite/docs/API.md)

---

## 🛠️ Local Development Setup (Backend)

### 1. Install Dependencies
Ensure you have Python 3.10+ installed. Navigate to the `backend/` folder and run:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```
Update the `DATABASE_URL` with your local PostgreSQL credentials.

### 3. Database Migrations
Generate and run migrations to create tables automatically:
```bash
# Create migration script
alembic revision --autogenerate -m "Add core database schema"

# Apply migrations
alembic upgrade head
```

### 4. Run the API Server
Start the development server:
```bash
uvicorn app.main:app --reload
```
The API docs will be available at `http://127.0.0.1:8000/docs` (Swagger UI).

### 5. Running Tests
Run the test suite using `pytest` inside the `backend/` folder:
```bash
pytest
```

---

## 📱 Local Development Setup (Student App)

### 1. Install Dependencies
Navigate to the `mobile/student-app/` directory and install the packages:
```bash
cd mobile/student-app
npm install
```

### 2. Run the App
Start the Expo development server:
```bash
npm start
```
Use the printed QR code with the **Expo Go** app on a physical Android device, or press `a` to boot the app in an Android emulator.

### 3. Compile-Check TypeScript
Verify that there are no TypeScript syntax or compile errors:
```bash
npx tsc --noEmit
```

---

## 📱 Local Development Setup (Shopkeeper App)

### 1. Install Dependencies
Navigate to the `mobile/shopkeeper-app/` directory and install the packages:
```bash
cd mobile/shopkeeper-app
npm install
```

### 2. Run the App
Start the Expo development server:
```bash
npm start
```
Use the printed QR code with the **Expo Go** app on a physical Android device, or press `a` to boot the app in an Android emulator.

### 3. Compile-Check TypeScript
Verify that there are no TypeScript syntax or compile errors:
```bash
npx tsc --noEmit
```



