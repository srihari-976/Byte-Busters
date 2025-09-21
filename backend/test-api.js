// Quick API test script
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';
const AI_BASE = 'http://localhost:3002/api';

async function testAPI() {
  try {
    console.log('Testing AI Prediction System...\n');
    
    // 1. Get manufacturing orders
    console.log('1. Getting manufacturing orders...');
    const mosResponse = await axios.get(`${API_BASE}/manufacturing-orders`);
    console.log(`Found ${mosResponse.data.length} MOs`);
    
    if (mosResponse.data.length > 0) {
      const firstMO = mosResponse.data[0];
      console.log(`First MO: ${firstMO.mo_number} (${firstMO.mo_id})\n`);
      
      // 2. Predict delay for first MO
      console.log('2. Predicting delay risk...');
      const predResponse = await axios.post(`${AI_BASE}/predict/mo`, {
        mo_id: firstMO.mo_id
      });
      console.log('Prediction:', predResponse.data);
      console.log('');
    }
    
    // 3. Get alerts
    console.log('3. Getting active alerts...');
    const alertsResponse = await axios.get(`${API_BASE}/alerts`);
    console.log(`Found ${alertsResponse.data.length} alerts`);
    alertsResponse.data.forEach(alert => {
      console.log(`- ${alert.severity}: ${alert.message}`);
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testAPI();