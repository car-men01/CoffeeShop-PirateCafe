import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { orderService } from '../services/cartService';
import { IMAGES_BASE_URL } from '../config';
import '../styles/AdminOrders.css';

const AdminOrders = () => {
  const navigate = useNavigate();
  const { isAuthenticated, currentUser } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
    hasNext: false,
    hasPrev: false
  });
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (currentUser?.role !== 'admin') {
      navigate('/orders');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, currentUser, navigate, filters]);

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true);
      const response = await orderService.getAllOrders(
        page, 
        20, 
        filters.status, 
        filters.userId
      );
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true);
      await orderService.updateOrderStatus(orderId, newStatus);
      await fetchOrders(pagination.currentPage); // Refresh current page
    } catch (error) {
      console.error('Error updating order status:', error);
      alert(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
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

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  if (loading) return <div className="loading">Loading orders...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="admin-orders-page">
      <div className="admin-orders-header">
        <h1>Orders Management</h1>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="filter-select"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(status => (
              <option key={status} value={status}>
                {getStatusText(status)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="user-filter">Filter by User ID:</label>
          <input
            id="user-filter"
            type="number"
            value={filters.userId}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            placeholder="Enter user ID"
            className="filter-input"
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <h2>No orders found</h2>
          <p>No orders match the current filters.</p>
        </div>
      ) : (
        <>
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card admin-order-card">
                <div className="order-header" onClick={() => toggleOrderDetails(order.id)}>
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-customer">
                      Customer: {order.user.username} (ID: {order.user.id})
                    </p>
                    <p className="order-email">Email: {order.user.email}</p>
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
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, e.target.value);
                      }}
                      disabled={updatingStatus}
                      className="status-select"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {statusOptions.map(status => (
                        <option key={status} value={status}>
                          {getStatusText(status)}
                        </option>
                      ))}
                    </select>
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
                            <p>Product ID: {item.ProductId}</p>
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

          <div className="orders-summary">
            <p>Total orders: {pagination.totalOrders}</p>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;
