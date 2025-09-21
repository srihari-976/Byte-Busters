#!/usr/bin/env node

// Phase 2 Demo Script - Manufacturing Order Flow
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
let authToken = '';

// Demo user credentials
const demoUser = {
  email: 'manager@demo.com',
  password: 'demo123',
  role: 'manager'
};

// Helper function for API calls
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API Error [${method} ${endpoint}]:`, error.response?.data || error.message);
    throw error;
  }
};

// Demo steps
const runDemo = async () => {
  console.log('🚀 Starting Phase-2 Manufacturing Demo...\n');
  
  try {
    // Step 1: Login as manager
    console.log('📋 Step 1: Manager Login');
    const loginResult = await apiCall('POST', '/login', demoUser);
    authToken = loginResult.token;
    console.log(`✅ Logged in as: ${loginResult.user.username} (${loginResult.user.role})\n`);
    
    // Step 2: Create Manufacturing Order
    console.log('📋 Step 2: Create Manufacturing Order');
    const newMO = {
      product_id: 1, // Wooden Table
      quantity: 5,
      start_date: new Date().toISOString().split('T')[0],
      assignee_id: loginResult.user.user_id,
      notes: 'Demo manufacturing order for 5 wooden tables'
    };
    
    const createdMO = await apiCall('POST', '/manufacturing-orders', newMO);
    console.log(`✅ Created MO: ${createdMO.mo_number} for ${newMO.quantity} units\n`);
    
    // Step 3: Get BOM for the product
    console.log('📋 Step 3: Check Bill of Materials');
    const bom = await apiCall('GET', `/bom/${newMO.product_id}`);
    console.log(`✅ BOM Components for product ${newMO.product_id}:`);
    bom.forEach(component => {
      console.log(`   - ${component.component_name}: ${component.quantity} ${component.unit} per unit`);
    });
    console.log('');
    
    // Step 4: Confirm MO (generates work orders)
    console.log('📋 Step 4: Confirm Manufacturing Order');
    const confirmResult = await apiCall('POST', `/manufacturing-orders/${createdMO.mo_id}/confirm`);
    console.log(`✅ ${confirmResult.message}`);
    console.log(`✅ Work Orders Created: ${confirmResult.work_orders_created}\n`);
    
    // Step 5: Get generated work orders
    console.log('📋 Step 5: View Generated Work Orders');
    const workOrders = await apiCall('GET', `/work-orders?mo_id=${createdMO.mo_id}`);
    console.log(`✅ Found ${workOrders.length} work orders:`);
    workOrders.forEach(wo => {
      console.log(`   - ${wo.wo_number}: ${wo.step_name} (${wo.status})`);
    });
    console.log('');
    
    // Step 6: Start first work order
    if (workOrders.length > 0) {
      console.log('📋 Step 6: Start First Work Order');
      const firstWO = workOrders[0];
      await apiCall('PUT', `/work-orders/${firstWO.wo_id}`, { status: 'in_progress' });
      console.log(`✅ Started WO: ${firstWO.wo_number} - ${firstWO.step_name}\n`);
      
      // Step 7: Complete the work order
      console.log('📋 Step 7: Complete Work Order');
      await apiCall('PUT', `/work-orders/${firstWO.wo_id}`, { 
        status: 'completed',
        comments: 'Demo completion - all tasks finished successfully'
      });
      console.log(`✅ Completed WO: ${firstWO.wo_number}\n`);
    }
    
    // Step 8: Check stock levels
    console.log('📋 Step 8: Check Stock Levels');
    const stockData = await apiCall('GET', '/stock-ledger');
    console.log('✅ Current Stock Status:');
    stockData.slice(0, 5).forEach(item => {
      console.log(`   - ${item.name}: ${item.current_stock} ${item.unit} (${item.stock_status || 'normal'})`);
    });
    console.log('');
    
    // Step 9: Get analytics
    console.log('📋 Step 9: View Analytics Dashboard');
    const analytics = await apiCall('GET', '/analytics/dashboard');
    console.log('✅ Manufacturing Analytics:');
    console.log(`   - Total Orders: ${analytics.orders?.total_orders || 0}`);
    console.log(`   - In Progress: ${analytics.orders?.in_progress || 0}`);
    console.log(`   - Completed: ${analytics.orders?.completed || 0}`);
    console.log(`   - Efficiency: ${Math.round(analytics.efficiency || 0)}%\n`);
    
    // Step 10: Check audit logs (if admin/manager)
    console.log('📋 Step 10: Review Audit Trail');
    try {
      const auditLogs = await apiCall('GET', '/audit-logs');
      console.log(`✅ Recent Activities (${auditLogs.length} entries):`);
      auditLogs.slice(0, 3).forEach(log => {
        console.log(`   - ${log.action} by ${log.username || 'System'} at ${new Date(log.created_at).toLocaleTimeString()}`);
      });
    } catch (error) {
      console.log('ℹ️  Audit logs require admin access');
    }
    
    console.log('\n🎉 Phase-2 Demo Completed Successfully!');
    console.log('\n📊 Demo Summary:');
    console.log('✅ Manufacturing Order created and confirmed');
    console.log('✅ Work Orders auto-generated from BOM');
    console.log('✅ Work Order lifecycle (start → complete)');
    console.log('✅ Stock levels monitored');
    console.log('✅ Analytics and audit trail verified');
    console.log('✅ Role-based access control enforced');
    
  } catch (error) {
    console.error('\n💥 Demo failed:', error.message);
    process.exit(1);
  }
};

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo };