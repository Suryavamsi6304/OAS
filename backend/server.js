const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/database');
const { auth, adminOnly, mentorOrAdmin, learnerOnly } = require('./middleware/auth');

// Controllers
const authController = require('./controllers/authController');
const examController = require('./controllers/examController');
const resultController = require('./controllers/resultController');
const jobController = require('./controllers/jobController');
const proctoringController = require('./controllers/proctoringController');
const reAttemptController = require('./controllers/reAttemptController');
const notificationController = require('./controllers/notificationController');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is running!' });
});

// Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/verify', auth, authController.verifyToken);

// Exam routes (includes practice tests and skill assessments)
app.post('/api/exams', auth, adminOnly, examController.createExam);
app.get('/api/exams', auth, examController.getExams);
app.get('/api/exams/:id', auth, examController.getExamById);
app.put('/api/exams/:id', auth, adminOnly, examController.updateExam);
app.delete('/api/exams/:id', auth, mentorOrAdmin, examController.deleteExam);
app.post('/api/exams/submit', auth, examController.submitExam);

// Result routes
app.get('/api/results/student', auth, resultController.getStudentResults);
app.get('/api/results/all', auth, mentorOrAdmin, resultController.getAllResults);
app.put('/api/results/:id/grade', auth, mentorOrAdmin, resultController.gradeAnswer);
app.get('/api/analytics', auth, adminOnly, resultController.getAnalytics);

// Job routes
app.post('/api/jobs', auth, adminOnly, jobController.createJob);
app.get('/api/jobs', auth, jobController.getJobs);
app.post('/api/jobs/apply', auth, learnerOnly, jobController.applyForJob);
app.get('/api/applications', auth, jobController.getApplications);
app.put('/api/applications/:id', auth, mentorOrAdmin, jobController.updateApplication);

// Practice Tests routes
app.post('/api/practice-tests', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { Exam } = require('./models');
    const practiceTest = await Exam.create({
      ...req.body,
      createdBy: req.user.id,
      type: 'practice'
    });
    res.json({ success: true, data: practiceTest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/practice-tests', auth, async (req, res) => {
  try {
    const { Exam } = require('./models');
    let whereClause = { isActive: true, type: 'practice' };
    
    // Filter by batch for learners
    if (req.user.role === 'learner' && req.user.batchCode) {
      whereClause.batchCode = req.user.batchCode;
    }
    
    const tests = await Exam.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Skill Assessments routes
app.post('/api/skills/assessment', auth, mentorOrAdmin, async (req, res) => {
  try {
    const { Exam } = require('./models');
    const assessment = await Exam.create({
      ...req.body,
      createdBy: req.user.id,
      type: 'skill-assessment'
    });
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
app.get('/api/skills/assessment', auth, async (req, res) => {
  try {
    const { Exam } = require('./models');
    let whereClause = { isActive: true, type: 'skill-assessment' };
    
    // Filter by batch for learners
    if (req.user.role === 'learner' && req.user.batchCode) {
      whereClause.batchCode = req.user.batchCode;
    }
    
    const assessments = await Exam.findAll({ 
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: assessments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proctoring routes
app.post('/api/proctoring/start', auth, proctoringController.startSession);
app.post('/api/proctoring/:sessionId/violation', auth, proctoringController.reportViolation);
app.put('/api/proctoring/:sessionId/behavior', auth, proctoringController.updateBehavior);
app.post('/api/proctoring/:sessionId/end', auth, proctoringController.endSession);
app.get('/api/proctoring/sessions', auth, mentorOrAdmin, proctoringController.getSessions);

// Re-attempt routes
app.post('/api/re-attempt/request', auth, learnerOnly, reAttemptController.requestReAttempt);
app.get('/api/re-attempt/requests', auth, mentorOrAdmin, reAttemptController.getReAttemptRequests);
app.get('/api/re-attempt/my-requests', auth, learnerOnly, reAttemptController.getMyReAttemptRequests);
app.put('/api/re-attempt/requests/:id/review', auth, mentorOrAdmin, reAttemptController.reviewReAttemptRequest);

// Notification routes
app.get('/api/notifications', auth, notificationController.getNotifications);
app.put('/api/notifications/:id/read', auth, notificationController.markAsRead);
app.get('/api/notifications/unread-count', auth, notificationController.getUnreadCount);

// Profile routes
app.put('/api/profile', auth, async (req, res) => {
  try {
    const { User } = require('./models');
    const { name, batchCode } = req.body;
    
    await User.update(
      { name, batchCode },
      { where: { id: req.user.id } }
    );
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Seed data route (development only)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/seed', async (req, res) => {
    try {
      const { User, Exam, JobPosting } = require('./models');
      
      // Create admin user
      const [admin] = await User.findOrCreate({
        where: { username: 'admin' },
        defaults: {
          username: 'admin',
          email: 'admin@test.com',
          password: 'password',
          name: 'Admin User',
          role: 'admin'
        }
      });

      // Create mentor user
      const [mentor] = await User.findOrCreate({
        where: { username: 'mentor' },
        defaults: {
          username: 'mentor',
          email: 'mentor@test.com',
          password: 'password',
          name: 'Mentor User',
          role: 'mentor'
        }
      });

      // Create learner user
      const [learner] = await User.findOrCreate({
        where: { username: 'learner' },
        defaults: {
          username: 'learner',
          email: 'learner@test.com',
          password: 'password',
          name: 'Learner User',
          role: 'learner',
          batchCode: 'BATCH001'
        }
      });

      // Create sample exam
      const [sampleExam] = await Exam.findOrCreate({
        where: { title: 'Sample Quiz' },
        defaults: {
          title: 'Sample Quiz',
          description: 'A sample quiz for testing',
          duration: 30,
          questions: [
            {
              _id: '1',
              type: 'multiple-choice',
              question: 'What is 2 + 2?',
              options: [
                { _id: 'a', text: '3', isCorrect: false },
                { _id: 'b', text: '4', isCorrect: true },
                { _id: 'c', text: '5', isCorrect: false }
              ],
              points: 1
            },
            {
              _id: '2',
              type: 'true-false',
              question: 'The sky is blue.',
              correctAnswer: 'true',
              points: 1
            }
          ],
          createdBy: admin.id,
          isActive: true,
          batchCode: 'BATCH001'
        }
      });

      // Create sample job posting
      const [sampleJob] = await JobPosting.findOrCreate({
        where: { title: 'Software Developer' },
        defaults: {
          title: 'Software Developer',
          description: 'We are looking for a skilled software developer to join our team.',
          requirements: 'Bachelor degree in Computer Science, 2+ years experience',
          location: 'Remote',
          salary: '$60,000 - $80,000',
          department: 'Engineering',
          createdBy: admin.id,
          status: 'active'
        }
      });

      res.json({
        success: true,
        message: 'Seed data created',
        data: { admin, mentor, learner, sampleExam, sampleJob }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});