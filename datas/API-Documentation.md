# Manufacturing Management API Documentation

Base URL: `http://localhost:3001/api`

## Authentication

### Register User
```
POST /register
Content-Type: application/json

Body:
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "manager"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "manager"
  }
}
```

### Login
```
POST /login
Content-Type: application/json

Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "manager"
  }
}
```

### Reset Password
```
POST /reset-password
Content-Type: application/json

Body:
{
  "email": "john@example.com"
}

Response:
{
  "message": "OTP sent successfully"
}
```

## Manufacturing Orders

**Auth Required**: Bearer Token in Authorization header

### Get All Manufacturing Orders
```
GET /manufacturing-orders
Authorization: Bearer {token}

Query Parameters (optional):
- status: planned|in_progress|completed|cancelled
- assignee_id: number

Response:
[
  {
    "mo_id": 1,
    "mo_number": "MO001",
    "product_id": 1,
    "product_name": "Wooden Table",
    "quantity": 10,
    "status": "planned",
    "assignee_id": 1,
    "assignee_name": "John Doe",
    "start_date": "2024-01-15",
    "end_date": "2024-01-22",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Create Manufacturing Order
```
POST /manufacturing-orders
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "mo_number": "MO004",
  "product_id": 1,
  "quantity": 5,
  "start_date": "2024-01-20",
  "end_date": "2024-01-25",
  "assignee_id": 1
}

Response:
{
  "mo_id": 4,
  "mo_number": "MO004",
  "product_id": 1,
  "quantity": 5,
  "status": "planned",
  "created_at": "2024-01-20T10:00:00Z"
}
```

### Update Manufacturing Order
```
PUT /manufacturing-orders/{id}
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "mo_number": "MO004",
  "product_id": 1,
  "quantity": 8,
  "start_date": "2024-01-20",
  "end_date": "2024-01-25",
  "assignee_id": 1,
  "status": "in_progress"
}
```

### Update MO Status
```
PUT /manufacturing-orders/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "completed"
}
```

### Delete Manufacturing Order
```
DELETE /manufacturing-orders/{id}
Authorization: Bearer {token}

Response:
{
  "success": true,
  "deleted_order": {...}
}
```

## Work Orders

**Auth Required**: Bearer Token

### Get All Work Orders
```
GET /work-orders
Authorization: Bearer {token}

Query Parameters (optional):
- mo_id: number
- status: planned|in_progress|paused|completed

Response:
[
  {
    "wo_id": 1,
    "wo_number": "WO001",
    "mo_id": 1,
    "mo_number": "MO001",
    "step_name": "Assembly",
    "status": "planned",
    "assignee_id": 1,
    "assignee_name": "John Doe",
    "work_center_id": 1,
    "work_center_name": "Assembly Line 1",
    "start_time": null,
    "end_time": null,
    "comments": null
  }
]
```

### Create Work Order
```
POST /work-orders
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "wo_number": "WO006",
  "mo_id": 1,
  "step_name": "Quality Check",
  "assignee_id": 2,
  "work_center_id": 4
}
```

### Update Work Order Status
```
PUT /work-orders/{id}/status
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "completed",
  "comments": "Work completed successfully"
}
```

## Products

**Auth Required**: Bearer Token

### Get All Products
```
GET /products
Authorization: Bearer {token}

Query Parameters (optional):
- type: raw|finished|component

Response:
[
  {
    "product_id": 1,
    "name": "Wooden Table",
    "type": "finished",
    "unit": "pcs",
    "cost": 150.00,
    "min_qty": 5,
    "max_qty": 50,
    "current_stock": 25,
    "stock_status": "normal"
  }
]
```

### Create Product
```
POST /products
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "New Product",
  "type": "finished",
  "unit": "pcs",
  "cost": 100.00,
  "min_qty": 10,
  "max_qty": 100,
  "current_stock": 50
}
```

## Bill of Materials (BOM)

**Auth Required**: Bearer Token

### Get BOM for Product
```
GET /bom/{product_id}
Authorization: Bearer {token}

Query Parameters (optional):
- mo_quantity: number (for scaling calculations)

