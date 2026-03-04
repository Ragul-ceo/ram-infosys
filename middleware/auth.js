// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = function(requiredRole) {
  return (req, res, next) => {
    const auth = req.headers.authorization || '';
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = parts[1];
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.user = payload;
      // if a role is required, enforce it
      if (requiredRole) {
        if (payload.role !== requiredRole) {
          return res.status(403).json({ error: 'Forbidden' });
        }
      }
      next();
    } catch (err) {
      console.error('auth middleware error:', err.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
};