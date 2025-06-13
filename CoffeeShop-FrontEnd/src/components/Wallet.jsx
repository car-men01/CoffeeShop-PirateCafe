import React, { useState, useEffect } from 'react';
import { walletService } from '../services/walletService';
import '../styles/Wallet.css';

const Wallet = () => {
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      setLoading(true);
      const response = await walletService.getBalance();
      setBalance(response.balance);
    } catch (error) {
      setError('Failed to load wallet balance');
      console.error('Error loading balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const addAmount = parseFloat(amount);
    if (!addAmount || addAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (addAmount > 1000) {
      setError('Maximum deposit amount is $1000');
      return;
    }

    try {
      setAdding(true);
      const response = await walletService.addFunds(addAmount);
      setBalance(response.newBalance);
      setAmount('');
      setSuccess(`Successfully added $${addAmount.toFixed(2)} to your wallet!`);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add funds');
    } finally {
      setAdding(false);
    }
  };

  const selectQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  if (loading) {
    return <div className="wallet-container">Loading wallet...</div>;
  }

  return (
    <div className="wallet-page wallet-container">
      <div className="wallet-header">
        <h2>My Wallet</h2>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="balance-display">
        <div className="balance-amount">{formatCurrency(balance)}</div>
        <div className="balance-label">Current Balance</div>
      </div>

      <div className="wallet-actions">
        <div className="add-funds-section">
          <h3>Add Funds</h3>
          
          <div className="quick-amounts">
            {[10, 25, 50, 100].map(quickAmount => (
              <button
                key={quickAmount}
                type="button"
                className={`quick-amount-btn ${amount === quickAmount.toString() ? 'selected' : ''}`}
                onClick={() => selectQuickAmount(quickAmount)}
              >
                ${quickAmount}
              </button>
            ))}
          </div>

          <form onSubmit={handleAddFunds} className="add-funds-form">
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="add-funds-btn"
              disabled={adding || !amount}
            >
              {adding ? 'Adding Funds...' : 'Add Funds'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Wallet;
