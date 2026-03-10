const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');

// 1. GET STATS (TOTAL, PRESENTES, AUSENTES, RETRASOS)
router.get('/stats', verifyToken, async (req, res) => {
    const db = req.db;
    // const today = new Date().toISOString().split('T')[0]; // Current date
    // PARA PRUEBAS usar la última fecha del seed (9 de Marzo de 2026) o fecha actual si hay datos
    const today = '2026-03-09'; 

    try {
        const [totalResult] = await db.promise().query('SELECT COUNT(*) as total FROM profesores');
        const [presentResult] = await db.promise().query(`
            SELECT a.*, h.entrada_asignada 
            FROM asistencias a 
            JOIN horarios h ON a.id_profesor = h.id_profesor AND h.dia_semana = 'Lunes' 
            WHERE a.fecha = ?
        `, [today]); // MONDAY for March 9, 2026 hardcoded or dynamic based on date

        let present = 0;
        let retrasos = 0;

        presentResult.forEach(row => {
            present++; // Al menos vino
            if (row.hora_entrada && row.entrada_asignada) {
                // simple string comparison for "HH:MM:SS"
                if (row.hora_entrada > row.entrada_asignada) {
                    retrasos++;
                }
            }
        });

        const total = totalResult[0].total;
        const absent = total - present;

        res.status(200).json({
            total,
            present,
            absent,
            retrasos
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 2. GET TODAY'S ATTENDANCE (TIMELINE)
router.get('/attendances/today', verifyToken, async (req, res) => {
    const db = req.db;
    const today = '2026-03-09'; 
    try {
        const query = `
            SELECT 
                a.id, 
                p.nombre, 
                p.apellido, 
                p.cedula,
                a.hora_entrada, 
                a.hora_salida, 
                h.entrada_asignada,
                a.observaciones
            FROM asistencias a
            JOIN profesores p ON a.id_profesor = p.id
            LEFT JOIN horarios h ON a.id_profesor = h.id_profesor AND h.dia_semana = 'Lunes'
            WHERE a.fecha = ?
            ORDER BY a.hora_entrada DESC
        `;
        const [results] = await db.promise().query(query, [today]);
        
        const formatTime = (timeStr) => {
            if (!timeStr) return null;
            const [h, m] = timeStr.split(':');
            const date = new Date();
            date.setHours(parseInt(h), parseInt(m), 0);
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        };

        const timeline = [];
        results.forEach(row => {
            // Determine Status
            let estado = 'A tiempo';
            if (row.observaciones === 'Reposo Médico') {
                estado = 'Reposo Médico';
            } else if (row.hora_entrada > row.entrada_asignada) {
                estado = 'Retraso';
            }

            // Push Entrada
            if (row.hora_entrada || estado === 'Reposo Médico') {
                timeline.push({
                    id: row.id + '_in',
                    nombre: `${row.nombre} ${row.apellido}`,
                    tipo: estado === 'Reposo Médico' ? 'Justificado' : 'Entrada',
                    hora: formatTime(row.hora_entrada) || '--:--',
                    estado: estado,
                    observaciones: row.observaciones
                });
            }
            // Push Salida
            if (row.hora_salida) {
                timeline.push({
                    id: row.id + '_out',
                    nombre: `${row.nombre} ${row.apellido}`,
                    tipo: 'Salida',
                    hora: formatTime(row.hora_salida),
                    estado: 'Completado',
                    observaciones: row.observaciones
                });
            }
        });

        res.status(200).json(timeline);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// 3. GET HISTORICAL ATTENDANCE (Con Filtros Dinámicos)
router.get('/attendances/history', verifyToken, async (req, res) => {
    const db = req.db;
    const { startDate, endDate, cedula, estado } = req.query;

    try {
        let query = `
            SELECT 
                a.id,
                a.fecha, 
                p.cedula,
                p.nombre, 
                p.apellido, 
                a.hora_entrada, 
                a.hora_salida, 
                a.observaciones
            FROM asistencias a
            JOIN profesores p ON a.id_profesor = p.id
            WHERE 1=1
        `;
        
        const params = [];

        if (startDate && endDate) {
            query += ` AND a.fecha BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        if (cedula && cedula !== '') { // Use LIKE for autocomplete searching
            query += ` AND p.cedula LIKE ?`;
            params.push(`%${cedula}%`);
        }

        query += ` ORDER BY a.fecha DESC, a.hora_entrada DESC LIMIT 500`;

        const [results] = await db.promise().query(query, params);

        // Map abstract state in Javascript (Ya que Ausente no existe en DB, Ausente debe calcularse de otra forma si se pide)
        // Para simplificar, devolvemos todos los filtrados por DB y aplicamos el filtro de "Estado" en memoria si existe
        
        let finalResults = results.map(row => {
            // Formatear fecha YYYY-MM-DD local
            const dateObj = new Date(row.fecha);
            const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000).toISOString().split('T')[0];
            
            let currentStatus = 'A tiempo';
            if (row.observaciones === 'Reposo Médico') currentStatus = 'Reposo Médico';
            // Para simplificar, si entró después de las 07:05 (margen de gracia)
            else if (row.hora_entrada > '07:05:00') currentStatus = 'Retraso';

            return {
                id: row.id,
                fecha: localDate,
                cedula: row.cedula,
                nombre: `${row.nombre} ${row.apellido}`,
                hora_entrada: row.hora_entrada,
                hora_salida: row.hora_salida,
                estado: currentStatus,
                observaciones: row.observaciones
            };
        });

        if (estado && estado !== 'Todos') {
            finalResults = finalResults.filter(r => r.estado === estado);
        }

        res.status(200).json(finalResults);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
