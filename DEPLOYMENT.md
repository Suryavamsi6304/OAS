# Deployment Guide

## Backend Deployment (Render)

### 1. Prepare Repository
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Deploy to Render
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `oas-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Add Environment Variables
In Render dashboard, add these environment variables:
```
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=24h
```

### 4. Add PostgreSQL Database
1. In Render dashboard, click "New +" → "PostgreSQL"
2. Name: `oas-postgres`
3. Plan: Free
4. After creation, copy connection details to backend env vars:
   - `DB_HOST`
   - `DB_PORT` 
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`

### 5. Your backend will be available at:
`https://your-app-name.onrender.com`

## Frontend Deployment (Netlify)

### 1. Update Production Environment
Update `frontend/.env.production` with your Render backend URL:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

### 2. Deploy to Netlify

#### Option A: Drag & Drop
1. Build the project locally:
   ```bash
   cd frontend
   npm run build
   ```
2. Go to [netlify.com](https://netlify.com)
3. Drag the `build` folder to Netlify

#### Option B: Git Integration
1. Go to [netlify.com](https://netlify.com) and login
2. Click "New site from Git"
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

### 3. Configure Environment Variables
In Netlify dashboard → Site settings → Environment variables:
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

### 4. Your frontend will be available at:
`https://your-site-name.netlify.app`

## Post-Deployment Setup

### 1. Create Admin User
Access your backend URL and create admin:
```bash
curl -X POST https://your-backend-url.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@oas.com", 
    "password": "your_secure_password",
    "name": "System Administrator",
    "role": "admin"
  }'
```

### 2. Test the Application
1. Visit your Netlify frontend URL
2. Login with admin credentials
3. Create test users and exams

## Environment Variables Summary

### Backend (Render)
```
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=24h
DB_HOST=your_postgres_host
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### Frontend (Netlify)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
GENERATE_SOURCEMAP=false
CI=false
```

## Troubleshooting

### Backend Issues
- Check Render logs for errors
- Verify database connection
- Ensure all environment variables are set

### Frontend Issues
- Check browser console for API errors
- Verify REACT_APP_API_URL is correct
- Check Netlify build logs

### CORS Issues
The backend is configured to allow all origins in production. If you face CORS issues, update the CORS configuration in `server.js`.

## Custom Domain (Optional)

### Netlify
1. Go to Site settings → Domain management
2. Add custom domain
3. Configure DNS records

### Render
1. Go to Settings → Custom Domains
2. Add your domain
3. Configure DNS records

## SSL/HTTPS
Both Netlify and Render provide free SSL certificates automatically.