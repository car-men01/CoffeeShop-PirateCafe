import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const walletService = {
  // Get user's wallet balance
  getBalance: async () => {
    try {
      const response = await api.get('/api/wallet/balance');
      return response.data;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      throw error;
    }
  },

  // Add funds to wallet
  addFunds: async (amount) => {
    try {
      const response = await api.post('/api/wallet/add-funds', { amount });
      return response.data;
    } catch (error) {
      console.error('Error adding funds:', error);
      throw error;
    }
  },

  // Get transaction history (simplified - returns empty array)
  getTransactions: async () => {
    try {
      const response = await api.get('/api/wallet/transactions');
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  },

  // Admin: Get all user wallets
  getAllUserWallets: async () => {
    try {
      const response = await api.get('/api/wallet/admin/all-wallets');
      return response.data;
    } catch (error) {
      console.error('Error fetching all user wallets:', error);
      throw error;
    }
  },

  // Admin: Add funds to a specific user's wallet (simplified - no note storage)
  addFundsToUser: async (userId, amount, note = '') => {
    try {
      const response = await api.post('/api/wallet/admin/add-funds', {
        userId,
        amount,
        note
      });
      return response.data;
    } catch (error) {
      console.error('Error adding funds to user wallet:', error);
      throw error;
    }
  },

  // Admin: Get user's transaction history (simplified - returns empty array)
  getUserTransactions: async (userId) => {
    try {
      const response = await api.get(`/api/wallet/admin/user-transactions/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user transactions:', error);
      throw error;
    }
  },

  // Deduct funds from wallet (for orders)
  deductFunds: async (amount, orderId) => {
    try {
      const response = await api.post('/api/wallet/deduct', {
        amount,
        orderId
      });
      return response.data;
    } catch (error) {
      console.error('Error deducting funds:', error);
      throw error;
    }
  }
};

export default walletService;
