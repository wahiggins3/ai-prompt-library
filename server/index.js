require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const dbPath = path.join(__dirname, 'db.json');

// Middleware
app.use(cors());
app.use(express.json());

// Helper functions
async function readDB() {
  try {
    const data = await fs.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { prompts: [] };
  }
}

async function writeDB(data) {
  await fs.writeFile(dbPath, JSON.stringify(data, null, 2));
}

// Routes
app.get('/api/prompts', async (req, res) => {
  try {
    const db = await readDB();
    res.json(db.prompts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/prompts', async (req, res) => {
  console.log('Received POST request to /api/prompts');
  console.log('Request body:', req.body);
  try {
    const db = await readDB();
    console.log('Current DB state:', db);
    const newPrompt = {
      _id: Date.now().toString(),
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    console.log('New prompt to add:', newPrompt);
    db.prompts.unshift(newPrompt);
    await writeDB(db);
    console.log('Successfully saved to database');
    res.status(201).json(newPrompt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/prompts/:id', async (req, res) => {
  try {
    const db = await readDB();
    const index = db.prompts.findIndex(p => p._id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ message: 'Prompt not found' });
    }
    const updatedPrompt = {
      ...db.prompts[index],
      ...req.body,
      _id: req.params.id,
      updatedAt: new Date().toISOString()
    };
    db.prompts[index] = updatedPrompt;
    await writeDB(db);
    res.json(updatedPrompt);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/prompts/:id', async (req, res) => {
  try {
    const db = await readDB();
    db.prompts = db.prompts.filter(p => p._id !== req.params.id);
    await writeDB(db);
    res.json({ message: 'Prompt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Using local JSON file for data storage');
});
