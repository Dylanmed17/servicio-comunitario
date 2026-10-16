@echo off
title Sistema de Asistencia - E.B.D. Jose Antonio Gonzalez
echo ========================================================
echo   Iniciando Sistema de Asistencia Digital
echo   E.B.D. "Jose Antonio Gonzalez"
echo ========================================================
echo.
echo 1. Iniciando Servidor Backend (Puerto 3000)...
start "Backend - Servidor Node" cmd /k "node server.js"

timeout /t 2 >nul

echo 2. Iniciando Frontend Vite (Puerto 5173 - Red Local)...
cd client
start "Frontend - Vite" cmd /k "npm run dev"

echo.
echo ========================================================
echo   Todo listo! Los servidores estan abiertos.
echo ========================================================
