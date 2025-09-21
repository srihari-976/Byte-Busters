# Manufacturing ERP Backend with AI-Powered Predictive Alerts

Complete Node.js backend for manufacturing operations with Random Forest ML algorithm for delay prediction.

## Features
- 🏭 **Manufacturing Orders & Work Orders Management**
- 📦 **Inventory & Stock Reservations**
- 🤖 **AI-Powered Delay Predictions** (Random Forest Algorithm)
- 🚨 **Real-time Alerts with Explanations**
- 👥 **Role-based Access Control** (Admin, Manager, Operator, Inventory)
- 📊 **Analytics & Reporting**
- 🔐 **JWT Authentication with OTP Reset**

## Quick Start

### 1. Database Setup
```bash
# One-line PostgreSQL setup
psql -U postgres -c "CREATE DATABASE manufacturing_db;" && psql -U postgres -d manufacturing_db -f schema/manufacturing.sql && psql -U postgres -d manufacturing_db -f schema/ai_predictions.sql
```

### PostgreSQL Commands to View Data
```bash
# Connect to database and run all queries
psql -U postgres -d manufacturing_db -c "
\dt;
SELECT 'Manufacturing Orders:' as info; SELECT mo_number, status, quantity FROM manufacturing_orders;
SELECT 'Products:' as info; SELECT name, type, current_stock FROM products;
SELECT 'Work Orders:' as info; SELECT wo_number, status, step_name FROM work_orders;
SELECT 'Alerts:' as info; SELECT severity, message, status FROM alerts;
SELECT 'Stock Levels:' as info; SELECT p.name, p.current_stock, p.min_qty FROM products p WHERE p.current_stock <= p.min_qty;
"
```

### 2. Install & Run
```bash
npm install
npm run dev          # Main API (port 3001)
npm run ai-server    # AI service (port 3002)
```

### 3. Test System
```bash
# Seed sample data
npm run seed-ai

# Create test alert
npm run create-alert

# Test prediction
curl -X POST http://localhost:3002/api/predict/mo -H "Content-Type: application/json" -d '{"mo_id":4}'
```

## Database Schema

### Core Manufacturing Tables
```sql
-- Users with role-based access
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'operator',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products (raw materials & finished goods)
CREATE TABLE products (
  product_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'finished',
  unit VARCHAR(20) DEFAULT 'pcs',
  cost DECIMAL(10,2) DEFAULT 0,
  min_qty DECIMAL(10,3) DEFAULT 10,
  max_qty DECIMAL(10,3) DEFAULT 100,
  current_stock DECIMAL(10,3) DEFAULT 0
);

-- Manufacturing Orders
CREATE TABLE manufacturing_orders (
  mo_id SERIAL PRIMARY KEY,
  mo_number VARCHAR(20) UNIQUE NOT NULL,
  product_id INTEGER REFERENCES products(product_id),
  quantity INTEGER NOT NULL,
  start_date DATE,
  end_date DATE,
  assignee_id INTEGER REFERENCES users(user_id),
  status VARCHAR(20) DEFAULT 'planned',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders
CREATE TABLE work_orders (
  wo_id SERIAL PRIMARY KEY,
  wo_number VARCHAR(20) UNIQUE NOT NULL,
  mo_id INTEGER REFERENCES manufacturing_orders(mo_id),
  step_name VARCHAR(100) NOT NULL,
  assignee_id INTEGER REFERENCES users(user_id),
  work_center_id INTEGER REFERENCES work_centers(wc_id),
  status VARCHAR(20) DEFAULT 'planned',
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  comments TEXT
);

-- Bill of Materials
CREATE TABLE bom (
  bom_id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(product_id),
  component_id INTEGER REFERENCES products(product_id),
  quantity DECIMAL(10,3) NOT NULL,
  operation VARCHAR(100),
  duration_min INTEGER DEFAULT 0
);

-- Stock Ledger (all transactions)
CREATE TABLE stock_ledger (
  ledger_id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(product_id),
  txn_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUST, RESERVED
  quantity DECIMAL(10,3) NOT NULL,
  balance_after DECIMAL(10,3) NOT NULL,
  reference_type VARCHAR(20), -- MO, WO, MANUAL
  reference_id INTEGER,
  user_id INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### AI Prediction Tables
```sql
-- ML Model Predictions
CREATE TABLE predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(16) NOT NULL, -- 'MO', 'WO', 'PRODUCT'
  entity_id INTEGER NOT NULL,
  model_version VARCHAR(32) NOT NULL,
  score DECIMAL(5,4) NOT NULL, -- 0.0 to 1.0
  risk_level VARCHAR(8) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
  top_reasons JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Alerts Generated from Predictions
