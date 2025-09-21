// Seed AI training data for demo
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'manufacturing_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'admin',
});

async function seedAIData() {
  try {
    console.log('Seeding AI training data...');
    
    // Create some MOs with varying component availability
    const products = await pool.query('SELECT product_id FROM products LIMIT 3');
    
    for (let i = 0; i < 10; i++) {
      const productId = products.rows[i % products.rows.length].product_id;
      const moNumber = `MO-AI-${String(i + 1).padStart(3, '0')}`;
      
      // Create MO
      const moResult = await pool.query(`
        INSERT INTO manufacturing_orders (mo_number, product_id, quantity, start_date, end_date, status)
        VALUES ($1, $2, $3, CURRENT_DATE + INTERVAL '1 day', CURRENT_DATE + INTERVAL '7 days', 'planned')
        RETURNING mo_id
      `, [moNumber, productId, 10 + (i * 5)]);
      
      const moId = moResult.rows[0].mo_id;
      
      // Compute and store features
      const features = {
        mo_qty: 10 + (i * 5),
        bom_component_count: 3,
        percent_components_available: Math.random() * 0.8 + 0.2, // 0.2 to 1.0
        min_component_available_ratio: Math.random() * 0.6 + 0.4,
        work_center_avg_utilization_7d: Math.random() * 0.4 + 0.6, // 0.6 to 1.0
        avg_wo_duration_product_30d: 200 + Math.random() * 200,
        mo_lead_time_days: 7,
        assignee_recent_delay_rate_30d: Math.random() * 0.5,
        is_high_priority: i < 3
      };
      
      await pool.query(`
        INSERT INTO features_mo (mo_id, mo_qty, bom_component_count, percent_components_available,
                                min_component_available_ratio, work_center_avg_utilization_7d,
                                avg_wo_duration_product_30d, mo_lead_time_days, 
                                assignee_recent_delay_rate_30d, is_high_priority)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [moId, ...Object.values(features)]);
      
      // Create some historical predictions for training
      const score = Math.random();
      const risk = score > 0.75 ? 'HIGH' : score > 0.5 ? 'MEDIUM' : 'LOW';
      
      const predResult = await pool.query(`
        INSERT INTO predictions (entity_type, entity_id, model_version, score, risk_level, 
                               top_reasons, recommended_actions)
        VALUES ('MO', $1, 'v1.0', $2, $3, $4, $5)
        RETURNING id
      `, [
        moId, 
        score, 
        risk,
        JSON.stringify([
          {feature: 'percent_components_available', value: features.percent_components_available, impact: -0.3},
          {feature: 'work_center_avg_utilization_7d', value: features.work_center_avg_utilization_7d, impact: 0.2}
        ]),
        JSON.stringify(['Reserve components', 'Check work center capacity'])
      ]);
      
      // Create alert if high risk
      if (score > 0.6) {
        await pool.query(`
          INSERT INTO alerts (prediction_id, alert_type, entity_type, entity_id, score, severity, message, recommended_actions)
          VALUES ($1, 'MO_DELAY', 'MO', $2, $3, $4, $5, $6)
        `, [
          predResult.rows[0].id,
          moId,
          score,
          risk,
          `MO ${moNumber} at ${risk} risk of delay (${Math.round(score * 100)}%)`,
          JSON.stringify(['Reserve components', 'Assign backup workforce'])
        ]);
      }
    }
    
    console.log('AI training data seeded successfully');
    
  } catch (error) {
    console.error('Error seeding AI data:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  seedAIData();
}

module.exports = seedAIData;