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

// Test connection on startup
pool.connect().then(client => {
  console.log('Database connected successfully');
  client.release();
}).catch(err => {
  console.error('Database connection error:', err);
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
