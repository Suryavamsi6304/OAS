const express = require('express');
const router = express.Router();
const authController = require('../controllers/authControllerRefactored');
const { auth } = require('../middleware/auth');
const { loginValidation, registerValidation } = require('../validators/authValidator');

// Public routes
router.post('/login', loginValidation, authController.login);
router.post('/register', registerValidation, authController.register);

// Protected routes
router.get('/verify', auth, authController.verifyToken);

module.exports = router;