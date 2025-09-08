/**
 * Utility functions for input sanitization and validation
 */

const sanitizeForLog = (input) => {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  // Remove or encode potentially dangerous characters
  return encodeURIComponent(input.replace(/[\r\n\t]/g, ' ').trim());
};

const sanitizeHTML = (input) => {
  if (typeof input !== 'string') {
    return String(input);
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

module.exports = {
  sanitizeForLog,
  sanitizeHTML,
  validateEmail,
  validatePassword
};