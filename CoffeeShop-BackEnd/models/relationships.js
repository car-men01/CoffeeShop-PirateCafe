const User = require('./User');
const Product = require('./Product');
const ProductCategory = require('./ProductCategory');
const ActivityLog = require('./ActivityLog');
const MonitoredUser = require('./MonitoredUser'); // Add this line

// Define relationships
Product.belongsTo(ProductCategory);
ProductCategory.hasMany(Product);

// Activity Log relationships
ActivityLog.belongsTo(User);
User.hasMany(ActivityLog);

// Monitored User relationships
MonitoredUser.belongsTo(User);
User.hasOne(MonitoredUser);

// Export all models
module.exports = {
  User,
  Product,
  ProductCategory,
  ActivityLog,
  MonitoredUser 
};