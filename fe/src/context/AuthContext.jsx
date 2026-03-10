import React, { createContext, useState, useCallback, useMemo } from "react";
import { jwtDecode } from "jwt-decode";
import { authService } from "../services";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.login(email, password);
      const token = data?.token || data?.accessToken || data?.access_token;
      if (token) authService.setToken(token);
      const payload = token ? jwtDecode(token) : {};
      const userData = data?.user || {
        email,
        role: payload.role || data?.role,
      };
      authService.setUser(userData);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.register(payload);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const verifyOtp = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.verifyOtp(payload);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Verify OTP failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const resendOtp = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.resendOtp(payload);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Resend OTP failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      authService.setUser(next);
      return next;
    });
  }, []);

  const googleLogin = useCallback(async (idToken) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.googleAuth(idToken);
      const token = data?.token || data?.accessToken || data?.access_token;
      if (token) authService.setToken(token);
      const payload = token ? jwtDecode(token) : {};
      const userData = data?.user || {
        role: payload.role || data?.role,
      };
      authService.setUser(userData);
      setUser(userData);
      return userData;
    } catch (err) {
      const message = err.response?.data?.message || "Google login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      googleLogin,
      register,
      verifyOtp,
      resendOtp,
      logout,
      updateUser,
    }),
    [
      user,
      loading,
      error,
      login,
      googleLogin,
      register,
      verifyOtp,
      resendOtp,
      logout,
      updateUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
