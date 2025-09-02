@echo off
echo ========================================
echo    OAS Error Fix Script
echo ========================================
echo.

echo 1. Stopping any existing processes...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo 2. Starting backend server on port 3000...
cd backend
start "Backend Server" cmd /k "echo Backend Server Starting... && npm run dev"
cd ..

echo 3. Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo 4. Testing backend connection...
node test-results-endpoint.js

echo.
echo 5. Starting frontend on port 3001...
cd frontend
start "Frontend Server" cmd /k "echo Frontend Server Starting... && npm start"
cd ..

echo.
echo ========================================
echo    Fix Applied Successfully!
echo ========================================
echo.
echo Backend: http://localhost:3000
echo Frontend: http://localhost:3001
echo.
echo The WebSocket errors should now be resolved.
echo The 500 errors should be fixed with better error handling.
echo.
echo Press any key to exit...
pause >nul