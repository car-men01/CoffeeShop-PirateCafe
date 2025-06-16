const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const RecommendationService = require('../services/RecommendationService');

// Initialize recommendation service
const recommendationService = new RecommendationService();

/**
 * GET /recommendations/user/:userId
 * Get personalized recommendations for a specific user
 * Query params:
 * - strategy: 'popularity', 'collaborative', 'content', 'hybrid' (default: 'hybrid')
 * - count: number of recommendations (default: 5, max: 10)
 * - category: filter by category name (optional)
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { strategy, count, category } = req.query;
    
    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    // Validate count parameter
    const requestedCount = count ? parseInt(count) : undefined;
    if (count && (isNaN(requestedCount) || requestedCount < 1)) {
      return res.status(400).json({
        error: 'Invalid count parameter',
        message: 'Count must be a positive number'
      });
    }

    const recommendations = await recommendationService.getRecommendations(parseInt(userId), {
      strategy,
      count: requestedCount,
      category
    });
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        userId: parseInt(userId),
        strategy: strategy || 'hybrid',
        count: recommendations.length,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: error.message 
    });
  }
});

/**
 * GET /recommendations/popular
 * Get popular products (no authentication required)
 * Query params:
 * - count: number of products (default: 5, max: 10)
 * - category: filter by category name (optional)
 */
router.get('/popular', async (req, res) => {
  try {
    const { count, category } = req.query;
    
    const requestedCount = count ? parseInt(count) : 5;
    if (isNaN(requestedCount) || requestedCount < 1) {
      return res.status(400).json({
        error: 'Invalid count parameter',
        message: 'Count must be a positive number'
      });
    }

    const recommendations = await recommendationService.getRecommendations(null, {
      strategy: 'popularity',
      count: requestedCount,
      category
    });
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        strategy: 'popularity',
        count: recommendations.length,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Error getting popular recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get popular products',
      message: error.message 
    });
  }
});

/**
 * GET /recommendations/anonymous
 * Get recommendations for anonymous users (based on popularity)
 * Query params:
 * - count: number of recommendations (default: 5, max: 10)
 * - category: filter by category name (optional)
 */
router.get('/anonymous', async (req, res) => {
  try {
    const { count, category } = req.query;
    
    const requestedCount = count ? parseInt(count) : 5;
    if (isNaN(requestedCount) || requestedCount < 1) {
      return res.status(400).json({
        error: 'Invalid count parameter',
        message: 'Count must be a positive number'
      });
    }

    const recommendations = await recommendationService.getRecommendations(null, {
      strategy: 'popularity',
      count: requestedCount,
      category
    });
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        strategy: 'popularity',
        count: recommendations.length,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Error getting anonymous recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: error.message 
    });
  }
});

/**
 * POST /recommendations/user/:userId/custom
 * Get recommendations with custom strategy weights (for hybrid strategy)
 * Body: { weights: { popularity: 0.3, collaborative: 0.4, content: 0.3 } }
 */
router.post('/user/:userId/custom', async (req, res) => {
  try {
    const { userId } = req.params;
    const { weights, count, category } = req.body;
    
    // Validate user ID
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({ 
        error: 'Invalid user ID',
        message: 'User ID must be a valid number'
      });
    }

    // Validate weights
    if (!weights || typeof weights !== 'object') {
      return res.status(400).json({
        error: 'Invalid weights',
        message: 'Weights must be an object with strategy names as keys'
      });
    }

    const weightSum = Object.values(weights).reduce((sum, weight) => sum + (weight || 0), 0);
    if (Math.abs(weightSum - 1.0) > 0.01) {
      return res.status(400).json({
        error: 'Invalid weights',
        message: 'Weights must sum to 1.0'
      });
    }

    const recommendations = await recommendationService.getRecommendations(parseInt(userId), {
      strategy: 'hybrid',
      weights,
      count: count || 5,
      category
    });
    
    res.json({
      success: true,
      data: recommendations,
      meta: {
        userId: parseInt(userId),
        strategy: 'hybrid',
        weights,
        count: recommendations.length,
        category: category || null
      }
    });
  } catch (error) {
    console.error('Error getting custom recommendations:', error);
    res.status(500).json({ 
      error: 'Failed to get custom recommendations',
      message: error.message 
    });
  }
});

/**
 * GET /recommendations/strategies
 * Get list of available recommendation strategies
 */
router.get('/strategies', (req, res) => {
  try {
    const strategies = recommendationService.getAvailableStrategies();
    const config = recommendationService.getConfiguration();
    
    res.json({
      success: true,
      data: {
        strategies,
        default: config.strategies.default,
        fallback: config.strategies.fallback,
        hybridWeights: config.strategies.hybrid.weights
      }
    });
  } catch (error) {
    console.error('Error getting strategies:', error);
    res.status(500).json({ 
      error: 'Failed to get strategies',
      message: error.message 
    });
  }
});

/**
 * GET /recommendations/config
 * Get current recommendation configuration (admin only)
 */
router.get('/config', async (req, res) => {
  try {
    // Add admin check here if you have admin middleware
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    const config = recommendationService.getConfiguration();
    const cacheStats = recommendationService.getCacheStats();
    
    res.json({
      success: true,
      data: {
        config,
        cacheStats
      }
    });
  } catch (error) {
    console.error('Error getting config:', error);
    res.status(500).json({ 
      error: 'Failed to get configuration',
      message: error.message 
    });
  }
});

/**
 * POST /recommendations/cache/clear
 * Clear recommendation cache (admin only)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    // Add admin check here if you have admin middleware
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({ error: 'Admin access required' });
    // }

    recommendationService.clearCache();
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
});

module.exports = router;
