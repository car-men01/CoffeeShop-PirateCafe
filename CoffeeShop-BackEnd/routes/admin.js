const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const { User, ActivityLog, MonitoredUser } = require('../models/relationships'); // Add MonitoredUser here
const { Op } = require('sequelize');
const sequelize = require('sequelize');
const { simulateSuspiciousActivity } = require('../utils/userMonitoring');

// Get all monitored users (admin only)
router.get('/monitored-users', authenticate, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Fetch monitored users with user details
    const monitoredUsers = await MonitoredUser.findAll({
      include: [{
        model: User,
        attributes: ['id', 'username', 'email', 'role', 'lastLogin'],
        where: {
          role: { [Op.ne]: 'admin' } // Exclude admin users
        }
      }],
      order: [['monitoringSince', 'DESC']]
    });

    // Format the response
    const formattedUsers = monitoredUsers.map(mu => ({
      id: mu.User.id,
      username: mu.User.username,
      email: mu.User.email,
      role: mu.User.role,
      monitoringSince: mu.monitoringSince,
      reason: mu.reason,
      lastLogin: mu.User.lastLogin
    }));

    res.json(formattedUsers);
  } catch (err) {
    console.error('Error fetching monitored users:', err);
    res.status(500).json({ error: 'Server error while fetching monitored users' });
  }
});

// Add this new endpoint for removing user monitoring
router.delete('/remove-monitoring/:userId', authenticate, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { userId } = req.params;
    
    // Remove from MonitoredUsers table
    const removeCount = await MonitoredUser.destroy({
      where: { UserId: userId }
    });

    if (removeCount === 0) {
      return res.status(404).json({ error: 'User not found in monitored list' });
    }

    // Delete recent activity logs to prevent immediate re-flagging
    const now = new Date();
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000); // 24 hours ago
    
    await ActivityLog.destroy({
      where: {
        UserId: userId,
        createdAt: { [Op.gt]: oneDayAgo }
      }
    });

    res.json({ 
      success: true, 
      message: 'User removed from monitoring and recent activity cleared' 
    });
    
  } catch (err) {
    console.error('Error removing user monitoring:', err);
    res.status(500).json({ 
      error: 'Server error while removing user monitoring', 
      details: err.message 
    });
  }
});

// Modified to exclude admin users
router.get('/users', authenticate, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    // Fetch all non-admin users from database
    const users = await User.findAll({
      where: {
        role: { [Op.ne]: 'admin' } // Exclude admin users
      },
      attributes: ['id', 'username', 'email', 'role', 'lastLogin', 'createdAt']
    });

    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
});

// Get activity logs for a specific user (admin only)
router.get('/user-activity/:userId', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7, page = 1, limit = 50 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    
    // Get logs
    const logs = await ActivityLog.findAndCountAll({
      where: {
        UserId: userId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    // Get user info
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'role', 'isMonitored', 'monitoringSince']
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return combined data
    res.json({
      user,
      logs: logs.rows,
      pagination: {
        total: logs.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(logs.count / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching user activity:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get activity statistics for a user (admin only)
router.get('/user-stats/:userId', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get user info
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get activity counts by type
    const activityStats = await ActivityLog.findAll({
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        UserId: userId,
        createdAt: { [Op.between]: [startDate, endDate] }
      },
      group: ['action']
    });
    
    // Format results
    const stats = {
      CREATE: 0,
      READ: 0,
      UPDATE: 0,
      DELETE: 0
    };
    
    activityStats.forEach(stat => {
      stats[stat.action] = parseInt(stat.dataValues.count);
    });
    
    res.json({
      userId,
      username: user.username,
      timeRange: { startDate, endDate },
      stats
    });
  } catch (err) {
    console.error('Error fetching user statistics:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin - Simulate suspicious activity (for testing)
router.post('/simulate-activity', authenticate, async (req, res) => {
  try {
    // Check if the requesting user is an admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    const { userId, action, count = 1 } = req.body;
    
    if (!userId || !action) {
      return res.status(400).json({ error: 'User ID and action are required' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Simulate activity logging
    const now = new Date();
    const activities = [];
    
    for (let i = 0; i < count; i++) {
      // Create activity log
      const activity = await ActivityLog.create({
        UserId: userId,
        action,
        entityType: 'Product', // Add this line to fix the null violation error
        targetId: Math.floor(Math.random() * 100), // Random product ID
        details: `Simulated ${action} operation`,
        createdAt: new Date(now - Math.random() * 86400000)
      });
      
      activities.push(activity);
    }

    // Check if this user should be monitored now
    const userActivityCount = await ActivityLog.count({
      where: {
        UserId: userId,
        createdAt: {
          [Op.gt]: new Date(now - 86400000) // Last 24 hours
        }
      }
    });

    // If activity count exceeds threshold, add to monitored users
    const THRESHOLD = 10; // Lower threshold to make it easier to trigger
    let isNowMonitored = false;
    
    if (userActivityCount > THRESHOLD) {
      try {
        // Use findOrCreate to either find an existing record or create a new one
        const [monitoredUser, created] = await MonitoredUser.findOrCreate({
          where: { UserId: userId },
          defaults: {
            monitoringSince: now,
            reason: `Suspicious activity: ${userActivityCount} ${action} operations in 24 hours`
          }
        });
        
        isNowMonitored = true;
      } catch (monitorError) {
        console.error('Error adding user to monitored list:', monitorError);
        // Continue execution even if monitoring fails
      }
    }

    res.json({ 
      success: true, 
      activitiesCreated: activities.length,
      isNowMonitored,
      threshold: THRESHOLD,
      currentCount: userActivityCount
    });
  } catch (err) {
    console.error('Error simulating activities:', err);
    res.status(500).json({ 
      error: 'Server error while simulating activities', 
      details: err.message 
    });
  }
});

module.exports = router;