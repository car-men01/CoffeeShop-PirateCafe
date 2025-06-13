import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { orderService } from '../services/cartService';
import { IMAGES_BASE_URL } from '../config';
import '../styles/Orders.css';

const Orders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false
  });
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (currentUser?.role === 'admin') {
      navigate('/admin/orders');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, currentUser, navigate]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await orderService.getOrders(page, 10);
      setOrders(response.orders);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await orderService.cancelOrder(orderId);
      await fetchOrders(pagination.currentPage); // Refresh current page
      alert('Order cancelled successfully');
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert(error.response?.data?.error || 'Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#ffa500';
      case 'confirmed': return '#007bff';
      case 'preparing': return '#17a2b8';
      case 'ready': return '#28a745';
      case 'delivered': return '#6c757d';
      case 'cancelled': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="orders-page">
      <div className="orders-header">
        <h1>My Orders</h1>
        <button onClick={() => navigate('/menu')} className="continue-shopping-btn">
          Continue Shopping
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h2>No orders yet</h2>
          <p>You haven't placed any orders yet. Start shopping!</p>
          <button onClick={() => navigate('/menu')} className="shop-now-btn">
            Shop Now
          </button>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header" onClick={() => toggleOrderDetails(order.id)}>
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">
                      {new Date(order.orderDate).toLocaleDateString()} at{' '}
                      {new Date(order.orderDate).toLocaleTimeString()}
                    </p>
                    <p className="order-total">Total: €{order.total.toFixed(2)}</p>
                  </div>
                  <div className="order-status">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {getStatusText(order.status)}
                    </span>
                    {order.estimatedTime && order.status === 'preparing' && (
                      <p className="estimated-time">
                        Est. {order.estimatedTime} min
                      </p>
                    )}
                  </div>
                  <div className="order-actions">
                    {(order.status === 'pending' || order.status === 'confirmed') && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelOrder(order.id);
                        }}
                        className="cancel-order-btn"
                      >
                        Cancel
                      </button>
                    )}
                    <button className="toggle-details-btn">
                      {expandedOrder === order.id ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {expandedOrder === order.id && (
                  <div className="order-details">
                    {order.notes && (
                      <div className="order-notes">
                        <h4>Special Instructions:</h4>
                        <p>{order.notes}</p>
                      </div>
                    )}
                    
                    {/* <h4>Order Items:</h4> */}
                    <div className="order-items">
                      {order.items.map((item) => (
                        <div key={item.id} className="order-item">
                          <img 
                            src={item.productImage 
                              ? (item.productImage.startsWith('http') 
                                  ? item.productImage 
                                  : `${IMAGES_BASE_URL}${item.productImage}`)
                              : '/assets/add_product_main.jpg'
                            }
                            alt={item.productName}
                            className="order-item-image"
                          />
                          <div className="order-item-details">
                            <h5>{item.productName}</h5>
                            <p>€{item.price.toFixed(2)} × {item.quantity}</p>
                          </div>
                          <div className="order-item-total">
                            €{item.subtotal.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => fetchOrders(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="pagination-btn"
              >
                Previous
              </button>
              <span className="pagination-info">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button 
                onClick={() => fetchOrders(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="pagination-btn"
              >
                Next
              </button>
            </div>
          )}

          {/* <div className="orders-summary">
            <p>Total orders: {pagination.totalOrders}</p>
          </div> */}
        </>
      )}
    </div>
  );
};

export default Orders;
