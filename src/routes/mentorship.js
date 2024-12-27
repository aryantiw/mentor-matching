const express = require('express');
const router = express.Router();
const pool = require('../database/config');
const authenticateToken = require('../middleware/auth');

router.post('/request', authenticateToken, async (req, res) => {
    try {
        const { mentorId, message } = req.body;
        
        const menteeProfile = await pool.query(
            'SELECT id FROM profiles WHERE user_id = $1',
            [req.user.userId]
        );
        
        if (menteeProfile.rows.length === 0) {
            return res.status(404).json({ error: 'Mentee profile not found' });
        }
        
        const result = await pool.query(
            `INSERT INTO mentorship_requests (mentee_id, mentor_id, message, status)
             VALUES ($1, $2, $3, 'pending')
             RETURNING id`,
            [menteeProfile.rows[0].id, mentorId, message]
        );
        
        res.status(201).json({ 
            message: 'Mentorship request sent successfully',
            requestId: result.rows[0].id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/request/:id', authenticateToken, async (req, res) => {
    try {
        const { status } = req.body;
        const requestId = req.params.id;
        
        const result = await pool.query(
            `UPDATE mentorship_requests 
             SET status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [status, requestId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Request not found' });
        }
        
        res.json({ 
            message: 'Request updated successfully',
            request: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
