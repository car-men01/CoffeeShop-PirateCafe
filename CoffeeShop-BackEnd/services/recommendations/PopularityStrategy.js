const BaseStrategy = require('./BaseStrategy');

/**
 * Popularity-based recommendation strategy
 * Recommends the most popular products across all users
 */
class PopularityStrategy extends BaseStrategy {
  async recommend(userId, count, options) {
    try {
      const popularProducts = await this.getPopularProducts(count * 2); // Get more to allow for filtering
      
      // Get user preferences for filtering
      let userPreferences = {};
      if (userId) {
        try {
          userPreferences = await this.getUserPreferences(userId);
        } catch (error) {
          console.warn('Could not get user preferences for filtering:', error.message);
        }
      }

      // Filter products based on configuration
      const filteredProducts = this.filterProducts(popularProducts, userPreferences);

      // Return requested count
      return filteredProducts.slice(0, count).map(product => ({
        ...product,
        recommendationReason: 'Popular choice',
        recommendationScore: product.orderCount || 1
      }));
    } catch (error) {
      console.error('Error in PopularityStrategy:', error);
      return [];
    }
  }
}

module.exports = PopularityStrategy;
