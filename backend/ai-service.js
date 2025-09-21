const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Simple Random Forest implementation
class RandomForestClassifier {
  constructor() {
    // Pre-trained decision trees (simplified)
    this.trees = [
      {
        // Tree 1: Focus on components
        predict: (f) => {
          if (f.percent_components_available < 0.4) return 0.8;
          if (f.percent_components_available < 0.6) return 0.6;
          return 0.3;
        },
        weight: 0.4
      },
      {
        // Tree 2: Focus on utilization
        predict: (f) => {
          if (f.work_center_avg_utilization_7d > 0.9) return 0.7;
          if (f.work_center_avg_utilization_7d > 0.8) return 0.5;
          return 0.2;
        },
        weight: 0.3
      },
      {
        // Tree 3: Focus on quantity and delays
        predict: (f) => {
          if (f.mo_qty > 20 && f.assignee_recent_delay_rate_30d > 0.3) return 0.9;
          if (f.mo_qty > 15) return 0.6;
          return 0.4;
        },
        weight: 0.3
      }
    ];
  }

  predict(features) {
    // Ensemble prediction: weighted average of all trees
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const tree of this.trees) {
      totalScore += tree.predict(features) * tree.weight;
      totalWeight += tree.weight;
    }
    
    return Math.min(totalScore / totalWeight, 1.0);
  }

  getFeatureImportance(features) {
    const importance = [];
    
    // Calculate feature contributions
    if (features.percent_components_available < 0.5) {
      importance.push({
        feature: 'percent_components_available',
        value: features.percent_components_available,
        impact: -0.4 * (0.5 - features.percent_components_available),
        description: 'Low component availability increases delay risk'
      });
    }
    
    if (features.work_center_avg_utilization_7d > 0.8) {
      importance.push({
        feature: 'work_center_avg_utilization_7d',
        value: features.work_center_avg_utilization_7d,
        impact: 0.3 * (features.work_center_avg_utilization_7d - 0.8),
        description: 'High work center utilization increases delay risk'
      });
    }
    
    if (features.mo_qty > 15) {
      importance.push({
        feature: 'mo_qty',
        value: features.mo_qty,
        impact: 0.2 * Math.min((features.mo_qty - 15) / 10, 1),
        description: 'Large order quantity increases complexity'
      });
    }
    
    return importance.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)).slice(0, 3);
  }
}

// Initialize the model
const rfModel = new RandomForestClassifier();

function predictMODelay(features) {
  return rfModel.predict(features);
}

function explainPrediction(features) {
  return rfModel.getFeatureImportance(features);
}



// Predict MO delay
app.post('/predict/mo', async (req, res) => {
  try {
    const { mo_id } = req.body;
    
    // Mock features for demo
    const features = {
      mo_qty: 25, // Large order
      percent_components_available: 0.3, // Low availability
      work_center_avg_utilization_7d: 0.95, // High utilization
      assignee_recent_delay_rate_30d: 0.4 // High delay rate
    };
    
    // Predict
    const score = predictMODelay(features);
    const risk = score > 0.75 ? 'HIGH' : score > 0.5 ? 'MEDIUM' : 'LOW';
    const topReasons = explainPrediction(features);
    
    const recommendedActions = ['Reserve components', 'Assign backup workforce'];
    
    res.json({
      mo_id,
      model_version: 'v1.0',
      score,
      risk,
      top_reasons: topReasons,
      recommended_actions: recommendedActions,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});



// Get active alerts
app.get('/alerts', async (req, res) => {
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
    
    const result = await pool.query(query, [status]);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Alerts fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});



module.exports = app;