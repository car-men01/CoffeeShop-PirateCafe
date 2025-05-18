const { ActivityLog } = require('../models/relationships');

exports.logActivity = async (req, userId, action, entityType, entityId, details = null) => {
  try {
    // Get IP address
    const ipAddress = 
      req.headers['x-forwarded-for'] || 
      req.connection.remoteAddress || 
      'unknown';
    
    // Create log entry
    await ActivityLog.create({
      UserId: userId,
      action: action,
      entityType: entityType,
      entityId: entityId,
      details: details,
      ipAddress: ipAddress
    });
    
    console.log(`Activity logged - User: ${userId}, Action: ${action}, Entity: ${entityType}:${entityId}`);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Log but don't interrupt the main flow
  }
};