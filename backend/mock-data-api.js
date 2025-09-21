// Mock Data API - Backend endpoints for creating mock data
const express = require('express');
const router = express.Router();

// RBAC middleware
const checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
};

// Mock data generators
const generateMockProducts = (count = 5) => {
  const mockProducts = [
    { product_code: 'FG001', product_name: 'Wooden Table', product_type: 'finished_good', uom: 'pcs', standard_cost: 150.00, reorder_level: 5, max_stock_level: 50, current_stock: 25 },
    { product_code: 'FG002', product_name: 'Office Chair', product_type: 'finished_good', uom: 'pcs', standard_cost: 120.00, reorder_level: 10, max_stock_level: 100, current_stock: 45 },
    { product_code: 'FG003', product_name: 'Wooden Desk', product_type: 'finished_good', uom: 'pcs', standard_cost: 200.00, reorder_level: 3, max_stock_level: 30, current_stock: 15 },
    { product_code: 'RM001', product_name: 'Wood Leg', product_type: 'raw_material', uom: 'pcs', standard_cost: 15.00, reorder_level: 20, max_stock_level: 200, current_stock: 150 },
    { product_code: 'RM002', product_name: 'Wood Top', product_type: 'raw_material', uom: 'pcs', standard_cost: 50.00, reorder_level: 10, max_stock_level: 100, current_stock: 80 },
    { product_code: 'RM003', product_name: 'Screws', product_type: 'raw_material', uom: 'pcs', standard_cost: 0.50, reorder_level: 100, max_stock_level: 1000, current_stock: 500 },
    { product_code: 'RM004', product_name: 'Varnish', product_type: 'raw_material', uom: 'ltr', standard_cost: 25.00, reorder_level: 5, max_stock_level: 50, current_stock: 20 },
    { product_code: 'RM005', product_name: 'Steel Frame', product_type: 'raw_material', uom: 'pcs', standard_cost: 35.00, reorder_level: 15, max_stock_level: 150, current_stock: 75 },
    { product_code: 'RM006', product_name: 'Fabric Cushion', product_type: 'raw_material', uom: 'pcs', standard_cost: 20.00, reorder_level: 25, max_stock_level: 250, current_stock: 120 },
    { product_code: 'SF001', product_name: 'Table Assembly', product_type: 'semi_finished', uom: 'pcs', standard_cost: 80.00, reorder_level: 8, max_stock_level: 80, current_stock: 40 }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const baseProduct = mockProducts[i % mockProducts.length];
    const product = { ...baseProduct };
    
    // Make unique codes
    if (i >= mockProducts.length) {
      const suffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      product.product_code = product.product_code.replace(/\d+$/, suffix);
      product.product_name = product.product_name + ' ' + suffix;
    }
    
    result.push(product);
  }
  
  return result;
};

const generateMockWorkCenters = (count = 5) => {
  const mockWorkCenters = [
    { name: 'Assembly Line 1', type: 'machine', capacity: 2, cost_per_hour: 50.00 },
    { name: 'Paint Station', type: 'workshop', capacity: 1, cost_per_hour: 30.00 },
    { name: 'Quality Control', type: 'team', capacity: 3, cost_per_hour: 40.00 },
    { name: 'Packaging Unit', type: 'machine', capacity: 4, cost_per_hour: 25.00 },
    { name: 'Cutting Station', type: 'machine', capacity: 2, cost_per_hour: 45.00 },
    { name: 'Welding Bay', type: 'workshop', capacity: 1, cost_per_hour: 55.00 },
    { name: 'Finishing Line', type: 'team', capacity: 2, cost_per_hour: 35.00 },
    { name: 'Inspection Area', type: 'team', capacity: 1, cost_per_hour: 42.00 }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const baseCenter = mockWorkCenters[i % mockWorkCenters.length];
    const center = { ...baseCenter };
    
    if (i >= mockWorkCenters.length) {
      center.name = center.name + ' ' + (i + 1);
    }
    
    result.push(center);
  }
  
  return result;
};

