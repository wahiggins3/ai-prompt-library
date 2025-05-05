import pg from 'pg';
const { Pool } = pg;

// Try to use DATABASE_URL first, if not available use individual connection params
const config = process.env.DATABASE_URL ? {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
} : {
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  ssl: {
    rejectUnauthorized: false
  }
};

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
