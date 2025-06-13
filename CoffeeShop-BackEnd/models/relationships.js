const User = require('./User');
const Product = require('./Product');
const ProductCategory = require('./ProductCategory');
const ActivityLog = require('./ActivityLog');
const MonitoredUser = require('./MonitoredUser');
const CartItem = require('./CartItem');
const Order = require('./Order');
const OrderItem = require('./OrderItem');

// Define relationships
Product.belongsTo(ProductCategory);
ProductCategory.hasMany(Product);

// Activity Log relationships
ActivityLog.belongsTo(User);
User.hasMany(ActivityLog);

// Monitored User relationships
MonitoredUser.belongsTo(User);
User.hasOne(MonitoredUser);

// Cart relationships
CartItem.belongsTo(User);
CartItem.belongsTo(Product);
User.hasMany(CartItem);
Product.hasMany(CartItem);

// Order relationships
Order.belongsTo(User);
User.hasMany(Order);

// OrderItem relationships
OrderItem.belongsTo(Order);
OrderItem.belongsTo(Product);
Order.hasMany(OrderItem);
Product.hasMany(OrderItem);

// Export all models
module.exports = {
  User,
  Product,
  ProductCategory,
  ActivityLog,
  MonitoredUser,
  CartItem,
  Order,
  OrderItem
};