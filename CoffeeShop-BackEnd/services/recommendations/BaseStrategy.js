const { Op, Sequelize } = require('sequelize');
const { User, Product, Order, OrderItem, ProductCategory } = require('../../models/relationships');
const config = require('../../config/recommendationConfig');

/**
 * Base class for all recommendation strategies
 */
class BaseStrategy {
  constructor() {
    this.config = config;
  }

  /**
   * Main recommendation method - must be implemented by subclasses
   * @param {number} userId - User ID to get recommendations for
   * @param {number} count - Number of recommendations to return
   * @param {object} options - Additional options
   * @returns {Promise<Array>} Array of recommended products
   */
  async recommend(userId, count, options) {
    throw new Error('Must implement recommend method');
  }

  /**
   * Get user's order history and analyze preferences
   * @param {number} userId - User ID
   * @returns {Promise<object>} User preferences object
   */
  async getUserPreferences(userId) {
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - this.config.criteria.orderHistory.lookbackDays);

    const orders = await Order.findAll({
      where: { 
        UserId: userId,
        createdAt: {
          [Op.gte]: lookbackDate
        }
      },
      include: [{
        model: OrderItem,
        include: [{
          model: Product,
          include: [ProductCategory]
        }]
      }],
      order: [['createdAt', 'DESC']],
      limit: this.config.queryLimits.maxOrdersPerUser
    });

