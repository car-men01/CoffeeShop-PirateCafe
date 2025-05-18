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

  // Login function 
  const login = async (email, password, userData = null) => {
    try {
      let response;
      
      if (!userData) {
        // If no userData provided, fetch it
        response = await axios.post(`${API_URL}/auth/login`, { email, password });
      } else {
        // Use the provided userData
        response = { data: userData };
      }
      
      if (response.data && response.data.token) {
        // Store token
        localStorage.setItem('authToken', response.data.token);
        
        // Update the current user state
        setCurrentUser({
          username: response.data.username || email.split('@')[0],
          email: email,
          role: response.data.role || 'user'
        });
        
        // Set authentication state
        setIsAuthenticated(true);
        setIsAdmin(response.data.role === 'admin');
        
        console.log('Token stored successfully in AuthContext');
        console.log('User role:', response.data.role);
        console.log('isAdmin set to:', response.data.role === 'admin');
        
        return response;
      }
      throw new Error('No token received from server');
    } catch (error) {
      console.error('Login error in AuthContext:', error);
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
    console.log("User logged out");
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { 
        username, 
        email, 
        password 
      });
      
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isAdmin,
        currentUser,
        login,
        logout,
        register,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;