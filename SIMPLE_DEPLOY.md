# Simple Deployment Guide

## Backend (Render - Manual Upload)

1. **Go to https://render.com**
2. **Sign up/Login**
3. **Click "New +" → "Web Service"**
4. **Choose "Deploy without Git"**
5. **Upload your backend folder as ZIP**
6. **Configure:**
   ```
   Name: oas-backend
   Build Command: npm install
   Start Command: npm start
   ```
7. **Add Environment Variables:**
   ```
   NODE_ENV=production
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure_12345
   JWT_EXPIRES_IN=24h
   ```
8. **Add PostgreSQL:**
   - New + → PostgreSQL
   - Copy Internal Database URL
   - Add as DATABASE_URL to web service

## Alternative: Use Railway.app

1. **Go to https://railway.app**
2. **Login with GitHub**
3. **New Project → Deploy from GitHub repo**
4. **Select your repo → backend folder**
5. **Add PostgreSQL addon**
6. **Set environment variables**

## Your URLs:
- Frontend: https://monumental-kataifi-3b4c02.netlify.app
- Backend: (Will get after deployment)

## Final Step:
Update frontend .env.production with backend URL and redeploy to Netlify.