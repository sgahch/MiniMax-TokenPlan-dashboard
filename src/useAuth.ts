import { useState, useEffect, useCallback } from 'react';

const API_BASE = '/api';

export interface User {
  id: string;
  username: string;
  is_admin: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 初始化时从 localStorage 恢复 token
  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  // 登录
  const login = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '登录失败');
    }

    const data = await res.json();
    const userData = { id: data.id, username: data.username, is_admin: data.is_admin === 1 || data.is_admin === true };
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    return data;
  }, []);

  // 注册
  const register = useCallback(async (username: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || '注册失败');
    }

    const data = await res.json();
    const userData = { id: data.id, username: data.username, is_admin: false };
    setUser(userData);
    setToken(data.token);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    return data;
  }, []);

  // 登出
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }, []);

  return {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!token && !!user
  };
}
