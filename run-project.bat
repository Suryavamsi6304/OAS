@echo off
echo ========================================
echo   Starting OAS Project
echo ========================================

echo [1/2] Starting Backend Server (Port 3001)...
cd backend
start "OAS Backend" cmd /k "node server.js"
timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend (Port 3000)...
cd ..\frontend
start "OAS Frontend" cmd /k "npm start"

echo.
echo ========================================
echo   Project Started Successfully!
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Frontend:    http://localhost:3000
echo.
echo Login Credentials:
echo Student: student / password
echo Admin:   admin / password
echo.
echo To create demo data, visit:
echo http://localhost:3001/api/seed
echo.
pause