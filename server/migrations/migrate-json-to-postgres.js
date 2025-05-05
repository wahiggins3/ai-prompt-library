import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// Log the database URL we're using (without sensitive info)
console.log('Using database URL:', process.env.RENDER_INTERNAL_DATABASE_URL ? 'RENDER_INTERNAL_DATABASE_URL' : 'DATABASE_URL');

// Print available environment variables (without values)
console.log('Available environment variables:', Object.keys(process.env));

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

// Check if we have enough connection info
if (!process.env.DATABASE_URL && (!process.env.PGHOST || !process.env.PGUSER || !process.env.PGPASSWORD)) {
  console.error('Missing required database connection information');
  console.error('Need either DATABASE_URL or all of: PGHOST, PGUSER, PGPASSWORD');
  process.exit(1);
}

console.log('Database config (without sensitive data):', {
  host: config.host || 'from connection string',
  port: config.port || 'from connection string',
  database: config.database || 'from connection string',
  ssl: config.ssl
});

console.log('Connecting to database...');

const pool = new Pool(config);

// Test database connection
try {
  const client = await pool.connect();
  const result = await client.query('SELECT NOW()');
  console.log('Successfully connected to database at:', result.rows[0].now);
  client.release();
} catch (err) {
  console.error('Database connection error:', err);
  process.exit(1);
}

async function createTable() {
  console.log('Creating prompts table if it doesn\'t exist...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        category TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table created or already exists');
    return true;
  } catch (err) {
    console.error('Error creating table:', err);
    return false;
  }
}

async function migrateData() {
  try {
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'db.json');
    console.log('Looking for JSON file at:', jsonPath);
    
    const jsonData = await fs.readFile(jsonPath, 'utf8');
    console.log('Successfully read JSON file');
    
    const { prompts } = JSON.parse(jsonData);
    console.log(`Found ${prompts.length} prompts to migrate`);

    // Create table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS prompts (
        _id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        prompt TEXT NOT NULL,
        category VARCHAR(100) NOT NULL,
        type VARCHAR(100) NOT NULL,
        author VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insert each prompt
    for (const prompt of prompts) {
      await pool.query(
        'INSERT INTO prompts (title, description, prompt, category, type, author, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          prompt.title,
          prompt.description,
          prompt.prompt,
          prompt.category,
          prompt.type,
          prompt.author,
          prompt.createdAt || new Date(),
          prompt.updatedAt || new Date()
        ]
      );
      console.log(`Migrated prompt: ${prompt.title}`);
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateData();
