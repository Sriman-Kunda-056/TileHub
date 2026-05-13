import { createContext, useContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { authAPI } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      authAPI.getMe()
        .then(res => setUser(res.data))
        .catch(() => Cookies.remove('token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (phone, password) => {
    const res = await authAPI.login({ phone, password });
    Cookies.set('token', res.data.token, { expires: 7 });
    setUser(res.data.user);
    return res.data.user;
  };

  const loginWithOTP = async (phone, otp) => {
    const res = await authAPI.verifyOTP({ phone, otp });
    Cookies.set('token', res.data.token, { expires: 7 });
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    window.location.href = '/auth/login';
  };

  const isAdmin = user?.role === 'admin';
  const isWarehouse = user?.role === 'warehouse';
  const isSales = user?.role === 'sales' || isAdmin;
  const isAccountant = user?.role === 'accountant' || isAdmin;

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithOTP, logout, isAdmin, isWarehouse, isSales, isAccountant }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};

// HOC: protect admin routes
export function withAuth(Component, allowedRoles = []) {
  return function ProtectedPage(props) {
    const { user, loading } = useAuth();

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" /></div>;

    if (!user) {
      if (typeof window !== 'undefined') window.location.href = '/auth/login';
      return null;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center min-h-screen flex-col gap-4">
          <h1 className="text-2xl font-medium">Access Denied</h1>
          <p className="text-gray-500">You don't have permission to view this page.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
