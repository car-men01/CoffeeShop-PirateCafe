const NodeCache = require('node-cache');
const config = require('../config/recommendationConfig');
const PopularityStrategy = require('./recommendations/PopularityStrategy');
const CollaborativeStrategy = require('./recommendations/CollaborativeStrategy');
const ContentBasedStrategy = require('./recommendations/ContentBasedStrategy');
const HybridStrategy = require('./recommendations/HybridStrategy');

/**
 * Main Recommendation Service
 * Manages different recommendation strategies and caching
 */
class RecommendationService {
  constructor() {
    this.config = config;
    this.strategies = new Map();
    this.cache = config.cache.enabled ? new NodeCache() : null;
    this.loadStrategies();
  }

  /**
   * Load and initialize all recommendation strategies
   */
  loadStrategies() {
    this.strategies.set('popularity', new PopularityStrategy());
    this.strategies.set('collaborative', new CollaborativeStrategy());
    this.strategies.set('content', new ContentBasedStrategy());
    this.strategies.set('hybrid', new HybridStrategy());
  }

  /**
   * Get recommendations for a user
   * @param {number|null} userId - User ID (null for anonymous users)
   * @param {object} options - Recommendation options
   * @param {string} options.strategy - Strategy to use ('popularity', 'collaborative', 'content', 'hybrid')
   * @param {number} options.count - Number of recommendations to return
   * @param {string} options.category - Filter by category (optional)
   * @param {object} options.weights - Custom weights for hybrid strategy (optional)
   * @returns {Promise<Array>} Array of recommended products
   */
  async getRecommendations(userId, options = {}) {
    try {
      // Validate and set defaults
      const strategyName = options.strategy || this.config.strategies.default;
      const count = Math.min(
        options.count || this.config.general.defaultRecommendations,
        this.config.general.maxRecommendations
      );

      // Check cache first
      const cacheKey = this.generateCacheKey(userId, strategyName, options);
      if (this.cache && this.config.cache.enabled) {
        const cached = this.cache.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for recommendations: ${cacheKey}`);
          return cached.slice(0, count); // Ensure count limit
        }
      }

      // Get strategy
      const strategy = this.strategies.get(strategyName);
      if (!strategy) {
        console.warn(`Strategy '${strategyName}' not found, falling back to '${this.config.strategies.fallback}'`);
        const fallbackStrategy = this.strategies.get(this.config.strategies.fallback);
        if (!fallbackStrategy) {
          throw new Error(`Fallback strategy '${this.config.strategies.fallback}' not found`);
        }
        return await fallbackStrategy.recommend(userId, count, options);
      }

      // Get recommendations
      console.log(`Getting recommendations for user ${userId || 'anonymous'} using ${strategyName} strategy`);
      const recommendations = await strategy.recommend(userId, count, options);

      // Apply category filter if specified
      let filteredRecommendations = recommendations;
      if (options.category) {
        filteredRecommendations = recommendations.filter(product => 
          product.ProductCategory && 
          product.ProductCategory.name.toLowerCase() === options.category.toLowerCase()
        );
      }

      // Ensure we have the requested count (pad with popular products if needed)
      if (filteredRecommendations.length < count && strategyName !== 'popularity') {
        const additionalCount = count - filteredRecommendations.length;
        const popularStrategy = this.strategies.get('popularity');
        const additionalRecs = await popularStrategy.recommend(userId, additionalCount * 2, options);
        
        // Filter out duplicates and add to results
        const existingIds = new Set(filteredRecommendations.map(p => p.id));
        const uniqueAdditional = additionalRecs.filter(p => !existingIds.has(p.id));
        
        filteredRecommendations.push(...uniqueAdditional.slice(0, additionalCount));
      }

      // Final count limit
      const finalRecommendations = filteredRecommendations.slice(0, count);

      // Cache results
      if (this.cache && this.config.cache.enabled) {
        const ttl = this.config.cache.recommendationsTTL;
        this.cache.set(cacheKey, finalRecommendations, ttl);
        console.log(`Cached recommendations: ${cacheKey} (TTL: ${ttl}s)`);
      }

      console.log(`Returning ${finalRecommendations.length} recommendations for user ${userId || 'anonymous'}`);
      return finalRecommendations;

    } catch (error) {
      console.error('Error getting recommendations:', error);
      
      // Ultimate fallback: try to get popular products
      try {
        const popularStrategy = this.strategies.get('popularity');
        return await popularStrategy.recommend(userId, options.count || this.config.general.defaultRecommendations, options);
      } catch (fallbackError) {
        console.error('Fallback strategy also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Get popular products (public method for direct access)
   * @param {number} count - Number of products to return
   * @returns {Promise<Array>} Popular products
   */
  async getPopularProducts(count = 5) {
    try {
      const popularStrategy = this.strategies.get('popularity');
      return await popularStrategy.recommend(null, count, {});
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  /**
   * Get available strategies
   * @returns {Array} List of available strategy names
   */
  getAvailableStrategies() {
    return Array.from(this.strategies.keys());
  }

  /**
   * Get current configuration
   * @returns {object} Current configuration object
   */
  getConfiguration() {
    return { ...this.config };
  }

  /**
   * Update configuration (for dynamic updates)
   * @param {object} newConfig - New configuration object
   */
  updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('Recommendation configuration updated');
  }

  /**
   * Clear cache
   */
  clearCache() {
    if (this.cache) {
      this.cache.flushAll();
      console.log('Recommendation cache cleared');
    }
  }

  /**
   * Generate cache key for recommendations
   * @param {number|null} userId - User ID
   * @param {string} strategy - Strategy name
   * @param {object} options - Options object
   * @returns {string} Cache key
   */
  generateCacheKey(userId, strategy, options) {
    const keyParts = [
      'rec',
      userId || 'anon',
      strategy,
      options.count || this.config.general.defaultRecommendations,
      options.category || 'all'
    ];
    
    if (options.weights) {
      keyParts.push(JSON.stringify(options.weights));
    }
    
    return keyParts.join(':');
  }

  /**
   * Get cache statistics
   * @returns {object} Cache statistics
   */
  getCacheStats() {
    if (!this.cache) {
      return { enabled: false };
    }

    return {
      enabled: true,
      keys: this.cache.keys().length,
      stats: this.cache.getStats()
    };
  }
}

module.exports = RecommendationService;
