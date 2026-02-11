const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth.middleware');

// Get all personnel
router.get('/', verifyToken, (req, res) => {
    const db = req.db;
    db.query('SELECT * FROM profesores', (err, results) => {
        if (err) return res.status(500).json({ error: err });
        res.status(200).json(results);
    });
});

// Create new personnel
router.post('/', verifyToken, (req, res) => {
    const { cedula, nombre, apellido, cargo, telefono } = req.body;
    const db = req.db;
    db.query('INSERT INTO profesores (cedula, nombre, apellido, cargo, telefono) VALUES (?, ?, ?, ?, ?)',
        [cedula, nombre, apellido, cargo, telefono], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Cédula ya registrada' });
                return res.status(500).json({ error: err });
            }
            res.status(201).json({ message: 'Personal registrado exitosamente' });
        });
});

// Update personnel
router.put('/:id', verifyToken, (req, res) => {
    const { nombre, apellido, cargo, telefono, cedula } = req.body;
    const db = req.db;
    db.query('UPDATE profesores SET nombre=?, apellido=?, cargo=?, telefono=?, cedula=? WHERE id=?',
        [nombre, apellido, cargo, telefono, cedula, req.params.id], (err, result) => {
            if (err) return res.status(500).json({ error: err });
            res.status(200).json({ message: 'Personal actualizado' });
        });
});

// Delete personnel
router.delete('/:id', verifyToken, (req, res) => {
    const db = req.db;
    db.query('DELETE FROM profesores WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: err });
        res.status(200).json({ message: 'Personal eliminado' });
    });
});

module.exports = router;
