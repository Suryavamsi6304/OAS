const { body, validationResult } = require('express-validator');

const validateExamCreation = [
  body('title').trim().isLength({ min: 1, max: 200 }).escape(),
  body('description').optional().trim().isLength({ max: 1000 }).escape(),
  body('duration').isInt({ min: 1, max: 480 }),
  body('questions').isArray({ min: 1 }),
  body('type').optional().isIn(['exam', 'practice', 'skill-assessment']),
  body('passingScore').optional().isInt({ min: 0, max: 100 })
];

const validateUserRegistration = [
  body('username').trim().isLength({ min: 3, max: 50 }).isAlphanumeric(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  body('role').isIn(['admin', 'mentor', 'learner'])
];

const validateLogin = [
  body('username').trim().isLength({ min: 1 }),
  body('password').isLength({ min: 1 })
];

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

module.exports = {
  validateExamCreation,
  validateUserRegistration,
  validateLogin,
  handleValidationErrors
};