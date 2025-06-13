import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import VerifyCode from './VerifyCode';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { loginInit, completeAuthentication, pendingVerification, cancelVerification } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      // First step of login - triggers 2FA
      await loginInit(email, password);
      
      // The verification UI will be shown based on pendingVerification state
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSuccess = (userData) => {
    // Complete the authentication process with user data
    completeAuthentication(userData);
    navigate('/');
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // If waiting for verification, show the verification component
  if (pendingVerification && !pendingVerification.isRegistration) {
    return (
      <VerifyCode 
        userId={pendingVerification.userId}
        email={pendingVerification.email}
        onSuccess={handleVerificationSuccess}
        onCancel={cancelVerification}
        isRegistration={false}
      />
    );
  }
    // Otherwise, show the normal login form
  return (
    <div className="login-container">
      <div className="login-form centered-login-form">
        <h2>Login to Pirate Café</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"  
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />              <button 
                type="button"
                className="password-toggle-btn"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Continue'}
          </button>
        </form>
        
        <div className="register-link">
          <p>Don't have an account? <a href="/register">Register here</a></p>
        </div>
      </div>
    </div>
  );
};

export default Login;