@echo off
echo ========================================
echo    OAS Platform Complete Setup
echo ========================================

echo.
echo 1. Starting Backend Server...
cd backend
start "OAS Backend" cmd /k "npm run dev"

echo.
echo 2. Waiting for backend to initialize...
timeout /t 5 /nobreak > nul

echo.
echo 3. Seeding database with sample data...
curl -X POST http://localhost:3001/api/seed

echo.
echo 4. Starting Frontend...
cd ..\frontend
start "OAS Frontend" cmd /k "npm start"

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo - Student/Learner: learner / password
echo - Mentor: mentor / password  
echo - Admin: admin / password
echo.
echo Features Available:
echo.
echo FOR LEARNERS:
echo - View available exams
echo - Take exams with timer
echo - View results and analytics
echo - Track performance
echo.
echo FOR MENTORS:
echo - Grade essay/coding questions
echo - View all student submissions
echo - Monitor student progress
echo - Review pending submissions
echo.
echo FOR ADMINS:
echo - Create/edit/delete exams
echo - View system analytics
echo - Manage all exams
echo - Monitor all activities
echo.
pause