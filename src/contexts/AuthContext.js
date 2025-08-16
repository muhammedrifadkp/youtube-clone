import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set up axios interceptor for authentication
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await axios.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            // Invalid token, remove it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/auth/login', { email, password });
      if (response.data.success) {
        const { user, token: newToken } = response.data.data;
        setUser(user);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/auth/register', userData);
      if (response.data.success) {
        const { user, token: newToken } = response.data.data;
        setUser(user);
        setToken(newToken);
        localStorage.setItem('token', newToken);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/users/profile', profileData);
      if (response.data.success) {
        setUser(response.data.data.user);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Profile update failed'
      };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await axios.put('/auth/change-password', {
        currentPassword,
        newPassword
      });
      if (response.data.success) {
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error?.message || 'Password change failed'
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
