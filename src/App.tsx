import { useState } from 'react';
import { useAccounts } from './useAccounts';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { useAuth } from './useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import type { Account } from './types';

type AuthView = 'login' | 'register';

export default function App() {
  const { user, logout, loading, isAuthenticated } = useAuth();
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

  const [authView, setAuthView] = useState<AuthView>('login');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [globalCollapsed, setGlobalCollapsed] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleAddAccount = async (name: string, apiKey: string) => {
    await addAccount(name, apiKey);
    setShowAddForm(false);
    setGlobalCollapsed(true);
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

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #fdf4ff 100%)' }}>
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl glass flex items-center justify-center animate-float">
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-sm text-indigo-400">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录，显示登录/注册页
  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      {/* 背景装饰 blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 blur-[100px] opacity-20 dark:opacity-10" />
        <div className="absolute top-1/3 -right-48 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300 via-indigo-300 to-purple-300 blur-[100px] opacity-15 dark:opacity-10" />
        <div className="absolute -bottom-24 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 blur-[120px] opacity-15 dark:opacity-10" />
      </div>

      <div className="min-h-screen bg-gradient-to-br from-indigo-50/50 via-white/50 to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">

        {/* 顶栏 */}
        <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-slate-700/20 shadow-sm">
          <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center shadow-lg animate-float">
                  <span className="text-2xl">🎯</span>
                </div>
              </div>
              <div>
                <span className="text-lg font-bold text-indigo-900 dark:text-indigo-100">Token Plan</span>
                <span className="ml-2 text-xs text-indigo-400 dark:text-indigo-500 hidden sm:inline">
                  {user?.is_admin && <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-600 mr-1">管理员</span>}
                  {user?.username}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* 一键折叠 */}
              <button
                onClick={() => setGlobalCollapsed(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl btn-glass shadow-sm transition-all ${
                  globalCollapsed
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-indigo-600 dark:text-indigo-400'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {globalCollapsed ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
                  )}
                </svg>
                {globalCollapsed ? '展开全部' : '折叠'}
              </button>

              {/* 刷新全部 */}
              <button
                onClick={() => void refreshAll()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl btn-glass text-indigo-600 dark:text-indigo-400 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新全部
              </button>

              {/* 深色模式切换 */}
              <button
                onClick={toggleDarkMode}
                className="w-9 h-9 flex items-center justify-center rounded-xl glass text-indigo-500 dark:text-indigo-400 transition-all hover:scale-105 btn-press"
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

              {/* 登出 */}
              <button
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-xl glass text-red-400 dark:text-red-500 transition-all hover:scale-105 btn-press"
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>

              {/* 修改密码 */}
              <button
                onClick={() => setShowChangePassword(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl glass text-amber-500 dark:text-amber-400 transition-all hover:scale-105 btn-press"
                title="修改密码"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="max-w-4xl mx-auto px-5 py-8">

          {/* 添加账号 */}
          <div className="mb-6">
            {showAddForm ? (
              <div className="glass rounded-3xl p-6 shadow-xl animate-scale-in">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">添加新账号</h2>
                </div>
                <AccountForm onSubmit={handleAddAccount} onCancel={() => setShowAddForm(false)} />
              </div>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full py-4 rounded-2xl border-2 border-dashed border-indigo-300/50 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 dark:hover:bg-indigo-500/10 transition-all flex items-center justify-center gap-2 text-sm font-medium"
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
            <div className="glass rounded-3xl p-12 shadow-xl text-center animate-scale-in">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl glass flex items-center justify-center">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">还没有添加账号</h3>
              <p className="text-sm text-indigo-400 dark:text-indigo-500 mb-6 max-w-xs mx-auto">
                点击上方按钮添加你的 MiniMax API Key
              </p>
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all btn-press"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                立即添加
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {accounts.map(account => {
                const status = statusMap[account.id];
                if (!status) return null;
                return (
                  <AccountCard
                    key={account.id}
                    status={status}
                    globalCollapsed={globalCollapsed}
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
            className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={e => { if (e.target === e.currentTarget) setEditingAccount(null); }}
          >
            <div className="glass rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">编辑账号</h2>
                  </div>
                  <button
                    onClick={() => setEditingAccount(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl glass text-indigo-400 hover:text-indigo-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <AccountForm
                  initial={editingAccount}
                  onSubmit={handleUpdateAccount}
                  onCancel={() => setEditingAccount(null)}
                />
              </div>
            </div>
          </div>
        )}

        {/* 页脚 */}
        <footer className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-indigo-400 dark:text-indigo-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            数据每 60 秒自动刷新
          </div>
        </footer>

        {/* 修改密码弹窗 */}
        {showChangePassword && (
          <ChangePasswordPage
            onClose={() => setShowChangePassword(false)}
            onSuccess={() => {
              // 密码修改成功，可以添加提示
            }}
          />
        )}
      </div>
    </div>
  );
}
