import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate session on app launch
  useEffect(() => {
    (async () => {
      try {
        const session = await authService.getSession();
        if (session) {
          // Verify token is still valid
          const res = await authService.getMe();
          setUser(res.data);
          setToken(session.token);
        }
      } catch {
        await authService.clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (phone, password) => {
    const res = await authService.login(phone, password);
    const { token: t, user: u } = res.data;
    await authService.saveSession(t, u);
    setToken(t);
    setUser(u);
    return u;
  };

  const register = async (data) => {
    const res = await authService.register(data);
    const { token: t, user: u } = res.data;
    await authService.saveSession(t, u);
    setToken(t);
    setUser(u);
    return u;
  };

  const verifyOTP = async (phone, otp) => {
    const res = await authService.verifyOTP(phone, otp);
    const { token: t, user: u } = res.data;
    await authService.saveSession(t, u);
    setToken(t);
    setUser(u);
    return u;
  };

  const logout = async () => {
    await authService.clearSession();
    setUser(null);
    setToken(null);
  };

  const isAdmin      = user?.role === 'admin';
  const isSales      = user?.role === 'sales' || isAdmin;
  const isWarehouse  = user?.role === 'warehouse';
  const isAccountant = user?.role === 'accountant' || isAdmin;
  const isCustomer   = user?.role === 'customer';

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, register, verifyOTP, logout,
      isAdmin, isSales, isWarehouse, isAccountant, isCustomer,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