    return this.analyzePreferences(orders);
  }

  /**
   * Analyze user preferences from order history
   * @param {Array} orders - User's orders
   * @returns {object} Analyzed preferences
   */
  analyzePreferences(orders) {
    const preferences = {
      categories: {},
      priceRange: { min: Infinity, max: 0, avg: 0 },
      timePreferences: { morning: 0, afternoon: 0, evening: 0 },
      totalOrders: orders.length,
      totalItems: 0,
      recentlyOrdered: new Set()
    };

    let totalSpent = 0;
    let totalItems = 0;

    orders.forEach(order => {
      const orderHour = new Date(order.createdAt).getHours();
      const orderDate = new Date(order.createdAt);
      const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);

      // Time preference analysis
      if (orderHour >= this.config.criteria.timePreference.morningHours[0] && 
          orderHour <= this.config.criteria.timePreference.morningHours[1]) {
        preferences.timePreferences.morning++;
      } else if (orderHour >= this.config.criteria.timePreference.afternoonHours[0] && 
                 orderHour <= this.config.criteria.timePreference.afternoonHours[1]) {
        preferences.timePreferences.afternoon++;
      } else {
        preferences.timePreferences.evening++;
      }

      order.OrderItems.forEach(item => {
        const product = item.Product;
        const category = product.ProductCategory;
        const itemTotal = item.quantity * item.price;

        totalSpent += itemTotal;
        totalItems += item.quantity;

        // Category preferences
        if (category) {
          if (!preferences.categories[category.name]) {
            preferences.categories[category.name] = { count: 0, spent: 0 };
          }
          preferences.categories[category.name].count += item.quantity;
          preferences.categories[category.name].spent += itemTotal;
        }

        // Price range analysis
        const unitPrice = item.price;
        preferences.priceRange.min = Math.min(preferences.priceRange.min, unitPrice);
        preferences.priceRange.max = Math.max(preferences.priceRange.max, unitPrice);

        // Recently ordered items (for exclusion)
        if (daysSinceOrder <= this.config.general.recentOrderDays) {
          preferences.recentlyOrdered.add(product.id);
        }
      });
    });

    preferences.totalItems = totalItems;
    preferences.priceRange.avg = totalItems > 0 ? totalSpent / totalItems : 0;

    // Convert recently ordered Set to Array for easier handling
    preferences.recentlyOrdered = Array.from(preferences.recentlyOrdered);

    return preferences;
  }

  /**
   * Get popular products based on order frequency
   * @param {number} count - Number of products to return
   * @returns {Promise<Array>} Popular products
   */
  async getPopularProducts(count) {
    const timeWindow = new Date();
    timeWindow.setDate(timeWindow.getDate() - this.config.criteria.popularity.timeWindow);

    const popularProducts = await OrderItem.findAll({
      attributes: [
        'ProductId',
        [Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity']
      ],
      include: [{
        model: Order,
        where: {
          createdAt: {
            [Op.gte]: timeWindow
          }
        },
        attributes: []
      }, {
        model: Product,
        include: [ProductCategory]
      }],
      group: ['OrderItem.ProductId', 'Product.id', 'Product.ProductCategory.id'],
      having: Sequelize.where(
        Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')),
        Op.gte,
        this.config.criteria.popularity.minOrdersForPopular
      ),
      order: [[Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'DESC']],
      limit: count
    });

    return popularProducts.map(item => {
      const product = item.Product.toJSON();
      return {
        ...product,
        price: parseFloat(product.price) || 0, // Ensure price is a number
        orderCount: parseInt(item.dataValues.orderCount),
        totalQuantity: parseInt(item.dataValues.totalQuantity)
      };
    });
  }

  /**
   * Filter products based on configuration settings
   * @param {Array} products - Products to filter
   * @param {object} userPreferences - User preferences
   * @returns {Array} Filtered products
   */
  filterProducts(products, userPreferences = {}) {
    return products.filter(product => {
      // Exclude out of stock if configured
      if (this.config.general.excludeOutOfStock && product.stock <= 0) {
        return false;
      }

      // Exclude recently ordered if configured
      if (this.config.general.excludeRecentlyOrdered && 
          userPreferences.recentlyOrdered && 
          userPreferences.recentlyOrdered.includes(product.id)) {
        return false;
      }

      return true;
    });
  }

  /**
   * Calculate similarity score between two users based on their order history
   * @param {object} user1Preferences - First user's preferences
   * @param {object} user2Preferences - Second user's preferences
   * @returns {number} Similarity score (0-1)
   */
  calculateUserSimilarity(user1Preferences, user2Preferences) {
    let similarity = 0;
    let totalFactors = 0;

    // Category similarity
    const categories1 = Object.keys(user1Preferences.categories);
    const categories2 = Object.keys(user2Preferences.categories);
    const commonCategories = categories1.filter(cat => categories2.includes(cat));
    
    if (categories1.length > 0 && categories2.length > 0) {
      similarity += (commonCategories.length / Math.max(categories1.length, categories2.length)) * 0.4;
      totalFactors += 0.4;
    }

    // Price range similarity
    if (user1Preferences.priceRange.avg > 0 && user2Preferences.priceRange.avg > 0) {
      const priceDiff = Math.abs(user1Preferences.priceRange.avg - user2Preferences.priceRange.avg);
      const maxPrice = Math.max(user1Preferences.priceRange.avg, user2Preferences.priceRange.avg);
      const priceSimiliarity = Math.max(0, 1 - (priceDiff / maxPrice));
      similarity += priceSimiliarity * 0.3;
      totalFactors += 0.3;
    }

    // Time preference similarity
    const time1 = user1Preferences.timePreferences;
    const time2 = user2Preferences.timePreferences;
    const total1 = time1.morning + time1.afternoon + time1.evening;
    const total2 = time2.morning + time2.afternoon + time2.evening;

    if (total1 > 0 && total2 > 0) {
      const timeVector1 = [time1.morning / total1, time1.afternoon / total1, time1.evening / total1];
      const timeVector2 = [time2.morning / total2, time2.afternoon / total2, time2.evening / total2];
      
      // Cosine similarity
      const dotProduct = timeVector1.reduce((sum, val, i) => sum + val * timeVector2[i], 0);
      const magnitude1 = Math.sqrt(timeVector1.reduce((sum, val) => sum + val * val, 0));
      const magnitude2 = Math.sqrt(timeVector2.reduce((sum, val) => sum + val * val, 0));
      
      if (magnitude1 > 0 && magnitude2 > 0) {
        similarity += (dotProduct / (magnitude1 * magnitude2)) * 0.3;
        totalFactors += 0.3;
      }
    }

    return totalFactors > 0 ? similarity / totalFactors : 0;
  }
}

module.exports = BaseStrategy;
