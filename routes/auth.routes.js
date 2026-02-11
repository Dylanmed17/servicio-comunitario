const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const db = req.db;

    console.log(`[LOGIN ATTEMPT] Username: ${username}`);

    db.query('SELECT * FROM usuarios WHERE username = ?', [username], (err, results) => {
        if (err) {
            console.error('[LOGIN ERROR] Database error:', err);
            return res.status(500).json({ error: err });
        }

        if (results.length === 0) {
            console.log('[LOGIN FAILED] User not found');
            return res.status(404).json({ message: 'User not found' });
        }

        const user = results[0];
        console.log(`[LOGIN DEBUG] User found: ${user.username}, Role: ${user.rol}`);
        console.log(`[LOGIN DEBUG] Stored Hash: ${user.password}`);

        const passwordIsValid = bcrypt.compareSync(password, user.password);
        console.log(`[LOGIN DEBUG] Password valid: ${passwordIsValid}`);

        if (!passwordIsValid) return res.status(401).json({ token: null, message: 'Invalid Password' });

        const token = jwt.sign({ id: user.id, role: user.rol }, process.env.JWT_SECRET, {
            expiresIn: 86400 // 24 hours
        });

        res.status(200).send({ id: user.id, username: user.username, role: user.rol, accessToken: token });
    });
});

module.exports = router;
