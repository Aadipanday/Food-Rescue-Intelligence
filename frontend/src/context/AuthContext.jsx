import React, { createContext, useContext, useState, useEffect } from "react";
import api from "../api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [tempToken, setTempToken] = useState(localStorage.getItem("tempToken") || null);
  const [loading, setLoading] = useState(true);

  // Load current user profile if token is present
  const fetchMe = async () => {
    try {
      const res = await api.get("/api/auth/me");
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        return res.data.user;
      }
    } catch (err) {
      console.warn("Session check failed or expired");
      logout();
    } finally {
      setLoading(false);
    }
    return null;
  };

  useEffect(() => {
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  // Register
  const register = async ({ name, email, password, phone, role }) => {
    const res = await api.post("/api/auth/register", {
      name,
      email,
      password,
      phone,
      role,
    });

    if (res.data?.tempToken) {
      setTempToken(res.data.tempToken);
      localStorage.setItem("tempToken", res.data.tempToken);
    }

    return res.data;
  };

  // Login
  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });

    if (res.data?.tempToken) {
      setTempToken(res.data.tempToken);
      localStorage.setItem("tempToken", res.data.tempToken);
    }

    if (res.data?.token) {
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("tempToken");
      setTempToken(null);
      await fetchMe();
    }

    return res.data;
  };

  // Verify Email OTP
  const verifyEmailOtp = async (otp) => {
    const res = await api.post("/api/auth/verify-email-otp", { otp });

    if (res.data?.token) {
      setToken(res.data.token);
      localStorage.setItem("token", res.data.token);
      localStorage.removeItem("tempToken");
      setTempToken(null);
      await fetchMe();
    }

    return res.data;
  };

  // Resend OTP
  const resendOtp = async (email) => {
    const res = await api.post("/api/auth/resend-otp", { email });
    if (res.data?.tempToken) {
      setTempToken(res.data.tempToken);
      localStorage.setItem("tempToken", res.data.tempToken);
    }
    return res.data;
  };

  // Logout
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {}
    localStorage.removeItem("token");
    localStorage.removeItem("tempToken");
    setToken(null);
    setTempToken(null);
    setUser(null);
  };

  const role = (user?.role || "").toUpperCase();
  const isFoodProvider = role === "FOOD_PROVIDER" || role === "DONOR";
  const isNgo = role === "NGO" || role === "RECIPIENT";

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        tempToken,
        loading,
        role,
        isFoodProvider,
        isNgo,
        organization: user?.organization || null,
        register,
        login,
        verifyEmailOtp,
        resendOtp,
        logout,
        fetchMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
