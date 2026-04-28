import { useState, useEffect, useCallback } from 'react';
import type { Group } from './types';

const API_BASE = '/api';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export function useGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading] = useState(false);

  // 加载分组列表
  const loadGroups = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/groups`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('获取分组失败');
      const data = await res.json();
      setGroups(data.map((row: { id: string; name: string; created_at?: number }) => ({
        id: row.id,
        name: row.name,
        created_at: row.created_at,
      })));
    } catch (err) {
      console.error('[Groups] 加载分组失败:', err);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // 创建分组
  const addGroup = useCallback(async (name: string) => {
    try {
      const res = await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('创建分组失败');
      const data = await res.json();
      const newGroup: Group = { id: data.id, name: data.name, created_at: data.created_at };
      setGroups(prev => [newGroup, ...prev]);
      return newGroup;
    } catch (err) {
      console.error('[Groups] 创建分组失败:', err);
      throw err;
    }
  }, []);

  // 删除分组
  const removeGroup = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('删除分组失败');
      setGroups(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('[Groups] 删除分组失败:', err);
      throw err;
    }
  }, []);

  // 重命名分组
  const renameGroup = useCallback(async (id: string, name: string) => {
    try {
      const res = await fetch(`${API_BASE}/groups/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error('重命名分组失败');
      setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
    } catch (err) {
      console.error('[Groups] 重命名分组失败:', err);
      throw err;
    }
  }, []);

  return {
    groups,
    loading,
    loadGroups,
    addGroup,
    removeGroup,
    renameGroup,
  };
}
