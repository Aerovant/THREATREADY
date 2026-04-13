require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: { rejectUnauthorized: false } 
});

pool.query('SELECT NOW()')
  .then(result => {
    console.log('DATABASE CONNECTED!');
    console.log('Time:', result.rows[0].now);
    return pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  })
  .then(result => {
    console.log('Tables found:', result.rows.length);
    result.rows.forEach(r => console.log('  -', r.table_name));
    process.exit(0);
  })
  .catch(err => {
    console.log('FAILED!');
    console.log('Error:', err.message);
    process.exit(1);
  });