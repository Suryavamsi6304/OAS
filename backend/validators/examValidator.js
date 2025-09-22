const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const createExamValidation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  body('duration')
    .isInt({ min: 1, max: 480 })
    .withMessage('Duration must be between 1 and 480 minutes'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  body('questions.*.type')
    .isIn(['multiple-choice', 'true-false', 'essay', 'coding'])
    .withMessage('Invalid question type'),
  body('questions.*.question')
    .notEmpty()
    .withMessage('Question text is required'),
  body('questions.*.points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('type')
    .optional()
    .isIn(['exam', 'practice', 'skill-assessment'])
    .withMessage('Invalid exam type'),
  body('batchCode')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Batch code must be less than 20 characters'),
  handleValidationErrors
];

const examIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid exam ID'),
  handleValidationErrors
];

const submitExamValidation = [
  body('examId')
    .isInt({ min: 1 })
    .withMessage('Valid exam ID is required'),
  body('answers')
    .isArray()
    .withMessage('Answers must be an array'),
  body('timeSpent')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Time spent must be a non-negative integer'),
  handleValidationErrors
];

module.exports = {
  createExamValidation,
  examIdValidation,
  submitExamValidation
};