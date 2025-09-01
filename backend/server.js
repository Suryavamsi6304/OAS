const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const assessmentRoutes = require('./routes/assessment');
const resultRoutes = require('./routes/result');
const practiceRoutes = require('./routes/practice');
const adminRoutes = require('./routes/admin');
const questionRoutes = require('./routes/questions');
const proctoringRoutes = require('./routes/proctoring');

const app = express();

// CORS middleware - must be first
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: false,
  originAgentCluster: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Route handlers for different user types
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/admin-login.html'));
});

app.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Database test route
app.get('/api/test', async (req, res) => {
  try {
    const db = require('./config/database');
    const result = await db.query('SELECT NOW()');
    res.json({ status: 'Database connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Simple connectivity test
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Server is reachable', 
    timestamp: new Date().toISOString(),
    clientIP: req.ip 
  });
});

// Create test user endpoint
app.post('/api/create-test-user', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const db = require('./config/database');
    
    const email = 'test@student.com';
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.json({ message: 'Test user already exists', email, password });
    }
    
    await db.query(
      'INSERT INTO users (email, password, role, first_name, last_name, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      [email, hashedPassword, 'student', 'Test', 'User', true]
    );
    
    res.json({ 
      message: 'Test user created successfully',
      email: email,
      password: password
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/practice', practiceRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/proctoring', proctoringRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Network access: http://[YOUR_IP]:${PORT}`);
});

module.exports = app;