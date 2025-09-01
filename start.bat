@echo off
echo Starting Assessment Platform...
echo.

echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Starting backend server...
start "Backend Server" cmd /k "npm run dev"

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo.
echo Starting frontend server...
cd ..\frontend
start "Frontend Server" cmd /k "python -m http.server 3001"

echo.
echo Assessment Platform is starting...
echo.
echo Local access:
echo - Backend: http://localhost:3000
echo - Frontend: http://localhost:3001
echo.
echo Network access for friends:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo - Share this URL: http://%%b:3001
        echo - Admin panel: http://%%b:3001/admin
    )
)
echo.
echo Default login: admin@assessment.com / password
echo.
echo IMPORTANT: Friends should use port 3001 (not 3000)
echo.
pause