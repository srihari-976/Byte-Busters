// Event Worker - Processes events and triggers predictions
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

class EventWorker {
  constructor() {
    this.processedEvents = new Set(); // Simple deduplication
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:3002';
  }

  async processEvent(event) {
    const { type, mo_id, request_id } = event;
    
    // Idempotency check
    if (this.processedEvents.has(request_id)) {
      console.log(`Event ${request_id} already processed`);
      return;
    }

    try {
      console.log(`Processing event: ${type} for MO: ${mo_id}`);
      
      switch (type) {
        case 'mo.confirmed':
          await this.handleMOConfirmed(mo_id);
          break;

        default:
          console.log(`Unknown event type: ${type}`);
      }
      
      this.processedEvents.add(request_id);
      
    } catch (error) {
      console.error(`Error processing event ${request_id}:`, error);
      // In production: enqueue for retry with exponential backoff
    }
  }

  async handleMOConfirmed(moId) {
    try {
      // Call AI service to predict MO delay
      const response = await axios.post(`${this.aiServiceUrl}/predict/mo`, {
        mo_id: moId
      });
      
      const prediction = response.data;
      console.log(`MO ${moId} prediction: ${prediction.risk} (${prediction.score})`);
      
      // Create alert if high risk
      if (prediction.score >= 0.6) {
        await this.createAlert({
          type: 'MO_DELAY',
          entity_type: 'MO',
          entity_id: moId,
          score: prediction.score,
          severity: prediction.risk,
          message: `MO at ${prediction.risk} risk of delay (${Math.round(prediction.score * 100)}%)`,
          recommended_actions: prediction.recommended_actions,
          top_reasons: prediction.top_reasons
        });
        

      }
      
    } catch (error) {
      console.error(`Failed to predict MO ${moId}:`, error);
      // Fallback to rule-based alert
      await this.fallbackRuleEngine(moId);
    }
  }



  async createAlert(alertData) {
    const query = `
      INSERT INTO alerts (alert_type, entity_type, entity_id, score, severity, message, recommended_actions)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING alert_id
    `;
    
    const result = await pool.query(query, [
      alertData.type,
      alertData.entity_type,
      alertData.entity_id,
      alertData.score,
      alertData.severity,
      alertData.message,
      JSON.stringify(alertData.recommended_actions)
    ]);
    
    console.log(`Created alert ${result.rows[0].alert_id} for ${alertData.entity_type} ${alertData.entity_id}`);
    return result.rows[0];
  }

  async fallbackRuleEngine(moId) {
    console.log(`Using fallback rule engine for MO ${moId}`);
    
    // Simple rule: check component availability
    const query = `
      SELECT 
        mo.mo_number,
        MIN(p_comp.current_stock / b.quantity) as min_component_ratio
      FROM manufacturing_orders mo
      JOIN bom b ON b.product_id = mo.product_id
      JOIN products p_comp ON p_comp.product_id = b.component_id
      WHERE mo.mo_id = $1
      GROUP BY mo.mo_id, mo.mo_number
    `;
    
    const result = await pool.query(query, [moId]);
    if (result.rows.length === 0) return;
    
    const { mo_number, min_component_ratio } = result.rows[0];
    
    if (min_component_ratio < 0.5) {
      await this.createAlert({
        type: 'MO_DELAY',
        entity_type: 'MO',
        entity_id: moId,
        score: 0.7,
        severity: 'MEDIUM',
        message: `MO ${mo_number} has low component availability (${Math.round(min_component_ratio * 100)}%) - using fallback rules`,
        recommended_actions: ['Reserve components', 'Check supplier lead times']
      });
    }
  }



  // Simulate event processing for demo
  async simulateEvents() {
    console.log('Starting event simulation...');
    
    // Get some MOs to simulate events
    const result = await pool.query(`
      SELECT mo_id, mo_number 
      FROM manufacturing_orders 
      WHERE status = 'planned' 
      LIMIT 3
    `);
    
    for (const mo of result.rows) {
      await this.processEvent({
        type: 'mo.confirmed',
        mo_id: mo.mo_id,
        request_id: `sim_${mo.mo_id}_${Date.now()}`
      });
      
      // Wait between events
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Export for use in main server
module.exports = EventWorker;

// Run simulation if called directly
if (require.main === module) {
  const worker = new EventWorker();
  worker.simulateEvents().then(() => {
    console.log('Event simulation completed');
    process.exit(0);
  }).catch(error => {
    console.error('Simulation failed:', error);
    process.exit(1);
  });
}