const { User, ActivityLog, MonitoredUser } = require('../models/relationships');
const { Op } = require('sequelize');
const sequelize = require('../models/index');

// Constants for monitoring
const MONITORING_INTERVAL = 60 * 1000; // Check every minute
const ACTIVITY_THRESHOLD = 10; // Number of operations that triggers monitoring
const TIME_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Function to start the monitoring thread
function startMonitoring() {
  console.log('Starting user activity monitoring service');
  
  // Set interval to periodically check user activity
  setInterval(checkSuspiciousActivity, MONITORING_INTERVAL);
}

// Function to check for suspicious activity patterns
async function checkSuspiciousActivity() {
  try {
    const now = new Date();
    const timeWindow = new Date(now - TIME_WINDOW);
    
    // Get activity counts grouped by user for the last 24 hours
    const userActivityCounts = await ActivityLog.findAll({
      attributes: [
        'UserId',
        [sequelize.fn('COUNT', sequelize.col('ActivityLog.id')), 'count']
      ],
      where: {
        createdAt: { [Op.gt]: timeWindow }
      },
      group: ['UserId', 'User.id', 'User.username', 'User.email'], // Include all User columns in GROUP BY
      having: sequelize.literal(`COUNT("ActivityLog"."id") > ${ACTIVITY_THRESHOLD}`),
      include: [{
        model: User,
        attributes: ['id', 'username', 'email']
      }]
    });
    
    // For each user with high activity, add to monitored users if not already there
    for (const userActivity of userActivityCounts) {
      const userId = userActivity.UserId;
      const activityCount = parseInt(userActivity.dataValues.count);
      
      // Add user to monitored users if not already monitored
      const [monitoredUser, created] = await MonitoredUser.findOrCreate({
        where: { UserId: userId },
        defaults: {
          monitoringSince: now,
          reason: `Suspicious activity: ${activityCount} operations in 24 hours`
        }
      });
      
      if (created) {
        console.log(`User ${userActivity.User.username} added to monitored users. Activity count: ${activityCount}`);
      }
    }
    
    console.log(`Activity monitoring completed. Checked ${userActivityCounts.length} users with high activity.`);
  } catch (err) {
    console.error('Error in suspicious activity monitoring:', err);
  }
}

// Function to simulate suspicious activity (for testing)
async function simulateSuspiciousActivity(userId, action, count) {
  try {
    const activities = [];
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const activity = await ActivityLog.create({
        UserId: userId,
        action: action || 'CREATE',
        targetType: 'Product',
        targetId: Math.floor(Math.random() * 100),
        details: `Simulated ${action || 'CREATE'} operation`,
        createdAt: new Date(now - Math.random() * TIME_WINDOW)
      });
      
      activities.push(activity);
    }
    
    return activities;
  } catch (err) {
    console.error('Error simulating activity:', err);
    throw err;
  }
}

module.exports = {
  startMonitoring,
  checkSuspiciousActivity,
  simulateSuspiciousActivity
};