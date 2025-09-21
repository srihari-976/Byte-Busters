-- Complete Manufacturing ERP System Database Schema (Based on Blueprint)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USER MANAGEMENT & SECURITY
-- Roles table
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INTEGER REFERENCES roles(role_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 2. PRODUCT MASTER DATA
-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
    category_id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL,
    parent_category_id INTEGER REFERENCES product_categories(category_id)
);

-- Products table (enhanced)
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    category_id INTEGER REFERENCES product_categories(category_id),
    product_type VARCHAR(20) CHECK (product_type IN ('raw_material', 'finished_good', 'semi_finished', 'consumable')),
    uom VARCHAR(20) NOT NULL,
    standard_cost DECIMAL(15,4),
    reorder_level DECIMAL(12,3),
    max_stock_level DECIMAL(12,3),
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. MANUFACTURING OPERATIONS
-- Work Centers table (enhanced)
CREATE TABLE IF NOT EXISTS work_centers (
    work_center_id SERIAL PRIMARY KEY,
    work_center_code VARCHAR(30) UNIQUE NOT NULL,
    work_center_name VARCHAR(100) NOT NULL,
    capacity_per_day DECIMAL(8,2),
    cost_per_hour DECIMAL(10,2),
    efficiency_factor DECIMAL(5,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bill of Materials Header
CREATE TABLE IF NOT EXISTS bom_header (
    bom_id SERIAL PRIMARY KEY,
    bom_code VARCHAR(50) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(product_id),
    bom_version VARCHAR(10) DEFAULT '1.0',
    quantity DECIMAL(12,3) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- BOM Components
CREATE TABLE IF NOT EXISTS bom_components (
    component_id SERIAL PRIMARY KEY,
    bom_id INTEGER REFERENCES bom_header(bom_id),
    product_id INTEGER REFERENCES products(product_id),
    quantity_required DECIMAL(12,6) NOT NULL,
    scrap_percentage DECIMAL(5,2) DEFAULT 0,
    operation_sequence INTEGER DEFAULT 10
);

-- Manufacturing Orders table (enhanced)
CREATE TABLE IF NOT EXISTS manufacturing_orders (
    mo_id SERIAL PRIMARY KEY,
    mo_number VARCHAR(30) UNIQUE NOT NULL,
    product_id INTEGER REFERENCES products(product_id),
    bom_id INTEGER REFERENCES bom_header(bom_id),
    planned_quantity DECIMAL(12,3) NOT NULL,
    produced_quantity DECIMAL(12,3) DEFAULT 0,
    planned_start_date DATE,
    planned_completion_date DATE,
    actual_start_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    priority_level INTEGER DEFAULT 5,
    mo_status VARCHAR(20) CHECK (mo_status IN ('draft', 'released', 'in_progress', 'completed', 'cancelled')),
    created_by INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders table (enhanced)
CREATE TABLE IF NOT EXISTS work_orders (
    wo_id SERIAL PRIMARY KEY,
    wo_number VARCHAR(30) UNIQUE NOT NULL,
    mo_id INTEGER REFERENCES manufacturing_orders(mo_id),
    work_center_id INTEGER REFERENCES work_centers(work_center_id),
    operation_name VARCHAR(100) NOT NULL,
    sequence_number INTEGER DEFAULT 10,
    setup_time_minutes INTEGER DEFAULT 0,
    run_time_minutes INTEGER DEFAULT 0,
    assigned_to INTEGER REFERENCES users(user_id),
    wo_status VARCHAR(20) CHECK (wo_status IN ('pending', 'ready', 'in_progress', 'completed', 'cancelled')),
    actual_start_time TIMESTAMP,
    actual_end_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. INVENTORY MANAGEMENT
-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
    warehouse_id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(20) UNIQUE NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- Stock Locations
CREATE TABLE IF NOT EXISTS stock_locations (
    location_id SERIAL PRIMARY KEY,
    location_code VARCHAR(30) UNIQUE NOT NULL,
    location_name VARCHAR(100) NOT NULL,
    warehouse_id INTEGER REFERENCES warehouses(warehouse_id),
    location_type VARCHAR(20) CHECK (location_type IN ('raw_material', 'finished_goods', 'wip', 'quality_hold', 'scrap')),
    parent_location_id INTEGER REFERENCES stock_locations(location_id)
);

-- Stock Transactions
CREATE TABLE IF NOT EXISTS stock_transactions (
    transaction_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    location_id INTEGER REFERENCES stock_locations(location_id),
    transaction_type VARCHAR(30) NOT NULL,
    quantity DECIMAL(12,6) NOT NULL,
    unit_cost DECIMAL(15,4),
    reference_type VARCHAR(20),
    reference_number VARCHAR(50),
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(user_id)
);

-- Current Stock Balances
CREATE TABLE IF NOT EXISTS stock_balances (
    balance_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    location_id INTEGER REFERENCES stock_locations(location_id),
    available_quantity DECIMAL(12,6) DEFAULT 0,
    reserved_quantity DECIMAL(12,6) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, location_id)
);

-- 5. QUALITY CONTROL
-- Quality Parameters
CREATE TABLE IF NOT EXISTS quality_parameters (
    parameter_id SERIAL PRIMARY KEY,
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type VARCHAR(20) CHECK (parameter_type IN ('numeric', 'text', 'pass_fail')),
    min_value DECIMAL(10,4),
    max_value DECIMAL(10,4),
    target_value DECIMAL(10,4)
);

-- Quality Control Plans
CREATE TABLE IF NOT EXISTS qc_plans (
    qc_plan_id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) NOT NULL,
    product_id INTEGER REFERENCES products(product_id),
    inspection_type VARCHAR(20) CHECK (inspection_type IN ('incoming', 'in_process', 'final')),
    sampling_size INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE
);

-- Quality Inspections
CREATE TABLE IF NOT EXISTS quality_inspections (
    inspection_id SERIAL PRIMARY KEY,
    qc_plan_id INTEGER REFERENCES qc_plans(qc_plan_id),
    reference_type VARCHAR(20),
    reference_id INTEGER,
    inspector_id INTEGER REFERENCES users(user_id),
    inspection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    inspection_result VARCHAR(20) CHECK (inspection_result IN ('pass', 'fail', 'rework')),
    remarks TEXT
);

-- 6. SYSTEM CONFIGURATION
-- Number Series
CREATE TABLE IF NOT EXISTS number_series (
    series_id SERIAL PRIMARY KEY,
    series_name VARCHAR(50) UNIQUE NOT NULL,
    prefix VARCHAR(10),
    current_number INTEGER DEFAULT 1,
    increment_by INTEGER DEFAULT 1,
    padding_zeros INTEGER DEFAULT 4
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action_type VARCHAR(10) CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(user_id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy compatibility tables (for backward compatibility)
CREATE TABLE IF NOT EXISTS bom (
    bom_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    component_id INTEGER REFERENCES products(product_id),
    quantity DECIMAL(10,3) NOT NULL,
    operation VARCHAR(100),
    duration_min INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_ledger (
    stock_id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(product_id),
    transaction_type VARCHAR(20),
    quantity DECIMAL(10,3),
    reference_type VARCHAR(20),
    reference_id INTEGER,
    balance DECIMAL(10,3),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_mo_status ON manufacturing_orders(mo_status);
CREATE INDEX IF NOT EXISTS idx_wo_status ON work_orders(wo_status);
CREATE INDEX IF NOT EXISTS idx_stock_product_location ON stock_balances(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON stock_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_audit_table_record ON audit_trail(table_name, record_id);

-- INSERT MASTER DATA
-- Insert default roles
INSERT INTO roles (role_name, permissions) VALUES
('admin', '{"all": true}'),
('manager', '{"manufacturing": true, "inventory": true, "reports": true}'),
('operator', '{"work_orders": true, "quality": true}'),
('inventory', '{"inventory": true, "stock": true}')
ON CONFLICT (role_name) DO NOTHING;

-- Insert product categories
INSERT INTO product_categories (category_name) VALUES
('Raw Materials'),
('Finished Goods'),
('Semi-Finished'),
('Consumables')
ON CONFLICT (category_name) DO NOTHING;

-- Insert warehouses
INSERT INTO warehouses (warehouse_code, warehouse_name, address) VALUES
('WH001', 'Main Warehouse', '123 Industrial Ave'),
('WH002', 'Production Floor', '123 Industrial Ave - Floor 2')
ON CONFLICT (warehouse_code) DO NOTHING;

-- Insert stock locations
INSERT INTO stock_locations (location_code, location_name, warehouse_id, location_type) VALUES
('RM001', 'Raw Material Store', 1, 'raw_material'),
('FG001', 'Finished Goods Store', 1, 'finished_goods'),
('WIP001', 'Work in Progress', 2, 'wip'),
('QC001', 'Quality Control Hold', 1, 'quality_hold'),
('SCRAP001', 'Scrap Area', 1, 'scrap')
ON CONFLICT (location_code) DO NOTHING;

-- Insert sample products
INSERT INTO products (product_code, product_name, category_id, product_type, uom, standard_cost, reorder_level, max_stock_level) VALUES
('FG001', 'Wooden Table', 2, 'finished_good', 'pcs', 150.00, 5, 50),
('FG002', 'Office Chair', 2, 'finished_good', 'pcs', 75.00, 10, 100),
('FG003', 'Wooden Desk', 2, 'finished_good', 'pcs', 200.00, 3, 30),
('RM001', 'Wood Leg', 1, 'raw_material', 'pcs', 15.00, 20, 200),
('RM002', 'Wood Top', 1, 'raw_material', 'pcs', 50.00, 10, 100),
('RM003', 'Screws', 1, 'raw_material', 'pcs', 0.50, 100, 1000),
('RM004', 'Varnish', 1, 'raw_material', 'ltr', 25.00, 5, 50)
ON CONFLICT (product_code) DO NOTHING;

-- Insert work centers
INSERT INTO work_centers (work_center_code, work_center_name, capacity_per_day, cost_per_hour) VALUES
('WC001', 'Assembly Line 1', 16.0, 50.00),
('WC002', 'Paint Booth', 8.0, 75.00),
('WC003', 'Packaging Station', 24.0, 30.00),
('WC004', 'Quality Check', 16.0, 40.00)
ON CONFLICT (work_center_code) DO NOTHING;

-- Insert number series
INSERT INTO number_series (series_name, prefix, current_number, padding_zeros) VALUES
('manufacturing_order', 'MO', 1, 6),
('work_order', 'WO', 1, 6),
('bom', 'BOM', 1, 4)
ON CONFLICT (series_name) DO NOTHING;

-- Insert sample users (admin user for testing)
INSERT INTO users (username, email, password_hash, role_id) VALUES
('admin', 'adarsh@gmail.com', '$2b$12$IdVphUlJAiq87VXxJktCg.KXxjTxZBBIlkrN8roHrisJU48ZbfiZK', 1),
('manager1', 'tejas@gmail.com', '$2b$12$IdVphUlJAiq87VXxJktCg.KXxjTxZBBIlkrN8roHrisJU48ZbfiZK', 2),
('operator1', 'vaishnavi@gmail.com', '$2b$12$IdVphUlJAiq87VXxJktCg.KXxjTxZBBIlkrN8roHrisJU48ZbfiZK', 3)
ON CONFLICT (username) DO NOTHING;

-- Insert sample BOM headers (fix product_id references)
INSERT INTO bom_header (bom_code, product_id, quantity) VALUES
('BOM0001', 1, 1.0),  -- Wooden Table
('BOM0002', 2, 1.0)   -- Office Chair
ON CONFLICT (bom_code) DO NOTHING;

-- Insert BOM components for Wooden Table (fix product_id references)
INSERT INTO bom_components (bom_id, product_id, quantity_required, operation_sequence) VALUES
(1, 4, 4.0, 10),   -- 4 Wood Legs (product_id 4)
(1, 5, 1.0, 20),   -- 1 Wood Top (product_id 5)
(1, 6, 12.0, 30),  -- 12 Screws (product_id 6)
(1, 7, 0.5, 40);   -- 0.5 ltr Varnish (product_id 7)

-- Insert BOM components for Office Chair (fix product_id references)
INSERT INTO bom_components (bom_id, product_id, quantity_required, operation_sequence) VALUES
(2, 4, 4.0, 10),   -- 4 Wood Legs (product_id 4)
(2, 5, 1.0, 20),   -- 1 Wood Top (product_id 5)
(2, 6, 8.0, 30),   -- 8 Screws (product_id 6)
(2, 7, 0.3, 40);   -- 0.3 ltr Varnish (product_id 7)

-- Insert sample manufacturing orders
INSERT INTO manufacturing_orders (mo_number, product_id, bom_id, planned_quantity, planned_start_date, planned_completion_date, mo_status, created_by) VALUES
('MO000001', 1, 1, 10.0, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'draft', 1),
('MO000002', 2, 2, 15.0, CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'released', 1)
ON CONFLICT (mo_number) DO NOTHING;

-- Insert sample work orders
INSERT INTO work_orders (wo_number, mo_id, work_center_id, operation_name, sequence_number, assigned_to, wo_status) VALUES
('WO000001', 1, 1, 'Assembly', 10, 3, 'pending'),
('WO000002', 1, 2, 'Painting', 20, 3, 'pending'),
('WO000003', 2, 1, 'Assembly', 10, 3, 'ready'),
('WO000004', 2, 3, 'Packaging', 30, 3, 'pending')
ON CONFLICT (wo_number) DO NOTHING;

-- Insert initial stock balances (fix product_id and location_id references)
INSERT INTO stock_balances (product_id, location_id, available_quantity) VALUES
(4, 1, 150.0), -- Wood Legs in Raw Material Store
(5, 1, 80.0),  -- Wood Tops in Raw Material Store
(6, 1, 500.0), -- Screws in Raw Material Store
(7, 1, 20.0),  -- Varnish in Raw Material Store
(1, 2, 0.0),   -- Wooden Table in Finished Goods Store
(2, 2, 0.0),   -- Office Chair in Finished Goods Store
(3, 2, 0.0);   -- Wooden Desk in Finished Goods Store

-- Insert sample stock transactions
INSERT INTO stock_transactions (product_id, location_id, transaction_type, quantity, reference_type, reference_number, created_by) VALUES
(4, 1, 'RECEIPT', 150.0, 'PURCHASE', 'PO001', 1),
(5, 1, 'RECEIPT', 80.0, 'PURCHASE', 'PO002', 1),
(6, 1, 'RECEIPT', 500.0, 'PURCHASE', 'PO003', 1),
(7, 1, 'RECEIPT', 20.0, 'PURCHASE', 'PO004', 1);

-- Insert sample quality control plans
INSERT INTO qc_plans (plan_name, product_id, inspection_type, sampling_size) VALUES
('Incoming Wood Inspection', 4, 'incoming', 5),
('Final Product Quality Check', 1, 'final', 2),
('Paint Quality Check', 2, 'in_process', 1)
ON CONFLICT DO NOTHING;