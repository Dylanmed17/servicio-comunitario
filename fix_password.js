
require('dotenv').config();
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const passwordToSet = 'password123';
const newHash = bcrypt.hashSync(passwordToSet, 10);

console.log('Generated Hash:', newHash);
console.log('Testing Hash immediately:', bcrypt.compareSync(passwordToSet, newHash));

db.connect(err => {
    if (err) {
        console.error('Error connecting:', err);
        return;
    }
    console.log('Connected to database.');

    db.query('UPDATE usuarios SET password = ? WHERE username = ?', [newHash, 'admin'], (err, result) => {
        if (err) {
            console.error('Error updating password:', err);
        } else {
            console.log('Password updated successfully in DB. Rows affected:', result.affectedRows);

            // Verify what is in the DB
            db.query('SELECT password FROM usuarios WHERE username = ?', ['admin'], (err, results) => {
                if (err) {
                    console.error('Error fetching password:', err);
                } else {
                    const fetchedHash = results[0].password;
                    console.log('Fetched Hash from DB:', fetchedHash);
                    console.log('Comparing input password with fetched hash:', bcrypt.compareSync(passwordToSet, fetchedHash));
                }
                db.end();
            });
        }
    });
});
