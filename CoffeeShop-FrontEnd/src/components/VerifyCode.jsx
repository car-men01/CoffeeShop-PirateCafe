import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import '../styles/VerifyCode.css';
import { NetworkContext } from '../NetworkContext';

const VerifyCode = ({ userId, email, onSuccess, onCancel, isRegistration }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60); // 1 minute countdown for resend
  const [canResend, setCanResend] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef([]);
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

  // Handle individual digit input
  const handleDigitChange = (index, value) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to move to previous input
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    const newCode = [...code];
    digits.forEach((digit, index) => {
      if (index < 6) {
        newCode[index] = digit;
      }
    });
    setCode(newCode);

    // Focus the next empty input or the last input
    const nextEmptyIndex = newCode.findIndex(digit => !digit);
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

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
    
    const codeString = code.join('');
    if (!codeString || codeString.length !== 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Submitting code: ${codeString} for user ${userId}`);
      
      const response = await axios.post(`${API_URL}/auth/verify-login`, {
        userId,
        code: codeString
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
        
        <form onSubmit={handleSubmit} className="verify-form">
          <div className="form-group">
            <label htmlFor="code">Verification Code</label>
            <div className="code-input-container">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  value={digit}
                  onChange={(e) => handleDigitChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="code-digit-input"
                  maxLength="1"
                  inputMode="numeric"
                  pattern="[0-9]"
                  autoComplete="off"
                />
              ))}
            </div>
          </div>
          
          <div className="verify-actions">
            <button 
              type="submit" 
              className="verify-button"
              disabled={isLoading || code.join('').length !== 6 || timeLeft === 0}
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