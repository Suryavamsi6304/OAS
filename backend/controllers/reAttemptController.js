const { ReAttemptRequest, Notification, Result, Exam, User } = require('../models');

/**
 * Request re-attempt (Student only)
 */
const requestReAttempt = async (req, res) => {
  try {
    const { resultId, reason } = req.body;
    
    // Check if result exists and belongs to student
    const result = await Result.findOne({
      where: { id: resultId, studentId: req.user.id },
      include: [{ model: Exam, as: 'exam', include: [{ model: User, as: 'creator' }] }]
    });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }
    
    // Check if student failed (assuming passing score is 60%)
    if (result.percentage >= (result.exam.passingScore || 60)) {
      return res.status(400).json({ success: false, message: 'Cannot request re-attempt for passed exam' });
    }
    
    // Check if any request already exists for this exam (regardless of status)
    const existingRequest = await ReAttemptRequest.findOne({
      where: { 
        studentId: req.user.id,
        examId: result.examId
      }
    });
    
    if (existingRequest) {
      return res.status(400).json({ success: false, message: 'Re-attempt already requested for this exam. Only one re-attempt allowed per exam.' });
    }
    
    // Create re-attempt request
    const request = await ReAttemptRequest.create({
      studentId: req.user.id,
      examId: result.examId,
      resultId,
      reason
    });
    
    // Create notification for teacher
    await Notification.create({
      userId: result.exam.createdBy,
      type: 're_attempt_request',
      title: 'Re-attempt Request',
      message: `${req.user.name} failed "${result.exam.title}" and is requesting a re-attempt`,
      relatedId: request.id
    });
    
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
    const requests = await ReAttemptRequest.findAll({
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
        { model: Exam, as: 'exam', attributes: ['id', 'title'] }
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