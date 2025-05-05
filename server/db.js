import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.RENDER_INTERNAL_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
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
