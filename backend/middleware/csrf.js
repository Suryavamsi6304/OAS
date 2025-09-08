const crypto = require('crypto');

// In-memory store for CSRF tokens (use Redis in production)
const csrfTokens = new Map();

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionId = req.headers['x-session-id'] || req.user?.id;

  if (!token || !sessionId) {
    return res.status(403).json({ error: 'CSRF token required' });
  }

  const storedToken = csrfTokens.get(sessionId);
  if (!storedToken || storedToken !== token) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
};

const getCSRFToken = (req, res) => {
  const sessionId = req.user?.id || req.sessionID;
  const token = generateCSRFToken();
  
  csrfTokens.set(sessionId, token);
  
  // Clean up old tokens (simple cleanup)
  if (csrfTokens.size > 1000) {
    const keys = Array.from(csrfTokens.keys());
    keys.slice(0, 100).forEach(key => csrfTokens.delete(key));
  }
  
  res.json({ csrfToken: token });
};

module.exports = {
  csrfProtection,
  getCSRFToken
};