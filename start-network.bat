@echo off
echo Starting Assessment Platform for Network Access...
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
echo Adding firewall rules...
netsh advfirewall firewall delete rule name="Assessment Platform" >nul 2>&1
netsh advfirewall firewall add rule name="Assessment Platform" dir=in action=allow protocol=TCP localport=3001

echo.
echo Starting Assessment Platform on port 3001...
start "Assessment Platform" cmd /k "node server.js"

echo.
echo Getting your network IP...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    for /f "tokens=1" %%b in ("%%a") do (
        echo.
        echo ========================================
        echo SHARE THIS URL WITH YOUR FRIEND:
        echo http://%%b:3001
        echo.
        echo Admin Panel: http://%%b:3001/admin
        echo Teacher Panel: http://%%b:3001/teacher
        echo Student Panel: http://%%b:3001/student
        echo ========================================
        echo.
    )
)

echo Default login: admin@assessment.com / password
echo.
echo Press any key to stop servers...
pause

echo.
echo Stopping server...
taskkill /f /im node.exe >nul 2>&1
echo Server stopped.
pause