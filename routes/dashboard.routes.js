const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');

router.get('/stats', verifyToken, (req, res) => {
    const db = req.db;
    const today = new Date().toISOString().split('T')[0];

    // Queries
    const totalQuery = 'SELECT COUNT(*) as total FROM profesores';
    const presentQuery = 'SELECT COUNT(*) as present FROM asistencias WHERE fecha = ?';

    db.query(totalQuery, (err, totalResult) => {
        if (err) return res.status(500).json({ error: err });

        db.query(presentQuery, [today], (err, presentResult) => {
            if (err) return res.status(500).json({ error: err });

            const total = totalResult[0].total;
            const present = presentResult[0].present;
            const absent = total - present;

            res.status(200).json({
                total,
                present,
                absent
            });
        });
    });
});

module.exports = router;
