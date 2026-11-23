import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [tempToken, setTempToken] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(true);

  // Directly set authenticated session from anywhere (e.g. after OTP verification)
  const setAuthSession = (authToken, authUser) => {
    if (authToken) {
      localStorage.setItem('token', authToken);
      setToken(authToken);
    }
    if (authUser) {
      localStorage.setItem('user', JSON.stringify(authUser));
      setUser(authUser);
    }
    setRequires2FA(false);
    setTempToken(null);
  };

  // Validate session against /auth/me on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success && res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            logout();
          }
        } catch (err) {
          console.warn('Session check failed or expired:', err?.response?.data?.message || err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;

      // Handle Verification / 2FA challenge (unverified account or OTP required)
      if (data.requiresEmailVerification || data.requiresOtp || data.requires2FA) {
        setRequires2FA(true);
        setTempToken(data.tempToken);
        return {
          success: false,
          requires2FA: true,
          tempToken: data.tempToken,
          message: data.message || 'Please enter the verification OTP sent to your email.',
        };
      }

      // Standard Login Success (Email is verified & credentials correct)
      if (data.success && data.token) {
        setAuthSession(data.token, data.user);
        return { success: true, user: data.user };
      }

      return { success: false, message: data.message || 'Login failed' };
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.requiresEmailVerification) {
        setRequires2FA(true);
        setTempToken(errData.tempToken);
        return {
          success: false,
          requires2FA: true,
          tempToken: errData.tempToken,
          message: errData.message || 'Your account needs verification. Please enter the OTP sent to your email.',
        };
      }

      return {
        success: false,
        message: errData?.message || 'Invalid email or password.',
      };
    }
  };

  const verify2FA = async (otp, customTempToken) => {
    const activeToken = customTempToken || tempToken;
    if (!activeToken) {
      return { success: false, message: 'No active verification session. Please sign in again.' };
    }

    try {
      const res = await api.post(
        '/auth/verify-email-otp',
        { otp },
        { headers: { Authorization: `Bearer ${activeToken}` } }
      );

      const data = res.data;
      if (data.success && data.token) {
        setAuthSession(data.token, data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'OTP verification failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Invalid or expired OTP code.',
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      const data = res.data;

      if (data.requiresEmailVerification) {
        setTempToken(data.tempToken);
        return {
          success: true,
          requiresEmailVerification: true,
          tempToken: data.tempToken,
          message: data.message,
        };
      }

      if (data.success && data.token) {
        setAuthSession(data.token, data.user);
        return { success: true, user: data.user };
      }

      return { success: false, message: data.message || 'Registration failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please check your details.',
      };
    }
  };

  const loginWithGoogle = async (credential, optionalRole) => {
    try {
      const res = await api.post('/auth/google', { credential, role: optionalRole });
      const data = res.data;
      if (data.success && data.token) {
        setAuthSession(data.token, data.user);
        return { success: true, user: data.user };
      }
      return { success: false, message: data.message || 'Google login failed' };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Google authentication failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      setRequires2FA(false);
      setTempToken(null);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.success && res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tempToken,
        requires2FA,
        loading,
        isAuthenticated: !!user,
        setAuthSession,
        login,
        loginWithGoogle,
        verify2FA,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
