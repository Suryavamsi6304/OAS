# OAS Deployment Guide

## Quick Deployment Steps

### 1. Install Tools
```bash
npm install -g vercel @railway/cli
```

### 2. Deploy Backend (Railway)
```bash
cd backend
railway login
railway init
# Choose "Create new project" and name it "oas-backend"
railway add postgresql
railway up
railway domain
```

### 3. Set Environment Variables
After Railway deployment, set these variables:
```bash
railway variables set JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
railway variables set JWT_EXPIRES_IN=24h
railway variables set NODE_ENV=production
```

### 4. Deploy Frontend (Vercel)
```bash
cd ../frontend
# Update .env.production with your Railway URL
npm run build
vercel --prod
# Choose "Create new project" and name it "oas-frontend"
```

### 5. Update Backend CORS
After getting Vercel URL, update backend server.js:
- Add your Vercel URL to allowedOrigins
- Redeploy: `railway up`

## URLs You'll Get
- Backend: `https://oas-backend-production.up.railway.app`
- Frontend: `https://oas-frontend.vercel.app`

## Test Your Deployment
1. Visit your Vercel URL
2. Try logging in with demo credentials:
   - Admin: `admin` / `password`
   - Student: `learner1` / `password`

## Troubleshooting
- If CORS errors occur, ensure your Vercel URL is in backend allowedOrigins
- If database errors occur, check Railway PostgreSQL connection
- If build fails, ensure all dependencies are installed