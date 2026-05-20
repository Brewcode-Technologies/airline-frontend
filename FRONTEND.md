# Airline Logistics — Frontend
> Re-run `npm run docs` from project root after adding/removing pages or updating API calls.

---

## Starting the Frontend

### Install
```bash
cd airline-frontend
npm install
```

### Environment — `.env.local`
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Scripts
| Command | Description |
|---|---|
| `npm run dev` | Development server — http://localhost:3000 |
| `npm run build` | Production build  |
| `npm start` | Serve production build |
| `npm run lint` | Run ESLint |

---

## Tech Stack
| Package | Version |
|---|---|
| next | 16.2.4 |
| react | 19.2.4 |
| react-dom | 19.2.4 |
| tailwindcss | ^4 |
| typescript | ^5 |

---

## API Client — `services/api.js`
All API calls go through a shared Axios instance:
- Base URL: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api`)
- Auth: reads `token` from `localStorage`, auto-attaches `Authorization: Bearer <token>` on every request

```js
import api from '@/services/api';

const res = await api.get('/orders');
const res = await api.post('/auth/login', { email, password });
const res = await api.put(`/orders/${id}`, { status: 'delivered' });
const res = await api.delete(`/orders/${id}`);
```

---

## Role-Based Access
| Role | Accessible Routes |
|---|---|
| `admin` | `/admin/*` |
| `airline` | `/airline/*` |
| `driver` | `/driver/*` |
| public | `/login` |

Token stored in `localStorage` after login, cleared on logout.

---

## All APIs Used — Quick Reference

| # | Method | Endpoint | Used In |
|---|---|---|---|
| 1 | POST | `/api/auth/login` | `/login` |
| 2 | GET | `/api/analytics/summary` | `/admin/dashboard`, `/airline/dashboard`, `/airline/summary` |
| 3 | GET | `/api/analytics/orders` | `/admin/analytics` |
| 4 | GET | `/api/analytics/orders-by-status` | `/admin/analytics`, `/airline/summary` |
| 5 | GET | `/api/analytics/sla` | `/admin/analytics` |
| 6 | GET | `/api/orders` | `/admin/orders`, `/airline/bundles`, `/airline/history`, `/driver/orders` |
| 7 | POST | `/api/orders` | `/admin/orders`, `/airline/bundles` |
| 8 | PUT | `/api/orders/:id` | `/admin/orders` |
| 9 | DELETE | `/api/orders/:id` | `/admin/orders` |
| 10 | POST | `/api/orders/:id/assign-driver` | `/admin/orders` |
| 11 | PUT | `/api/orders/:id/status` | `/admin/orders` |
| 12 | PUT | `/api/orders/:id/picked` | `/driver/orders` |
| 13 | PUT | `/api/orders/:id/enroute` | `/driver/orders` |
| 14 | PUT | `/api/orders/:id/delivered` | `/driver/orders` |
| 15 | GET | `/api/drivers` | `/admin/drivers` |
| 16 | POST | `/api/drivers` | `/admin/drivers` |
| 17 | PUT | `/api/drivers/:id` | `/admin/drivers` |
| 18 | DELETE | `/api/drivers/:id` | `/admin/drivers` |
| 19 | PUT | `/api/drivers/:id/status` | `/driver/details` |
| 20 | GET | `/api/vendors` | `/admin/vendors` |
| 21 | POST | `/api/vendors` | `/admin/vendors` |
| 22 | PUT | `/api/vendors/:id` | `/admin/vendors` |
| 23 | DELETE | `/api/vendors/:id` | `/admin/vendors` |
| 24 | GET | `/api/skus` | `/admin/skus` |
| 25 | POST | `/api/skus` | `/admin/skus` |
| 26 | PUT | `/api/skus/:id` | `/admin/skus` |
| 27 | DELETE | `/api/skus/:id` | `/admin/skus` |
| 28 | GET | `/api/tracking/:orderId` | `/admin/tracking`, `/airline/tracking`, `/driver/navigation` |
| 29 | POST | `/api/tracking` | `/driver/navigation` |
| 30 | POST | `/api/orders/:id/proof` | `/driver/proof` |
| 31 | GET | `/api/orders/:id/proof` | `/driver/proof` |
| 32 | GET | `/api/auth/me` | `/driver/details` |

---

## Pages & API Schemas

---

### `/login` — `app/(auth)/login/page.tsx`

**APIs used:** `POST /api/auth/login`

---

#### `POST /api/auth/login`

**Request**
```json
{ "email": "string (required)", "password": "string (required)" }
```
**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "jwt_string",
    "user": { "id": "ObjectId", "name": "string", "email": "string", "role": "admin | airline | driver" }
  }
}
```
Store `token` in `localStorage`. Redirect based on `role`:
- `admin` → `/admin/dashboard`
- `airline` → `/airline/dashboard`
- `driver` → `/driver/orders`

---

### `/admin/dashboard` — `app/(admin)/admin/dashboard/page.tsx`

**APIs used:** `GET /api/analytics/summary`

---

#### `GET /api/analytics/summary`

**Response 200**
```json
{
  "success": true,
  "data": {
    "totalOrders": 10,
    "delivered": 4,
    "pending": 6,
    "availableDrivers": 3
  }
}
```

---

### `/admin/orders` — `app/(admin)/admin/orders/page.tsx`

**APIs used:** `GET /api/orders` · `POST /api/orders` · `PUT /api/orders/:id` · `DELETE /api/orders/:id` · `POST /api/orders/:id/assign-driver` · `PUT /api/orders/:id/status`

---

#### `GET /api/orders`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "orderNumber": "string",
      "vendor": { "_id": "ObjectId", "name": "string" },
      "driver": { "_id": "ObjectId", "vehicle": "string" },
      "items": [{ "sku": "ObjectId", "quantity": 10 }],
      "status": "pending | assigned | in_transit | delivered | cancelled",
      "scheduledAt": "ISO date",
      "createdAt": "ISO date"
    }
  ]
}
```

#### `POST /api/orders`

**Request**
```json
{
  "orderNumber": "string (required, unique)",
  "vendor": "ObjectId string (optional)",
  "driver": "ObjectId string (optional)",
  "items": [{ "sku": "ObjectId string", "quantity": 10 }],
  "status": "pending | assigned | in_transit | delivered | cancelled (optional, default: pending)",
  "scheduledAt": "ISO date string (optional)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "orderNumber": "string", "status": "pending", "createdAt": "ISO date" }
}
```

#### `PUT /api/orders/:id`

**Request** (all optional)
```json
{
  "orderNumber": "string",
  "vendor": "ObjectId string",
  "driver": "ObjectId string",
  "items": [{ "sku": "ObjectId string", "quantity": 10 }],
  "status": "pending | assigned | in_transit | delivered | cancelled",
  "scheduledAt": "ISO date string"
}
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "orderNumber": "string", "status": "string", "updatedAt": "ISO date" }
}
```

#### `DELETE /api/orders/:id`

**Response 200**
```json
{ "success": true, "data": {} }
```

#### `POST /api/orders/:id/assign-driver`

**Request**
```json
{ "driverId": "ObjectId string (required)" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "orderNumber": "string", "driver": "ObjectId", "status": "assigned" }
}
```

#### `PUT /api/orders/:id/status`

**Request**
```json
{ "status": "pending | assigned | in_transit | delivered | cancelled (required)" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "status": "string", "updatedAt": "ISO date" }
}
```

---

### `/admin/drivers` — `app/(admin)/admin/drivers/page.tsx`

**APIs used:** `GET /api/drivers` · `POST /api/drivers` · `PUT /api/drivers/:id` · `DELETE /api/drivers/:id`

---

#### `GET /api/drivers`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "user": { "_id": "ObjectId", "name": "string", "email": "string" },
      "licenseNumber": "string",
      "vehicle": "string",
      "isAvailable": true,
      "createdAt": "ISO date"
    }
  ]
}
```

#### `POST /api/drivers`

**Request**
```json
{
  "user": "ObjectId string (required)",
  "licenseNumber": "string (optional)",
  "vehicle": "string (optional)",
  "isAvailable": "boolean (optional, default: true)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "user": "ObjectId", "licenseNumber": "string", "vehicle": "string", "isAvailable": true }
}
```

#### `PUT /api/drivers/:id`

**Request** (all optional)
```json
{ "licenseNumber": "string", "vehicle": "string", "isAvailable": "boolean" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "licenseNumber": "string", "vehicle": "string", "isAvailable": true, "updatedAt": "ISO date" }
}
```

#### `DELETE /api/drivers/:id`

**Response 200**
```json
{ "success": true, "data": {} }
```

---

### `/admin/vendors` — `app/(admin)/admin/vendors/page.tsx`

**APIs used:** `GET /api/vendors` · `POST /api/vendors` · `PUT /api/vendors/:id` · `DELETE /api/vendors/:id`

---

#### `GET /api/vendors`

**Response 200**
```json
{
  "success": true,
  "data": [
    { "_id": "ObjectId", "name": "string", "contact": "string", "email": "string", "address": "string", "isActive": true, "createdAt": "ISO date" }
  ]
}
```

#### `POST /api/vendors`

**Request**
```json
{
  "name": "string (required)",
  "contact": "string (optional)",
  "email": "string, valid email (optional)",
  "address": "string (optional)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "name": "string", "contact": "string", "email": "string", "address": "string", "isActive": true }
}
```

#### `PUT /api/vendors/:id`

**Request** (all optional)
```json
{ "name": "string", "contact": "string", "email": "string", "address": "string" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "name": "string", "contact": "string", "email": "string", "address": "string", "isActive": true, "updatedAt": "ISO date" }
}
```

#### `DELETE /api/vendors/:id`

**Response 200**
```json
{ "success": true, "data": {} }
```

---

### `/admin/skus` — `app/(admin)/admin/skus/page.tsx`

**APIs used:** `GET /api/skus` · `POST /api/skus` · `PUT /api/skus/:id` · `DELETE /api/skus/:id`

---

#### `GET /api/skus`

**Query Params (optional):** `?vendorId=<ObjectId>` · `?airportCode=<string>`

**Response 200**
```json
{
  "success": true,
  "data": [
    { "_id": "ObjectId", "code": "string", "name": "string", "description": "string", "vendor": "ObjectId", "unit": "string", "isActive": true }
  ]
}
```

#### `POST /api/skus`

**Request**
```json
{
  "code": "string (required, unique)",
  "name": "string (required)",
  "description": "string (optional)",
  "vendor": "ObjectId string (optional)",
  "unit": "string (optional)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "code": "string", "name": "string", "unit": "string", "isActive": true }
}
```

#### `PUT /api/skus/:id`

**Request** (all optional)
```json
{ "code": "string", "name": "string", "description": "string", "vendor": "ObjectId string", "unit": "string" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "code": "string", "name": "string", "unit": "string", "updatedAt": "ISO date" }
}
```

#### `DELETE /api/skus/:id`

**Response 200**
```json
{ "success": true, "data": {} }
```

---

### `/admin/tracking` — `app/(admin)/admin/tracking/page.tsx`

**APIs used:** `GET /api/tracking/:orderId`

---

#### `GET /api/tracking/:orderId`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "order": "ObjectId",
      "driver": "ObjectId",
      "coordinates": { "lat": 17.385, "lng": 78.4867 },
      "recordedAt": "ISO date"
    }
  ]
}
```
Sorted by `recordedAt` ascending.

---

### `/admin/analytics` — `app/(admin)/admin/analytics/page.tsx`

**APIs used:** `GET /api/analytics/summary` · `GET /api/analytics/orders` · `GET /api/analytics/orders-by-status` · `GET /api/analytics/sla`

---

#### `GET /api/analytics/summary`

**Response 200**
```json
{
  "success": true,
  "data": { "totalOrders": 10, "delivered": 4, "pending": 6, "availableDrivers": 3 }
}
```

#### `GET /api/analytics/orders`

**Response 200**
```json
{
  "success": true,
  "data": {
    "total": 10,
    "byStatus": [{ "_id": "pending", "count": 3 }, { "_id": "delivered", "count": 4 }]
  }
}
```

#### `GET /api/analytics/orders-by-status`

**Response 200**
```json
{
  "success": true,
  "data": [{ "_id": "pending", "count": 3 }, { "_id": "delivered", "count": 4 }, { "_id": "in_transit", "count": 2 }]
}
```

#### `GET /api/analytics/sla`

**Response 200**
```json
{
  "success": true,
  "data": { "delivered": 4, "total": 10, "slaRate": "40.00%" }
}
```

---

### `/airline/dashboard` — `app/(airline)/airline/dashboard/page.tsx`

**APIs used:** `GET /api/analytics/summary`

---

#### `GET /api/analytics/summary`

**Response 200**
```json
{
  "success": true,
  "data": { "totalOrders": 10, "delivered": 4, "pending": 6, "availableDrivers": 3 }
}
```

---

### `/airline/bundles` — `app/(airline)/airline/bundles/page.tsx`

**APIs used:** `GET /api/orders` · `POST /api/orders`

---

#### `GET /api/orders`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "orderNumber": "string",
      "vendor": { "_id": "ObjectId", "name": "string" },
      "driver": { "_id": "ObjectId", "vehicle": "string" },
      "items": [{ "sku": "ObjectId", "quantity": 10 }],
      "status": "pending | assigned | in_transit | delivered | cancelled",
      "scheduledAt": "ISO date",
      "createdAt": "ISO date"
    }
  ]
}
```

#### `POST /api/orders`

**Request**
```json
{
  "orderNumber": "string (required, unique)",
  "vendor": "ObjectId string (optional)",
  "items": [{ "sku": "ObjectId string", "quantity": 10 }],
  "scheduledAt": "ISO date string (optional)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "orderNumber": "string", "status": "pending", "createdAt": "ISO date" }
}
```

---

### `/airline/history` — `app/(airline)/airline/history/page.tsx`

**APIs used:** `GET /api/orders`

---

#### `GET /api/orders`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "orderNumber": "string",
      "status": "pending | assigned | in_transit | delivered | cancelled",
      "scheduledAt": "ISO date",
      "createdAt": "ISO date"
    }
  ]
}
```

---

### `/airline/summary` — `app/(airline)/airline/summary/page.tsx`

**APIs used:** `GET /api/analytics/summary` · `GET /api/analytics/orders-by-status`

---

#### `GET /api/analytics/summary`

**Response 200**
```json
{
  "success": true,
  "data": { "totalOrders": 10, "delivered": 4, "pending": 6, "availableDrivers": 3 }
}
```

#### `GET /api/analytics/orders-by-status`

**Response 200**
```json
{
  "success": true,
  "data": [{ "_id": "pending", "count": 3 }, { "_id": "delivered", "count": 4 }]
}
```

---

### `/airline/tracking` — `app/(airline)/airline/tracking/page.tsx`

**APIs used:** `GET /api/tracking/:orderId`

---

#### `GET /api/tracking/:orderId`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "order": "ObjectId",
      "driver": "ObjectId",
      "coordinates": { "lat": 17.385, "lng": 78.4867 },
      "recordedAt": "ISO date"
    }
  ]
}
```

---

### `/driver/orders` — `app/(driver)/driver/orders/page.tsx`

**APIs used:** `GET /api/orders` · `PUT /api/orders/:id/picked` · `PUT /api/orders/:id/enroute` · `PUT /api/orders/:id/delivered`

---

#### `GET /api/orders`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "orderNumber": "string",
      "driver": "ObjectId",
      "status": "pending | assigned | in_transit | delivered | cancelled",
      "scheduledAt": "ISO date"
    }
  ]
}
```

#### `PUT /api/orders/:id/picked`

No request body.

**Response 200**
```json
{ "success": true, "data": { "_id": "ObjectId", "status": "picked" } }
```

#### `PUT /api/orders/:id/enroute`

No request body.

**Response 200**
```json
{ "success": true, "data": { "_id": "ObjectId", "status": "enroute" } }
```

#### `PUT /api/orders/:id/delivered`

No request body.

**Response 200**
```json
{ "success": true, "data": { "_id": "ObjectId", "status": "delivered" } }
```

---

### `/driver/navigation` — `app/(driver)/driver/navigation/page.tsx`

**APIs used:** `POST /api/tracking` · `GET /api/tracking/:orderId`

---

#### `POST /api/tracking`

**Request**
```json
{
  "order": "ObjectId string (optional)",
  "driver": "ObjectId string (optional)",
  "coordinates": { "lat": 17.385, "lng": 78.4867 }
}
```
**Response 201**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "order": "ObjectId",
    "driver": "ObjectId",
    "coordinates": { "lat": 17.385, "lng": 78.4867 },
    "recordedAt": "ISO date"
  }
}
```

#### `GET /api/tracking/:orderId`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "_id": "ObjectId",
      "order": "ObjectId",
      "driver": "ObjectId",
      "coordinates": { "lat": 17.385, "lng": 78.4867 },
      "recordedAt": "ISO date"
    }
  ]
}
```

---

### `/driver/proof` — `app/(driver)/driver/proof/page.tsx`

**APIs used:** `POST /api/orders/:id/proof` · `GET /api/orders/:id/proof`

---

#### `POST /api/orders/:id/proof`

**Request**
```json
{
  "imageUrl": "string (optional)",
  "signature": "string, base64 (optional)",
  "notes": "string (optional)"
}
```
**Response 201**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "order": "ObjectId",
    "driver": "ObjectId",
    "imageUrl": "string",
    "signature": "string",
    "notes": "string",
    "deliveredAt": "ISO date"
  }
}
```

#### `GET /api/orders/:id/proof`

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "order": "ObjectId",
    "driver": { "_id": "ObjectId", "vehicle": "string", "licenseNumber": "string" },
    "imageUrl": "string",
    "signature": "string",
    "notes": "string",
    "deliveredAt": "ISO date"
  }
}
```
Returns `"data": null` if no proof exists.

---

### `/driver/details` — `app/(driver)/driver/details/page.tsx`

**APIs used:** `GET /api/auth/me` · `PUT /api/drivers/:id/status`

---

#### `GET /api/auth/me`

**Response 200**
```json
{
  "success": true,
  "data": {
    "_id": "ObjectId",
    "name": "string",
    "email": "string",
    "role": "driver",
    "createdAt": "ISO date"
  }
}
```

#### `PUT /api/drivers/:id/status`

**Request**
```json
{ "isAvailable": "boolean (required)" }
```
**Response 200**
```json
{
  "success": true,
  "data": { "_id": "ObjectId", "isAvailable": true, "updatedAt": "ISO date" }
}
```
