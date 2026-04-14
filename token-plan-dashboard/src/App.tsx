import { useState } from 'react';
import { useAccounts } from './useAccounts';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import type { Account } from './types';

export default function App() {
  const {
    accounts,
    statusMap,
    darkMode,
    toggleDarkMode,
    addAccount,
    removeAccount,
    updateAccount,
    refreshAccount,
    refreshAll,
  } = useAccounts();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleAddAccount = (name: string, apiKey: string) => {
    addAccount(name, apiKey);
    setShowAddForm(false);
  };

  const handleUpdateAccount = (name: string, apiKey: string) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, name, apiKey);
      setEditingAccount(null);
    }
  };

  const handleDelete = (id: string) => {
    if (confirmDelete === id) {
      removeAccount(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="bg-slate-100 dark:bg-slate-900 min-h-screen">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white text-xl font-bold">M</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Token Plan 管理面板</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">MiniMax 多账号统一管理</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshAll()}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新全部
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              >
                {darkMode ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-6xl mx-auto px-4 py-6">
          {/* 添加账号区域 */}
          <div className="mb-6">
            {showAddForm ? (
              <AccountForm
                onSubmit={handleAddAccount}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-slate-500 dark:text-slate-400 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                添加账号
              </button>
            )}
          </div>

          {/* 账号列表 */}
          {accounts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mb-2">暂无账号</p>
              <p className="text-sm text-slate-400 dark:text-slate-500">点击上方按钮添加你的 MiniMax API Key</p>
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map(account => {
                const status = statusMap[account.id];
                if (!status) return null;
                return (
                  <AccountCard
                    key={account.id}
                    status={status}
                    onDelete={() => handleDelete(account.id)}
                    onRefresh={() => void refreshAccount(account.id)}
                    onEdit={() => setEditingAccount(account)}
                  />
                );
              })}
            </div>
          )}
        </main>

        {/* 编辑弹窗 */}
        {editingAccount && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-xl">
              <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">编辑账号</h2>
              </div>
              <div className="p-4">
                <AccountForm
                  initial={editingAccount}
                  onSubmit={handleUpdateAccount}
                  onCancel={() => setEditingAccount(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <footer className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
          MiniMax Token Plan 管理面板 · 数据每 60 秒自动刷新
        </footer>
      </div>
    </div>
  );
}