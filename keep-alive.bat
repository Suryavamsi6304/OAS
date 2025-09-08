@echo off
echo Starting OAS Server with Auto-Restart...

:start
cd backend
npm start
echo Server stopped. Restarting in 5 seconds...
timeout /t 5 /nobreak
goto start