const express = require('express');
const path = require('path');
const { NewsSourceParser } = require('./fetchNews');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// News API endpoint
app.get('/api/news', async (req, res) => {
    try {
        const parser = new NewsSourceParser();
        const headlines = await parser.loadHeadlines();
        
        // Apply query filter if provided
        if (req.query.q) {
            const query = req.query.q.toLowerCase();
            const filtered = headlines.filter(headline => 
                headline.title.toLowerCase().includes(query) ||
                headline.source.toLowerCase().includes(query)
            );
            res.json(filtered);
        } else {
            res.json(headlines);
        }
    } catch (error) {
        console.error('Error serving news:', error);
        res.status(500).json({ error: 'Failed to load news' });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 News ticker server running on port ${PORT}`);
    console.log(`📰 News API: http://localhost:${PORT}/api/news`);
    console.log(`🌐 Web interface: http://localhost:${PORT}/`);
});

module.exports = app;
