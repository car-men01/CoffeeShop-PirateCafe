const { Op, Sequelize } = require('sequelize');
const BaseStrategy = require('./BaseStrategy');
const { User, Product, Order, OrderItem, ProductCategory } = require('../../models/relationships');

/**
 * Collaborative filtering recommendation strategy
 * Recommends products based on similar users' preferences
 */
class CollaborativeStrategy extends BaseStrategy {
  async recommend(userId, count, options) {
    try {
      if (!userId) {
        // Fall back to popularity for anonymous users
        return await this.getPopularProducts(count);
      }

      const userPreferences = await this.getUserPreferences(userId);
      
      // Check if user has enough order history
      if (userPreferences.totalOrders < this.config.criteria.orderHistory.minOrdersRequired) {
        console.log(`User ${userId} has insufficient order history for collaborative filtering`);
        return await this.getPopularProducts(count);
      }

      // Find similar users
      const similarUsers = await this.findSimilarUsers(userId, userPreferences);
      
      if (similarUsers.length < this.config.general.minSimilarUsers) {
        console.log(`Not enough similar users found for user ${userId}`);
        return await this.getPopularProducts(count);
      }

      // Get recommendations based on similar users
      const recommendations = await this.getCollaborativeRecommendations(
        userId, 
        similarUsers, 
        userPreferences, 
        count
      );

      return recommendations;
    } catch (error) {
      console.error('Error in CollaborativeStrategy:', error);
      // Fall back to popularity strategy
      return await this.getPopularProducts(count);
    }
  }

  /**
   * Find users with similar preferences
   * @param {number} userId - Current user ID
   * @param {object} userPreferences - Current user's preferences
   * @returns {Promise<Array>} Array of similar users with similarity scores
   */
  async findSimilarUsers(userId, userPreferences) {
    try {
      // Get other users who have made orders
      const otherUsers = await User.findAll({
        where: {
          id: { [Op.ne]: userId }
        },
        include: [{
          model: Order,
          include: [{
            model: OrderItem,
            include: [{
              model: Product,
              include: [ProductCategory]
            }]
          }],
          required: true // Only users with orders
        }],
        limit: this.config.queryLimits.maxSimilarUsers * 2 // Get more for better filtering
      });

      const similarUsers = [];

      for (const user of otherUsers) {
        const otherUserPreferences = this.analyzePreferences(user.Orders);
        
        // Skip users with insufficient order history
        if (otherUserPreferences.totalOrders < this.config.criteria.orderHistory.minOrdersRequired) {
          continue;
        }

        const similarity = this.calculateUserSimilarity(userPreferences, otherUserPreferences);
        
        if (similarity > 0.1) { // Minimum similarity threshold
          similarUsers.push({
            userId: user.id,
            similarity,
            preferences: otherUserPreferences
          });
        }
      }

      // Sort by similarity and return top matches
      return similarUsers
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, this.config.queryLimits.maxSimilarUsers);
    } catch (error) {
      console.error('Error finding similar users:', error);
      return [];
    }
  }

  /**
   * Get product recommendations based on similar users' orders
   * @param {number} userId - Current user ID
   * @param {Array} similarUsers - Array of similar users
   * @param {object} userPreferences - Current user's preferences
   * @param {number} count - Number of recommendations to return
   * @returns {Promise<Array>} Recommended products
   */
  async getCollaborativeRecommendations(userId, similarUsers, userPreferences, count) {
    try {
      const similarUserIds = similarUsers.map(u => u.userId);
      
      // Get products ordered by similar users that current user hasn't ordered
      const recommendations = await OrderItem.findAll({
        attributes: [
          'ProductId',
          [Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'orderCount'],
          [Sequelize.fn('SUM', Sequelize.col('quantity')), 'totalQuantity'],
          [Sequelize.fn('AVG', Sequelize.col('OrderItem.price')), 'avgPrice']
        ],
        include: [{
          model: Order,
          where: {
            UserId: { [Op.in]: similarUserIds }
          },
          attributes: ['UserId']
        }, {
          model: Product,
          include: [ProductCategory],
          where: {
            id: { [Op.notIn]: userPreferences.recentlyOrdered }
          }
        }],
        group: ['OrderItem.ProductId', 'Product.id', 'Product.ProductCategory.id'],
        order: [[Sequelize.fn('COUNT', Sequelize.col('OrderItem.id')), 'DESC']],
        limit: count * 3 // Get more for filtering and scoring
      });

      // Calculate recommendation scores based on user similarity
      const scoredRecommendations = await Promise.all(
        recommendations.map(async (item) => {
          const product = item.Product;
          const productId = product.id;
          
          // Calculate weighted score based on similar users who ordered this product
          let totalScore = 0;
          let userCount = 0;

          for (const similarUser of similarUsers) {
            // Check if this similar user ordered this product
            const userOrderedProduct = await OrderItem.findOne({
              include: [{
                model: Order,
                where: { UserId: similarUser.userId }
              }],
              where: { ProductId: productId }
            });

            if (userOrderedProduct) {
              totalScore += similarUser.similarity;
              userCount++;
            }
          }

          const avgScore = userCount > 0 ? totalScore / userCount : 0;
          const orderFrequency = parseInt(item.dataValues.orderCount) || 0;
          
          // Combined score: similarity weight + order frequency
          const finalScore = (avgScore * 0.7) + (orderFrequency / 100 * 0.3);

          const productData = product.toJSON();
          return {
            ...productData,
            price: parseFloat(productData.price) || 0, // Ensure price is a number
            recommendationReason: `Liked by ${userCount} similar user(s)`,
            recommendationScore: finalScore,
            orderCount: orderFrequency,
            similarUsersCount: userCount
          };
        })
      );

      // Filter and sort by score
      const filteredRecommendations = this.filterProducts(scoredRecommendations, userPreferences);
      
      return filteredRecommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, count);
    } catch (error) {
      console.error('Error getting collaborative recommendations:', error);
      return [];
    }
  }
}

module.exports = CollaborativeStrategy;
