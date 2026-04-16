import { useState, useEffect, useCallback } from 'react';
import type { Account, ModelRemain } from './types';
import { fetchTokenPlanRemains } from './api';

const API_BASE = 'http://localhost:5000/api';

export interface AccountStatus {
  account: Account;
  data: ModelRemain[];
  loading: boolean;
  error: string;
  lastFetched: number;
}

export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AccountStatus>>({});
  const [darkMode, setDarkMode] = useState(false);
  const [dbReady, setDbReady] = useState(false);

  // 加载账号列表
  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/accounts`);
      if (!res.ok) throw new Error('获取账号失败');
      const data = await res.json();
      const loadedAccounts: Account[] = data.map((row: { id: string; name: string; api_key: string }) => ({
        id: row.id,
        name: row.name,
        apiKey: row.api_key,
      }));
      setAccounts(loadedAccounts);

      // 初始化 statusMap
      const initialStatusMap: Record<string, AccountStatus> = {};
      for (const account of loadedAccounts) {
        initialStatusMap[account.id] = { account, data: [], loading: false, error: '', lastFetched: 0 };
      }
      setStatusMap(initialStatusMap);
    } catch (err) {
      console.error('[DB] 加载账号失败:', err);
    }
  }, []);

  // 初始化
  useEffect(() => {
    loadAccounts();

    // 加载 dark mode
    try {
      const stored = localStorage.getItem('darkMode');
      if (stored === 'true') setDarkMode(true);
    } catch {}

    setDbReady(true);
  }, [loadAccounts]);

  // 切换 dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  // 添加账号
  const addAccount = useCallback(async (name: string, apiKey: string) => {
    try {
      const res = await fetch(`${API_BASE}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, api_key: apiKey }),
      });
      if (!res.ok) throw new Error('添加账号失败');
      const data = await res.json();

      const newAccount: Account = { id: data.id, name: data.name, apiKey: data.api_key };
      console.log(`[Account] 添加账号 "${name}"（id: ${data.id}），即将拉取套餐数据...`);
      setAccounts(prev => [newAccount, ...prev]);
      setStatusMap(prev => ({
        ...prev,
        [data.id]: { account: newAccount, data: [], loading: false, error: '', lastFetched: 0 }
      }));

      await refreshAccount(data.id);
      console.log(`[Account] 账号 "${name}" 套餐数据拉取完成`);
    } catch (err) {
      console.error('[Account] 添加账号失败:', err);
      throw err;
    }
  }, []);

  // 删除账号
  const removeAccount = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('删除账号失败');
      setAccounts(prev => prev.filter(a => a.id !== id));
      setStatusMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error('[Account] 删除账号失败:', err);
      throw err;
    }
  }, []);

  // 更新账号
  const updateAccount = useCallback(async (id: string, name: string, apiKey: string) => {
    try {
      const res = await fetch(`${API_BASE}/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, api_key: apiKey }),
      });
      if (!res.ok) throw new Error('更新账号失败');
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, name, apiKey } : a));
    } catch (err) {
      console.error('[Account] 更新账号失败:', err);
      throw err;
    }
  }, []);

  // 刷新单个账号
  const refreshAccount = useCallback(async (id: string) => {
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    setStatusMap(prev => {
      const existing = prev[id];
      const accountData = existing
        ? { ...existing, account, loading: true, error: '' }
        : { account, data: [], loading: true, error: '', lastFetched: 0 };
      return { ...prev, [id]: accountData };
    });

    try {
      const data = await fetchTokenPlanRemains(account.apiKey);
      setStatusMap(prev => ({
        ...prev,
        [id]: { account, data, loading: false, error: '', lastFetched: Date.now() }
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取失败';
      setStatusMap(prev => ({
        ...prev,
        [id]: { account, data: [], loading: false, error: message, lastFetched: Date.now() }
      }));
    }
  }, [accounts]);

  // 刷新所有账号
  const refreshAll = useCallback(async () => {
    await Promise.all(accounts.map(a => refreshAccount(a.id)));
  }, [accounts, refreshAccount]);

  // 每 60 秒自动刷新
  useEffect(() => {
    if (accounts.length === 0 || !dbReady) return;
    const interval = setInterval(() => {
      void refreshAll();
    }, 60000);
    return () => clearInterval(interval);
  }, [accounts, refreshAll, dbReady]);

  // 初始获取账号数据
  useEffect(() => {
    if (!dbReady) return;
    for (const account of accounts) {
      void refreshAccount(account.id);
    }
  }, [dbReady]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    accounts,
    statusMap,
    darkMode,
    toggleDarkMode,
    addAccount,
    removeAccount,
    updateAccount,
    refreshAccount,
    refreshAll,
    dbReady,
  };
}
