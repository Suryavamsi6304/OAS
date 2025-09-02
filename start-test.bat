@echo off
echo Starting OAS for Testing...

echo.
echo 1. Starting Backend...
cd backend
start "Backend" cmd /k "node server.js"

echo.
echo 2. Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo 3. Testing backend connection...
node ../test-backend.js

echo.
echo 4. Starting Frontend...
cd ../frontend
start "Frontend" cmd /k "npm start"

echo.
echo Both servers should be starting now!
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Try logging in with: learner / password
pause