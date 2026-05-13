# 🏠 TileHub Pro — Complete ERP + E-commerce Platform

A full-stack tile retail business platform with e-commerce, inventory management, QR-based warehouse dispatch, GST billing, and analytics.

---

## 🗂 Project Structure

```
tilehub/
├── database/
│   ├── schema.sql         ← All tables, indexes, triggers
│   └── seed.sql           ← Sample products, users, orders
├── backend/               ← Node.js + Express REST API
│   ├── server.js
│   ├── controllers/       ← Business logic
│   ├── routes/            ← API routes
│   ├── middleware/        ← Auth, error handling
│   ├── models/            ← DB connection
│   └── utils/             ← Cloudinary, helpers
├── frontend/              ← Next.js customer + admin UI
│   ├── pages/
│   │   ├── index.js       ← Homepage
│   │   ├── catalog.js     ← Customer tile catalog
│   │   ├── calculator.js  ← Tile quantity calculator
│   │   ├── inquiry.js     ← Quotation + showroom booking
│   │   ├── auth/          ← Login (password + OTP)
│   │   ├── admin/         ← Dashboard, products, inventory, orders,
│   │   │                     shipments, billing, analytics, customers
│   │   └── warehouse/     ← Shipments, QR scanner
│   ├── components/
│   ├── lib/               ← API client, auth context
│   └── styles/
└── mobile-app/            ← Flutter (iOS + Android)
    └── lib/main.dart      ← All screens in one file
```

---

## ⚡ Tech Stack

| Layer       | Technology                  |
|-------------|------------------------------|
| Frontend    | Next.js 14, React, Tailwind  |
| Mobile      | Flutter 3                    |
| Backend     | Node.js, Express.js          |
| Database    | PostgreSQL                   |
| Auth        | JWT + OTP (Twilio)           |
| Storage     | Cloudinary                   |
| QR          | qrcode (Node) + html5-qrcode |
| PDF         | PDFKit                       |
| Charts      | Recharts                     |
| Deploy      | Vercel (frontend) + Render   |

---

## 🚀 Local Development Setup

### 1. Database

```bash
# Create database
createdb tilehub

# Run schema
psql -U postgres -d tilehub -f database/schema.sql

# Load sample data
psql -U postgres -d tilehub -f database/seed.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values

npm install
npm run dev
# API runs on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:5000/api

npm install
npm run dev
# App runs on http://localhost:3000
```

### 4. Mobile App

```bash
cd mobile-app
# Edit lib/main.dart — change API_BASE to your local IP
# e.g. const String API_BASE = 'http://192.168.1.5:5000/api';

flutter pub get
flutter run
```

---

## 👤 Default Login Credentials

All passwords: **Admin@1234**

| Role      | Phone         | Access                              |
|-----------|---------------|-------------------------------------|
| Admin     | +919876543210 | Full access — all pages             |
| Sales     | +919876543211 | Products, orders, shipments, billing|
| Warehouse | +919876543212 | Shipments, QR scanner, inventory    |
| Accountant| +919876543213 | Billing, invoices, analytics        |
| Customer  | +919876500001 | Catalog, calculator, inquiry        |

---

## 📡 API Endpoints

### Auth
```
POST /api/auth/register       Register new user
POST /api/auth/login          Login with phone + password
POST /api/auth/send-otp       Send OTP to phone
POST /api/auth/verify-otp     Verify OTP and get token
GET  /api/auth/me             Get current user
PUT  /api/auth/change-password
```

### Products
```
GET    /api/products           List with search & filters
GET    /api/products/:id       Single product + similar
POST   /api/products           Create (admin/sales)
PUT    /api/products/:id       Update
DELETE /api/products/:id       Soft delete
POST   /api/products/:id/images  Upload images
```

### Inventory
```
GET  /api/inventory            All inventory with status
GET  /api/inventory/alerts     Low stock alerts
GET  /api/inventory/:productId Product inventory + logs
POST /api/inventory/adjust     Adjust stock (±)
POST /api/inventory/restock    Add stock
PUT  /api/inventory/:id/settings  Reorder points, location
```

### Shipments (QR Workflow)
```
GET  /api/shipments            List shipments
GET  /api/shipments/:id        Single shipment
POST /api/shipments            Create shipment (stocks reserved, QR generated)
POST /api/shipments/scan       Scan QR → auto dispatch + deduct stock
POST /api/shipments/:id/dispatch   Manual dispatch
PUT  /api/shipments/:id/deliver    Mark delivered
```

### Billing
```
GET  /api/billing/invoices         List invoices
GET  /api/billing/invoices/:id     Invoice detail
POST /api/billing/invoices         Create invoice
POST /api/billing/invoices/:id/payment  Record payment
GET  /api/billing/invoices/:id/pdf     Download GST PDF
POST /api/billing/boq              Generate Bill of Quantity
```

### Analytics
```
GET /api/analytics/dashboard   KPIs, revenue chart, alerts
GET /api/analytics/stock       Stock by category
GET /api/analytics/sales       Sales report with date range
```

---

## 🏗 Deployment

### Backend → Render

```bash
# 1. Push code to GitHub
git push origin main

# 2. Create Render account → New Blueprint
# Import repository → render.yaml handles everything

# 3. After deploy, run migrations:
# Open Render shell → cd backend && node utils/migrate.js
```

### Frontend → Vercel

```bash
# 1. Install Vercel CLI
npm i -g vercel

cd frontend
vercel --prod

# 2. Set environment variable in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://tilehub-api.onrender.com/api
```

### Mobile App → App Stores

```bash
# Android
cd mobile-app
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk

# iOS (Mac required)
flutter build ipa --release
```

---

## 🔑 QR Dispatch Workflow

```
1. Admin creates shipment → stock reserved automatically
2. System generates QR code (JSON with shipment ID + items)
3. Warehouse worker opens mobile app or web scanner
4. Scans QR code on shipment package
5. API auto-deducts stock from inventory
6. Shipment status → "dispatched"
7. Admin dashboard updates in real time
8. GST invoice auto-generated
```

---

## 🔮 Future Enhancements (Phase 2)

- [ ] AI Room Visualizer — upload photo, preview tiles virtually
- [ ] AI Tile Recommendation engine
- [ ] AI Demand Forecasting (reorder suggestions)
- [ ] WhatsApp notifications via Twilio
- [ ] Customer loyalty / points system
- [ ] Multi-warehouse support
- [ ] Barcode support alongside QR
- [ ] Tally / accounting software export

---

## 📁 Environment Variables Checklist

**Backend (.env)**
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — strong random string (min 32 chars)
- `CLOUDINARY_*` — from cloudinary.com dashboard
- `TWILIO_*` — from twilio.com console (for OTP SMS)
- `BUSINESS_*` — your GST number, address, phone

**Frontend (.env.local)**
- `NEXT_PUBLIC_API_URL` — backend URL (e.g. https://tilehub-api.onrender.com/api)
