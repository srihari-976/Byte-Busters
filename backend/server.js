const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
const manufacturingRoutes = require('./manufacturing-api');
const mockDataRoutes = require('./mock-data-api');
const StockReservationSystem = require('./reservation-system');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'manufacturing_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

const JWT_SECRET = process.env.JWT_SECRET || 'manufacturing-erp-secret-key-2024-secure';

// Initialize reservation system
let reservationSystem;

// Middleware to attach pool to request
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Use manufacturing routes
app.use('/api', manufacturingRoutes);

// Use mock data routes
app.use('/api', mockDataRoutes);

// Seed sample data
const seedSampleData = async () => {
  try {
    // Check if data already exists
    const existingProducts = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(existingProducts.rows[0].count) > 0) {
      console.log('✅ Sample data already exists');
      return;
    }

    console.log('🌱 Seeding sample data...');

    // Insert sample products
    await pool.query(`
      INSERT INTO products (product_code, product_name, product_type, uom, standard_cost, reorder_level, max_stock_level, current_stock) VALUES
      ('FG001', 'Wooden Table', 'finished_good', 'pcs', 150.00, 5, 50, 25),
      ('FG002', 'Office Chair', 'finished_good', 'pcs', 120.00, 10, 100, 45),
      ('FG003', 'Wooden Desk', 'finished_good', 'pcs', 200.00, 3, 30, 15),
      ('RM001', 'Wood Leg', 'raw_material', 'pcs', 15.00, 20, 200, 150),
      ('RM002', 'Wood Top', 'raw_material', 'pcs', 50.00, 10, 100, 80),
      ('RM003', 'Screws', 'raw_material', 'pcs', 0.50, 100, 1000, 500),
      ('RM004', 'Varnish', 'raw_material', 'ltr', 25.00, 5, 50, 20)
      ON CONFLICT (product_code) DO NOTHING
    `);

    // Insert sample work centers
    await pool.query(`
      INSERT INTO work_centers (name, type, capacity, cost_per_hour) VALUES
      ('Assembly Line 1', 'machine', 2, 50.00),
      ('Paint Station', 'workshop', 1, 30.00),
      ('Quality Control', 'team', 3, 40.00),
      ('Packaging Unit', 'machine', 4, 25.00)
      ON CONFLICT (name) DO NOTHING
    `);

    // Insert sample manufacturing orders
    await pool.query(`
      INSERT INTO manufacturing_orders (mo_number, product_id, quantity, start_date, end_date, status) VALUES
      ('MO001', 1, 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'planned'),
      ('MO002', 2, 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '5 days', 'in_progress'),
      ('MO003', 3, 8, CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '3 days', 'completed')
      ON CONFLICT (mo_number) DO NOTHING
    `);

    // Insert BOM data
    await pool.query(`
      INSERT INTO bom (product_id, component_id, quantity, operation, duration_min) VALUES
      (1, 4, 4, 'Assembly', 60),
      (1, 5, 1, 'Assembly', 15),
      (1, 6, 12, 'Assembly', 10),
      (1, 7, 0.5, 'Painting', 30),
      (2, 4, 4, 'Assembly', 45),
      (2, 6, 8, 'Assembly', 15),
      (2, 7, 0.3, 'Painting', 25)
    `);

    // Insert work orders
    await pool.query(`
      INSERT INTO work_orders (wo_number, mo_id, step_name, work_center_id, status) VALUES
      ('WO001', 1, 'Assembly', 1, 'planned'),
      ('WO002', 1, 'Painting', 2, 'planned'),
      ('WO003', 2, 'Assembly', 1, 'in_progress'),
      ('WO004', 3, 'Quality Check', 3, 'completed')
      ON CONFLICT (wo_number) DO NOTHING
    `);

    // Insert stock ledger
    await pool.query(`
      INSERT INTO stock_ledger (product_id, transaction_type, quantity, balance, reference_type, reference_id) VALUES
      (4, 'in', 150, 150, 'manual', 0),
      (5, 'in', 80, 80, 'manual', 0),
      (6, 'in', 500, 500, 'manual', 0),
      (7, 'in', 20, 20, 'manual', 0)
    `);

    console.log('✅ Sample data seeded successfully');
    console.log('✅ Database ready with sample products, work centers, and BOM data');
  } catch (error) {
    console.error(' Error seeding sample data:', error);
  }
};

