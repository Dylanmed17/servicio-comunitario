const express = require('express');
const router = express.Router();

// Mark Attendance
router.post('/', (req, res) => {
    const { cedula } = req.body;
    const db = req.db;

    // First find the professor
    db.query('SELECT id, nombre, apellido FROM profesores WHERE cedula = ?', [cedula], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Profesor no encontrado' });

        const profesor = results[0];
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });

        // Check if already checked in today
        db.query('SELECT * FROM asistencias WHERE id_profesor = ? AND fecha = ?', [profesor.id, today], (err, attendanceResults) => {
            if (err) return res.status(500).json({ error: err });

            if (attendanceResults.length > 0) {
                // Already checked in, check if checked out
                const attendance = attendanceResults[0];
                if (attendance.hora_salida) {
                    return res.status(400).json({ message: 'Ya has registrado tu salida hoy.' });
                } else {
                    // Mark check out
                    db.query('UPDATE asistencias SET hora_salida = ? WHERE id = ?', [now, attendance.id], (err) => {
                        if (err) return res.status(500).json({ error: err });
                        return res.status(200).json({ message: `Salida registrada para ${profesor.nombre} ${profesor.apellido}` });
                    });
                }
            } else {
                // Mark check in
                db.query('INSERT INTO asistencias (id_profesor, fecha, hora_entrada) VALUES (?, ?, ?)', [profesor.id, today, now], (err) => {
                    if (err) return res.status(500).json({ error: err });
                    return res.status(200).json({ message: `Entrada registrada para ${profesor.nombre} ${profesor.apellido}` });
                });
            }
        });
    });
});

module.exports = router;
