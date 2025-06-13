const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User } = require('../models/relationships');
const { logActivity } = require('../utils/activityLogger');
const { sendVerificationEmail } = require('../utils/emailService');
const bcrypt = require('bcrypt'); 
const { Op } = require('sequelize'); 
const sequelizeDb = require('../models/index');
const { JWT_SECRET } = require('../config');


const JWT_EXPIRY = '24h';

// Generate a random 6-digit code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// In the login-init route
router.post('/login-init', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Validate password
    try {
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
    } catch (validationError) {
      console.error('Password validation error:', validationError);
      return res.status(500).json({ error: 'Server error during login' });
    }
    
    // Generate verification code
    const code = generateVerificationCode();
    
    // Try direct SQL update to ensure fields get set correctly regardless of naming
    try {
      // First, check column names from database schema
      const [columns] = await sequelizeDb.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'Users' 
        AND column_name LIKE '%verification%';
      `);
      
      console.log('Verification columns in database:', columns);
      
      // Try direct SQL update based on actual column names - REMOVED expiry time
      await sequelizeDb.query(`
        UPDATE "Users"
        SET "verificationCode" = ?, 
            "isVerified" = false
        WHERE id = ?
      `, {
        replacements: [code, user.id],
        type: sequelizeDb.QueryTypes.UPDATE
      });
      
      console.log(`Direct SQL update attempted for user ${user.id}`);
    } catch (sqlError) {
      console.error('Failed to update via SQL:', sqlError);
    }
    
    // Also try the direct model update as a backup - REMOVED expiry time
    await User.update(
      {
        verificationCode: code,
        isVerified: false
      },
      {
        where: { id: user.id },
        // Force raw SQL for this critical update
        sideEffects: false
      }
    );
    
    // Double-check that the update was successful with direct SQL
    const [updatedUserRaw] = await sequelizeDb.query(`
      SELECT id, username, email, "verificationCode", "isVerified"
      FROM "Users"
      WHERE id = ?
    `, {
      replacements: [user.id],
      type: sequelizeDb.QueryTypes.SELECT
    });
    
    console.log('User data after update (direct SQL):', updatedUserRaw);
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, code);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    // Return success with user ID
    res.status(200).json({
      message: 'Verification code sent',
      userId: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Login init error:', err);
    res.status(500).json({ error: 'Server error during login initialization' });
  }
});

// In the verify-login route - REMOVE expiry check
router.post('/verify-login', async (req, res) => {
  try {
    const { userId, code } = req.body;
    
    console.log(`Attempting to verify code for user ${userId}: ${code}`);
    
    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and verification code are required' });
    }
    
    // Get user data directly from SQL to bypass any potential model issues
    const [userRaw] = await sequelizeDb.query(`
      SELECT id, username, email, role, "verificationCode", "isVerified"
      FROM "Users"
      WHERE id = ?
    `, {
      replacements: [userId],
      type: sequelizeDb.QueryTypes.SELECT
    });
    
    if (!userRaw) {
      console.log(`User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('Raw user data from database:', userRaw);
    
    // Verify code - check directly from raw SQL result
    if (!userRaw.verificationCode) {
      return res.status(401).json({ error: 'No verification code exists for this user' });
    }
    
    if (userRaw.verificationCode !== code) {
      return res.status(401).json({ 
        error: 'Invalid verification code',
        debug: {
          expected: userRaw.verificationCode,
          received: code,
          match: userRaw.verificationCode === code
        }
      });
    }
        
    await sequelizeDb.query(`
      UPDATE "Users"
      SET "isVerified" = true,
          "verificationCode" = NULL,
          "lastLogin" = NOW()
      WHERE id = ?
    `, {
      replacements: [userId],
      type: sequelizeDb.QueryTypes.UPDATE
    });
    
    // Generate token
    const token = jwt.sign({ 
      id: userRaw.id,
      username: userRaw.username,
      role: userRaw.role
    }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    
    // Log activity
    await logActivity(req, userRaw.id, 'READ', 'User', userRaw.id, 'User login');
    
    // Return user data with token
    res.status(200).json({
      id: userRaw.id,
      username: userRaw.username,
      email: userRaw.email,
      role: userRaw.role,
      token
    });
  } catch (err) {
    console.error('Verification error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
});

// In the register route - REMOVED expiry time
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
        [Op.or]: [{ username }, { email }]
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
      role: 'user'
    });

    // Generate verification code
    const code = generateVerificationCode();
    
    // Database update - REMOVED expiry time
    await User.update(
      {
        verificationCode: code,
        isVerified: false
      },
      {
        where: { id: user.id }
      }
    );
    
    // Double-check that the update was successful
    const updatedUser = await User.findByPk(user.id);
    console.log(`New user ${user.id} verification code saved:`, {
      code: code,
      savedCode: updatedUser.verificationCode
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, code);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }

    // Return user ID for verification (no token yet)
    res.status(201).json({
      message: 'User registered successfully. Please verify your account.',
      userId: user.id,
      email: user.email
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Resend code route - REMOVED expiry time
router.post('/resend-code', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    // Find user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate new verification code
    const code = generateVerificationCode();
    
    // Update user - REMOVED expiry time
    await User.update(
      {
        verificationCode: code
      },
      {
        where: { id: user.id }
      }
    );
    
    // Double-check that the update was successful
    const updatedUser = await User.findByPk(user.id);
    console.log(`User ${user.id} verification code resent:`, {
      code: code,
      savedCode: updatedUser.verificationCode
    });
    
    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, code);
    
    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send verification email' });
    }
    
    // Return success
    res.status(200).json({
      message: 'New verification code sent',
      email: user.email
    });
  } catch (err) {
    console.error('Resend code error:', err);
    res.status(500).json({ error: 'Server error during code resend' });
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

module.exports = router;