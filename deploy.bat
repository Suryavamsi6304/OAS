@echo off
echo Starting OAS Deployment...

echo.
echo Step 1: Installing deployment tools...
npm install -g vercel @railway/cli

echo.
echo Step 2: Deploying Backend to Railway...
cd backend
call railway login
call railway init
call railway add postgresql
call railway up
call railway domain

echo.
echo Step 3: Building Frontend...
cd ..\frontend
call npm run build

echo.
echo Step 4: Deploying Frontend to Vercel...
call vercel --prod

echo.
echo Deployment Complete!
echo Please update your backend CORS settings with the Vercel URL
pause