@echo off
echo Starting OAS Quick Setup...

echo.
echo 1. Starting Backend Server...
cd backend
start "Backend Server" cmd /k "npm run dev"

echo.
echo 2. Waiting for backend to start...
timeout /t 5 /nobreak > nul

echo.
echo 3. Seeding database with demo data...
curl -X POST http://localhost:3001/api/seed

echo.
echo 4. Starting Frontend...
cd ..\frontend
start "Frontend Server" cmd /k "npm start"

echo.
echo Setup complete! 
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Demo credentials:
echo - Learner: learner / password
echo - Mentor: mentor / password  
echo - Admin: admin / password
pause