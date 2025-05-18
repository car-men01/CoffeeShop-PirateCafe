const jwt = require('jsonwebtoken');
const { User } = require('../models/relationships');

const JWT_SECRET = process.env.JWT_SECRET || 'piratecafesecret';

// Authentication middleware
exports.authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Store user info in request
    req.user = decoded;
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Admin only middleware
exports.adminOnly = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ error: 'Admin access required' });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};