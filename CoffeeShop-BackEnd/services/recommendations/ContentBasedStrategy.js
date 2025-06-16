const { Op, Sequelize } = require('sequelize');
const BaseStrategy = require('./BaseStrategy');
const { Product, ProductCategory, OrderItem } = require('../../models/relationships');

/**
 * Content-based recommendation strategy
 * Recommends products similar to what the user has previously ordered
 */
class ContentBasedStrategy extends BaseStrategy {
  async recommend(userId, count, options) {
    try {
      if (!userId) {
        // Fall back to popular products for anonymous users
        return await this.getPopularProducts(count);
      }

      const userPreferences = await this.getUserPreferences(userId);
      
      // Check if user has enough order history
      if (userPreferences.totalOrders < this.config.criteria.orderHistory.minOrdersRequired) {
        console.log(`User ${userId} has insufficient order history for content-based filtering`);
        return await this.getPopularProducts(count);
      }

      const recommendations = await this.getContentBasedRecommendations(
        userPreferences, 
        count
      );

      return recommendations;
    } catch (error) {
      console.error('Error in ContentBasedStrategy:', error);
      // Fall back to popularity strategy
      return await this.getPopularProducts(count);
    }
  }

  /**
   * Get recommendations based on user's content preferences
   * @param {object} userPreferences - User's analyzed preferences
   * @param {number} count - Number of recommendations to return
   * @returns {Promise<Array>} Recommended products
   */
  async getContentBasedRecommendations(userPreferences, count) {
    try {
      const recommendations = [];

      // 1. Category-based recommendations (60% weight)
      const categoryRecommendations = await this.getCategoryBasedRecommendations(
        userPreferences, 
        Math.ceil(count * 0.6)
      );
      recommendations.push(...categoryRecommendations);

      // 2. Price-range based recommendations (40% weight)
      const priceRangeRecommendations = await this.getPriceRangeRecommendations(
        userPreferences, 
        Math.ceil(count * 0.4)
      );
      recommendations.push(...priceRangeRecommendations);

      // Remove duplicates and filter
      const uniqueRecommendations = this.removeDuplicates(recommendations);
      const filteredRecommendations = this.filterProducts(uniqueRecommendations, userPreferences);

      // Sort by recommendation score and return top results
      return filteredRecommendations
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, count);
    } catch (error) {
      console.error('Error getting content-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on user's preferred categories
   * @param {object} userPreferences - User's preferences
   * @param {number} count - Number of recommendations
   * @returns {Promise<Array>} Category-based recommendations
   */
  async getCategoryBasedRecommendations(userPreferences, count) {
    try {
      const categoryPreferences = userPreferences.categories;
      const preferredCategories = Object.keys(categoryPreferences)
        .sort((a, b) => categoryPreferences[b].count - categoryPreferences[a].count);

      if (preferredCategories.length === 0) {
        return [];
      }

      const recommendations = [];

      for (const categoryName of preferredCategories) {
        const categoryPreference = categoryPreferences[categoryName];
        const categoryWeight = categoryPreference.count / userPreferences.totalItems;

        // Get products from this category that user hasn't ordered recently
        const categoryProducts = await Product.findAll({
          include: [{
            model: ProductCategory,
            where: { name: categoryName }
          }],
          where: {
            id: { [Op.notIn]: userPreferences.recentlyOrdered }
          },
          limit: Math.ceil(count * categoryWeight) + 2 // Get a few extra for filtering
        });

        // Score products based on category preference strength
        const scoredProducts = categoryProducts.map(product => {
          const productData = product.toJSON();
          return {
            ...productData,
            price: parseFloat(productData.price) || 0, // Ensure price is a number
            recommendationReason: `Based on your preference for ${categoryName}`,
            recommendationScore: categoryWeight * 0.6 + 0.2, // Base score with category weight
            categoryPreferenceStrength: categoryWeight
          };
        });

        recommendations.push(...scoredProducts);

        if (recommendations.length >= count) break;
      }

      return recommendations.slice(0, count);
    } catch (error) {
      console.error('Error getting category-based recommendations:', error);
      return [];
    }
  }

  /**
   * Get recommendations based on user's price range preferences
   * @param {object} userPreferences - User's preferences  
   * @param {number} count - Number of recommendations
   * @returns {Promise<Array>} Price-range based recommendations
   */
  async getPriceRangeRecommendations(userPreferences, count) {
    try {
      const priceRange = userPreferences.priceRange;
      
      // Use user's price range or default if no history
      const minPrice = priceRange.min === Infinity ? 
        this.config.criteria.priceRange.defaultRange[0] : 
        priceRange.min * (1 - this.config.criteria.priceRange.tolerance);
      
      const maxPrice = priceRange.max === 0 ? 
        this.config.criteria.priceRange.defaultRange[1] : 
        priceRange.max * (1 + this.config.criteria.priceRange.tolerance);

      // Get products within price range
      const priceRangeProducts = await Product.findAll({
        where: {
          price: {
            [Op.between]: [minPrice, maxPrice]
          },
          id: { [Op.notIn]: userPreferences.recentlyOrdered }
        },
        include: [ProductCategory],
        limit: count * 2 // Get extra for filtering
      });

      // Score products based on how close they are to user's average price
      const avgPrice = priceRange.avg || (minPrice + maxPrice) / 2;
      
      const scoredProducts = priceRangeProducts.map(product => {
        const productPrice = parseFloat(product.price) || 0;
        const priceDifference = Math.abs(productPrice - avgPrice);
        const maxDifference = Math.max(productPrice, avgPrice);
        const priceScore = maxDifference > 0 ? 1 - (priceDifference / maxDifference) : 1;

        const productData = product.toJSON();
        return {
          ...productData,
          price: productPrice, // Ensure price is a number
          recommendationReason: `Matches your price range ($${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`,
          recommendationScore: priceScore * 0.4 + 0.1, // Price-based score
          priceScore
        };
      });

      return scoredProducts
        .sort((a, b) => b.priceScore - a.priceScore)
        .slice(0, count);
    } catch (error) {
      console.error('Error getting price-range recommendations:', error);
      return [];
    }
  }

  /**
   * Remove duplicate products from recommendations
   * @param {Array} recommendations - Array of product recommendations
   * @returns {Array} Unique recommendations
   */
  removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(product => {
      if (seen.has(product.id)) {
        return false;
      }
      seen.add(product.id);
      return true;
    });
  }
}

module.exports = ContentBasedStrategy;
