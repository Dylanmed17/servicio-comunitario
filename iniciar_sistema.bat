@echo off
title Sistema de Asistencia - E.B.D. Jose Antonio Gonzalez
echo ========================================================
echo   Iniciando Sistema de Asistencia Digital
echo   E.B.D. "Jose Antonio Gonzalez"
echo ========================================================
echo.
cd /d "%~dp0"

echo [0] Verificando Base de Datos MySQL...
netstat -ano | findstr :3306 >nul
if errorlevel 1 (
    echo Iniciando MySQL de XAMPP...
    start /min "MySQL" cmd /c "cd /d C:\xampp && mysql\bin\mysqld --defaults-file=mysql\bin\my.ini --standalone"
    timeout /t 3 >nul
)

echo 1. Iniciando Servidor Principal (Puerto 3000)...
start "Servidor Principal" cmd /k "node server.js"

timeout /t 2 >nul

echo 2. Iniciando Modo Desarrollo Vite (Puerto 5173)...
cd client
start "Vite Dev" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Acceso Principal: http://localhost:3000/
echo   Acceso Vite Dev:  http://localhost:5173/
echo ========================================================
