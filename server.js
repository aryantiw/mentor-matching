const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes (we'll create these files next)
app.use('/api/auth', require('./src/routes/auth'));
app.use('/api/profile', require('./src/routes/profile'));
app.use('/api/mentorship', require('./src/routes/mentorship'));

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});