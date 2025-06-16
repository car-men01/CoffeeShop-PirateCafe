const BaseStrategy = require('./BaseStrategy');
const PopularityStrategy = require('./PopularityStrategy');
const CollaborativeStrategy = require('./CollaborativeStrategy');
const ContentBasedStrategy = require('./ContentBasedStrategy');

/**
 * Hybrid recommendation strategy
 * Combines multiple strategies with configurable weights
 */
class HybridStrategy extends BaseStrategy {
  constructor() {
    super();
    this.popularityStrategy = new PopularityStrategy();
    this.collaborativeStrategy = new CollaborativeStrategy();
    this.contentBasedStrategy = new ContentBasedStrategy();
  }

  async recommend(userId, count, options) {
    try {
      const weights = options.weights || this.config.strategies.hybrid.weights;
      
      // Validate weights sum to 1.0
      const weightSum = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
      if (Math.abs(weightSum - 1.0) > 0.01) {
        console.warn('Strategy weights do not sum to 1.0, normalizing...');
        const normalizedWeights = {};
        for (const [key, value] of Object.entries(weights)) {
          normalizedWeights[key] = value / weightSum;
        }
        weights = normalizedWeights;
      }

      // Get recommendations from each strategy
      const [popularityRecs, collaborativeRecs, contentRecs] = await Promise.allSettled([
        this.popularityStrategy.recommend(userId, Math.ceil(count * 1.5), options),
        this.collaborativeStrategy.recommend(userId, Math.ceil(count * 1.5), options),
        this.contentBasedStrategy.recommend(userId, Math.ceil(count * 1.5), options)
      ]);

      // Extract successful results, handle failures gracefully
      const strategies = [
        {
          name: 'popularity',
          recommendations: popularityRecs.status === 'fulfilled' ? popularityRecs.value : [],
          weight: weights.popularity || 0
        },
        {
          name: 'collaborative', 
          recommendations: collaborativeRecs.status === 'fulfilled' ? collaborativeRecs.value : [],
          weight: weights.collaborative || 0
        },
        {
          name: 'content',
          recommendations: contentRecs.status === 'fulfilled' ? contentRecs.value : [],
          weight: weights.content || 0
        }
      ].filter(strategy => strategy.weight > 0 && strategy.recommendations.length > 0);

      if (strategies.length === 0) {
        console.warn('No strategies returned results, falling back to popularity');
        return await this.popularityStrategy.recommend(userId, count, options);
      }

      // Combine recommendations with weighted scoring
      const combinedRecommendations = this.combineRecommendations(strategies, count);

      return combinedRecommendations;
    } catch (error) {
      console.error('Error in HybridStrategy:', error);
      // Ultimate fallback to popularity strategy
      return await this.popularityStrategy.recommend(userId, count, options);
    }
  }

  /**
   * Combine recommendations from multiple strategies with weights
   * @param {Array} strategies - Array of strategy results with weights
   * @param {number} count - Number of final recommendations to return
   * @returns {Array} Combined and scored recommendations
   */
  combineRecommendations(strategies, count) {
    try {
      const productScores = new Map();
      const productDetails = new Map();

      // Calculate weighted scores for each product
      strategies.forEach(strategy => {
        strategy.recommendations.forEach(product => {
          const productId = product.id;
          const currentScore = productScores.get(productId) || 0;
          const productScore = product.recommendationScore || 0.5;
          
          // Add weighted score from this strategy
          const weightedScore = productScore * strategy.weight;
          productScores.set(productId, currentScore + weightedScore);
          
          // Store product details (use the version with highest individual score)
          if (!productDetails.has(productId) || 
              (productDetails.get(productId).recommendationScore || 0) < productScore) {
            productDetails.set(productId, {
              ...product,
              hybridScore: currentScore + weightedScore,
              strategySources: productDetails.has(productId) ? 
                [...(productDetails.get(productId).strategySources || []), strategy.name] :
                [strategy.name]
            });
          } else {
            // Update hybrid score and add strategy source
            const existing = productDetails.get(productId);
            existing.hybridScore = currentScore + weightedScore;
            existing.strategySources = [...(existing.strategySources || []), strategy.name];
            productDetails.set(productId, existing);
          }
        });
      });

      // Convert to array and sort by combined score
      const sortedRecommendations = Array.from(productDetails.values())
        .map(product => ({
          ...product,
          recommendationScore: product.hybridScore,
          recommendationReason: this.generateHybridReason(product.strategySources)
        }))
        .sort((a, b) => b.recommendationScore - a.recommendationScore);

      return sortedRecommendations.slice(0, count);
    } catch (error) {
      console.error('Error combining recommendations:', error);
      return [];
    }
  }

  /**
   * Generate explanation for hybrid recommendations
   * @param {Array} strategySources - List of strategies that recommended this product
   * @returns {string} Human-readable reason
   */
  generateHybridReason(strategySources) {
    if (!strategySources || strategySources.length === 0) {
      return 'Recommended for you';
    }

    const reasons = [];
    if (strategySources.includes('popularity')) {
      reasons.push('popular choice');
    }
    if (strategySources.includes('collaborative')) {
      reasons.push('liked by similar users');
    }
    if (strategySources.includes('content')) {
      reasons.push('matches your preferences');
    }

    if (reasons.length === 1) {
      return `Recommended: ${reasons[0]}`;
    } else if (reasons.length === 2) {
      return `Recommended: ${reasons[0]} and ${reasons[1]}`;
    } else {
      return `Recommended: ${reasons.slice(0, -1).join(', ')}, and ${reasons[reasons.length - 1]}`;
    }
  }
}

module.exports = HybridStrategy;
