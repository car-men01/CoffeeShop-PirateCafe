const express = require('express');
const router = express.Router();
const { User } = require('../models/relationships');
const { authenticate, adminOnly } = require('../middleware/auth');

// GET /api/wallet/balance - Get user's wallet balance
router.get('/balance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['balance']
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Ensure balance is never null - default to 0.00
    const balance = user.balance !== null ? parseFloat(user.balance) : 0.00;
    
    res.json({ balance });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({ message: 'Failed to fetch wallet balance' });
  }
});

// POST /api/wallet/add-funds - Add funds to user's wallet
router.post('/add-funds', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentBalance = user.balance !== null ? parseFloat(user.balance) : 0.00;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Update user balance
    await user.update({ balance: newBalance });
    
    res.json({
      success: true,
      newBalance,
      message: 'Funds added successfully'
    });
  } catch (error) {
    console.error('Error adding funds:', error);
    res.status(500).json({ message: 'Failed to add funds' });
  }
});

// GET /api/wallet/transactions - Get user's transaction history (empty for simplified version)
router.get('/transactions', authenticate, async (req, res) => {
  try {
    // Return empty array since we're not storing transaction history
    res.json({ transactions: [] });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

// POST /api/wallet/deduct - Deduct funds from wallet (for orders)
router.post('/deduct', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, orderId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentBalance = user.balance !== null ? parseFloat(user.balance) : 0.00;
    
    if (currentBalance < parseFloat(amount)) {
      return res.status(400).json({ message: 'Insufficient funds' });
    }
    
    const newBalance = currentBalance - parseFloat(amount);
    
    // Update user balance
    await user.update({ balance: newBalance });
    
    res.json({
      success: true,
      newBalance,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    console.error('Error deducting funds:', error);
    res.status(500).json({ message: 'Failed to process payment' });
  }
});

// Admin Routes
// GET /api/wallet/admin/all-wallets - Get all user wallets (admin only)
router.get('/admin/all-wallets', authenticate, adminOnly, async (req, res) => {
  try {
    const wallets = await User.findAll({
      where: { role: 'user' },
      attributes: ['id', 'username', 'email', 'balance', 'updatedAt'],
      order: [['username', 'ASC']]
    });
    
    // Format the response
    const formattedWallets = wallets.map(wallet => ({
      user_id: wallet.id,
      username: wallet.username,
      email: wallet.email,
      balance: wallet.balance !== null ? parseFloat(wallet.balance) : 0.00,
      updated_at: wallet.updatedAt
    }));
    
    res.json({ wallets: formattedWallets });
  } catch (error) {
    console.error('Error fetching all wallets:', error);
    res.status(500).json({ message: 'Failed to fetch wallets' });
  }
});

// POST /api/wallet/admin/add-funds - Add funds to specific user's wallet (admin only)
router.post('/admin/add-funds', authenticate, adminOnly, async (req, res) => {
  try {
    const { userId, amount, note } = req.body;
    
    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({ message: 'Invalid user ID or amount' });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const currentBalance = user.balance !== null ? parseFloat(user.balance) : 0.00;
    const newBalance = currentBalance + parseFloat(amount);
    
    // Update user balance
    await user.update({ balance: newBalance });
    
    res.json({
      success: true,
      newBalance,
      message: 'Funds added successfully'
    });
  } catch (error) {
    console.error('Error adding funds (admin):', error);
    res.status(500).json({ message: 'Failed to add funds' });
  }
});

// GET /api/wallet/admin/user-transactions/:userId - Get specific user's transaction history (admin only)
router.get('/admin/user-transactions/:userId', authenticate, adminOnly, async (req, res) => {
  try {
    // Return empty array since we're not storing transaction history
    res.json({ transactions: [] });
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
});

module.exports = router;
