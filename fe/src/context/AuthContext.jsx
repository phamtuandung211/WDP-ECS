import React, { createContext, useState, useCallback, useMemo } from "react";
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
      // Support different backend shapes: { token, user } or { accessToken }
      const token = data?.token || data?.accessToken || data?.access_token;
      if (token) authService.setToken(token);
      const userData = data?.user || { email };
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

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      register,
      verifyOtp,
      resendOtp,
      logout,
    }),
    [user, loading, error, login, register, verifyOtp, resendOtp, logout],
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