// Initialize database tables
const initDB = async () => {
  // Create UUID extension
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  // Roles table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS roles (
      role_id SERIAL PRIMARY KEY,
      name VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default roles
  await pool.query(`
    INSERT INTO roles (name, description) VALUES
    ('admin', 'Full system access, reports, user management'),
    ('manager', 'Manufacturing orders, work orders, analytics'),
    ('operator', 'Work order execution, status updates'),
    ('inventory', 'Stock management, inventory tracking')
    ON CONFLICT (name) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'operator',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);
  
  // Add role_id column if it doesn't exist
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id INTEGER REFERENCES roles(role_id) DEFAULT 3`);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS otp_verification (
      otp_id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(user_id),
      otp_code VARCHAR(6),
      expiry_time TIMESTAMP,
      used BOOLEAN DEFAULT FALSE
    )
  `);

  // User Settings table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
      settings JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      product_id SERIAL PRIMARY KEY,
      product_code VARCHAR(50) UNIQUE,
      product_name VARCHAR(200) NOT NULL,
      product_type VARCHAR(20) DEFAULT 'finished_good',
      uom VARCHAR(20) DEFAULT 'pcs',
      standard_cost DECIMAL(10,2) DEFAULT 0,
      reorder_level DECIMAL(10,3) DEFAULT 10,
      max_stock_level DECIMAL(10,3) DEFAULT 100,
      current_stock DECIMAL(10,3) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Work Centers table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_centers (
      wc_id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) DEFAULT 'machine',
      capacity INTEGER DEFAULT 1,
      cost_per_hour DECIMAL(10,2) DEFAULT 0,
      downtime_hours INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Manufacturing Orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS manufacturing_orders (
      mo_id SERIAL PRIMARY KEY,
      mo_number VARCHAR(20) UNIQUE NOT NULL,
      product_id INTEGER REFERENCES products(product_id),
      quantity INTEGER NOT NULL,
      start_date DATE,
      end_date DATE,
      assignee_id INTEGER REFERENCES users(user_id),
      status VARCHAR(20) DEFAULT 'planned',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Bills of Materials table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bom (
      bom_id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(product_id),
      component_id INTEGER REFERENCES products(product_id),
      quantity DECIMAL(10,3) NOT NULL,
      operation VARCHAR(100),
      duration_min INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Work Orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS work_orders (
      wo_id SERIAL PRIMARY KEY,
      wo_number VARCHAR(20) UNIQUE NOT NULL,
      mo_id INTEGER REFERENCES manufacturing_orders(mo_id),
      step_name VARCHAR(100) NOT NULL,
      assignee_id INTEGER REFERENCES users(user_id),
      work_center_id INTEGER REFERENCES work_centers(wc_id),
      status VARCHAR(20) DEFAULT 'planned',
      start_time TIMESTAMP,
      end_time TIMESTAMP,
      comments TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Enhanced Stock Ledger table (Phase 3)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_ledger (
      ledger_id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(product_id),
      txn_type VARCHAR(20) NOT NULL, -- IN, OUT, ADJUST, RESERVED
      quantity DECIMAL(10,3) NOT NULL,
      balance_after DECIMAL(10,3) NOT NULL,
      reference_type VARCHAR(20), -- MO, WO, MANUAL, ADJUSTMENT
      reference_id INTEGER,
      user_id INTEGER REFERENCES users(user_id),
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Legacy compatibility - add transaction_type column if it exists
  await pool.query(`ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(20)`);
  await pool.query(`ALTER TABLE stock_ledger ADD COLUMN IF NOT EXISTS balance DECIMAL(10,3)`);

  // Product Master enhancement
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS min_qty DECIMAL(10,3) DEFAULT 10`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS max_qty DECIMAL(10,3) DEFAULT 100`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7`);
  await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS current_stock DECIMAL(10,3) DEFAULT 0`);

  // Stock Alerts table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_alerts (
      alert_id SERIAL PRIMARY KEY,
      product_id INTEGER REFERENCES products(product_id),
      alert_type VARCHAR(20), -- LOW_STOCK, OUT_OF_STOCK, OVERSTOCK
      threshold_value DECIMAL(10,3),
      current_value DECIMAL(10,3),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Stock Reservations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS stock_reservations (
      reservation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id INTEGER REFERENCES products(product_id),
      qty DECIMAL(10,3) NOT NULL,
      unit VARCHAR(16) NOT NULL,
      ref_type VARCHAR(32) NOT NULL,
      ref_id INTEGER NOT NULL,
      reserved_by INTEGER REFERENCES users(user_id),
      status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMMITTED','RELEASED')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  // Inventory Snapshot table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_snapshot (
      product_id INTEGER PRIMARY KEY REFERENCES products(product_id),
      available_qty DECIMAL(10,3) DEFAULT 0,
      reserved_qty DECIMAL(10,3) DEFAULT 0,
      last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  // Enhanced Audit Log table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id INTEGER REFERENCES users(user_id),
      action VARCHAR(128),
      details JSONB,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )
  `);

  // Initialize reservation system
  reservationSystem = new StockReservationSystem(pool);
  
  // Fix existing users role_id
  await pool.query(`
    UPDATE users SET role_id = (
      SELECT role_id FROM roles WHERE name = users.role
    ) WHERE role_id IS NULL OR role_id = 3
  `);
  
  // Create sample admin user if not exists
  const adminExists = await pool.query('SELECT COUNT(*) FROM users WHERE email = $1', ['admin@example.com']);
  if (parseInt(adminExists.rows[0].count) === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING',
      ['admin', 'admin@example.com', hashedPassword, 1]
    );
    console.log('✅ Admin user created: admin@example.com / admin123');
  }
  
  // Seed sample data
  await seedSampleData();
};

