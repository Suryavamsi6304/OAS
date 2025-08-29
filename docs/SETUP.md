# Setup Guide - Online Assessment Platform

This guide will help you set up the Online Assessment Platform on your local machine or server.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher)
- **npm** (v6.0.0 or higher)
- **PostgreSQL** (v12.0 or higher)
- **Git** (for cloning the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd assessment-platform
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### 3. Database Setup

```bash
# Create database (using PostgreSQL command line)
createdb assessment_platform

# Or using psql
psql -U postgres
CREATE DATABASE assessment_platform;
\q

# Run database schema
psql -d assessment_platform -f ../database/schema.sql
```

### 4. Environment Configuration

Edit the `.env` file in the backend directory:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
JWT_EXPIRES_IN=24h

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=assessment_platform
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### 5. Start the Backend Server

```bash
# Development mode (with auto-restart)
npm run dev

# Or production mode
npm start
```

The backend server will start on `http://localhost:3000`

### 6. Frontend Setup

```bash
# Navigate to frontend directory
cd ../frontend

# Serve static files (choose one method)

# Method 1: Using Python (if installed)
python -m http.server 3001

# Method 2: Using Node.js serve package
npx serve -p 3001 .

# Method 3: Using any other static file server
```

The frontend will be available at `http://localhost:3001`

## Detailed Setup Instructions

### Database Configuration

#### Option 1: Local PostgreSQL Installation

1. **Install PostgreSQL**
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - macOS: `brew install postgresql`
   - Linux: `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL Service**
   ```bash
   # macOS/Linux
   sudo service postgresql start
   
   # Windows (run as administrator)
   net start postgresql-x64-14
   ```

3. **Create Database and User**
   ```sql
   -- Connect as postgres user
   psql -U postgres
   
   -- Create database
   CREATE DATABASE assessment_platform;
   
   -- Create user (optional)
   CREATE USER assessment_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE assessment_platform TO assessment_user;
   
   -- Exit
   \q
   ```

#### Option 2: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run --name assessment-postgres \
  -e POSTGRES_DB=assessment_platform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:13

# Wait for container to start, then run schema
docker exec -i assessment-postgres psql -U postgres -d assessment_platform < database/schema.sql
```

### Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Secret key for JWT tokens | `your_secret_key_here` |
| `JWT_EXPIRES_IN` | Token expiration time | `24h`, `7d`, `30m` |
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `assessment_platform` |
| `DB_USER` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `CORS_ORIGIN` | Frontend URL for CORS | `http://localhost:3001` |

### Default User Accounts

The system comes with a default admin account:

- **Email**: `admin@assessment.com`
- **Password**: `password`
- **Role**: Admin

**Important**: Change the default password immediately after first login!

## Verification Steps

### 1. Backend Health Check

```bash
# Test if backend is running
curl http://localhost:3000/api/auth/verify

# Should return authentication error (expected)
```

### 2. Database Connection Test

```bash
# Check if database is accessible
psql -d assessment_platform -c "SELECT COUNT(*) FROM users;"

# Should return count of users (at least 1 for admin)
```

### 3. Frontend Access Test

1. Open browser and navigate to `http://localhost:3001`
2. You should see the login page
3. Try logging in with admin credentials

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error**: `ECONNREFUSED` or `database does not exist`

**Solutions**:
- Ensure PostgreSQL is running: `sudo service postgresql status`
- Check database exists: `psql -l | grep assessment_platform`
- Verify credentials in `.env` file
- Check firewall settings

#### 2. Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
- Kill process using port: `lsof -ti:3000 | xargs kill -9`
- Use different port in `.env` file
- Check for other running applications

#### 3. JWT Secret Error

**Error**: `secretOrPrivateKey has a value`

**Solutions**:
- Ensure `JWT_SECRET` is set in `.env`
- Make JWT secret at least 32 characters long
- Restart the server after changing `.env`

#### 4. CORS Error

**Error**: `Access to fetch at 'http://localhost:3000' from origin 'http://localhost:3001' has been blocked by CORS policy`

**Solutions**:
- Check `CORS_ORIGIN` in `.env` matches frontend URL
- Ensure backend server is running
- Clear browser cache

#### 5. Frontend Not Loading

**Solutions**:
- Check if static file server is running
- Verify port 3001 is not blocked
- Try different static file server
- Check browser console for errors

### Database Issues

#### Reset Database

```bash
# Drop and recreate database
dropdb assessment_platform
createdb assessment_platform
psql -d assessment_platform -f database/schema.sql
```

#### Check Database Schema

```sql
-- Connect to database
psql -d assessment_platform

-- List all tables
\dt

-- Check users table
SELECT * FROM users LIMIT 5;

-- Exit
\q
```

### Performance Issues

#### Backend Performance

- Check Node.js version: `node --version`
- Monitor memory usage: `ps aux | grep node`
- Check database connections: `SELECT * FROM pg_stat_activity;`

#### Frontend Performance

- Use browser developer tools
- Check network tab for slow requests
- Verify static file server configuration

## Production Deployment

### Environment Setup

1. **Set Production Environment**
   ```env
   NODE_ENV=production
   JWT_SECRET=very_long_random_secret_for_production
   DB_HOST=your_production_db_host
   CORS_ORIGIN=https://yourdomain.com
   ```

2. **Database Migration**
   ```bash
   # Backup existing data
   pg_dump assessment_platform > backup.sql
   
   # Run on production database
   psql -d production_db -f database/schema.sql
   ```

3. **Security Considerations**
   - Use HTTPS in production
   - Set strong JWT secret (64+ characters)
   - Configure firewall rules
   - Enable database SSL
   - Set up monitoring and logging

### Deployment Options

#### Option 1: Traditional Server

```bash
# Install PM2 for process management
npm install -g pm2

# Start application
pm2 start backend/server.js --name "assessment-platform"

# Configure nginx reverse proxy
# See nginx configuration in docs/nginx.conf
```

#### Option 2: Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or build custom image
docker build -t assessment-platform .
docker run -d -p 3000:3000 assessment-platform
```

#### Option 3: Cloud Deployment

- **Heroku**: Use provided `Procfile`
- **AWS**: Deploy on EC2 or use Elastic Beanstalk
- **DigitalOcean**: Use App Platform or Droplets
- **Vercel/Netlify**: For frontend static hosting

## Maintenance

### Regular Tasks

1. **Database Backup**
   ```bash
   # Daily backup
   pg_dump assessment_platform > backup_$(date +%Y%m%d).sql
   ```

2. **Log Rotation**
   ```bash
   # Setup logrotate for application logs
   sudo nano /etc/logrotate.d/assessment-platform
   ```

3. **Security Updates**
   ```bash
   # Update dependencies
   npm audit
   npm update
   ```

### Monitoring

- Monitor server resources (CPU, Memory, Disk)
- Check database performance
- Monitor application logs
- Set up alerts for errors
- Track user activity and system usage

## Support

If you encounter issues not covered in this guide:

1. Check the [FAQ](FAQ.md)
2. Review application logs
3. Search existing issues in the repository
4. Create a new issue with detailed information

## Next Steps

After successful setup:

1. [User Management Guide](USER_MANAGEMENT.md)
2. [Assessment Creation Guide](ASSESSMENT_GUIDE.md)
3. [API Documentation](API.md)
4. [Customization Guide](CUSTOMIZATION.md)