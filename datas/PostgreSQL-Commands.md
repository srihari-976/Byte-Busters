# PostgreSQL Database Commands

## Connect to Database

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# Connect to specific database
psql -U postgres -d manufacturing_db -h localhost
```

## Database Setup

```sql
-- Create database
CREATE DATABASE manufacturing_db;

-- Connect to database
\c manufacturing_db;

-- Run schema file
\i backend/schema/manufacturing.sql
```

## View All Tables

```sql
-- List all tables
\dt

-- List tables with details
\dt+

-- Show table structure
\d table_name

-- Show all tables and their row counts
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public';
```

## Check Table Data

### Users Table
```sql
-- View all users
SELECT * FROM users;

-- Count users by role
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Show user details
SELECT user_id, username, email, role, created_at FROM users;
```

### Products Table
```sql
-- View all products
SELECT * FROM products;

-- Products with stock status
SELECT 
    product_id,
    name,
    type,
    current_stock,
    min_qty,
    max_qty,
    CASE 
        WHEN current_stock <= min_qty THEN 'LOW'
        WHEN current_stock = 0 THEN 'OUT'
        WHEN current_stock >= max_qty THEN 'HIGH'
        ELSE 'NORMAL'
    END as stock_status
FROM products;

-- Products by type
SELECT type, COUNT(*) FROM products GROUP BY type;
```

### Manufacturing Orders Table
```sql
-- View all manufacturing orders
SELECT * FROM manufacturing_orders;

-- MO with product details
SELECT 
    mo.mo_id,
    mo.mo_number,
    p.name as product_name,
    mo.quantity,
    mo.status,
    mo.start_date,
    mo.end_date
FROM manufacturing_orders mo
LEFT JOIN products p ON mo.product_id = p.product_id;

-- MO status summary
SELECT status, COUNT(*) FROM manufacturing_orders GROUP BY status;
```

### Work Orders Table
```sql
-- View all work orders
SELECT * FROM work_orders;

-- WO with MO and product details
SELECT 
    wo.wo_number,
    mo.mo_number,
    p.name as product_name,
    wo.step_name,
    wo.status,
    wc.name as work_center_name
FROM work_orders wo
LEFT JOIN manufacturing_orders mo ON wo.mo_id = mo.mo_id
LEFT JOIN products p ON mo.product_id = p.product_id
LEFT JOIN work_centers wc ON wo.work_center_id = wc.wc_id;

-- WO status summary
SELECT status, COUNT(*) FROM work_orders GROUP BY status;
```

### Work Centers Table
```sql
-- View all work centers
SELECT * FROM work_centers;

-- Work center utilization
SELECT 
    wc.name,
    wc.capacity,
    COUNT(wo.wo_id) as active_orders
FROM work_centers wc
LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id 
    AND wo.status IN ('planned', 'in_progress')
GROUP BY wc.wc_id, wc.name, wc.capacity;
```

### BOM (Bill of Materials) Table
```sql
-- View all BOM entries
SELECT * FROM bom;

-- BOM with product and component names
SELECT 
    b.bom_id,
    p1.name as product_name,
    p2.name as component_name,
    b.quantity,
    b.operation,
    b.duration_min
FROM bom b
LEFT JOIN products p1 ON b.product_id = p1.product_id
LEFT JOIN products p2 ON b.component_id = p2.product_id;

-- BOM for specific product
SELECT 
    p2.name as component_name,
    b.quantity,
    b.operation,
    b.duration_min
FROM bom b
LEFT JOIN products p1 ON b.product_id = p1.product_id
LEFT JOIN products p2 ON b.component_id = p2.product_id
WHERE p1.name = 'Wooden Table';
```

### Stock Ledger Table
```sql
-- View all stock transactions
SELECT * FROM stock_ledger ORDER BY created_at DESC LIMIT 20;

-- Stock ledger with product names
SELECT 
    sl.ledger_id,
    p.name as product_name,
    sl.transaction_type,
    sl.quantity,
    sl.balance,
    sl.reference_type,
    sl.created_at
FROM stock_ledger sl
LEFT JOIN products p ON sl.product_id = p.product_id
ORDER BY sl.created_at DESC;

-- Current stock balance per product
SELECT 
    p.name,
    p.current_stock,
    COALESCE(latest_balance.balance, 0) as ledger_balance
FROM products p
LEFT JOIN (
    SELECT DISTINCT ON (product_id) 
        product_id, 
        balance
    FROM stock_ledger 
    ORDER BY product_id, created_at DESC
) latest_balance ON p.product_id = latest_balance.product_id;
```

## Advanced Queries

### Manufacturing Flow Analysis
```sql
-- Complete manufacturing flow
SELECT 
    mo.mo_number,
    p.name as product_name,
    mo.quantity as mo_quantity,
    mo.status as mo_status,
    COUNT(wo.wo_id) as total_work_orders,
    COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_work_orders,
    ROUND(
        COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(wo.wo_id), 0), 2
    ) as completion_percentage
FROM manufacturing_orders mo
LEFT JOIN products p ON mo.product_id = p.product_id
LEFT JOIN work_orders wo ON mo.mo_id = wo.mo_id
GROUP BY mo.mo_id, mo.mo_number, p.name, mo.quantity, mo.status;
```

### Stock Analysis
```sql
-- Stock alerts
SELECT 
    p.name,
    p.current_stock,
    p.min_qty,
    p.max_qty,
    CASE 
        WHEN p.current_stock <= p.min_qty THEN 'LOW_STOCK'
        WHEN p.current_stock = 0 THEN 'OUT_OF_STOCK'
        WHEN p.current_stock >= p.max_qty THEN 'OVERSTOCK'
        ELSE 'NORMAL'
    END as alert_type
FROM products p
WHERE p.current_stock <= p.min_qty OR p.current_stock >= p.max_qty;
```

### Production Efficiency
```sql
-- Work order efficiency
SELECT 
    wc.name as work_center,
    COUNT(wo.wo_id) as total_orders,
    COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_orders,
    AVG(EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600) as avg_hours
FROM work_centers wc
LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id
WHERE wo.start_time IS NOT NULL AND wo.end_time IS NOT NULL
GROUP BY wc.wc_id, wc.name;
```

## Database Maintenance

### Check Database Size
```sql
-- Database size
SELECT pg_size_pretty(pg_database_size('manufacturing_db'));

-- Table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### Backup and Restore
```bash
# Backup database
pg_dump -U postgres -h localhost manufacturing_db > backup.sql

# Restore database
psql -U postgres -h localhost manufacturing_db < backup.sql
```

### Clear All Data (Reset)
```sql
-- Clear all data (keep structure)
TRUNCATE TABLE stock_ledger CASCADE;
TRUNCATE TABLE work_orders CASCADE;
TRUNCATE TABLE bom CASCADE;
TRUNCATE TABLE manufacturing_orders CASCADE;
TRUNCATE TABLE work_centers CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE otp_verification CASCADE;
TRUNCATE TABLE users CASCADE;
```

## Useful PostgreSQL Commands

```sql
-- Show current database
SELECT current_database();

-- Show current user
SELECT current_user;

-- Show all databases
\l

-- Show all schemas
\dn

-- Show all functions
\df

-- Show table constraints
\d+ table_name

-- Show indexes
\di

-- Exit psql
\q
```

## Connection Troubleshooting

```bash
# Check PostgreSQL service status
sudo systemctl status postgresql

# Start PostgreSQL service
sudo systemctl start postgresql

# Check if PostgreSQL is listening
netstat -an | grep 5432

# Test connection
pg_isready -h localhost -p 5432
```