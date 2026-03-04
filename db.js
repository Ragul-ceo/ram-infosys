// db.js — PostgreSQL connection pool
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5432,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'ram_infosys',
});

// Adapter: wrap pg pool to work like mysql2/promise for backward compatibility
const adaptedPool = {
  async query(sql, values) {
    return pool.query(sql, values);
  },
  async getConnection() {
    const client = await pool.connect();
    return {
      execute: (sql, values) => client.query(sql, values),
      release: () => client.release(),
    };
  },
};

// Test connection on startup
(async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅  PostgreSQL connected:', process.env.DB_NAME);
  } catch (err) {
    console.error('❌  PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
})();

module.exports = adaptedPool;
