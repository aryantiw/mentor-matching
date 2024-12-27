const jwt = require('jsonwebtoken');
require('dotenv').config();

const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET);
console.log('Generated token:', token);

// Verify token
jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
        console.error('Token verification failed:', err);
    } else {
        console.log('Token verified, decoded:', decoded);
    }
});