const generateMockManufacturingOrders = (count = 5) => {
  const getDateString = (daysFromNow) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  const mockOrders = [
    { mo_number: 'MO001', quantity: 10, start_date: getDateString(0), end_date: getDateString(7), status: 'planned' },
    { mo_number: 'MO002', quantity: 15, start_date: getDateString(0), end_date: getDateString(5), status: 'in_progress' },
    { mo_number: 'MO003', quantity: 8, start_date: getDateString(-2), end_date: getDateString(3), status: 'completed' },
    { mo_number: 'MO004', quantity: 20, start_date: getDateString(1), end_date: getDateString(8), status: 'planned' },
    { mo_number: 'MO005', quantity: 25, start_date: getDateString(2), end_date: getDateString(7), status: 'planned' }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const baseOrder = mockOrders[i % mockOrders.length];
    const order = { ...baseOrder };
    
    // Generate unique MO number
    order.mo_number = 'MO' + Math.floor(Math.random() * 9000 + 1000);
    
    result.push(order);
  }
  
  return result;
};

const generateMockWorkOrders = (count = 5) => {
  const mockWorkOrders = [
    { wo_number: 'WO001', step_name: 'Assembly', status: 'planned' },
    { wo_number: 'WO002', step_name: 'Painting', status: 'planned' },
    { wo_number: 'WO003', step_name: 'Assembly', status: 'in_progress' },
    { wo_number: 'WO004', step_name: 'Quality Check', status: 'completed' },
    { wo_number: 'WO005', step_name: 'Cutting', status: 'planned' },
    { wo_number: 'WO006', step_name: 'Welding', status: 'in_progress' },
    { wo_number: 'WO007', step_name: 'Finishing', status: 'planned' }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const baseOrder = mockWorkOrders[i % mockWorkOrders.length];
    const order = { ...baseOrder };
    
    // Generate unique WO number
    order.wo_number = 'WO' + Math.floor(Math.random() * 9000 + 1000);
    
    result.push(order);
  }
  
  return result;
};

const generateMockUsers = (count = 5) => {
  const mockUsers = [
    { username: 'john_doe', email: 'john@company.com', role_id: 3 },
    { username: 'jane_smith', email: 'jane@company.com', role_id: 2 },
    { username: 'mike_wilson', email: 'mike@company.com', role_id: 4 },
    { username: 'sarah_jones', email: 'sarah@company.com', role_id: 3 },
    { username: 'david_brown', email: 'david@company.com', role_id: 2 },
    { username: 'lisa_white', email: 'lisa@company.com', role_id: 4 },
    { username: 'tom_green', email: 'tom@company.com', role_id: 3 }
  ];

  const result = [];
  for (let i = 0; i < count; i++) {
    const baseUser = mockUsers[i % mockUsers.length];
    const user = { ...baseUser };
    
    // Make unique usernames and emails
    const suffix = Math.random().toString(36).substr(2, 5);
    user.username = baseUser.username + '_' + suffix;
    user.email = user.username + '@company.com';
    user.password = 'password123'; // Default password for mock users
    
    result.push(user);
  }
  
  return result;
};

