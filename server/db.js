import pg from 'pg';
const { Pool } = pg;

// Log environment for debugging
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
  PGHOST: process.env.PGHOST || 'not set',
  PGPORT: process.env.PGPORT || 'not set',
  PGDATABASE: process.env.PGDATABASE || 'not set',
  PGUSER: process.env.PGUSER ? 'set' : 'not set',
});

// Try to use DATABASE_URL first, if not available use individual connection params
let config;

if (process.env.DATABASE_URL) {
  console.log('Using DATABASE_URL for connection');
  config = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else if (process.env.PGHOST && process.env.PGUSER) {
  console.log('Using individual PG* variables for connection');
  config = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432', 10),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    ssl: {
      rejectUnauthorized: false
    }
  };
} else {
  throw new Error('No database connection information available');
}

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

export { query, pool };
