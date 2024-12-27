const express = require('express');
const router = express.Router();
const pool = require('../database/config');
const authenticateToken = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.*, array_agg(s.name) as skills
             FROM profiles p
             LEFT JOIN user_skills us ON p.id = us.profile_id
             LEFT JOIN skills s ON us.skill_id = s.id
             WHERE p.user_id = $1
             GROUP BY p.id`,
            [req.user.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { role, fullName, bio, skills, yearsOfExperience, currentTitle, company, linkedinUrl } = req.body;
        
        // Upsert profile
        const profileResult = await client.query(
            `INSERT INTO profiles (user_id, role, full_name, bio, years_of_experience, current_title, company, linkedin_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (user_id) DO UPDATE
             SET role = $2, full_name = $3, bio = $4, years_of_experience = $5,
                 current_title = $6, company = $7, linkedin_url = $8, updated_at = CURRENT_TIMESTAMP
             RETURNING id`,
            [req.user.userId, role, fullName, bio, yearsOfExperience, currentTitle, company, linkedinUrl]
        );
        
        // Update skills
        if (skills && skills.length > 0) {
            // Clear existing skills
            await client.query('DELETE FROM user_skills WHERE profile_id = $1',
                [profileResult.rows[0].id]);
            
            // Add new skills
            for (const skill of skills) {
                // Upsert skill
                const skillResult = await client.query(
                    `INSERT INTO skills (name) VALUES ($1)
                     ON CONFLICT (name) DO UPDATE SET name = $1
                     RETURNING id`,
                    [skill.toLowerCase()]
                );
                
                // Link skill to profile
                await client.query(
                    'INSERT INTO user_skills (profile_id, skill_id) VALUES ($1, $2)',
                    [profileResult.rows[0].id, skillResult.rows[0].id]
                );
            }
        }
        
        await client.query('COMMIT');
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

module.exports = router;