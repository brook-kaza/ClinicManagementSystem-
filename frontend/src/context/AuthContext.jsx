import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const res = await axios.post(`http://${window.location.hostname}:8000/token`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const newToken = res.data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
    } catch (error) {
      if (error.response) {
        // The server responded with a status code that falls out of the range of 2xx
        if (error.response.status === 401) {
          throw new Error('INVALID_CREDENTIALS');
        } else {
          throw new Error('SERVER_ERROR');
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('NETWORK_ERROR');
      } else {
        throw new Error('UNKNOWN_ERROR');
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
