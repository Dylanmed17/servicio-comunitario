# Plan de Implementación - Sistema de Gestión de Asistencia Digital

## Descripción del Objetivo
Construir un sistema de asistencia digital para la U.E.N. "Cardenal José Humberto Quintero" con un enfoque en una base de datos MySQL normalizada y un frontend "mobile-first" (HTML/CSS/JS).

## Cambios Propuestos

## Cambios Propuestos

### Stack Tecnológico
- **Frontend**: Vite + React + Tailwind CSS + Shadcn UI.
- **Backend**: Node.js + Express + MySQL.
- **Autenticación**: JWT (JSON Web Tokens).

### Base de Datos
#### [NUEVO] [database.sql](file:///c:/Users/medin/OneDrive/Desktop/Servicio%20comunitario/database.sql)
- Tablas: `profesores`, `horarios`, `asistencias`, `usuarios`.
- **Seed**: Insertar usuario Admin por defecto (Username: `admin`, Password: `password123` hasheado).

### Backend (Node.js/Express)
#### [NUEVO] [package.json](file:///c:/Users/medin/OneDrive/Desktop/Servicio%20comunitario/package.json)
- Dependencias: `express`, `mysql2`, `body-parser`, `cors`, `jsonwebtoken`, `bcryptjs`.

#### [NUEVO] [server.js](file:///c:/Users/medin/OneDrive/Desktop/Servicio%20comunitario/server.js)
- API Endpoints:
    - `POST /api/auth/login`: Login para administradores.
    - `POST /api/attendance`: Marcar asistencia (Público).
    - `GET /api/dashboard/stats`: Estadísticas (Protegido).
    - `GET /api/personnel`: CRUD Personal (Protegido).
- Middleware de Autenticación para rutas protegidas.

### Frontend (React + Vite)
*Se inicializará en la carpeta `client` o raíz según preferencia, usaremos la raíz para simplificar si es posible, o una estructura `client/server`.*

#### [NUEVO] Estructura Vite
- `src/App.jsx`: Configuración de Rutas (React Router).
- `src/components/ui`: Componentes Shadcn (Button, Card, Input, Table, etc.).
- `src/pages/Login.jsx`: Pantalla de inicio de sesión para administradores.
- `src/pages/Attendance.jsx`: Pantalla pública de marcado rápido (Identidad Visual: Rojo/Negro/Blanco).
- `src/pages/Dashboard.jsx`: Panel protegido con diseño modular (Sidebar Layout).
    - **Navegación Lateral (Sidebar):** Menú para cambiar de vistas.
    - **Header/Tarjetas Fijas:** Resumen diario (Total, Presentes, Ausentes, Retrasos).
    - **Vista 1: Monitoreo:** Incluye botón Toggle para alternar entre "Timeline Dinámico" y "Tabla de Datos".
    - **Vista 2: Personal (Gestión):** Tabla y formulario interactivo para CRUD de empleados (Manteniendo la funcionalidad actual).

## Plan de Verificación
1. **Instalación**: `npm install` tanto en server como en cliente.
2. **Base de Datos**: Ejecutar `database.sql` y verificar usuario admin.
3. **Flujo de Asistencia**: Probar marcado rápido sin login.
4. **Flujo de Admin**:
    - Intentar acceder a `/dashboard` sin login -> Redirige a login.
    - Login con credenciales incorrectas -> Error.
    - Login con `admin` -> Acceso permitido.
5. **Funcionalidad Dashboard**: Crear/Editar/Eliminar un empleado y ver cambios reflejados.
