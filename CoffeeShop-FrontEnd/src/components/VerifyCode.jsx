import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import '../App.css';
import { NetworkContext } from '../NetworkContext';

const VerifyCode = ({ userId, email, onSuccess, onCancel, isRegistration }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // 1 minute countdown for resend
  const [canResend, setCanResend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds


  // Timer for code expiry countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Format remaining time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Set up countdown timer for resend
  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    
    return () => clearTimeout(timer);
  }, [countdown, canResend]);
  
  // Function to handle resend code
  const handleResendCode = async (e) => {
    e.preventDefault();
    
    if (!canResend) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/auth/resend-code`, { userId });
      
      // Reset countdown and disable resend
      setCountdown(60);
      setCanResend(false);
      
      // Show success message
      setError('');
      
      // Optional: Show a success notification
      alert(`New verification code sent to ${email}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!code) {
      setError('Please enter the verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Submitting code: ${code} for user ${userId}`);
      
      const response = await axios.post(`${API_URL}/auth/verify-login`, {
        userId,
        code
      });
      
      if (response.data && response.data.token) {
        // Store the token in local storage
        localStorage.setItem('authToken', response.data.token);
        
        // Call the success callback with user data
        onSuccess(response.data);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('Verification error:', err);
    
      // Provide user-friendly error messages based on the error
      let errorMessage = 'Failed to verify code';
      
      if (err.response) {
        if (err.response.status === 401) {
          if (err.response.data?.error === 'Verification code has expired') {
            errorMessage = 'Your verification code has expired. Please request a new one.';
          } else if (err.response.data?.error === 'Invalid verification code') {
            errorMessage = 'The code you entered is incorrect. Please try again.';
          } else if (err.response.data?.error === 'No verification code exists for this user') {
            errorMessage = 'No verification code exists. Please request a new one.';
          }
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
    
  return (
    <div className="verify-code-container">
      <div className="verify-code-form">
        <h2>Verification Required</h2>
        
        <p>Please enter the 6-digit code sent to: <strong>{email}</strong></p>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <input
              type="text"
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter 6-digit code"
              maxLength="6"
              pattern="[0-9]{6}"
              required
            />
            {/* <div className="code-timer">
              Code expires in: <span className={timeLeft < 60 ? 'time-critical' : ''}>{formatTime(timeLeft)}</span>
            </div> */}
          </div>
          
          <div className="verify-actions">
            <button 
              type="submit" 
              className="verify-button"
              disabled={isLoading || !code || timeLeft === 0}
            >
              {isLoading ? 'Verifying...' : isRegistration ? 'Complete Registration' : 'Log In'}
            </button>
            
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
          </div>
        </form>
        
        <div className="resend-code">
          <button 
            className="link-button" 
            onClick={handleResendCode} 
            disabled={!canResend || isLoading}
            style={{ 
              cursor: canResend ? 'pointer' : 'not-allowed',
              opacity: canResend ? 1 : 0.6,
              textDecoration: 'underline'
            }}
          >
            {isLoading ? "Sending..." : "Didn't receive the code? Resend"}
          </button>
          
          {!canResend && (
            <p className="resend-note">You can resend the code after {formatTime(countdown)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyCode;