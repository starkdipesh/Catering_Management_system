'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/api';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const publicPaths = ['/login', '/register', '/forgot-password', '/reset-password'];

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading && !user && !publicPaths.includes(pathname)) {
      router.push('/login');
    }
  }, [user, loading, pathname]);

  const checkAuth = async () => {
    const token = Cookies.get('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      setUser(response.data.data.user);
    } catch (error) {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, tokens } = response.data.data;
    
    Cookies.set('token', tokens.accessToken, { expires: 1 });
    Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 });
    
    setUser(user);
    return user;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { user, tokens } = response.data.data;
    
    Cookies.set('token', tokens.accessToken, { expires: 1 });
    Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 });
    
    setUser(user);
    return user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      Cookies.remove('token');
      Cookies.remove('refreshToken');
      setUser(null);
      router.push('/login');
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === 'super_admin',
    isTenantAdmin: user?.role === 'tenant_admin',
    isManager: user?.role === 'manager',
    isStaff: user?.role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
