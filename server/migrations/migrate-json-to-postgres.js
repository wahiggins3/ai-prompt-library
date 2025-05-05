import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

// In Render's environment, use the internal database URL
const pool = new Pool({
  connectionString: process.env.RENDER_INTERNAL_DATABASE_URL || process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function migrateData() {
  try {
    // Read JSON file
    const jsonPath = path.join(__dirname, '..', 'db.json');
    const jsonData = await fs.readFile(jsonPath, 'utf8');
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
