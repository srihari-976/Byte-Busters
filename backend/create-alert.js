// Create a test alert directly
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'manufacturing_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function createTestAlert() {
  try {
    // Create alert for MO ID 4
    const result = await pool.query(`
      INSERT INTO alerts (alert_type, entity_type, entity_id, score, severity, message, recommended_actions)
      VALUES ('MO_DELAY', 'MO', 4, 0.9, 'HIGH', 'MO-AI-001 at HIGH risk of delay (90%)', $1)
      RETURNING alert_id
    `, [JSON.stringify(['Reserve components', 'Assign backup workforce'])]);
    
    console.log(`Created alert ${result.rows[0].alert_id} for MO 4`);
    
  } catch (error) {
    console.error('Error creating alert:', error);
  } finally {
    await pool.end();
  }
}

createTestAlert();