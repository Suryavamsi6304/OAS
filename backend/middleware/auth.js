const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware
 */
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Token is not valid' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false,
      message: 'Token is not valid' 
    });
  }
};

/**
 * Role-based middleware
 */
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};

const mentorOrAdmin = (req, res, next) => {
  if (!['admin', 'mentor'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Mentor or Admin access required'
    });
  }
  next();
};

const learnerOnly = (req, res, next) => {
  if (req.user.role !== 'learner') {
    return res.status(403).json({
      success: false,
      message: 'Learner access required'
    });
  }
  next();
};

module.exports = { auth, adminOnly, mentorOrAdmin, learnerOnly };