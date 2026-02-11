CREATE DATABASE IF NOT EXISTS asistencia_db;
USE asistencia_db;

-- Tabla de Usuarios (Admin/Staff)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'staff') DEFAULT 'staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Profesores/Personal
CREATE TABLE IF NOT EXISTS profesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cargo VARCHAR(50),
    telefono VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Horarios
CREATE TABLE IF NOT EXISTS horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo') NOT NULL,
    entrada_asignada TIME NOT NULL,
    salida_asignada TIME NOT NULL,
    FOREIGN KEY (id_profesor) REFERENCES profesores(id) ON DELETE CASCADE
);

-- Tabla de Asistencias
CREATE TABLE IF NOT EXISTS asistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_profesor INT NOT NULL,
    fecha DATE NOT NULL,
    hora_entrada TIME,
    hora_salida TIME,
    observaciones TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_profesor) REFERENCES profesores(id) ON DELETE CASCADE
);

-- Seed de Usuario Administrador
-- Password: password123
INSERT INTO usuarios (username, password, rol) VALUES 
('admin', '$2b$10$gMPQZGKpln5VThkLXJHJxup5HLSrbGgSg8DhDkQWBuDqh/aAXrkB', 'admin')
ON DUPLICATE KEY UPDATE password=VALUES(password);
