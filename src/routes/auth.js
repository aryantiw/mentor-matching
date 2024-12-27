const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../database/config');

// Register route
router.post('/register', async (req, res) => {
        try {
            const { email, password } = req.body;
            
            // Validate input
            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }
            
            // Check if user exists
            const userExists = await pool.query(
                'SELECT id FROM users WHERE email = $1',
                [email]
            );
            
            if (userExists.rows.length > 0) {
                return res.status(400).json({ error: 'Email already registered' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create user
            const result = await pool.query(
                'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
                [email, hashedPassword]
            );
            
            res.status(201).json({ message: 'User registered successfully', userId: result.rows[0].id });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server error' });
        }
    
});

// Login route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await pool.query(
            'SELECT id, password_hash FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;