@echo off
echo Testing Student Functionality...

echo.
echo 1. Starting backend if not running...
cd backend
start /min "Backend" cmd /c "npm run dev"

echo.
echo 2. Waiting for backend...
timeout /t 3 /nobreak > nul

echo.
echo 3. Seeding database...
curl -X POST http://localhost:3001/api/seed

echo.
echo 4. Testing student API endpoints...
cd ..
node test-student-flow.js

echo.
echo 5. Starting frontend...
cd frontend
start "Frontend" cmd /k "npm start"

echo.
echo Debug complete! Check the test results above.
echo Frontend will open at http://localhost:3000
echo Login with: learner / password
pause