import React, { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';
import '../styles/AdminWallets.css';

const AdminWallets = () => {
  const [userWallets, setUserWallets] = useState([]);
  const [addFundsForm, setAddFundsForm] = useState({
    userId: '',
    amount: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddFunds, setShowAddFunds] = useState(false);

  useEffect(() => {
    loadUserWallets();
  }, []);

  // Auto-clear success message after 2 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [success]);

  const loadUserWallets = async () => {
    try {
      setLoading(true);
      const response = await walletService.getAllUserWallets();
      setUserWallets(response.wallets || []);
    } catch (error) {
      setError('Failed to load user wallets');
      console.error('Error loading user wallets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!addFundsForm.userId || !addFundsForm.amount) {
      setError('Please select a user and enter an amount');
      return;
    }

    const amount = parseFloat(addFundsForm.amount);
    if (amount <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    try {
      await walletService.addFundsToUser(
        addFundsForm.userId,
        amount
      );
      setSuccess('Funds added successfully');
      setAddFundsForm({ userId: '', amount: '' });
      setShowAddFunds(false);
      loadUserWallets(); // Refresh the wallet list
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add funds');
    }
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="admin-wallets-container">Loading user wallets...</div>;
  }

  return (
    <div className="wallet-page admin-wallets-container">
      <div className="admin-wallets-header">
        <h2>User Wallet Management</h2>
        <button 
          className="add-funds-btn"
          onClick={() => setShowAddFunds(!showAddFunds)}
        >
          {showAddFunds ? 'Cancel' : 'Add Funds to User'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showAddFunds && (
        <div className="add-funds-form">
          <h3>Add Funds to User Wallet</h3>
          <form onSubmit={handleAddFunds}>
            <div className="form-group">
              <label>Select User:</label>
              <select
                value={addFundsForm.userId}
                onChange={(e) => setAddFundsForm(prev => ({
                  ...prev,
                  userId: e.target.value
                }))}
                required
              >
                <option value="">Choose a user...</option>
                {userWallets.map(wallet => (
                  <option key={wallet.user_id} value={wallet.user_id}>
                    {wallet.username} (Current: {formatCurrency(wallet.balance)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Amount:</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={addFundsForm.amount}
                onChange={(e) => setAddFundsForm(prev => ({
                  ...prev,
                  amount: e.target.value
                }))}
                placeholder="Enter amount"
                required
              />
            </div>
            

            
            <div className="form-buttons">
              <button type="submit" className="submit-btn">Add Funds</button>
            </div>
          </form>
        </div>
      )}

      {!showAddFunds && (
        <div className="wallets-section">
          <h3>All User Wallets</h3>
          {userWallets.length === 0 ? (
            <p>No user wallets found.</p>
          ) : (
            <div className="wallets-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Balance</th>
                    <th>Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {userWallets.map(wallet => (
                    <tr key={wallet.user_id}>
                      <td>{wallet.username}</td>
                      <td>{wallet.email}</td>
                      <td className="balance-cell">{formatCurrency(wallet.balance)}</td>
                      <td>{formatDate(wallet.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminWallets;
