const pg = require('pg');

// Default to localhost if no DATABASE_URL is provided
const dbUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/promptlibrary';

console.log('Using database URL:', dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://USER:PASSWORD@'));

const config = {
  connectionString: dbUrl,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
  // Connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
};

console.log('Database config (without sensitive data):', {
  host: config.host || 'from connection string',
  port: config.port || 'from connection string',
  database: config.database || 'from connection string',
  ssl: config.ssl
});

const pool = new Pool(config);

// Function to test connection with retries
async function testConnection(retries = 5, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      console.log('Database connected successfully');
      const result = await client.query('SELECT NOW()');
      console.log('Database time:', result.rows[0].now);
      client.release();
      return true;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1}/${retries} failed:`, err.message);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw new Error('Failed to connect to database after multiple attempts');
}

// Test connection on startup with retries
testConnection().catch(err => {
  console.error('Final database connection error:', err);
  // Don't exit process, let the application handle the error
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

module.exports = { query, pool };