// Bulk create mock products
router.post('/mock/products', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const mockProducts = generateMockProducts(count);
    
    const createdProducts = [];
    for (const product of mockProducts) {
      try {
        const result = await req.pool.query(`
          INSERT INTO products (product_code, product_name, product_type, uom, standard_cost, reorder_level, max_stock_level, current_stock)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          product.product_code,
          product.product_name,
          product.product_type,
          product.uom,
          product.standard_cost,
          product.reorder_level,
          product.max_stock_level,
          product.current_stock
        ]);
        createdProducts.push(result.rows[0]);
      } catch (error) {
        console.log(`Skipping duplicate product: ${product.product_code}`);
      }
    }
    
    res.json({ 
      success: true, 
      created: createdProducts.length,
      products: createdProducts 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create mock work centers
router.post('/mock/work-centers', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const mockWorkCenters = generateMockWorkCenters(count);
    
    const createdCenters = [];
    for (const center of mockWorkCenters) {
      try {
        const result = await req.pool.query(`
          INSERT INTO work_centers (name, type, capacity, cost_per_hour)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [center.name, center.type, center.capacity, center.cost_per_hour]);
        createdCenters.push(result.rows[0]);
      } catch (error) {
        console.log(`Skipping duplicate work center: ${center.name}`);
      }
    }
    
    res.json({ 
      success: true, 
      created: createdCenters.length,
      workCenters: createdCenters 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create mock manufacturing orders
router.post('/mock/manufacturing-orders', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    
    // Get available products
    const productsResult = await req.pool.query('SELECT product_id FROM products WHERE product_type = $1 LIMIT 10', ['finished_good']);
    if (productsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No finished goods available. Create products first.' });
    }
    
    const mockOrders = generateMockManufacturingOrders(count);
    const createdOrders = [];
    
    for (const order of mockOrders) {
      try {
        // Assign random product
        const randomProduct = productsResult.rows[Math.floor(Math.random() * productsResult.rows.length)];
        
        const result = await req.pool.query(`
          INSERT INTO manufacturing_orders (mo_number, product_id, quantity, start_date, end_date, status)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          order.mo_number,
          randomProduct.product_id,
          order.quantity,
          order.start_date,
          order.end_date,
          order.status
        ]);
        createdOrders.push(result.rows[0]);
      } catch (error) {
        console.log(`Skipping duplicate MO: ${order.mo_number}`);
      }
    }
    
    res.json({ 
      success: true, 
      created: createdOrders.length,
      orders: createdOrders 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk create mock users
router.post('/mock/users', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const mockUsers = generateMockUsers(count);
    
    const bcrypt = require('bcrypt');
    const createdUsers = [];
    
    for (const user of mockUsers) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        const result = await req.pool.query(`
          INSERT INTO users (username, email, password_hash, role_id)
          VALUES ($1, $2, $3, $4)
          RETURNING user_id, username, email
        `, [user.username, user.email, hashedPassword, user.role_id]);
        createdUsers.push(result.rows[0]);
      } catch (error) {
        console.log(`Skipping duplicate user: ${user.username}`);
      }
    }
    
    res.json({ 
      success: true, 
      created: createdUsers.length,
      users: createdUsers 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mock data samples (for preview)
router.get('/mock/samples/:type', (req, res) => {
  const { type } = req.params;
  const { count = 3 } = req.query;
  
  let samples = [];
  switch (type) {
    case 'products':
      samples = generateMockProducts(parseInt(count));
      break;
    case 'work-centers':
      samples = generateMockWorkCenters(parseInt(count));
      break;
    case 'manufacturing-orders':
      samples = generateMockManufacturingOrders(parseInt(count));
      break;
    case 'users':
      samples = generateMockUsers(parseInt(count));
      break;
    default:
      return res.status(400).json({ error: 'Invalid type' });
  }
  
  res.json({ samples });
});

// Bulk create mock work orders
router.post('/mock/work-orders', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    
    // Get available manufacturing orders
    const moResult = await req.pool.query('SELECT mo_id FROM manufacturing_orders LIMIT 10');
    if (moResult.rows.length === 0) {
      return res.status(400).json({ error: 'No manufacturing orders available. Create manufacturing orders first.' });
    }
    
    // Get available work centers
    const wcResult = await req.pool.query('SELECT wc_id FROM work_centers LIMIT 10');
    
    const mockWorkOrders = generateMockWorkOrders(count);
    const createdWorkOrders = [];
    
    for (const workOrder of mockWorkOrders) {
      try {
        // Assign random MO and work center
        const randomMO = moResult.rows[Math.floor(Math.random() * moResult.rows.length)];
        const randomWC = wcResult.rows.length > 0 ? wcResult.rows[Math.floor(Math.random() * wcResult.rows.length)] : null;
        
        const result = await req.pool.query(`
          INSERT INTO work_orders (wo_number, mo_id, step_name, work_center_id, status)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `, [
          workOrder.wo_number,
          randomMO.mo_id,
          workOrder.step_name,
          randomWC?.wc_id || null,
          workOrder.status
        ]);
        createdWorkOrders.push(result.rows[0]);
      } catch (error) {
        console.log(`Skipping duplicate WO: ${workOrder.wo_number}`);
      }
    }
    
    res.json({ 
      success: true, 
      created: createdWorkOrders.length,
      workOrders: createdWorkOrders 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all mock data (for testing)
router.delete('/mock/clear', async (req, res) => {
  try {
    const { type } = req.query;
    
    if (type === 'products') {
      await req.pool.query('DELETE FROM products WHERE product_code LIKE $1', ['%00%']);
    } else if (type === 'work-centers') {
      await req.pool.query('DELETE FROM work_centers WHERE name LIKE $1', ['%Line%']);
    } else if (type === 'manufacturing-orders') {
      await req.pool.query('DELETE FROM manufacturing_orders WHERE mo_number LIKE $1', ['MO%']);
    } else if (type === 'work-orders') {
      await req.pool.query('DELETE FROM work_orders WHERE wo_number LIKE $1', ['WO%']);
    } else if (type === 'users') {
      await req.pool.query('DELETE FROM users WHERE username LIKE $1', ['%_%_%']);
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }
    
    res.json({ success: true, message: `Mock ${type} cleared` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;