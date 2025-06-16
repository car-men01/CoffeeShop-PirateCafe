import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProductContext } from '../ProductContext';
import { AuthContext } from '../AuthContext';
import { IMAGES_BASE_URL } from '../config';
import { cartService } from '../services/cartService';
import '../styles/BestSellingSection.css';

const BestSellingSection = () => {
  const [bestSellingProducts, setBestSellingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const navigate = useNavigate();
  
  const { getBestSellingProducts } = useContext(ProductContext);
  const { isAuthenticated, currentUser } = useContext(AuthContext);

  useEffect(() => {
    const fetchBestSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const products = await getBestSellingProducts(3);
        setBestSellingProducts(products);
      } catch (err) {
        console.error('Error fetching best selling products:', err);
        setError('Failed to load best selling products');
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingProducts();
  }, [getBestSellingProducts]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCart = async (e, productId, productName) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (currentUser?.role === 'admin') {
      alert('Admins cannot add items to cart');
      return;
    }

    try {
      setAddingToCart(true);
      await cartService.addToCart(productId, 1);
      alert(`${productName} added to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        alert('Failed to add item to cart. Please try again.');
      }
    } finally {
      setAddingToCart(false);
    }
  };

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === '') {
      return '0.00';
    }
    const numPrice = typeof price === 'number' ? price : parseFloat(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  const getImageSrc = (product) => {
    if (!product.image) {
      return `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`;
    }
    if (product.image.startsWith('http')) {
      return product.image;
    }
    return `${IMAGES_BASE_URL}${product.image}`;
  };

  if (loading) {
    return (
      <section className="best-selling-section">
        <div className="container">
          <h2 className="section-title">Best Selling Items</h2>
          <div className="loading-message">Loading best selling products...</div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="best-selling-section">
        <div className="container">
          <h2 className="section-title">Best Selling Items</h2>
          <div className="error-message">{error}</div>
        </div>
      </section>
    );
  }

  if (bestSellingProducts.length === 0) {
    return (
      <section className="best-selling-section">
        <div className="container">
          <h2 className="section-title">Best Selling Items</h2>
          <div className="no-products-message">No best selling products available.</div>
        </div>
      </section>
    );
  }

  const [mainProduct, ...sideProducts] = bestSellingProducts;

  return (
    <section className="best-selling-section">
      <div className="container">
        <h2 className="section-title">Best Selling Items</h2>
        <div className="best-selling-grid">
          {/* Main product - left side */}
          {mainProduct && (
            <div 
              className="main-product-card"
              onClick={() => handleProductClick(mainProduct.id)}
            >
              <div className="main-product-image">
                <img
                  src={getImageSrc(mainProduct)}
                  alt={mainProduct.name}
                  onError={(e) => {
                    e.target.src = `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`;
                  }}
                />
              </div>
              <div className="main-product-info">
                <h3 className="product-name">{mainProduct.name}</h3>
                <span className="product-category">
                  {mainProduct.ProductCategory?.name || mainProduct.category || 'Category'}
                </span>
                <p className="product-description">{mainProduct.description}</p>
                <div className="product-price">{formatPrice(mainProduct.price)} €</div>
                {isAuthenticated && currentUser?.role !== 'admin' && (
                  <button 
                    className="add-to-cart-btn"
                    onClick={(e) => handleAddToCart(e, mainProduct.id, mainProduct.name)}
                    disabled={addingToCart}
                  >
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Side products - right side */}
          <div className="side-products">
            {sideProducts.map((product) => (
              <div 
                key={product.id}
                className="side-product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="side-product-image">
                  <img
                    src={getImageSrc(product)}
                    alt={product.name}
                    onError={(e) => {
                      e.target.src = `${IMAGES_BASE_URL}/data/assets/cappuccino.webp`;
                    }}
                  />
                </div>
                <div className="side-product-info">
                  <h4 className="product-name">{product.name}</h4>
                  <span className="product-category">
                    {product.ProductCategory?.name || product.category || 'Category'}
                  </span>
                  <p className="product-description">
                    {product.description?.length > 40 
                      ? `${product.description.substring(0, 40)}...` 
                      : product.description}
                  </p>
                  <div className="product-price">{formatPrice(product.price)} €</div>
                  {isAuthenticated && currentUser?.role !== 'admin' && (
                    <button 
                      className="add-to-cart-btn side-add-to-cart"
                      onClick={(e) => handleAddToCart(e, product.id, product.name)}
                      disabled={addingToCart}
                    >
                      {addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Set display name for better debugging and Fast Refresh
BestSellingSection.displayName = 'BestSellingSection';

export default BestSellingSection;
