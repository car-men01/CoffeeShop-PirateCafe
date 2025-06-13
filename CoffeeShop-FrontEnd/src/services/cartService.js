import axios from 'axios';
import { API_URL } from '../config';

// Set up axios defaults
const setupAuthHeader = () => {
  const token = localStorage.getItem('authToken');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const cartService = {
  // Get cart items
  async getCart() {
    setupAuthHeader();
    const response = await axios.get(`${API_URL}/cart`);
    return response.data;
  },

  // Add item to cart
  async addToCart(productId, quantity = 1) {
    setupAuthHeader();
    const response = await axios.post(`${API_URL}/cart/add`, {
      productId,
      quantity
    });
    return response.data;
  },

  // Update cart item quantity
  async updateCartItem(cartItemId, quantity) {
    setupAuthHeader();
    const response = await axios.put(`${API_URL}/cart/update/${cartItemId}`, {
      quantity
    });
    return response.data;
  },

  // Remove item from cart
  async removeFromCart(cartItemId) {
    setupAuthHeader();
    const response = await axios.delete(`${API_URL}/cart/remove/${cartItemId}`);
    return response.data;
  },

  // Clear entire cart
  async clearCart() {
    setupAuthHeader();
    const response = await axios.delete(`${API_URL}/cart/clear`);
    return response.data;
  }
};

export const orderService = {
  // Get user's orders
  async getOrders(page = 1, limit = 10) {
    setupAuthHeader();
    const response = await axios.get(`${API_URL}/orders?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get all orders (admin only)
  async getAllOrders(page = 1, limit = 20, status = '', userId = '') {
    setupAuthHeader();
    let url = `${API_URL}/orders/admin?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (userId) url += `&userId=${userId}`;
    const response = await axios.get(url);
    return response.data;
  },

  // Get specific order
  async getOrder(orderId) {
    setupAuthHeader();
    const response = await axios.get(`${API_URL}/orders/${orderId}`);
    return response.data;
  },

  // Create order from cart
  async createOrder(notes = '') {
    setupAuthHeader();
    const response = await axios.post(`${API_URL}/orders/create`, { notes });
    return response.data;
  },

  // Update order status (admin only)
  async updateOrderStatus(orderId, status) {
    setupAuthHeader();
    const response = await axios.put(`${API_URL}/orders/${orderId}/status`, { status });
    return response.data;
  },

  // Cancel order
  async cancelOrder(orderId) {
    setupAuthHeader();
    const response = await axios.put(`${API_URL}/orders/${orderId}/cancel`);
    return response.data;
  }
};
