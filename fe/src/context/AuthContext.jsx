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
      authService.setToken(data.token);
      authService.setUser(data.user);
      setUser(data.user);
      return data.user;
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, name, role) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await authService.register(email, password, name, role);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || "Registration failed";
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
    () => ({ user, loading, error, login, register, logout }),
    [user, loading, error, login, register, logout],
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
