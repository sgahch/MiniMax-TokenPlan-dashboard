import { useState, useEffect, useCallback } from 'react';
import type { Account, ModelRemain } from './types';
import { fetchTokenPlanRemains } from './api';
import type { Database } from 'sql.js';
import initSqlJs from 'sql.js';

// Database singleton
let db: Database | null = null;

const DB_STORAGE_KEY = 'token_plan_db';

function saveDb(): void {
  if (!db) return;
  const data = db.export();
  const buffer = new Uint8Array(data);
  localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(Array.from(buffer)));
}

async function initDb(): Promise<Database> {
  const SQLModule = await initSqlJs({
    locateFile: (_file: string) => '/sql-wasm.wasm'
  });

  // Try to load existing database from localStorage
  const stored = localStorage.getItem(DB_STORAGE_KEY);
  let database: Database;

  if (stored) {
    console.log('[DB] Loading existing database from localStorage...');
    try {
      const buffer = new Uint8Array(JSON.parse(stored));
      database = new SQLModule.Database(buffer);
    } catch {
      console.log('[DB] Failed to load existing database, creating new one...');
      database = new SQLModule.Database();
    }
  } else {
    console.log('[DB] No existing database found, creating new one...');
    database = new SQLModule.Database();
  }

  // Create accounts table if not exists
  database.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
    )
  `);

  return database;
}

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

  // Initialize database
  useEffect(() => {
    initDb().then(database => {
      db = database;

      // Load accounts from DB
      const result = db.exec('SELECT id, name, api_key FROM accounts ORDER BY created_at DESC');
      if (result.length > 0) {
        const rows = result[0].values;
        const loadedAccounts = rows.map((row: unknown[]) => ({
          id: row[0] as string,
          name: row[1] as string,
          apiKey: row[2] as string,
        }));
        setAccounts(loadedAccounts);

        // Initialize status for loaded accounts
        const initialStatusMap: Record<string, AccountStatus> = {};
        for (const account of loadedAccounts) {
          initialStatusMap[account.id] = { account, data: [], loading: false, error: '', lastFetched: 0 };
        }
        setStatusMap(initialStatusMap);
      }

      // Load dark mode preference
      try {
        const stored = localStorage.getItem('darkMode');
        if (stored === 'true') setDarkMode(true);
      } catch {}

      setDbReady(true);
    }).catch(console.error);
  }, []);

  // Toggle dark mode
  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  // Add account
  const addAccount = useCallback(async (name: string, apiKey: string) => {
    if (!db) return;

    const id = crypto.randomUUID();
    db.run('INSERT INTO accounts (id, name, api_key) VALUES (?, ?, ?)', [id, name, apiKey]);
    saveDb();

    const newAccount = { id, name, apiKey };
    console.log(`[Account] 添加账号 "${name}"（id: ${id}），即将拉取套餐数据...`);
    setAccounts(prev => [newAccount, ...prev]);
    setStatusMap(prev => ({
      ...prev,
      [id]: { account: newAccount, data: [], loading: false, error: '', lastFetched: 0 }
    }));

    // Fetch data for new account
    await refreshAccount(id);
    console.log(`[Account] 账号 "${name}" 套餐数据拉取完成`);
  }, []);

  // Remove account
  const removeAccount = useCallback((id: string) => {
    if (!db) return;

    db.run('DELETE FROM accounts WHERE id = ?', [id]);
    saveDb();
    setAccounts(prev => prev.filter(a => a.id !== id));
    setStatusMap(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  // Update account
  const updateAccount = useCallback((id: string, name: string, apiKey: string) => {
    if (!db) return;

    db.run('UPDATE accounts SET name = ?, api_key = ? WHERE id = ?', [name, apiKey, id]);
    saveDb();
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, name, apiKey } : a));
  }, []);

  // Refresh single account - must be stable for useEffect
  const refreshAccount = useCallback(async (id: string) => {
    // Find account from current state
    const account = accounts.find(a => a.id === id);
    if (!account) return;

    setStatusMap(prev => {
      const existing = prev[id];
      const accountData = existing ? { ...existing, account, loading: true, error: '' } : { account, data: [], loading: true, error: '', lastFetched: 0 };
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

  // Refresh all accounts
  const refreshAll = useCallback(async () => {
    await Promise.all(accounts.map(a => refreshAccount(a.id)));
  }, [accounts, refreshAccount]);

  // Auto refresh every 60 seconds
  useEffect(() => {
    if (accounts.length === 0 || !dbReady) return;
    const interval = setInterval(() => {
      void refreshAll();
    }, 60000);
    return () => clearInterval(interval);
  }, [accounts, refreshAll, dbReady]);

  // Initial fetch when accounts are loaded from DB
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