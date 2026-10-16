require('dotenv').config();
const os = require('os');
const path = require('path');
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/auth.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const personnelRoutes = require('./routes/personnel.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database Connection
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('    ✅ Base de Datos:   Conectada Exitosamente!');
        connection.release();
    }
});

// Make db accessible to routers
app.use((req, res, next) => {
    req.db = db;
    next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/personnel', personnelRoutes);

// Stat route (protected)
app.use('/api/dashboard', require('./routes/dashboard.routes'));

// Network info endpoint (to provide LAN IP for QR codes)
app.get('/api/network-ip', (req, res) => {
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
                break;
            }
        }
    }
    res.json({ ip: localIp });
});

// Serve static frontend files from client/dist if available
const distPath = path.join(__dirname, 'client', 'dist');
app.use(express.static(distPath));

// For all non-API routes, send index.html (SPA routing compatible with Express 5)
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
});

// Start server
// Start server
app.listen(PORT, () => {
    // Get local IP address
    const interfaces = os.networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                localIp = iface.address;
                break;
            }
        }
    }

    console.log(`
    🚀 Servidor Iniciado Exitosamente!
    -----------------------------------
    📡 Local:           http://localhost:${PORT}
    🌐 En tu red (IP):  http://${localIp}:${PORT}
    -----------------------------------
    🔧 Base de Datos:   Conectando...
    `);
});
