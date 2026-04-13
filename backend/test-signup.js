require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

async function testSignup() {
  try {
    console.log('Step 1: Testing connection...');
    await pool.query('SELECT NOW()');
    console.log('Connection OK!');

    console.log('Step 2: Checking users table...');
    const tables = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position");
    console.log('Users table columns:');
    tables.rows.forEach(r => console.log('  -', r.column_name, ':', r.data_type));

    console.log('Step 3: Inserting test user...');
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, created_at) VALUES ($1, $2, $3, NOW()) RETURNING id, name, email",
      ['Test User', 'testuser@test.com', 'fakehash123']
    );
    console.log('USER CREATED!', result.rows[0]);

    console.log('Step 4: Checking users table...');
    const users = await pool.query('SELECT id, name, email FROM users');
    console.log('All users:', users.rows);

    console.log('Step 5: Cleaning up...');
    await pool.query("DELETE FROM users WHERE email = 'testuser@test.com'");
    console.log('Test user deleted');

    console.log('\nALL TESTS PASSED! Signup should work.');
  } catch (err) {
    console.log('\nFAILED AT:', err.message);
    console.log('Error detail:', err.detail || 'none');
    console.log('Error code:', err.code || 'none');
  }
  process.exit(0);
}

testSignup();