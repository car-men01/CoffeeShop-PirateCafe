import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { cartService } from '../services/cartService';
import { IMAGES_BASE_URL } from '../config';
import '../styles/Cart.css';

const Cart = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (currentUser?.role === 'admin') {
      navigate('/');
      return;
    }

    fetchCart();
  }, [isAuthenticated, currentUser, navigate]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error fetching cart:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load cart');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      setUpdating(true);
      await cartService.updateCartItem(cartItemId, newQuantity);
      await fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity');
    } finally {
      setUpdating(false);
    }
  };

  const removeItem = async (cartItemId, productName) => {
    if (!confirm(`Remove ${productName} from cart?`)) return;
    
    try {
      setUpdating(true);
      await cartService.removeFromCart(cartItemId);
      await fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item');
    } finally {
      setUpdating(false);
    }
  };

  const clearCart = async () => {
    if (!confirm('Are you sure you want to clear your entire cart?')) return;
    
    try {
      setUpdating(true);
      await cartService.clearCart();
      await fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error clearing cart:', error);
      alert('Failed to clear cart');
    } finally {
      setUpdating(false);
    }
  };

  const proceedToCheckout = () => {
    if (cart.items.length === 0) {
      alert('Your cart is empty');
      return;
    }
    navigate('/checkout');
  };

  if (loading) return <div className="loading">Loading cart...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Your Shopping Cart</h1>
        <button onClick={() => navigate('/menu')} className="continue-shopping-btn">
          ← Continue Shopping
        </button>
      </div>

      {cart.items.length === 0 ? (
        <div className="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Add some delicious items from our menu!</p>
          <button onClick={() => navigate('/menu')} className="shop-now-btn">
            Shop Now
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item.id} className="cart-item">
                <img 
                  src={item.product.image.startsWith('http') 
                    ? item.product.image 
                    : `${IMAGES_BASE_URL}${item.product.image}`
                  }
                  alt={item.product.name}
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{item.product.name}</h3>
                  <p className="cart-item-category">{item.product.category}</p>
                  <p className="cart-item-description">{item.product.description}</p>
                  <p className="cart-item-price">€{item.price.toFixed(2)} each</p>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-controls">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={updating || item.quantity <= 1}
                      className="quantity-btn"
                    >
                      -
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={updating}
                      className="quantity-btn"
                    >
                      +
                    </button>
                  </div>
                  <div className="cart-item-subtotal">
                    <strong>€{item.subtotal.toFixed(2)}</strong>
                  </div>
                  <div className="cart-item-buttons">
                    <button 
                      onClick={() => navigate(`/product/${encodeURIComponent(item.product.id)}`)}
                      className="view-btn"
                      title="View product details"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => removeItem(item.id, item.product.name)}
                      disabled={updating}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="cart-summary-content">
              <div className="cart-total">
                <h3>Total: €{cart.total.toFixed(2)}</h3>
                <p>{cart.itemCount} item(s)</p>
              </div>
              <div className="cart-buttons">
                <button 
                  onClick={clearCart}
                  disabled={updating}
                  className="clear-cart-btn"
                >
                  Clear Cart
                </button>
                <button 
                  onClick={proceedToCheckout}
                  disabled={updating}
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Cart;
