/**
 * Recommendation System Configuration
 * 
 * This file contains all configurable parameters for the recommendation system.
 * You can modify these values to change recommendation criteria without touching the core logic.
 */

module.exports = {
  // Strategy configuration
  strategies: {
    // Default strategy to use when none specified
    default: 'hybrid',
    
    // Fallback strategy if default fails
    fallback: 'popularity',

    
    // Hybrid strategy weights - must sum to 1.0
    hybrid: {
      weights: {
        popularity: 0.1,        // 30% based on overall popularity
        collaborative: 0.1,     // 40% based on similar users
        content: 0.8           // 30% based on product similarity
      }
    }
  },

  // Recommendation criteria weights and settings
  criteria: {
    // User order history analysis
    orderHistory: {
      enabled: true,
      weight: 0.4,
      lookbackDays: 10,          // How far back to look for orders
      minOrdersRequired: 2       // Minimum orders needed for personalization
    },

    // Category preference analysis
    categoryPreference: {
      enabled: true,
      weight: 0.3,
      minCategoryOrders: 1       // Minimum orders in category to consider preference
    },

    // Price range preference
    priceRange: {
      enabled: true,
      weight: 0.2,
      tolerance: 0.5,            // 30% price tolerance from user's typical range
      defaultRange: [3, 30]      // Default price range for new users
    },

    // Product popularity
    popularity: {
      enabled: true,
      weight: 0.1,
      timeWindow: 30,            // Days to consider for popularity calculation
      minOrdersForPopular: 1     // Minimum orders to consider a product popular (lowered from 5)
    },

    // Time-based preferences (morning vs afternoon)
    timePreference: {
      enabled: true,
      weight: 0.15,
      morningHours: [6, 11],     // Morning time range
      afternoonHours: [12, 17],  // Afternoon time range
      eveningHours: [18, 22]     // Evening time range
    },

    // Seasonal preferences
    seasonal: {
      enabled: false,            // Disabled by default, enable if you have seasonal products
      weight: 0.1
    }
  },

  // General settings
  general: {
    maxRecommendations: 10,      // Maximum recommendations to return
    defaultRecommendations: 5,   // Default number if not specified
    minSimilarUsers: 3,          // Minimum similar users for collaborative filtering
    excludeOutOfStock: true,     // Whether to exclude out-of-stock items
    excludeRecentlyOrdered: true, // Exclude items ordered in last N days
    recentOrderDays: 7           // Days to consider "recent" for exclusion
  },

  // Cache settings
  cache: {
    enabled: true,
    popularProductsTTL: 1800,    // 30 minutes cache for popular products
    userPreferencesTTL: 3600,    // 1 hour cache for user preferences
    recommendationsTTL: 600      // 10 minutes cache for recommendations
  },

  // Database query limits
  queryLimits: {
    maxOrdersPerUser: 100,       // Max orders to analyze per user
    maxSimilarUsers: 20,         // Max similar users to consider
    maxProductsToAnalyze: 1000   // Max products to analyze for recommendations
  }
};
