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
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0d1117] transition-colors duration-300">

        {/* 顶栏 */}
        <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 dark:bg-[#161b22]/80 border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-bold">M</span>
              </div>
              <div>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">Token Plan</span>
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">MiniMax 多账号管理</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => void refreshAll()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新全部
              </button>
              <button
                onClick={toggleDarkMode}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400 transition-colors"
              >
                {darkMode ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-4xl mx-auto px-5 py-8">

          {/* 添加账号 */}
          <div className="mb-6">
            {showAddForm ? (
              <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm p-5">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">添加账号</h2>
                <AccountForm onSubmit={handleAddAccount} onCancel={() => setShowAddForm(false)} />
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-3.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-500 dark:hover:text-blue-400 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                添加账号
              </button>
            )}
          </div>

          {/* 账号列表 */}
          {accounts.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-14 h-14 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-7 h-7 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-slate-400 dark:text-slate-500">还没有账号</p>
              <p className="text-xs text-slate-300 dark:text-slate-600 mt-1">点击上方添加你的 MiniMax API Key</p>
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
                    confirmDelete={confirmDelete === account.id}
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
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={e => { if (e.target === e.currentTarget) setEditingAccount(null); }}
          >
            <div className="bg-white dark:bg-[#161b22] rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700/60 p-6">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-4">编辑账号</h2>
              <AccountForm
                initial={editingAccount}
                onSubmit={handleUpdateAccount}
                onCancel={() => setEditingAccount(null)}
              />
            </div>
          </div>
        )}

        <footer className="text-center py-6 text-xs text-slate-300 dark:text-slate-700">
          数据每 60 秒自动刷新
        </footer>
      </div>
    </div>
  );
}
