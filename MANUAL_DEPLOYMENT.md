# Manual Deployment Instructions

Since CLI tools require interactive login, follow these steps manually:

## Option 1: Netlify + Render (Recommended)

### Frontend (Netlify):
1. Go to https://netlify.com and sign up/login
2. Drag and drop your `frontend/build` folder to Netlify
3. Get your URL (e.g., https://amazing-app-123.netlify.app)

### Backend (Render):
1. Go to https://render.com and sign up/login
2. Connect your GitHub repo or upload backend folder
3. Create a Web Service with these settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     ```
     NODE_ENV=production
     JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
     JWT_EXPIRES_IN=24h
     ```
4. Add PostgreSQL database from Render dashboard
5. Get your backend URL (e.g., https://oas-backend.onrender.com)

## Option 2: Vercel + Railway

### Frontend (Vercel):
1. Run: `npx vercel --prod` in frontend folder
2. Follow prompts in browser

### Backend (Railway):
1. Run: `npx @railway/cli login` in backend folder
2. Follow browser login
3. Run: `npx @railway/cli init`
4. Run: `npx @railway/cli add postgresql`
5. Run: `npx @railway/cli up`

## Final Step:
Update frontend/.env.production with your backend URL and rebuild:
```
REACT_APP_API_URL=https://your-backend-url
```

Then redeploy frontend.

## Test URLs:
- Frontend: Your Netlify/Vercel URL
- Backend: Your Render/Railway URL
- Test login: admin/password or learner1/password