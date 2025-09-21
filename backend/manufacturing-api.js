const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware for authentication and role checking
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

const checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// User Profile API
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT u.user_id, u.username, u.email, u.role_id, r.name as role_name, u.role
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

// Manufacturing Orders API
router.get('/manufacturing-orders', authenticateToken, async (req, res) => {
  try {
    const { status, assignee_id } = req.query;
    let query = `
      SELECT mo.*, p.name as product_name, p.unit as uom, u.username as assignee_name,
             COALESCE(bom_summary.total_components, 0) as components_count,
             COALESCE(wo_summary.total_work_orders, 0) as work_orders_count,
             COALESCE(wo_summary.completed_work_orders, 0) as completed_work_orders
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.product_id
      LEFT JOIN users u ON mo.assignee_id = u.user_id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as total_components
        FROM bom GROUP BY product_id
      ) bom_summary ON mo.product_id = bom_summary.product_id
      LEFT JOIN (
        SELECT mo_id, 
               COUNT(*) as total_work_orders,
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_work_orders
        FROM work_orders GROUP BY mo_id
      ) wo_summary ON mo.mo_id = wo_summary.mo_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (status) {
      conditions.push(`mo.status = $${params.length + 1}`);
      params.push(status);
    }
    
    if (assignee_id) {
      conditions.push(`mo.assignee_id = $${params.length + 1}`);
      params.push(assignee_id);
    }
    
    // Role-based filtering
    if (req.user.role === 'operator') {
      conditions.push(`mo.assignee_id = $${params.length + 1}`);
      params.push(req.user.userId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY mo.created_at DESC';
    
    const result = await req.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/manufacturing-orders', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { mo_number, product_id, quantity, start_date, end_date, assignee_id } = req.body;
    
    // Check if BOM exists for the product
    const bomCheck = await req.pool.query('SELECT COUNT(*) FROM bom WHERE product_id = $1', [product_id]);
    if (parseInt(bomCheck.rows[0].count) === 0) {
      return res.status(400).json({ error: 'No BOM found for this product' });
    }
    
    const result = await req.pool.query(
      'INSERT INTO manufacturing_orders (mo_number, product_id, quantity, start_date, end_date, assignee_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [mo_number, product_id, quantity, start_date, end_date, assignee_id]
    );
    
    // Auto-create work orders based on BOM operations
    const bomOperations = await req.pool.query(`
      SELECT DISTINCT operation, SUM(duration_min) as total_duration
      FROM bom WHERE product_id = $1 
      GROUP BY operation ORDER BY operation
    `, [product_id]);
    
    for (let i = 0; i < bomOperations.rows.length; i++) {
      const op = bomOperations.rows[i];
      const woNumber = `${mo_number}-WO${String(i + 1).padStart(3, '0')}`;
      
      await req.pool.query(`
        INSERT INTO work_orders (wo_number, mo_id, step_name, work_center_id, status)
        VALUES ($1, $2, $3, $4, 'planned')
      `, [woNumber, result.rows[0].mo_id, op.operation, 1]); // Default to work center 1
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/manufacturing-orders/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check permissions based on status change
    if (status === 'completed' && !['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Only managers can complete manufacturing orders' });
    }
    
    const result = await req.pool.query(
      'UPDATE manufacturing_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE mo_id = $2 RETURNING *',
      [status, id]
    );
    
    // Emit event for AI processing
    if (status === 'confirmed') {
      const EventWorker = require('./event-worker');
      const worker = new EventWorker();
      await worker.processEvent({
        type: 'mo.confirmed',
        mo_id: id,
        request_id: `mo_${id}_${Date.now()}`
      });
    }
    
    // If completing, update stock levels
    if (status === 'completed') {
      const mo = result.rows[0];
      await req.pool.query(`
        INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id, balance)
        SELECT $1, 'in', $2, 'mo', $3, 
               COALESCE((SELECT current_stock FROM products WHERE product_id = $1), 0) + $2
      `, [mo.product_id, mo.quantity, mo.mo_id]);
      
      await req.pool.query(
        'UPDATE products SET current_stock = current_stock + $1 WHERE product_id = $2',
        [mo.quantity, mo.product_id]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work Orders API
router.get('/work-orders', authenticateToken, async (req, res) => {
  try {
    const { mo_id, status } = req.query;
    let query = `
      SELECT wo.*, mo.mo_number, mo.product_id, p.name as product_name,
             wc.name as work_center_name, u.username as assignee_name,
             EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600 as duration_hours
      FROM work_orders wo
      LEFT JOIN manufacturing_orders mo ON wo.mo_id = mo.mo_id
      LEFT JOIN products p ON mo.product_id = p.product_id
      LEFT JOIN work_centers wc ON wo.work_center_id = wc.wc_id
      LEFT JOIN users u ON wo.assignee_id = u.user_id
    `;
    
    const params = [];
    const conditions = [];
    
    if (mo_id) {
      conditions.push(`wo.mo_id = $${params.length + 1}`);
      params.push(mo_id);
    }
    
    if (status) {
      conditions.push(`wo.status = $${params.length + 1}`);
      params.push(status);
    }
    
    // Operators can only see their assigned work orders
    if (req.user.role === 'operator') {
      conditions.push(`wo.assignee_id = $${params.length + 1}`);
      params.push(req.user.userId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY wo.created_at DESC';
    
    const result = await req.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/work-orders/:id/status', authenticateToken, async (req, res) => {
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
    const result = await req.pool.query(
      `UPDATE work_orders SET ${updateFields.join(', ')} WHERE wo_id = $${params.length} RETURNING *`,
      params
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// BOM API
router.get('/bom/:product_id', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.params;
    const { mo_quantity } = req.query;
    
    const result = await req.pool.query(`
      SELECT b.*, p.name as component_name, p.unit as uom, p.cost as standard_cost,
             CASE WHEN $2 IS NOT NULL THEN b.quantity * $2 ELSE b.quantity END as required_quantity,
             'available' as availability_status
      FROM bom b
      LEFT JOIN products p ON b.component_id = p.product_id
      WHERE b.product_id = $1
      ORDER BY b.operation, b.bom_id
    `, [product_id, mo_quantity || null]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/bom', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { product_id, component_id, quantity, operation, duration_min } = req.body;
    
    const result = await req.pool.query(
      'INSERT INTO bom (product_id, component_id, quantity, operation, duration_min) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [product_id, component_id, quantity, operation, duration_min]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Work Centers API
router.get('/work-centers', authenticateToken, async (req, res) => {
  try {
    const result = await req.pool.query(`
      SELECT wc.*, 
             COUNT(wo.wo_id) as active_work_orders,
             COALESCE(AVG(EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600), 0) as avg_completion_hours
      FROM work_centers wc
      LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id AND wo.status IN ('planned', 'in_progress')
      GROUP BY wc.wc_id
      ORDER BY wc.name
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/work-centers', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { name, type, capacity, cost_per_hour } = req.body;
    
    const result = await req.pool.query(
      'INSERT INTO work_centers (name, type, capacity, cost_per_hour) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, type, capacity, cost_per_hour]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products API
router.get('/products', async (req, res) => {
  try {
    const { type } = req.query;
    let query = `
      SELECT p.*, 
             COALESCE(p.current_stock, 0) as current_stock,
             CASE 
               WHEN COALESCE(p.current_stock, 0) <= p.min_qty THEN 'low'
               WHEN COALESCE(p.current_stock, 0) = 0 THEN 'out'
               WHEN COALESCE(p.current_stock, 0) >= p.max_qty THEN 'high'
               ELSE 'normal'
             END as stock_status
      FROM products p
    `;
    
    const params = [];
    if (type) {
      query += ' WHERE p.type = $1';
      params.push(type);
    }
    
    query += ' ORDER BY p.product_name';
    
    const result = await req.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/products', async (req, res) => {
  try {
    const { name, type, unit, cost, min_qty, max_qty, current_stock } = req.body;
    
    const result = await req.pool.query(
      'INSERT INTO products (name, type, unit, cost, min_qty, max_qty, current_stock) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, type, unit, cost, min_qty || 10, max_qty || 100, current_stock || 0]
    );
    
    // Create initial stock ledger entry
    if (current_stock > 0) {
      await req.pool.query(
        'INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, balance) VALUES ($1, $2, $3, $4, $5)',
        [result.rows[0].product_id, 'in', current_stock, 'manual', current_stock]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock Ledger API
router.get('/stock-ledger', authenticateToken, checkPermission(['admin', 'manager', 'inventory']), async (req, res) => {
  try {
    const { product_id } = req.query;
    
    let query = `
      SELECT sl.*, p.name as product_name, p.unit, u.username as user_name
      FROM stock_ledger sl
      LEFT JOIN products p ON sl.product_id = p.product_id
      LEFT JOIN users u ON sl.user_id = u.user_id
    `;
    
    const params = [];
    if (product_id) {
      query += ' WHERE sl.product_id = $1';
      params.push(product_id);
    }
    
    query += ' ORDER BY sl.created_at DESC LIMIT 100';
    
    const result = await req.pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stock-adjust', authenticateToken, checkPermission(['admin', 'inventory']), async (req, res) => {
  try {
    const { product_id, quantity, notes } = req.body;
    const user_id = req.user.userId;
    
    // Get current stock
    const currentStock = await req.pool.query('SELECT current_stock FROM products WHERE product_id = $1', [product_id]);
    const current = currentStock.rows[0]?.current_stock || 0;
    const newBalance = parseFloat(current) + parseFloat(quantity);
    
    if (newBalance < 0) {
      return res.status(400).json({ error: 'Insufficient stock for adjustment' });
    }
    
    // Insert ledger entry
    await req.pool.query(`
      INSERT INTO stock_ledger (product_id, transaction_type, quantity, reference_type, reference_id, balance, user_id, notes)
      VALUES ($1, $2, $3, 'manual', 0, $4, $5, $6)
    `, [product_id, quantity > 0 ? 'in' : 'out', Math.abs(quantity), newBalance, user_id, notes]);
    
    // Update product stock
    await req.pool.query('UPDATE products SET current_stock = $1 WHERE product_id = $2', [newBalance, product_id]);
    
    res.json({ success: true, new_balance: newBalance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public test endpoints (no auth required)
router.get('/test/alerts', async (req, res) => {
  try {
    const query = `
      SELECT a.*, mo.mo_number, p.name as product_name
      FROM alerts a
      LEFT JOIN manufacturing_orders mo ON mo.mo_id = a.entity_id AND a.entity_type = 'MO'
      LEFT JOIN products p ON p.product_id = mo.product_id
      WHERE a.status = 'ACTIVE'
      ORDER BY a.created_at DESC
      LIMIT 10
    `;
    
    const result = await req.pool.query(query);
    res.json(result.rows);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/test/manufacturing-orders', async (req, res) => {
  try {
    const query = `
      SELECT mo.mo_id, mo.mo_number, mo.status, p.name as product_name, mo.quantity
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.product_id
      ORDER BY mo.created_at DESC
      LIMIT 10
    `;
    
    const result = await req.pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Alerts API
router.get('/alerts', authenticateToken, async (req, res) => {
  try {
    const { status = 'ACTIVE' } = req.query;
    
    const query = `
      SELECT a.*, mo.mo_number, p.name as product_name
      FROM alerts a
      LEFT JOIN manufacturing_orders mo ON mo.mo_id = a.entity_id AND a.entity_type = 'MO'
      LEFT JOIN products p ON p.product_id = mo.product_id
      WHERE a.status = $1
      ORDER BY a.created_at DESC
      LIMIT 50
    `;
    
    const result = await req.pool.query(query, [status]);
    res.json(result.rows);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/alerts/:alertId/acknowledge', authenticateToken, async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user.userId;
    
    await req.pool.query(`
      UPDATE alerts 
      SET status = 'ACKNOWLEDGED', acknowledged_by = $1, acknowledged_at = now()
      WHERE alert_id = $2
    `, [userId, alertId]);
    
    res.json({ success: true });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics API
router.get('/analytics/dashboard', authenticateToken, async (req, res) => {
  try {
    const analytics = {};
    
    // Manufacturing Orders KPIs
    const moStats = await req.pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'planned' THEN 1 END) as planned,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
      FROM manufacturing_orders
    `);
    
    // Work Orders efficiency
    const woStats = await req.pool.query(`
      SELECT 
        COUNT(*) as total_work_orders,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_work_orders,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_completion_hours
      FROM work_orders 
      WHERE start_time IS NOT NULL AND end_time IS NOT NULL
    `);
    
    // Stock alerts
    const stockAlerts = await req.pool.query(`
      SELECT 
        COUNT(CASE WHEN current_stock <= min_qty THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock_items
      FROM products
      WHERE type IN ('raw', 'finished')
    `);
    
    // Production efficiency by work center
    const wcEfficiency = await req.pool.query(`
      SELECT wc.name, COUNT(wo.wo_id) as total_orders,
             AVG(EXTRACT(EPOCH FROM (wo.end_time - wo.start_time))/3600) as avg_hours
      FROM work_centers wc
      LEFT JOIN work_orders wo ON wc.wc_id = wo.work_center_id AND wo.status = 'completed'
      GROUP BY wc.wc_id, wc.name
      ORDER BY avg_hours DESC
    `);
    
    // AI Alerts summary
    const aiAlerts = await req.pool.query(`
      SELECT 
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_severity,
        COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active_alerts
      FROM alerts
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);
    
    analytics.manufacturing_orders = moStats.rows[0];
    analytics.work_orders = woStats.rows[0];
    analytics.stock_alerts = stockAlerts.rows[0];
    analytics.ai_alerts = aiAlerts.rows[0];
    analytics.work_center_efficiency = wcEfficiency.rows;
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reports API
router.get('/reports/production', authenticateToken, checkPermission(['admin', 'manager']), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    const result = await req.pool.query(`
      SELECT mo.mo_number, p.name as product_name, mo.quantity, mo.status,
             mo.start_date, mo.end_date, u.username as assignee,
             COUNT(wo.wo_id) as total_work_orders,
             COUNT(CASE WHEN wo.status = 'completed' THEN 1 END) as completed_work_orders
      FROM manufacturing_orders mo
      LEFT JOIN products p ON mo.product_id = p.product_id
      LEFT JOIN users u ON mo.assignee_id = u.user_id
      LEFT JOIN work_orders wo ON mo.mo_id = wo.mo_id
      WHERE mo.created_at BETWEEN $1 AND $2
      GROUP BY mo.mo_id, p.name, u.username
      ORDER BY mo.created_at DESC
    `, [start_date || '2024-01-01', end_date || '2024-12-31']);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;