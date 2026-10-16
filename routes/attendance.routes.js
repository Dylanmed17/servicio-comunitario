const express = require('express');
const router = express.Router();

// Helper to get local date in YYYY-MM-DD
const getLocalDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 1. Mark Attendance (Manual Cédula Input)
router.post('/', (req, res) => {
    const { cedula } = req.body;
    const db = req.db;

    if (!cedula) return res.status(400).json({ message: 'Por favor ingrese su cédula.' });

    // First find the professor
    db.query('SELECT id, nombre, apellido FROM profesores WHERE cedula = ?', [cedula.trim()], (err, results) => {
        if (err) return res.status(500).json({ error: err });
        if (results.length === 0) return res.status(404).json({ message: 'Profesor no encontrado en nómina.' });

        const profesor = results[0];
        const today = getLocalDateString();
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });

        // Check if already checked in today
        db.query('SELECT * FROM asistencias WHERE id_profesor = ? AND fecha = ?', [profesor.id, today], (err, attendanceResults) => {
            if (err) return res.status(500).json({ error: err });

            if (attendanceResults.length > 0) {
                const attendance = attendanceResults[0];
                if (attendance.hora_salida) {
                    return res.status(400).json({ message: `Ya has registrado tu salida hoy (${attendance.hora_salida}).` });
                } else {
                    // Mark check out
                    db.query('UPDATE asistencias SET hora_salida = ? WHERE id = ?', [now, attendance.id], (err) => {
                        if (err) return res.status(500).json({ error: err });
                        return res.status(200).json({
                            type: 'Salida',
                            profesor: { nombre: profesor.nombre, apellido: profesor.apellido, cedula },
                            hora: now,
                            message: `Salida registrada para ${profesor.nombre} ${profesor.apellido}`
                        });
                    });
                }
            } else {
                // Mark check in
                db.query('INSERT INTO asistencias (id_profesor, fecha, hora_entrada) VALUES (?, ?, ?)', [profesor.id, today, now], (err) => {
                    if (err) return res.status(500).json({ error: err });
                    return res.status(200).json({
                        type: 'Entrada',
                        profesor: { nombre: profesor.nombre, apellido: profesor.apellido, cedula },
                        hora: now,
                        message: `Entrada registrada para ${profesor.nombre} ${profesor.apellido}`
                    });
                });
            }
        });
    });
});

// 2. QR Scan Attendance & Auto-Registration
router.post('/qr-scan', async (req, res) => {
    let { cedula, nombre, apellido } = req.body;
    const db = req.db;

    if (!cedula) {
        return res.status(400).json({ message: 'La cédula es requerida.' });
    }

    cedula = cedula.trim();

    try {
        // Find professor by cedula
        const [profResults] = await db.promise().query(
            'SELECT id, nombre, apellido, cargo FROM profesores WHERE cedula = ?',
            [cedula]
        );

        let profesor;
        let isNew = false;

        if (profResults.length === 0) {
            // Not registered yet
            if (!nombre || !apellido) {
                return res.status(200).json({
                    needsRegistration: true,
                    cedula,
                    message: 'Esta cédula no está registrada aún. Ingrese su Nombre y Apellido para completar su registro inicial.'
                });
            }

            // Create new professor automatically
            const [insertResult] = await db.promise().query(
                'INSERT INTO profesores (cedula, nombre, apellido, cargo) VALUES (?, ?, ?, ?)',
                [cedula, nombre.trim(), apellido.trim(), 'Docente']
            );

            profesor = {
                id: insertResult.insertId,
                nombre: nombre.trim(),
                apellido: apellido.trim(),
                cargo: 'Docente'
            };
            isNew = true;

            // Generate default Monday-Friday schedule
            const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            for (const dia of dias) {
                await db.promise().query(
                    'INSERT INTO horarios (id_profesor, dia_semana, entrada_asignada, salida_asignada) VALUES (?, ?, ?, ?)',
                    [profesor.id, dia, '07:00:00', '13:00:00']
                );
            }
        } else {
            profesor = profResults[0];
        }

        // Mark today's attendance
        const today = getLocalDateString();
        const now = new Date().toLocaleTimeString('en-US', { hour12: false });

        const [attendanceResults] = await db.promise().query(
            'SELECT * FROM asistencias WHERE id_profesor = ? AND fecha = ?',
            [profesor.id, today]
        );

        if (attendanceResults.length > 0) {
            const attendance = attendanceResults[0];
            if (attendance.hora_salida) {
                return res.status(200).json({
                    alreadyCompleted: true,
                    type: 'Completado',
                    profesor: {
                        cedula,
                        nombre: profesor.nombre,
                        apellido: profesor.apellido
                    },
                    horaEntrada: attendance.hora_entrada,
                    horaSalida: attendance.hora_salida,
                    message: `Ya has registrado tu entrada (${attendance.hora_entrada}) y salida (${attendance.hora_salida}) el día de hoy.`
                });
            } else {
                // Mark check out
                await db.promise().query(
                    'UPDATE asistencias SET hora_salida = ? WHERE id = ?',
                    [now, attendance.id]
                );
                return res.status(200).json({
                    type: 'Salida',
                    isNew,
                    profesor: {
                        cedula,
                        nombre: profesor.nombre,
                        apellido: profesor.apellido
                    },
                    hora: now,
                    message: `¡Hasta luego! Salida registrada exitosamente.`
                });
            }
        } else {
            // Mark check in
            await db.promise().query(
                'INSERT INTO asistencias (id_profesor, fecha, hora_entrada) VALUES (?, ?, ?)',
                [profesor.id, today, now]
            );
            return res.status(200).json({
                type: 'Entrada',
                isNew,
                profesor: {
                    cedula,
                    nombre: profesor.nombre,
                    apellido: profesor.apellido
                },
                hora: now,
                message: isNew
                    ? `¡Registro completado y Entrada marcada con éxito!`
                    : `¡Bienvenido(a)! Entrada registrada con éxito.`
            });
        }
    } catch (err) {
        console.error('Error in /qr-scan:', err);
        return res.status(500).json({ error: err.message || 'Error del servidor al procesar escaneo.' });
    }
});

module.exports = router;
