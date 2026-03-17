import React, { createContext, useState, useContext, useEffect } from 'react';
import api, { API_BASE_URL, setupInterceptors } from '../services/api';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Inject the logout function into our global API client
    setupInterceptors(logout);

    if (token) {
      api.get('/users/me')
        .then(res => setUser(res.data))
        .catch(() => {
          setToken(null);
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);

    try {
      // Auth endpoint requires form-urlencoded
      const res = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const newToken = res.data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          throw new Error('Incorrect username or password.');
        } else {
          throw new Error(error.response.data?.detail || 'Server error. Contact IT support.');
        }
      } else if (error.request) {
        throw new Error('Server unreachable. Check connection.');
      } else {
        throw new Error('An unexpected error occurred.');
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
