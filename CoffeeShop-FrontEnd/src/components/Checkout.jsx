import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { cartService, orderService } from '../services/cartService';
import { IMAGES_BASE_URL } from '../config';
import '../styles/Checkout.css';

const Checkout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [cart, setCart] = useState({ items: [], total: 0, itemCount: 0 });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState(null);

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
      if (cartData.items.length === 0) {
        navigate('/cart');
        return;
      }
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

  const placeOrder = async () => {
    try {
      setPlacing(true);
      setError(null);
      
      const orderResponse = await orderService.createOrder(notes);
      
      // Show success message and redirect to orders page
      alert(`Order placed successfully! Order #${orderResponse.order.id}`);
      navigate('/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      if (error.response?.status === 400 && error.response.data.error === 'Insufficient balance') {
        setError(`Insufficient balance. Required: €${error.response.data.required.toFixed(2)}, Available: €${error.response.data.available.toFixed(2)}`);
      } else if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError(error.response?.data?.error || 'Failed to place order');
      }
    } finally {
      setPlacing(false);
    }
  };

  if (loading) return <div className="loading">Loading checkout...</div>;

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <button onClick={() => navigate('/cart')} className="back-to-cart-btn">
          ← Back to Cart
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      <div className="checkout-content">
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="order-items">
            {cart.items.map((item) => (
              <div 
                key={item.id} 
                className="order-item"
                onClick={() => navigate(`/product/${encodeURIComponent(item.product.id)}`)}
                title="Click to view product details"
              >
                <img 
                  src={item.product.image.startsWith('http') 
                    ? item.product.image 
                    : `${IMAGES_BASE_URL}${item.product.image}`
                  }
                  alt={item.product.name}
                  className="order-item-image"
                />
                <div className="order-item-details">
                  <h4>{item.product.name}</h4>
                  <p>€{item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <div className="order-item-total">
                  €{item.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <div className="order-total">
            <h3>Total: €{cart.total.toFixed(2)}</h3>
            <p>{cart.itemCount} item(s)</p>
          </div>
        </div>

        <div className="order-details-panel">
          <h2>Order Details</h2>
          
          <div className="form-group">
            <label htmlFor="notes">Special Instructions (Optional)</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any order details or special requirements..."
              rows={4}
              className="notes-textarea"
            />
          </div>

          <div className="payment-info">
            <h3>Payment Information</h3>
            <p>Payment will be deducted from your account balance.</p>
          </div>

          <div className="checkout-actions">
            <button 
              onClick={placeOrder}
              disabled={placing || cart.items.length === 0}
              className="place-order-btn"
            >
              {placing ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
