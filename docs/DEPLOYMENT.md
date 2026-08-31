# CampusBite — Production Deployment Guide

This document outlines the production deployment strategy, server configurations, PostgreSQL database management, Alembic migrations, mobile build workflows, and automated disaster recovery runbooks for the **CampusBite** platform.

---

## 1. System Topology

```mermaid
graph TD
    ClientApps[Mobile Apps & Web Admin] -->|HTTPS Port 443| Nginx[Nginx Reverse Proxy / Load Balancer]
    Nginx -->|Proxy Pass :8000| FastAPI[FastAPI Backend Gateway<br/>Gunicorn + Uvicorn Workers]
    FastAPI -->|PostgreSQL Wire Protocol :5432| Postgres[(PostgreSQL 15+ Cluster<br/>Primary / Read Replicas)]
    FastAPI -.->|Optional Push Dispatch| FCM[Firebase Cloud Messaging / Expo]
    FastAPI -.->|Optional Gateway API| Gateway[Razorpay / Stripe Payment API]
```

---

## 2. Production Environment Variables

Store all environment secrets in `/etc/campusbite/backend.env` (never commit to git):

```ini
# Core Environment
ENVIRONMENT="production"
PROJECT_NAME="CampusBite"
API_V1_STR="/api/v1"

# Production PostgreSQL Connection String
DATABASE_URL="postgresql://campusbite_user:SECURE_STRONG_DB_PASS@127.0.0.1:5432/campusbite_prod"

# JWT & Authentication (Generate using: openssl rand -hex 32)
SECRET_KEY="e4b2a98f7129034c56e7890123456789abcdef0123456789abcdef0123456789"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# CORS Whitelist (Do NOT use wildcard * in production)
BACKEND_CORS_ORIGINS="https://admin.campusbite.com,https://campusbite.com"

# Optional Third-Party Services
PAYMENT_GATEWAY_KEY=""
PAYMENT_GATEWAY_SECRET=""
MAPS_API_KEY=""
PUSH_NOTIFICATION_KEY=""
```

---

## 3. PostgreSQL Database Setup & Migrations

### 3.1 PostgreSQL Initialization
```bash
# 1. Access PostgreSQL as superuser
sudo -u postgres psql

# 2. Create dedicated production user and database
CREATE USER campusbite_user WITH PASSWORD 'SECURE_STRONG_DB_PASS';
CREATE DATABASE campusbite_prod OWNER campusbite_user;
GRANT ALL PRIVILEGES ON DATABASE campusbite_prod TO campusbite_user;
\q
```

### 3.2 Running Alembic Migrations
Run migrations on deployment to apply all PostgreSQL schemas, tables, indices, and foreign keys:
```bash
cd /opt/campusbite/backend
source venv/bin/activate
alembic upgrade head
```

---

## 4. Backend Deployment (Systemd + Gunicorn)

### 4.1 Gunicorn Service Unit (`/etc/systemd/system/campusbite-backend.service`)
```ini
[Unit]
Description=CampusBite FastAPI Application Gateway
After=network.target postgresql.service

[Service]
User=campusbite
Group=campusbite
WorkingDirectory=/opt/campusbite/backend
EnvironmentFile=/etc/campusbite/backend.env
ExecStart=/opt/campusbite/backend/venv/bin/gunicorn \
    -k uvicorn.workers.UvicornWorker \
    -w 4 \
    -b 127.0.0.1:8000 \
    --access-logfile /var/log/campusbite/access.log \
    --error-logfile /var/log/campusbite/error.log \
    app.main:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 4.2 Enable & Start Backend Service
```bash
sudo systemctl daemon-reload
sudo systemctl enable campusbite-backend
sudo systemctl start campusbite-backend
sudo systemctl status campusbite-backend
```

---

## 5. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/campusbite.conf`)

```nginx
# Rate Limiting Zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;

server {
    listen 80;
    server_name api.campusbite.com admin.campusbite.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.campusbite.com;

    ssl_certificate /etc/letsencrypt/live/api.campusbite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.campusbite.com/privkey.pem;

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Health Check (bypasses rate limiter)
    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        proxy_set_header Host $host;
    }

    # Sensitive Auth Endpoints
    location /api/v1/auth/ {
        limit_req zone=auth_limit burst=10 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # General API Routes
    location / {
        limit_req zone=api_limit burst=30 nodelay;
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Admin Panel Web Static Hosting
server {
    listen 443 ssl http2;
    server_name admin.campusbite.com;

    ssl_certificate /etc/letsencrypt/live/admin.campusbite.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.campusbite.com/privkey.pem;

    root /opt/campusbite/admin/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 6. Admin Panel Web Deployment

```bash
cd /opt/campusbite/admin
npm install
export VITE_API_URL="https://api.campusbite.com/api/v1"
npm run build
# Files in admin/dist are now ready to be served by Nginx / Vercel / Cloudflare Pages.
```

---

## 7. Android Mobile Applications Build (React Native)

### 7.1 Configuration
Before building production APKs, configure `PROD_API_URL` in `src/utils/config.ts` across each app:
```typescript
export const PROD_API_URL = 'https://api.campusbite.com/api/v1';
```

### 7.2 EAS Cloud Build (Expo Application Services)
```bash
# Student App
cd mobile/student-app
eas build --platform android --profile production

# Shopkeeper App
cd mobile/shopkeeper-app
eas build --platform android --profile production

# Delivery Partner App
cd mobile/delivery-app
eas build --platform android --profile production
```

### 7.3 Local Debug APK Generation
```bash
npx expo run:android --variant debug
```

---

## 8. Backup & Disaster Recovery Strategy

### 8.1 Automated Nightly Backup Cron
Add the following cron job to `/etc/cron.d/campusbite_backup`:
```bash
# Runs daily at 02:00 AM UTC
0 2 * * * postgres pg_dump -Fc campusbite_prod > /var/backups/campusbite/campusbite_$(date +\%Y\%m\%d_\%H\%M\%S).dump
# Retain backups for 30 days
0 3 * * * find /var/backups/campusbite -name "campusbite_*.dump" -mtime +30 -delete
```

### 8.2 Database Restore Procedure
To restore a backup into a clean instance:
```bash
# Drop existing database if needed
sudo -u postgres dropdb campusbite_prod
sudo -u postgres createdb campusbite_prod -O campusbite_user

# Restore from pg_dump custom archive
sudo -u postgres pg_restore -d campusbite_prod /var/backups/campusbite/campusbite_20260901_020000.dump

# Verify migration integrity
cd /opt/campusbite/backend && alembic current
```
