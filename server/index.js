require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const { query, pool } = require('./db.js');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test database connection
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Error connecting to PostgreSQL:', err));

app.use(express.json());
app.use(cors());

// AI suggestion endpoint
app.post('/api/suggest', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that analyzes AI prompts and suggests concise titles and descriptions. Title should be max 50 chars, description max 120 chars."
        },
        {
          role: "user",
          content: `Analyze this AI prompt and suggest a concise title and brief description:
          
${prompt}

Return the response in JSON format like this:
{
  "title": "Short, clear title (max 50 chars)",
  "description": "Brief, informative description (max 120 chars)"
}`
        }
      ],
      temperature: 0.7,
    });

    // Parse the JSON response
    const suggestion = JSON.parse(completion.choices[0].message.content);
    res.json({
      title: suggestion.title.slice(0, 50),
      description: suggestion.description.slice(0, 120)
    });
  } catch (error) {
    console.error('Error in /api/suggest:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// Routes
app.get('/api/prompts', async (req, res) => {
  try {
    const result = await query('SELECT * FROM prompts ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prompts:', error);
    res.status(500).json({ error: 'Failed to fetch prompts' });
  }
});

app.post('/api/prompts', async (req, res) => {
  const { title, description, prompt, category, type, author } = req.body;
  try {
    const result = await query(
      'INSERT INTO prompts (title, description, prompt, category, type, author) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, prompt, category, type, author]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating prompt:', error);
    res.status(500).json({ error: 'Failed to create prompt' });
  }
});

app.put('/api/prompts/:id', async (req, res) => {
  const { id } = req.params;
  const { title, description, prompt, category, type, author } = req.body;
  try {
    const result = await query(
      'UPDATE prompts SET title = $1, description = $2, prompt = $3, category = $4, type = $5, author = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [title, description, prompt, category, type, author, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt' });
  }
});

app.delete('/api/prompts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM prompts WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
