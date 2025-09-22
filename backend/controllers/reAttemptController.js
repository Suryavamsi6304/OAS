const { ReAttemptRequest, Notification, Result, Exam, User } = require('../models');

/**
 * Request re-attempt (Student only)
 */
const requestReAttempt = async (req, res) => {
  try {
    const { examId, reason } = req.body;
    
    if (!examId || !reason) {
      return res.status(400).json({ success: false, message: 'Exam ID and reason are required' });
    }
    
    // Check if exam exists
    const exam = await Exam.findByPk(examId, {
      include: [{ model: User, as: 'creator' }]
    });
    
    if (!exam) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }
    
    // Check if student has taken this exam
    const result = await Result.findOne({
      where: { examId, studentId: req.user.id }
    });
    
    if (!result) {
      return res.status(400).json({ success: false, message: 'You must take the exam first before requesting a re-attempt' });
    }
    
    // Check if any request already exists for this exam (regardless of status)
    const existingRequest = await ReAttemptRequest.findOne({
      where: { 
        studentId: req.user.id,
        examId: examId
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Re-attempt already requested for this exam. Only one re-attempt allowed per exam.' });
    }
    
    // Create re-attempt request
    const request = await ReAttemptRequest.create({
      studentId: req.user.id,
      examId: examId,
      resultId: result.id,
      reason
    });
    
    // Create notification for teacher
    await Notification.create({
      userId: exam.createdBy,
      type: 're_attempt_request',
      title: 'Re-attempt Request',
      message: `${req.user.name} is requesting a re-attempt for "${exam.title}"`,
      relatedId: request.id
    });
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.emit('new-reattempt-request', {
        studentName: req.user.name,
        examTitle: exam.title,
        examId: exam.id,
        requestId: request.id
      });
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    console.error('Request re-attempt error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get re-attempt requests (Teacher/Admin)
 */
const getReAttemptRequests = async (req, res) => {
  try {
    let whereClause = {};
    
    // If user is a mentor, only show requests for their exams
    if (req.user.role === 'mentor') {
      const mentorExams = await Exam.findAll({
        where: { createdBy: req.user.id },
        attributes: ['id']
      });
      const examIds = mentorExams.map(exam => exam.id);
      whereClause.examId = examIds;
    }
    
    const requests = await ReAttemptRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'student', attributes: ['name', 'username'] },
        { model: Exam, as: 'exam', attributes: ['title'] },
        { model: Result, as: 'result', attributes: ['score', 'percentage'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Review re-attempt request (Teacher/Admin)
 */
const reviewReAttemptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body; // 'approved' or 'rejected'
    
    const request = await ReAttemptRequest.findByPk(id, {
      include: [
        { model: User, as: 'student' },
        { model: Exam, as: 'exam' }
      ]
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    // Check if mentor can review this request (only for their own exams)
    if (req.user.role === 'mentor' && request.exam.createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only review requests for your own exams' });
    }
    
    // Update request
    await request.update({
      status,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      reviewComment: comment
    });
    
    // Create notification for student
    const notificationType = status === 'approved' ? 're_attempt_approved' : 're_attempt_rejected';
    const message = status === 'approved' 
      ? `Your re-attempt request for "${request.exam.title}" has been approved`
      : `Your re-attempt request for "${request.exam.title}" has been rejected`;
    
    await Notification.create({
      userId: request.studentId,
      type: notificationType,
      title: `Re-attempt ${status}`,
      message,
      relatedId: request.examId
    });
    
    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${request.studentId}`).emit('reattempt-response', {
        status,
        examTitle: request.exam.title,
        examId: request.examId,
        studentId: request.studentId
      });
    }
    
    res.json({ success: true, data: request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get my re-attempt requests (Student only)
 */
const getMyReAttemptRequests = async (req, res) => {
  try {
    const requests = await ReAttemptRequest.findAll({
      where: { studentId: req.user.id },
      include: [
        { model: Exam, as: 'exam', attributes: ['id', 'title'] },
        { model: Result, as: 'result', attributes: ['score', 'percentage'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  requestReAttempt,
  getReAttemptRequests,
  getMyReAttemptRequests,
  reviewReAttemptRequest
};