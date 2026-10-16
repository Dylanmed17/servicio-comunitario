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

// Helper for 12-hour format display with AM/PM
const formatTime12 = (timeStr) => {
    if (!timeStr) return '--:--';
    const parts = timeStr.toString().split(':');
    if (parts.length < 2) return timeStr;
    const hour = parseInt(parts[0], 10);
    const m = parts[1];
    const s = parts[2] ? `:${parts[2]}` : '';
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    const padHour = String(formattedHour).padStart(2, '0');
    return `${padHour}:${m}${s} ${ampm}`;
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
            try {
                const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
                for (const dia of dias) {
                    await db.promise().query(
                        'INSERT INTO horarios (id_profesor, dia_semana, entrada_asignada, salida_asignada) VALUES (?, ?, ?, ?)',
                        [profesor.id, dia, '07:00:00', '13:00:00']
                    ).catch(async () => {
                        // fallback with accent if DB schema requires Miércoles
                        await db.promise().query(
                            'INSERT INTO horarios (id_profesor, dia_semana, entrada_asignada, salida_asignada) VALUES (?, ?, ?, ?)',
                            [profesor.id, dia === 'Miercoles' ? 'Miércoles' : dia, '07:00:00', '13:00:00']
                        ).catch(() => {});
                    });
                }
            } catch (scheduleErr) {
                console.warn('Could not insert default schedule:', scheduleErr.message);
            }
        } else {
            profesor = profResults[0];
        }

        // Exact date and local time
        const today = getLocalDateString();
        const nowObj = new Date();
        const nowTime = nowObj.toTimeString().split(' ')[0]; // 'HH:MM:SS'
        const displayTime = formatTime12(nowTime);

        // CASE 1: First time registration -> MUST ONLY mark Entrada!
        if (isNew) {
            await db.promise().query(
                'INSERT INTO asistencias (id_profesor, fecha, hora_entrada) VALUES (?, ?, ?)',
                [profesor.id, today, nowTime]
            );
            return res.status(200).json({
                type: 'Entrada',
                isNew: true,
                profesor: {
                    cedula,
                    nombre: profesor.nombre,
                    apellido: profesor.apellido
                },
                hora: displayTime,
                message: `¡Registro completado exitosamente! Entrada marcada a las ${displayTime}.`
            });
        }

        // CASE 2: Subsequent scans for existing professor
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
                    horaEntrada: formatTime12(attendance.hora_entrada),
                    horaSalida: formatTime12(attendance.hora_salida),
                    message: `Ya has completado tu jornada de hoy. Entrada: ${formatTime12(attendance.hora_entrada)} | Salida: ${formatTime12(attendance.hora_salida)}.`
                });
            } else {
                // Mark check out
                await db.promise().query(
                    'UPDATE asistencias SET hora_salida = ? WHERE id = ?',
                    [nowTime, attendance.id]
                );
                return res.status(200).json({
                    type: 'Salida',
                    isNew: false,
                    profesor: {
                        cedula,
                        nombre: profesor.nombre,
                        apellido: profesor.apellido
                    },
                    hora: displayTime,
                    message: `¡Hasta luego! Salida registrada a las ${displayTime}.`
                });
            }
        } else {
            // First scan of the day -> Mark check in
            await db.promise().query(
                'INSERT INTO asistencias (id_profesor, fecha, hora_entrada) VALUES (?, ?, ?)',
                [profesor.id, today, nowTime]
            );
            return res.status(200).json({
                type: 'Entrada',
                isNew: false,
                profesor: {
                    cedula,
                    nombre: profesor.nombre,
                    apellido: profesor.apellido
                },
                hora: displayTime,
                message: `¡Bienvenido(a)! Entrada registrada a las ${displayTime}.`
            });
        }
    } catch (err) {
        console.error('Error in /qr-scan:', err);
        return res.status(500).json({ 
            message: err.message || 'Error del servidor al procesar escaneo.',
            error: err.message || 'Error del servidor al procesar escaneo.'
        });
    }
});

module.exports = router;
