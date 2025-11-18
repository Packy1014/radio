require('dotenv').config();
const express = require('express');
const path = require('path');
const { testConnection, getAllUsers, createUser, getAllPosts, createPost, submitRating, getRatings, getUserRating } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Basic routes
// Server info page moved to /server-info to allow static index.html to be served
app.get('/server-info', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Local Prototype Server</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          max-width: 800px;
          margin: 50px auto;
          padding: 20px;
          background: #f5f5f5;
        }
        .container {
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #333; }
        .status { color: #28a745; font-weight: bold; }
        code {
          background: #f4f4f4;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 Server is Running!</h1>
        <p class="status">✓ Express webserver is active</p>
        <p class="status">✓ SQLite database is configured</p>
        <h2>Quick Start</h2>
        <ul>
          <li>Server running on port <code>${PORT}</code></li>
          <li>Radio Player: <a href="/">Radio Player</a></li>
          <li>API endpoint test: <a href="/api/test">/api/test</a></li>
          <li>Database test: <a href="/api/db-test">/api/db-test</a></li>
        </ul>
        <h2>Project Structure</h2>
        <pre>
radio/
├── server.js       (Express server)
├── database.js     (SQLite connection)
├── public/         (Static files)
└── data.db         (SQLite database)
        </pre>
      </div>
    </body>
    </html>
  `);
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    status: 'success',
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get('/api/db-test', (req, res) => {
  const result = testConnection();
  res.json(result);
});

// User endpoints
app.get('/api/users', (req, res) => {
  try {
    const users = getAllUsers();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/users', (req, res) => {
  try {
    const { username, email } = req.body;
    if (!username || !email) {
      return res.status(400).json({ success: false, error: 'Username and email are required' });
    }
    const userId = createUser(username, email);
    res.json({ success: true, userId, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Post endpoints
app.get('/api/posts', (req, res) => {
  try {
    const posts = getAllPosts();
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/posts', (req, res) => {
  try {
    const { userId, title, content } = req.body;
    if (!userId || !title) {
      return res.status(400).json({ success: false, error: 'User ID and title are required' });
    }
    const postId = createPost(userId, title, content);
    res.json({ success: true, postId, message: 'Post created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Rating endpoints
app.post('/api/ratings', (req, res) => {
  try {
    const { songId, userId, rating } = req.body;
    if (!songId || !userId || (rating !== 1 && rating !== -1)) {
      return res.status(400).json({
        success: false,
        error: 'Song ID, user ID, and rating (1 or -1) are required'
      });
    }
    const success = submitRating(songId, userId, rating);
    res.json({
      success,
      message: success ? 'Rating submitted successfully' : 'Rating submission failed'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/ratings/:songId', (req, res) => {
  try {
    const { songId } = req.params;
    const { userId } = req.query;

    const ratings = getRatings(songId);
    const userRating = userId ? getUserRating(songId, userId) : null;

    res.json({
      success: true,
      data: {
        ...ratings,
        userRating
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   Server running successfully!         ║
║   URL: http://localhost:${PORT}         ║
╚════════════════════════════════════════╝
  `);
});
