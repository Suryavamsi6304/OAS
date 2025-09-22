const express = require('express');
const router = express.Router();
const examController = require('../controllers/examControllerRefactored');
const { auth, adminOnly, mentorOrAdmin } = require('../middleware/auth');
const { createExamValidation, examIdValidation, submitExamValidation } = require('../validators/examValidator');

// Protected routes
router.get('/', auth, examController.getExams);
router.get('/:id', auth, examIdValidation, examController.getExamById);
router.post('/', auth, adminOnly, createExamValidation, examController.createExam);
router.put('/:id', auth, adminOnly, examIdValidation, createExamValidation, examController.updateExam);
router.delete('/:id', auth, mentorOrAdmin, examIdValidation, examController.deleteExam);
router.post('/submit', auth, submitExamValidation, examController.submitExam);

module.exports = router;