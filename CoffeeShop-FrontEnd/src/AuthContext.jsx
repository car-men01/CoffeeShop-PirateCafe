import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "./config";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Define state variables using useState hooks
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(null);

  // Check for existing auth token on component mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken');
      
      if (token) {
        try {
          // Set authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          // Verify the token by making a request
          const response = await axios.get(`${API_URL}/auth/me`);
          
          if (response.data) {
            setCurrentUser({
              id: response.data.id,
              username: response.data.username,
              email: response.data.email,
              role: response.data.role
            });
            setIsAuthenticated(true);
            setIsAdmin(response.data.role === 'admin');
            console.log("User authenticated from stored token:", response.data.role);
          }
        } catch (error) {
          console.error("Error verifying token:", error);
          // Token invalid, clear it
          localStorage.removeItem('authToken');
          setIsAuthenticated(false);
          setIsAdmin(false);
          setCurrentUser(null);
        }
      }
      
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  // Updated login function for 2FA
  const loginInit = async (email, password) => {
    try {
      // First step of login - just validate credentials and get verification code
      const response = await axios.post(`${API_URL}/auth/login-init`, { email, password });
      
      // Store the pending verification data
      setPendingVerification({
        userId: response.data.userId,
        email: response.data.email,
        isRegistration: false
      });
      
      return response;
    } catch (error) {
      console.error("Login initialization error:", error);
      throw error;
    }
  };
  // This is called after successful 2FA verification
  const completeAuthentication = (userData) => {
    if (userData && userData.token) {
      // Set authorization header for future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      
      // Update state
      setCurrentUser({
        username: userData.username, 
        email: userData.email,
        role: userData.role || 'user',
        id: userData.id
      });
      
      setIsAuthenticated(true);
      setIsAdmin(userData.role === 'admin');
      
      // Clear pending verification
      setPendingVerification(null);
      
      return true;
    }
    return false;
  };

  // Register function updated for 2FA
  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { 
        username, 
        email, 
        password 
      });
      
      // Store pending verification data for registration
      setPendingVerification({
        userId: response.data.userId,
        email: response.data.email,
        isRegistration: true
      });
      
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    axios.defaults.headers.common['Authorization'] = '';
    setIsAuthenticated(false);
    setIsAdmin(false);
    setCurrentUser(null);
    setPendingVerification(null);
  };

  // Cancel verification process
  const cancelVerification = () => {
    setPendingVerification(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        currentUser,
        loginInit,
        completeAuthentication,
        logout,
        register,
        loading,
        pendingVerification,
        cancelVerification
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;