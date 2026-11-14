import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('queueflow_token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await api.auth.getMe();
        if (res.success && res.manager) {
          setUser(res.manager);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (emailOrUsername, password) => {
    const res = await api.auth.login(emailOrUsername, password);
    if (res.success && res.token) {
      localStorage.setItem('queueflow_token', res.token);
      setToken(res.token);
      setUser(res.manager);
      return res;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, username, password) => {
    const res = await api.auth.register(name, email, username, password);
    if (res.success && res.token) {
      localStorage.setItem('queueflow_token', res.token);
      setToken(res.token);
      setUser(res.manager);
      return res;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('queueflow_token');
    setToken(null);
    setUser(null);
  };

  const quickDemoLogin = async () => {
    return login('admin@queueflow.com', 'admin123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        quickDemoLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
