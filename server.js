const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Import routes
const authRouter = require('./src/routes/auth');
const profileRouter = require('./src/routes/profile');
const mentorshipRouter = require('./src/routes/mentorship');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Use routes
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/mentorship', mentorshipRouter);

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});