import React, { useState, useEffect, useContext, useCallback, memo } from 'react';
import { ProductContext } from '../ProductContext';
import { AuthContext } from '../AuthContext';
import { IMAGES_BASE_URL } from '../config';
import '../styles/RecommendationsSection.css';

const RecommendationsSection = ({ 
  title = "Recommended for You", 
  strategy = "hybrid", 
  count = 4,
  category = null,
  showForAnonymous = true 
}) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Safely get contexts with fallbacks
  const productContext = useContext(ProductContext);
  const authContext = useContext(AuthContext);

  // Fallback if contexts are not available
  const { getRecommendations, getPopularProducts, products = [] } = productContext || {};
  const { isAuthenticated, currentUser, loading: authLoading } = authContext || { 
    isAuthenticated: false, 
    currentUser: null, 
    loading: true 
  };
  
  // Wait for auth to be determined before doing anything
  const isAuthReady = authContext && !authLoading;
  
  // Load recommendations with proper timing
  useEffect(() => {
    let timeoutId;
    
    // Only proceed if auth state is ready
    if (!isAuthReady) return;
    
    if (showForAnonymous && !isAuthenticated && (getRecommendations || getPopularProducts)) {
      // Debounce the auto-open to prevent flickering
      timeoutId = setTimeout(() => {
        setIsDropdownOpen(true);
      }, 500); // Increased delay to ensure auth is settled
    } else if (isAuthenticated && currentUser) {
      // For authenticated users, open dropdown and fetch recommendations
      timeoutId = setTimeout(() => {
        setIsDropdownOpen(true);
      }, 300);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthReady, isAuthenticated, currentUser, showForAnonymous, getRecommendations, getPopularProducts]);

  // Helper function to get random products as fallback
  const getRandomProducts = useCallback((count) => {
    if (!products || products.length === 0) return [];
    
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count).map(product => ({
      ...product,
      recommendationReason: 'Random discovery'
    }));
  }, [products]);

  const fetchRecommendations = useCallback(async () => {
    if (!getRecommendations && !getPopularProducts) {
      console.warn('No recommendation functions available');
      return;
    }

    // Debug logging
    console.log('🔍 Recommendations Debug:', {
      isAuthenticated,
      currentUser: currentUser ? { id: currentUser.id, username: currentUser.username } : null,
      authLoading,
      isAuthReady,
      showForAnonymous,
      hasGetRecommendations: !!getRecommendations,
      hasGetPopularProducts: !!getPopularProducts,
      totalProducts: products.length
    });

    try {
      setLoading(true);
      setError(null);

      let recommendationsData = [];

      if (isAuthenticated && currentUser && getRecommendations) {
        console.log('📊 Fetching personalized recommendations for user:', currentUser.id);
        try {
          // Get personalized recommendations for authenticated users
          recommendationsData = await getRecommendations(currentUser.id, {
            strategy,
            count,
            category
          });
          console.log('✅ Personalized recommendations received:', recommendationsData.length);
        } catch (authError) {
          console.warn('Failed to get personalized recommendations, falling back to popular:', authError.message);
          // Fallback to popular products if personalized fails
          if (getPopularProducts) {
            console.log('🔄 Falling back to popular products');
            recommendationsData = await getPopularProducts(count);
          }
        }
      } else if (showForAnonymous && getPopularProducts) {
        console.log('👤 Fetching popular products for anonymous user');
        try {
          // Get popular products for anonymous users
          recommendationsData = await getPopularProducts(count);
          console.log('✅ Popular products received:', recommendationsData.length);
          
          // If no popular products, fallback to random products
          if (recommendationsData.length === 0) {
            console.log('📦 No popular products found, using random products as fallback');
            recommendationsData = getRandomProducts(count);
            console.log('✅ Random products fallback:', recommendationsData.length);
          }
        } catch (popularError) {
          console.warn('Failed to get popular products:', popularError.message);
          // Even if API fails, try random products
          console.log('📦 Using random products as fallback due to error');
          recommendationsData = getRandomProducts(count);
        }
      } else if (showForAnonymous && products.length > 0) {
        // If no API functions available but we have products, show random ones
        console.log('📦 No API functions available, using random products');
        recommendationsData = getRandomProducts(count);
      } else {
        console.log('❌ No conditions met for recommendations:', {
          isAuthenticated,
          hasCurrentUser: !!currentUser,
          showForAnonymous,
          hasGetRecommendations: !!getRecommendations,
          hasGetPopularProducts: !!getPopularProducts
        });
      }

      setRecommendations(recommendationsData || []);
      console.log('✅ Final recommendations set:', recommendationsData?.length || 0);
      if (recommendationsData?.length > 0) {
        console.log('📸 First product image path:', recommendationsData[0].image);
        console.log('📸 Image URL will be:', recommendationsData[0].image 
          ? (recommendationsData[0].image.startsWith('http') ? recommendationsData[0].image : `${IMAGES_BASE_URL}${recommendationsData[0].image}`)
          : `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`
        );
      }
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [getRandomProducts]); // Added dependency

  const handleDropdownToggle = useCallback(() => {
    const newOpenState = !isDropdownOpen;
    setIsDropdownOpen(newOpenState);
    
    // Fetch recommendations when opening dropdown if we don't have any
    if (newOpenState && recommendations.length === 0 && !loading && (getRecommendations || getPopularProducts)) {
      // Add a small delay to prevent rapid firing
      setTimeout(() => {
        fetchRecommendations();
      }, 100);
    }
  }, [isDropdownOpen, recommendations.length, loading, getRecommendations, getPopularProducts]);

  // Removed the problematic useEffect that was causing twitching
  // The dropdown will naturally refresh when user interacts with it

  const handleAddToCart = useCallback((product) => {
    // You can implement add to cart functionality here
    // This will depend on your existing cart implementation
    console.log('Adding to cart:', product);
  }, []);

  // Safe price formatting function
  const formatPrice = useCallback((price) => {
    if (price === null || price === undefined || price === '') {
      return '0.00';
    }
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  }, []);

  // Safe stock check function
  const getStock = useCallback((product) => {
    const stock = product.stock;
    if (stock === null || stock === undefined) {
      return 1; // Default to available if stock not specified
    }
    return typeof stock === 'number' ? stock : parseInt(stock) || 0;
  }, []);

  // Don't render if contexts are not available
  if (!productContext) {
    console.warn('RecommendationsSection: ProductContext not available');
    return null;
  }

  // Don't render if auth is still loading
  if (!isAuthReady) {
    console.log('RecommendationsSection: Waiting for auth to be ready...');
    return (
      <div className="recommendations-dropdown">
        <div className="recommendations-header-button">
          <h3 className="recommendations-title">{title}</h3>
          <div className="dropdown-info">
            <span className="recommendations-subtitle">Loading...</span>
            <span className="dropdown-arrow">⏳</span>
          </div>
        </div>
      </div>
    );
  }

  // Don't show recommendations if user is not authenticated and showForAnonymous is false
  if (!isAuthenticated && !showForAnonymous) {
    return null;
  }

  // Don't show anything if no recommendations and loading is done and no error
  if (!loading && recommendations.length === 0 && !error && !isDropdownOpen) {
    // Still show the dropdown header so users can try to load recommendations
    return (
      <div className="recommendations-dropdown">
        <div 
          className="recommendations-header-button"
          onClick={handleDropdownToggle}
        >
          <h3 className="recommendations-title">{title}</h3>
          <div className="dropdown-info">
            {!isAuthenticated && showForAnonymous && (
              <span className="recommendations-subtitle">Click to see popular choices</span>
            )}
            {isAuthenticated && (
              <span className="recommendations-subtitle">
                Click to see recommendations
              </span>
            )}
            <span className="dropdown-arrow">▼</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommendations-dropdown">
      <div 
        className="recommendations-header-button"
        onClick={handleDropdownToggle}
      >
        <h3 className="recommendations-title">{title}</h3>
        <div className="dropdown-info">
          {!isAuthenticated && showForAnonymous && (
            <span className="recommendations-subtitle">Popular choices</span>
          )}
          {isAuthenticated && (
            <span className="recommendations-subtitle">
              Based on your preferences
            </span>
          )}
          <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isDropdownOpen && (
        <div className="recommendations-dropdown-content">
          {loading && (
            <div className="recommendations-loading">
              <div className="loading-spinner"></div>
              <span>Loading recommendations...</span>
            </div>
          )}

          {error && (
            <div className="recommendations-error">
              <span>{error}</span>
              <button onClick={fetchRecommendations} className="retry-btn">
                Try Again
              </button>
            </div>
          )}

          {!loading && recommendations.length > 0 && (
            <div className="recommendations-compact-grid">
              {recommendations.map((product) => (
                <div key={product.id} className="recommendation-compact-card">
                  <div className="compact-image-container">
                    <img
                      src={product.image 
                        ? (product.image.startsWith('http') ? product.image : `${IMAGES_BASE_URL}${product.image}`)
                        : `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`
                      }
                      alt={product.name}
                      className="compact-product-image"
                      onError={(e) => {
                        e.target.src = `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`;
                      }}
                    />
                    {product.recommendationReason && (
                      <div className="compact-recommendation-badge">
                        <span>{product.recommendationReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="compact-product-info">
                    <h5 className="compact-product-name">{product.name}</h5>
                    <p className="compact-product-description">
                      {product.description?.length > 40 
                        ? `${product.description.substring(0, 40)}...` 
                        : product.description}
                    </p>
                    
                    <div className="compact-product-details">
                      <span className="compact-product-price">${formatPrice(product.price)}</span>
                      {product.ProductCategory && (
                        <span className="compact-product-category">
                          {product.ProductCategory.name}
                        </span>
                      )}
                    </div>

                    <button
                      className="compact-add-to-cart-btn"
                      onClick={() => handleAddToCart(product)}
                      disabled={getStock(product) <= 0}
                    >
                      {getStock(product) <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <div className="recommendations-footer">
              <button
                className="refresh-recommendations-btn"
                onClick={fetchRecommendations}
              >
                Refresh Recommendations
              </button>
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <div className="no-recommendations">
              <p>No recommendations available at the moment.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default memo(RecommendationsSection);
