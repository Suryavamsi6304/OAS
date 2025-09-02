@echo off
echo Starting Online Assessment System...
echo.

echo Starting PostgreSQL...
net start postgresql-x64-13

echo.
echo Starting Backend Server...
cd backend
start cmd /k "npm run dev"

echo.
echo Starting Frontend Server...
cd ..\frontend
start cmd /k "npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo Demo Credentials:
echo Student: student / password
echo Admin: admin / password
echo.
echo To seed initial data, make a POST request to:
echo http://localhost:3000/api/seed
echo.
pause