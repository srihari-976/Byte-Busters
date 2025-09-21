const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'manufacturing_db',
  password: process.env.DB_PASSWORD || 'admin',
  port: process.env.DB_PORT || 5432,
});

const seedUsers = async () => {
  try {
    console.log('🌱 Seeding demo users...');

    const demoUsers = [
      { username: 'admin', email: 'admin@company.com', password: 'admin123', role: 'admin' },
      { username: 'manager', email: 'manager@company.com', password: 'manager123', role: 'manager' },
      { username: 'operator', email: 'operator@company.com', password: 'operator123', role: 'operator' },
      { username: 'inventory', email: 'inventory@company.com', password: 'inventory123', role: 'inventory' }
    ];

    for (const user of demoUsers) {
      // Check if user already exists
      const existingUser = await pool.query('SELECT user_id FROM users WHERE email = $1', [user.email]);
      
      if (existingUser.rows.length === 0) {
        // Hash password
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        // Get role_id
        const roleResult = await pool.query('SELECT role_id FROM roles WHERE name = $1', [user.role]);
        const role_id = roleResult.rows[0]?.role_id || 3; // Default to operator
        
        // Insert user
        await pool.query(
          'INSERT INTO users (username, email, password_hash, role, role_id) VALUES ($1, $2, $3, $4, $5)',
          [user.username, user.email, hashedPassword, user.role, role_id]
        );
        
        console.log(`✅ Created user: ${user.email} (${user.role})`);
      } else {
        console.log(`⚠️  User already exists: ${user.email}`);
      }
    }

    console.log('✅ Demo users seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();