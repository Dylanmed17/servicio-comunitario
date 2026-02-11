# Guía de Instalación y Uso - Sistema de Gestión de Asistencia

## Requisitos Previos
- Node.js (v14 o superior)
- MySQL Server

## Paso 1: Configuración de Base de Datos
1. Abra su cliente de MySQL (Workbench, PHPMyAdmin, o terminal).
2. Ejecute el script [database.sql](file:///c:/Users/medin/OneDrive/Desktop/Servicio%20comunitario/database.sql) ubicado en la raíz del proyecto.
   - Esto creará la base de datos `asistencia_db` y las tablas necesarias.
   - Creará un usuario administrador por defecto.

## Paso 2: Configuración del Backend
1. Abra una terminal en la carpeta raíz del proyecto (`Servicio comunitario`).
2. Instale las dependencias:
   ```bash
   npm install
   ```
3. Configure el archivo [.env](file:///c:/Users/medin/OneDrive/Desktop/Servicio%20comunitario/.env) si es necesario (por defecto usa `root` sin contraseña en localhost).
4. Inicie el servidor:
   ```bash
   node server.js
   ```
   *El servidor correrá en http://localhost:3000*

## Paso 3: Configuración del Frontend
1. Abra **otra** terminal y navegue a la carpeta `client`:
   ```bash
   cd client
   ```
2. Instale las dependencias:
   ```bash
   npm install
   ```
3. Inicie la aplicación de desarrollo:
   ```bash
   npm run dev
   ```
4. Abra el enlace que aparece (usualmente http://localhost:5173).

## Guía de Uso

### 1. Panel Administrativo (Dashboard)
- Vaya a `/login` o intente acceder a `/dashboard`.
- **Credenciales por defecto**:
  - Usuario: `admin`
  - Contraseña: `password123`
- **Funciones**:
  - Ver estadísticas de asistencia.
  - Registrar nuevo personal (Profesores, Administrativos, Obreros).
  - Editar o Eliminar personal.

### 2. Registro de Asistencia (Público)
- En la página principal (`/`), los empleados pueden ingresar su **Cédula**.
- El sistema registrará la **Entrada** automáitcamente.
- Si vuelven a ingresar la cédula el mismo día, registrará la **Salida**.
