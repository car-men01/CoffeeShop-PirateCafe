const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/relationships');
const { logActivity } = require('../utils/activityLogger');
const bcrypt = require('bcrypt'); 
const sequelize = require('sequelize'); 
const { JWT_SECRET } = require('../config');


// const JWT_SECRET = process.env.JWT_SECRET || 'piratecafesecret';
const JWT_EXPIRY = '24h';

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      where: {
        [sequelize.Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Username or email already in use' });
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      role: 'user' // Default role
    });

    // Generate token
    const token = jwt.sign({ 
      id: user.id,
      username: user.username,
      role: user.role
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Log activity
    await logActivity(req, user.id, 'CREATE', 'User', user.id, 'User registration');

    // Return user data (excluding password)
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`Login attempt - email: ${email}, password provided: ${password ? 'Yes' : 'No'}`);

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return res.status(401).json({ error: 'Invalid email' });
    }

    console.log(`User found: ${user.username}, stored hash: ${user.password.substring(0, 10)}...`);

    // Validate password
    // const isValidPassword = await user.validatePassword(password);
    // if (!isValidPassword) {
    //   return res.status(401).json({ error: 'Invalid password' });
    // }

     // Validate password - add direct debugging
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);

      // const isValidPassword = true; //Temporary bypass
      console.log(`Password validation result: ${isValidPassword}`);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid password' });
      }
    } catch (validationError) {
      console.error('Password validation error:', validationError);
      return res.status(500).json({ error: 'Password validation error' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = jwt.sign({ 
      id: user.id,
      username: user.username,
      role: user.role
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Log activity
    await logActivity(req, user.id, 'READ', 'User', user.id, 'User login');

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data
    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Error verifying token:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get current user
// router.get('/me', async (req, res) => {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     if (!token) {
//       return res.status(401).json({ error: 'No token provided' });
//     }

//     // Verify token
//     const decoded = jwt.verify(token, JWT_SECRET);
//     const user = await User.findByPk(decoded.id, {
//       attributes: { exclude: ['password'] }
//     });

//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     res.json(user);
//   } catch (err) {
//     console.error('Auth error:', err);
//     res.status(401).json({ error: 'Invalid token' });
//   }
// });

module.exports = router;