Response:
[
  {
    "bom_id": 1,
    "product_id": 1,
    "component_id": 4,
    "component_name": "Wood Leg",
    "quantity": 4,
    "required_quantity": 40,
    "operation": "Assembly",
    "duration_min": 60,
    "availability_status": "available"
  }
]
```

### Create BOM Entry
```
POST /bom
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "product_id": 1,
  "component_id": 4,
  "quantity": 4,
  "operation": "Assembly",
  "duration_min": 60
}
```

## Work Centers

**Auth Required**: Bearer Token

### Get All Work Centers
```
GET /work-centers
Authorization: Bearer {token}

Response:
[
  {
    "wc_id": 1,
    "name": "Assembly Line 1",
    "type": "machine",
    "capacity": 2,
    "cost_per_hour": 50.00,
    "downtime_hours": 0,
    "active_work_orders": 2,
    "avg_completion_hours": 4.5
  }
]
```

### Create Work Center
```
POST /work-centers
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "name": "New Work Center",
  "type": "machine",
  "capacity": 2,
  "cost_per_hour": 75.00
}
```

## Stock Management

**Auth Required**: Bearer Token

### Get Stock Ledger
```
GET /stock-ledger
Authorization: Bearer {token}

Query Parameters (optional):
- product_id: number

Response:
[
  {
    "ledger_id": 1,
    "product_id": 4,
    "product_name": "Wood Leg",
    "txn_type": "IN",
    "quantity": 150,
    "balance_after": 150,
    "reference_type": "MANUAL",
    "user_name": "John Doe",
    "created_at": "2024-01-15T10:00:00Z"
  }
]
```

### Stock Adjustment
```
POST /stock-adjust
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "product_id": 4,
  "quantity": 50,
  "notes": "Stock replenishment"
}

Response:
{
  "success": true,
  "new_balance": 200
}
```

### Get Stock Levels
```
GET /stock/levels
Authorization: Bearer {token}

Response:
[
  {
    "product_id": 1,
    "name": "Wooden Table",
    "available_qty": 25,
    "reserved_qty": 0,
    "stock_status": "NORMAL"
  }
]
```

### Get Stock Alerts
```
GET /stock-alerts
Authorization: Bearer {token}

Response:
[
  {
    "product_id": 4,
    "name": "Wood Leg",
    "current_stock": 5,
    "min_qty": 20,
    "alert_type": "LOW_STOCK"
  }
]
```

## Analytics & Reports

**Auth Required**: Bearer Token

### Dashboard Analytics
```
GET /analytics/dashboard
Authorization: Bearer {token}

Response:
{
  "manufacturing_orders": {
    "total_orders": 10,
    "completed": 3,
    "in_progress": 4,
    "planned": 3
  },
  "work_orders": {
    "total_work_orders": 25,
    "completed_work_orders": 8,
    "avg_completion_hours": 4.2
  },
  "stock_alerts": {
    "low_stock_items": 2,
    "out_of_stock_items": 0
  }
}
```

### Production Report
```
GET /reports/production
Authorization: Bearer {token}

Query Parameters:
- start_date: YYYY-MM-DD
- end_date: YYYY-MM-DD

Response:
[
  {
    "mo_number": "MO001",
    "product_name": "Wooden Table",
    "quantity": 10,
    "status": "completed",
    "assignee": "John Doe",
    "total_work_orders": 3,
    "completed_work_orders": 3
  }
]
```

## Error Responses

All endpoints return standard HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

Error Response Format:
```json
{
  "error": "Error message description"
}
```

## Database Tables

### Core Tables:
- `users` - User authentication and roles
- `products` - Product master data
- `manufacturing_orders` - Production orders
- `work_orders` - Step-by-step operations
- `work_centers` - Production resources
- `bom` - Bill of materials
- `stock_ledger` - Inventory transactions

### Role-based Access:
- **Admin**: Full access to all endpoints
- **Manager**: Manufacturing orders, work orders, analytics, reports
- **Operator**: Work order updates (own assignments only)
- **Inventory**: Stock management, product data

## Setup Instructions

1. **Database**: Create PostgreSQL database `manufacturing_db`
2. **Schema**: Run `backend/schema/manufacturing.sql`
3. **Backend**: `cd backend && npm install && npm start`
4. **Test**: Use Postman with the provided endpoints