# Airline Logistics — Frontend

Next.js 16 frontend running on **http://localhost:3000**

---

## Prerequisites
- Node.js v18+
- Backend running on **http://localhost:5000**

---

## Setup

### 1. Install dependencies
```bash
cd airline-frontend
npm install
```

### 2. Configure environment
Create a `.env.local` file in `airline-frontend/`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start the frontend
```bash
npm run dev
```
Frontend runs on **http://localhost:3000**

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Login

Go to **http://localhost:3000/login** and use any of these credentials:

| Role | Email | Password | Redirects To |
|---|---|---|---|
| Admin | admin@airline.com | password123 | `/admin/dashboard` |
| Airline | manager@airline.com | password123 | `/airline/dashboard` |
| Driver | ravi@driver.com | password123 | `/driver/orders` |

---

## Pages

### Admin
| Page | URL |
|---|---|
| Dashboard | `/admin/dashboard` |
| Orders | `/admin/orders` |
| Drivers | `/admin/drivers` |
| Vendors | `/admin/vendors` |
| SKUs | `/admin/skus` |
| Tracking | `/admin/tracking` |
| Analytics | `/admin/analytics` |

### Airline
| Page | URL |
|---|---|
| Dashboard | `/airline/dashboard` |
| Bundles | `/airline/bundles` |
| History | `/airline/history` |
| Summary | `/airline/summary` |
| Tracking | `/airline/tracking` |

### Driver
| Page | URL |
|---|---|
| Orders | `/driver/orders` |
| Navigation | `/driver/navigation` |
| Proof of Delivery | `/driver/proof` |
| Details | `/driver/details` |
