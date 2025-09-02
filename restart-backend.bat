@echo off
echo Stopping any existing backend processes...
taskkill /f /im node.exe 2>nul

echo Starting backend server on port 3000...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo Backend server starting...
timeout /t 3 /nobreak >nul

echo Testing server connection...
curl -X GET http://localhost:3000/api/test

echo.
echo Backend server should now be running on http://localhost:3000
echo Press any key to exit...
pause >nul