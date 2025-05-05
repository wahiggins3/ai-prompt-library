import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query, pool } from './db.js';

// Test database connection
pool.connect()
  .then(client => {
    console.log('Successfully connected to database');
    client.query('SELECT NOW()')
      .then(result => {
        console.log('Database time:', result.rows[0].now);
        client.release();
      })
      .catch(err => {
        console.error('Error querying database:', err);
        client.release();
      });
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
    // Don't exit - let the server start anyway
  });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/prompts', async (req, res) => {
  try {
    const result = await query('SELECT * FROM prompts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/prompts', async (req, res) => {
  const { title, description, prompt, category, type, author } = req.body;
  try {
    const result = await query(
      'INSERT INTO prompts (title, description, prompt, category, type, author) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, prompt, category, type, author]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/prompts/:id', async (req, res) => {
  const { title, description, prompt, category, type, author } = req.body;
  try {
    const result = await query(
      'UPDATE prompts SET title = $1, description = $2, prompt = $3, category = $4, type = $5, author = $6, updated_at = CURRENT_TIMESTAMP WHERE _id = $7 RETURNING *',
      [title, description, prompt, category, type, author, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/prompts/:id', async (req, res) => {
  try {
    const result = await query('DELETE FROM prompts WHERE _id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Using local JSON file for data storage');
});
