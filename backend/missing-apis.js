// Add these endpoints to server.js

// Quality Control APIs
app.get('/api/quality-inspections', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT qi.*, qp.plan_name, u.username as inspector_name
      FROM quality_inspections qi
      LEFT JOIN qc_plans qp ON qi.qc_plan_id = qp.qc_plan_id
      LEFT JOIN users u ON qi.inspector_id = u.user_id
      ORDER BY qi.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/qc-plans', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM qc_plans ORDER BY plan_name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stock Transactions API
app.get('/api/stock-transactions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sl.*, p.product_name, u.username as created_by_name
      FROM stock_ledger sl
      LEFT JOIN products p ON sl.product_id = p.product_id
      LEFT JOIN users u ON sl.user_id = u.user_id
      ORDER BY sl.created_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create missing tables
const createMissingTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS qc_plans (
      qc_plan_id SERIAL PRIMARY KEY,
      plan_name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS quality_inspections (
      inspection_id SERIAL PRIMARY KEY,
      qc_plan_id INTEGER REFERENCES qc_plans(qc_plan_id),
      reference_type VARCHAR(20),
      reference_id VARCHAR(50),
      inspector_id INTEGER REFERENCES users(user_id),
      inspection_result VARCHAR(20) DEFAULT 'pass',
      remarks TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
};