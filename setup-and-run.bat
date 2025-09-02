@echo off
echo ========================================
echo   OAS - Automated Setup and Run
echo ========================================
echo.

echo [1/5] Installing Backend Dependencies...
cd backend
call npm install sqlite3 --save
echo Backend dependencies installed!
echo.

echo [2/5] Installing Frontend Dependencies...
cd ..\frontend
call npm install
echo Frontend dependencies installed!
echo.

echo [3/5] Starting Backend Server...
cd ..\backend
start "OAS Backend" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo.

echo [4/5] Creating Demo Data...
curl -X POST http://localhost:3000/api/seed 2>nul || echo Demo data will be created when backend starts
echo.

echo [5/5] Starting Frontend...
cd ..\frontend
start "OAS Frontend" cmd /k "npm start"
echo.

echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Demo Login Credentials:
echo Student: student / password
echo Admin:   admin / password
echo.
echo Press any key to exit...
pause >nul