// Input validation helper
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password && password.length >= 8;
};

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password, role = 'operator' } = req.body;
    
    // Input validation
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Get role_id from roles table
    const roleResult = await pool.query('SELECT role_id FROM roles WHERE name = $1', [role]);
    if (roleResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }
    const role_id = roleResult.rows[0].role_id;
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email',
      [username, email, hashedPassword, role_id]
    );
    
    const token = jwt.sign({ userId: result.rows[0].user_id, role }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { ...result.rows[0], role } });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(`
      SELECT * FROM users WHERE email = $1
    `, [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
    
    // Get role name from roles table
    const roleResult = await pool.query('SELECT name FROM roles WHERE role_id = $1', [user.role_id]);
    const roleName = roleResult.rows[0]?.name || 'operator';
    
    const token = jwt.sign({ userId: user.user_id, role: roleName }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { user_id: user.user_id, username: user.username, email: user.email, role: roleName } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset Password - Send OTP
app.post('/api/reset-password', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    const user = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await pool.query(
      'INSERT INTO otp_verification (user_id, otp_code, expiry_time) VALUES ($1, $2, $3)',
      [user.rows[0].user_id, otp, expiry]
    );
    
    // In development mode, show OTP in console
    if (process.env.NODE_ENV === 'development' || process.env.EMAIL_SERVICE === 'console') {
      console.log(`\n🔐 OTP CODE FOR ${email}: ${otp}\n`);
    } else {
      console.log(`OTP sent to ${email}`);
    }
    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and Reset Password
app.post('/api/verify-otp-reset', async (req, res) => {
  try {
    const { email, otp_code, new_password } = req.body;
    
    // Get user
    const user = await pool.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify OTP
    const otpResult = await pool.query(
      'SELECT * FROM otp_verification WHERE user_id = $1 AND otp_code = $2 AND expiry_time > NOW() AND used = FALSE ORDER BY created_at DESC LIMIT 1',
      [user.rows[0].user_id, otp_code]
    );
    
    if (otpResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [hashedPassword, user.rows[0].user_id]
    );
    
    // Mark OTP as used
    await pool.query(
      'UPDATE otp_verification SET used = TRUE WHERE otp_id = $1',
      [otpResult.rows[0].otp_id]
    );
    
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware for authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.sendStatus(401);
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// RBAC middleware
const checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Role-based filtering middleware
const filterByRole = (req, res, next) => {
  req.roleFilter = {
    isAdmin: req.user.role === 'admin',
    isManager: ['admin', 'manager'].includes(req.user.role),
    isOperator: req.user.role === 'operator',
    isInventory: req.user.role === 'inventory',
    userId: req.user.userId
  };
  next();
};

// Audit logging middleware
const auditLog = (action, tableName) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(data) {
      // Log the action
      pool.query(
        'INSERT INTO audit_logs (user_id, action, table_name, record_id, new_values, ip_address, user_agent) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          req.user?.userId,
          action,
          tableName,
          req.params?.id || null,
          JSON.stringify(req.body || {}),
          req.ip,
          req.get('User-Agent')
        ]
      ).catch(err => console.error('Audit log error:', err));
      
      originalSend.call(this, data);
    };
    next();
  };
};

// Manufacturing Orders API
app.get('/api/manufacturing-orders', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mo.*, p.product_name as product_name, u.username as assignee_name
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.product_id
      LEFT JOIN users u ON mo.assignee_id = u.user_id
      ORDER BY mo.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/manufacturing-orders', authenticateToken, checkPermission(['admin', 'manager']), auditLog('CREATE', 'manufacturing_orders'), async (req, res) => {
  try {
    const { mo_number, product_id, quantity, start_date, end_date, assignee_id } = req.body;
    const result = await pool.query(
      'INSERT INTO manufacturing_orders (mo_number, product_id, quantity, start_date, end_date, assignee_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [mo_number, product_id, quantity, start_date, end_date, assignee_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/manufacturing-orders/:id', authenticateToken, checkPermission(['admin', 'manager']), auditLog('UPDATE', 'manufacturing_orders'), async (req, res) => {
  try {
    const { id } = req.params;
    const { mo_number, product_id, quantity, start_date, end_date, assignee_id, status } = req.body;
    
    let query, params;
    if (status) {
      // Status update only
      query = 'UPDATE manufacturing_orders SET status = $1, end_date = $2, updated_at = CURRENT_TIMESTAMP WHERE mo_id = $3 RETURNING *';
      params = [status, end_date, id];
    } else {
      // Full update
      query = `UPDATE manufacturing_orders SET 
        mo_number = $1, product_id = $2, quantity = $3, start_date = $4, end_date = $5, assignee_id = $6, updated_at = CURRENT_TIMESTAMP 
        WHERE mo_id = $7 RETURNING *`;
      params = [mo_number, product_id, quantity, start_date, end_date, assignee_id, id];
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/manufacturing-orders/:id', authenticateToken, checkPermission(['admin', 'manager']), auditLog('DELETE', 'manufacturing_orders'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are associated work orders
    const woCheck = await pool.query('SELECT COUNT(*) FROM work_orders WHERE mo_id = $1', [id]);
    if (parseInt(woCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete Manufacturing Order with associated Work Orders' });
    }
    
    const result = await pool.query(
      'DELETE FROM manufacturing_orders WHERE mo_id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Manufacturing Order not found' });
    }
    
    res.json({ success: true, deleted_order: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work Orders API
app.get('/api/work-orders', authenticateToken, filterByRole, async (req, res) => {
  try {
    const { mo_id } = req.query;
    let query = `
      SELECT wo.*, mo.mo_number, wc.name as work_center_name, u.username as assignee_name
      FROM work_orders wo
      LEFT JOIN manufacturing_orders mo ON wo.mo_id = mo.mo_id
      LEFT JOIN work_centers wc ON wo.work_center_id = wc.wc_id
      LEFT JOIN users u ON wo.assignee_id = u.user_id
    `;
    const params = [];
    let whereConditions = [];
    
    if (mo_id) {
      whereConditions.push(`wo.mo_id = $${params.length + 1}`);
      params.push(mo_id);
    }
    
    // Operators can only see their assigned work orders
    if (req.roleFilter.isOperator) {
      whereConditions.push(`wo.assignee_id = $${params.length + 1}`);
      params.push(req.roleFilter.userId);
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    query += ' ORDER BY wo.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/work-orders', authenticateToken, checkPermission(['admin', 'manager']), auditLog('CREATE', 'work_orders'), async (req, res) => {
  try {
    const { wo_number, mo_id, step_name, assignee_id, work_center_id } = req.body;
    const result = await pool.query(
      'INSERT INTO work_orders (wo_number, mo_id, step_name, assignee_id, work_center_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [wo_number, mo_id, step_name, assignee_id, work_center_id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/work-orders/:id', authenticateToken, checkPermission(['admin', 'manager', 'operator']), auditLog('UPDATE', 'work_orders'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    let updateFields = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    let params = [status];
    
    if (status === 'in_progress') {
      updateFields.push('start_time = CURRENT_TIMESTAMP');
    } else if (status === 'completed') {
      updateFields.push('end_time = CURRENT_TIMESTAMP');
    }
    
    if (comments) {
      updateFields.push(`comments = $${params.length + 1}`);
      params.push(comments);
    }
    
    params.push(id);
    const result = await pool.query(
      `UPDATE work_orders SET ${updateFields.join(', ')} WHERE wo_id = $${params.length} RETURNING *`,
      params
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BOM API
app.get('/api/bom/:product_id', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { product_id } = req.params;
    const { mo_quantity } = req.query;
    const result = await pool.query(`
      SELECT b.*, p.name as component_name, p.unit, p.cost,
             CASE WHEN $2::integer IS NOT NULL THEN b.quantity * $2::integer ELSE b.quantity END as required_quantity,
             'available' as availability_status
      FROM bom b
      LEFT JOIN products p ON b.component_id = p.product_id
      WHERE b.product_id = $1
      ORDER BY b.operation, b.bom_id
    `, [product_id, mo_quantity]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bom', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { product_id, component_id, quantity, operation, duration_min } = req.body;
    const result = await pool.query(
      'INSERT INTO bom (product_id, component_id, quantity, operation, duration_min) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_id, component_id, quantity, operation, duration_min]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work Centers API
app.get('/api/work-centers', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT wc.*, 
             COUNT(wo.wo_id) as active_work_orders,
             AVG(EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600) as avg_completion_hours
      FROM work_centers wc
      LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id AND wo.status IN ('in_progress', 'planned')
      GROUP BY wc.wc_id
      ORDER BY wc.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/work-centers', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { name, type, capacity, cost_per_hour } = req.body;
    const result = await pool.query(
      'INSERT INTO work_centers (name, type, capacity, cost_per_hour) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, capacity, cost_per_hour]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const { type } = req.query;
    let query = 'SELECT * FROM products';
    const params = [];
    if (type) {
      query += ' WHERE product_type = $1';
      params.push(type);
    }
    query += ' ORDER BY product_name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { product_code, product_name, product_type, uom, standard_cost, reorder_level, max_stock_level, current_stock } = req.body;
    const result = await pool.query(
      'INSERT INTO products (product_code, product_name, product_type, uom, standard_cost, reorder_level, max_stock_level, current_stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [product_code || 'P' + Date.now(), product_name, product_type, uom, standard_cost, reorder_level || 10, max_stock_level || 100, current_stock || 0]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Stock Ledger API (Phase 3)
app.get('/api/stock-ledger', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.name as product_name, p.type as product_type, p.unit as uom,
             COALESCE(p.current_stock, 0) as current_stock,
             p.min_qty as reorder_level, p.max_qty as max_stock_level,
             CASE 
               WHEN COALESCE(p.current_stock, 0) <= p.min_qty THEN 'LOW'
               WHEN COALESCE(p.current_stock, 0) = 0 THEN 'OUT'
               WHEN COALESCE(p.current_stock, 0) >= p.max_qty THEN 'HIGH'
               ELSE 'NORMAL'
             END as stock_status
      FROM products p
      WHERE p.type IN ('raw_material', 'finished_good', 'semi_finished')
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock transactions history
app.get('/api/stock-transactions/:product_id', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { product_id } = req.params;
    const result = await pool.query(`
      SELECT sl.*, u.username, p.name as product_name
      FROM stock_ledger sl
      LEFT JOIN users u ON sl.user_id = u.user_id
      LEFT JOIN products p ON sl.product_id = p.product_id
      WHERE sl.product_id = $1
      ORDER BY sl.created_at DESC
      LIMIT 50
    `, [product_id]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock adjustment API
app.post('/api/stock-adjust', authenticateToken, checkPermission(['admin', 'inventory']), auditLog('ADJUST', 'stock_ledger'), async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;
    const user_id = req.user.userId;
    
    // Get current stock
    const currentStock = await pool.query('SELECT current_stock FROM products WHERE product_id = $1', [product_id]);
    const current = currentStock.rows[0]?.current_stock || 0;
    const newBalance = parseFloat(current) + parseFloat(quantity);
    
    // Insert ledger entry
    await pool.query(`
      INSERT INTO stock_ledger (product_id, txn_type, quantity, balance_after, reference_type, user_id, notes)
      VALUES ($1, $2, $3, $4, 'MANUAL', $5, $6)
    `, [product_id, quantity > 0 ? 'IN' : 'OUT', Math.abs(quantity), newBalance, user_id, notes]);
    
    // Update product stock
    await pool.query('UPDATE products SET current_stock = $1 WHERE product_id = $2', [newBalance, product_id]);
    
    res.json({ success: true, new_balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced Stock Reservation APIs

// Reserve stock for work orders
app.post('/api/stock/reserve', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { product_id, qty, unit, ref_type, ref_id } = req.body;
    const { userId, role } = req.user;
    
    const result = await reservationSystem.reserveStock(product_id, qty, unit, ref_type, ref_id, userId, role);
    res.json(result);
  } catch (error) {
    console.error('Error reserving stock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Commit reservation (WO completion)
app.post('/api/stock/commit', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { reservation_id, finished_product_id, finished_qty } = req.body;
    const { userId, role } = req.user;
    
    const result = await reservationSystem.commitReservation(reservation_id, finished_product_id, finished_qty, userId, role);
    res.json(result);
  } catch (error) {
    console.error('Error committing stock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Release reservation (WO cancellation)
app.post('/api/stock/release', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { reservation_id, reason } = req.body;
    const { userId, role } = req.user;
    
    const result = await reservationSystem.releaseReservation(reservation_id, reason, userId, role);
    res.json(result);
  } catch (error) {
    console.error('Error releasing stock:', error);
    res.status(400).json({ error: error.message });
  }
});

// Stock adjustment
app.post('/api/stock/adjust', authenticateToken, checkPermission(['admin', 'inventory']), async (req, res) => {
  try {
    const { product_id, qty, unit, reason } = req.body;
    const { userId, role } = req.user;
    
    const result = await reservationSystem.adjustStock(product_id, qty, unit, reason, userId, role);
    res.json(result);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get enhanced stock levels with reservations
app.get('/api/stock/levels', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, 
             COALESCE(p.current_stock, 0) as available_qty,
             0 as reserved_qty,
             CASE 
               WHEN COALESCE(p.current_stock, 0) <= p.reorder_level THEN 'LOW'
               WHEN COALESCE(p.current_stock, 0) = 0 THEN 'OUT'
               WHEN COALESCE(p.current_stock, 0) >= p.max_stock_level THEN 'HIGH'
               ELSE 'NORMAL'
             END as stock_status
      FROM products p
      ORDER BY p.product_name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock ledger with full audit trail
app.get('/api/stock/ledger', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { product_id, limit = 50, offset = 0 } = req.query;
    
    let query = `
      SELECT sl.*, p.name as product_name, u.username as created_by_name
      FROM stock_ledger sl
      JOIN products p ON sl.product_id = p.product_id
      LEFT JOIN users u ON sl.user_id = u.user_id
    `;
    
    const params = [];
    if (product_id) {
      query += ' WHERE sl.product_id = $1';
      params.push(product_id);
    }
    
    query += ' ORDER BY sl.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active reservations
app.get('/api/stock/reservations', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sr.*, p.name as product_name, u.username as reserved_by_name
      FROM stock_reservations sr
      JOIN products p ON sr.product_id = p.product_id
      JOIN users u ON sr.reserved_by = u.user_id
      WHERE sr.status = 'ACTIVE'
      ORDER BY sr.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Inventory reconciliation
app.post('/api/stock/reconcile', authenticateToken, checkPermission(['admin']), async (req, res) => {
  try {
    const result = await reservationSystem.reconcileInventory();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock alerts API
app.get('/api/stock-alerts', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.product_id, p.name as product_name, 
             COALESCE(p.current_stock, 0) as current_stock, 
             p.min_qty as reorder_level, p.max_qty as max_stock_level,
             CASE 
               WHEN COALESCE(p.current_stock, 0) <= p.min_qty THEN 'LOW_STOCK'
               WHEN COALESCE(p.current_stock, 0) = 0 THEN 'OUT_OF_STOCK'
               ELSE 'OVERSTOCK'
             END as alert_type
      FROM products p
      WHERE COALESCE(p.current_stock, 0) <= p.min_qty 
         OR COALESCE(p.current_stock, 0) >= p.max_qty
      ORDER BY COALESCE(p.current_stock, 0) ASC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics API - Role-based insights
app.get('/api/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const role = req.user.role;
    let analytics = {};

    if (role === 'admin' || role === 'manager') {
      // Overall KPIs
      const moStats = await pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
          COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned
        FROM manufacturing_orders
      `);
      
      const efficiency = await pool.query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_completion_hours
        FROM work_orders 
        WHERE status = 'completed' AND start_time IS NOT NULL AND end_time IS NOT NULL
      `);
      
      analytics = {
        orders: moStats.rows[0],
        efficiency: efficiency.rows[0]?.avg_completion_hours || 0,
        role_type: 'management'
      };
    }
    
    if (role === 'operator') {
      // Operator-specific metrics
      const myTasks = await pool.query(`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as active_tasks
        FROM work_orders 
        WHERE assignee_id = $1
      `, [req.user.userId]);
      
      analytics = {
        tasks: myTasks.rows[0],
        role_type: 'operator'
      };
    }
    
    if (role === 'inventory') {
      // Inventory-specific metrics
      const stockStatus = await pool.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(CASE WHEN balance < 10 THEN 1 END) as low_stock_items
        FROM (
          SELECT DISTINCT ON (product_id) product_id, balance
          FROM stock_ledger
          ORDER BY product_id, created_at DESC
        ) latest_stock
      `);
      
      analytics = {
        stock: stockStatus.rows[0],
        role_type: 'inventory'
      };
    }
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Users API
app.get('/api/users', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.username, u.email, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      ORDER BY u.username
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', authenticateToken, checkPermission(['admin']), async (req, res) => {
  try {
    const { username, email, password, role_id } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email',
      [username, email, hashedPassword, role_id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Roles API
app.get('/api/roles', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM roles ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to verify database connection
app.get('/api/test/connection', async (req, res) => {
  try {
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const productCount = await pool.query('SELECT COUNT(*) FROM products');
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const moCount = await pool.query('SELECT COUNT(*) FROM manufacturing_orders');
    
    res.json({
      status: 'connected',
      tables: tables.rows.map(r => r.table_name),
      counts: {
        products: productCount.rows[0].count,
        users: userCount.rows[0].count,
        manufacturing_orders: moCount.rows[0].count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message, status: 'error' });
  }
});

// User Settings API
app.get('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT settings FROM user_settings WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (result.rows.length === 0) {
      // Return default settings
      const defaultSettings = {
        notifications: {
          manufacturingOrders: true,
          stockAlerts: true,
          workOrderAssignments: true
        },
        system: {
          currency: 'USD',
          dateFormat: 'MM/DD/YYYY',
          timeZone: 'UTC',
          language: 'English'
        },
        appearance: {
          theme: 'light',
          sidebarPosition: 'Left'
        }
      };
      return res.json(defaultSettings);
    }
    
    res.json(result.rows[0].settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/user/settings', authenticateToken, async (req, res) => {
  try {
    const settings = req.body;
    
    // Upsert user settings
    await pool.query(`
      INSERT INTO user_settings (user_id, settings, updated_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id)
      DO UPDATE SET settings = $2, updated_at = CURRENT_TIMESTAMP
    `, [req.user.userId, JSON.stringify(settings)]);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get current user
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE user_id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE user_id = $2',
      [hashedPassword, req.user.userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.user_id, u.username, u.email, r.name as role
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.role_id
      WHERE u.user_id = $1
    `, [req.user.userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Audit Logs API (Admin only)
app.get('/api/audit-logs', authenticateToken, checkPermission(['admin']), async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT al.*, u.username, u.email
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.user_id
      ORDER BY al.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Quality Control APIs
app.get('/api/quality-inspections', authenticateToken, async (req, res) => {
  res.json([]);
});

app.get('/api/qc-plans', authenticateToken, async (req, res) => {
  res.json([]);
});

app.get('/api/stock-transactions', authenticateToken, async (req, res) => {
  res.json([]);
});

initDB().then(() => {
  app.listen(3001, () => {
    console.log('🚀 Manufacturing API Server running on port 3001');
    console.log('📋 Available endpoints:');
    console.log('   - Authentication: /api/login, /api/register, /api/reset-password, /api/verify-otp-reset');
    console.log('   - Manufacturing Orders: /api/manufacturing-orders');
    console.log('   - Work Orders: /api/work-orders');
    console.log('   - BOM: /api/bom');
    console.log('   - Work Centers: /api/work-centers');
    console.log('   - Products: /api/products');
    console.log('   - Stock Management: /api/stock-ledger, /api/stock-alerts');
  });
});