CREATE TABLE alerts (
  alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id UUID REFERENCES predictions(id),
  alert_type VARCHAR(32) NOT NULL, -- 'MO_DELAY', 'WO_DELAY', 'STOCK_SHORTAGE'
  entity_type VARCHAR(16) NOT NULL,
  entity_id INTEGER NOT NULL,
  score DECIMAL(5,4) NOT NULL,
  severity VARCHAR(8) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH'
  message TEXT NOT NULL,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  status VARCHAR(16) DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
  created_by INTEGER,
  acknowledged_by INTEGER,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Feature Store for ML
CREATE TABLE features_mo (
  mo_id INTEGER PRIMARY KEY,
  mo_qty INTEGER,
  bom_component_count INTEGER,
  percent_components_available DECIMAL(5,4),
  work_center_avg_utilization_7d DECIMAL(5,4),
  avg_wo_duration_product_30d DECIMAL(8,2),
  assignee_recent_delay_rate_30d DECIMAL(5,4),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## API Endpoints

### Authentication
```bash
# Register user
POST /api/register
{
  "username": "john_doe",
  "email": "john@company.com",
  "password": "password123",
  "role": "manager"
}

# Login
POST /api/login
{
  "email": "john@company.com",
  "password": "password123"
}

# Reset password (sends OTP)
POST /api/reset-password
{
  "email": "john@company.com"
}
```

### Manufacturing Operations (Requires JWT)
```bash
# Get manufacturing orders
GET /api/manufacturing-orders
Authorization: Bearer <jwt_token>

# Create manufacturing order
POST /api/manufacturing-orders
{
  "mo_number": "MO-2024-001",
  "product_id": 1,
  "quantity": 50,
  "start_date": "2024-01-15",
  "end_date": "2024-01-22",
  "assignee_id": 2
}

# Update MO status
PUT /api/manufacturing-orders/1/status
{
  "status": "confirmed"
}

# Get work orders
GET /api/work-orders?mo_id=1

# Update work order
PUT /api/work-orders/1
{
  "status": "completed",
  "comments": "Finished assembly"
}
```

### Stock Management
```bash
# Get stock levels
GET /api/stock/levels

# Adjust stock
POST /api/stock/adjust
{
  "product_id": 1,
  "quantity": 100,
  "reason": "Physical count adjustment"
}

# Reserve stock for MO
POST /api/stock/reserve
{
  "product_id": 4,
  "qty": 50,
  "unit": "pcs",
  "ref_type": "MO",
  "ref_id": 1
}
```

### AI Predictions & Alerts
```bash
# Predict MO delay (Random Forest)
POST /api/predict/mo
{
  "mo_id": 4
}

# Response:
{
  "mo_id": 4,
  "score": 0.8,
  "risk": "HIGH",
  "top_reasons": [
    {
      "feature": "percent_components_available",
      "value": 0.3,
      "impact": -0.08,
      "description": "Low component availability increases delay risk"
    }
  ],
  "recommended_actions": ["Reserve components", "Assign backup workforce"]
}

# Get active alerts
GET /api/alerts

# Acknowledge alert
PUT /api/alerts/{alert_id}/acknowledge
```

### Public Test Endpoints (No Auth)
```bash
# Test alerts
GET /api/test/alerts

# Test manufacturing orders
GET /api/test/manufacturing-orders
```

## AI Algorithm: Random Forest

### Model Architecture
```javascript
// 3 Decision Trees with Weighted Ensemble
Trees = [
  {
    focus: "Component Availability",
    weight: 0.4,
    logic: "if components < 40% → high_risk"
  },
  {
    focus: "Work Center Utilization", 
    weight: 0.3,
    logic: "if utilization > 90% → high_risk"
  },
  {
    focus: "Order Complexity",
    weight: 0.3, 
    logic: "if quantity > 20 AND delays > 30% → high_risk"
  }
]

// Final Score = Weighted Average
final_score = (tree1 × 0.4) + (tree2 × 0.3) + (tree3 × 0.3)
```

### Risk Classification
- **HIGH**: score > 0.75 (Create alert)
- **MEDIUM**: score > 0.5 (Monitor)
- **LOW**: score ≤ 0.5 (Normal)

## Sample Data Queries

### Manufacturing Analytics
```sql
-- Production efficiency by work center
SELECT 
  wc.name,
  COUNT(wo.wo_id) as total_orders,
  AVG(EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600) as avg_hours
FROM work_centers wc
LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id 
WHERE wo.status = 'completed'
GROUP BY wc.wc_id, wc.name;

-- Stock alerts (low inventory)
SELECT 
  p.name,
  p.current_stock,
  p.min_qty,
  CASE 
    WHEN p.current_stock <= p.min_qty THEN 'LOW_STOCK'
    WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
    ELSE 'NORMAL'
  END as status
FROM products p
WHERE p.current_stock <= p.min_qty;

-- MO completion rate
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM manufacturing_orders
GROUP BY status;
```

### AI Predictions Analysis
```sql
-- High-risk MOs with predictions
SELECT 
  mo.mo_number,
  p.name as product_name,
  pred.score,
  pred.risk_level,
  pred.top_reasons,
  pred.created_at
FROM predictions pred
JOIN manufacturing_orders mo ON mo.mo_id = pred.entity_id
JOIN products p ON p.product_id = mo.product_id
WHERE pred.risk_level = 'HIGH'
ORDER BY pred.score DESC;

-- Alert summary by severity
SELECT 
  severity,
  COUNT(*) as alert_count,
  COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_count
FROM alerts
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY severity;
```

## Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=manufacturing_db
DB_USER=postgres
DB_PASSWORD=admin

# Server
PORT=3001
AI_PORT=3002
JWT_SECRET=manufacturing_erp_super_secure_secret_key_2024

# Email (for OTP)
EMAIL_SERVICE=console  # Development mode
```

## Testing

### Complete Test Flow
```bash
# 1. Start services
npm run dev &
npm run ai-server &

# 2. Create test data
npm run seed-ai

# 3. Test authentication
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123","role":"manager"}'

# 4. Test manufacturing data
curl http://localhost:3001/api/test/manufacturing-orders

# 5. Test AI prediction
curl -X POST http://localhost:3002/api/predict/mo \
  -H "Content-Type: application/json" \
  -d '{"mo_id":4}'

# 6. Create and view alerts
npm run create-alert
curl http://localhost:3001/api/test/alerts
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Main API      │    │   AI Service    │
│   (Port 3000)   │◄──►│   (Port 3001)   │◄──►│   (Port 3002)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   PostgreSQL    │    │  Random Forest  │
                       │   Database      │    │     Model       │
                       └─────────────────┘    └─────────────────┘
```

## Production Deployment

1. **Database**: PostgreSQL with connection pooling
2. **API**: PM2 for process management
3. **Security**: Rate limiting, input validation, SQL injection protection
4. **Monitoring**: Logs, metrics, health checks
5. **Scaling**: Load balancer, Redis for sessions

This backend provides a complete manufacturing ERP system with AI-powered predictive capabilities, ready for production use.