const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'manufacturing_db',
  password: 'admin',
  port: 5432,
});

async function fixAuth() {
  try {
    // Create admin user with known password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await pool.query(`
      UPDATE users SET password_hash = $1 
      WHERE email = 'admin@example.com'
    `, [hashedPassword]);
    
    console.log('✅ Admin user fixed: admin@example.com / admin123');
    
    // Test login
    const user = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@example.com']);
    console.log('✅ User exists:', user.rows[0].username);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixAuth();