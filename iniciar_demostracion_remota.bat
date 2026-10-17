@echo off
title Sistema E.B.D. Jose Antonio Gonzalez - Modo Demostracion Remota
echo =====================================================================
echo   SISTEMA DE ASISTENCIA - E.B.D. "JOSE ANTONIO GONZALEZ"
echo   MODO DEMOSTRACION REMOTA (ACCESO DESDE EL COLEGIO)
echo =====================================================================
echo.
cd /d "%~dp0"

echo [0/3] Verificando Base de Datos MySQL...
netstat -ano | findstr :3306 >nul
if errorlevel 1 (
    echo Iniciando MySQL de XAMPP...
    start /min "MySQL" cmd /c "cd /d C:\xampp && mysql\bin\mysqld --defaults-file=mysql\bin\my.ini --standalone"
    timeout /t 3 >nul
)

echo [1/3] Iniciando Servidor Principal...
start "Servidor Asistencia (Puerto 3000)" cmd /k "node server.js"

timeout /t 3 >nul

echo [2/2] Iniciando Tunel Seguro Cloudflare...
echo.
echo =====================================================================
echo   INSTRUCCIONES IMPORTANTES:
echo   1. En la ventana que se abrira, busca el enlace que termina en:
echo      .trycloudflare.com (Ej: https://xxxx-xxxx.trycloudflare.com)
echo   2. Copia ese enlace en tu telefono o llevalo anotado al colegio.
echo   3. En el colegio, abrelo en cualquier computadora o telefono.
echo   4. NO CIERRES ESTA VENTANA NI APAGUES TU PC EN CASA.
echo =====================================================================
echo.
.\cloudflared.exe tunnel --url http://localhost:3000
pause
