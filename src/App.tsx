import { useState } from 'react';
import { useAccounts } from './useAccounts';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { useAuth } from './useAuth';
import { useGroups } from './useGroups';
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
  const { groups, addGroup, removeGroup, renameGroup } = useGroups();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [globalCollapsed, setGlobalCollapsed] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const filteredAccounts = selectedGroupId
    ? accounts.filter(a => a.groupId === selectedGroupId)
    : accounts;

  const handleAddAccount = async (name: string, apiKey: string, groupId: string | null) => {
    await addAccount(name, apiKey, groupId);
    setShowAddForm(false);
    setGlobalCollapsed(true);
  };

  const handleUpdateAccount = (name: string, apiKey: string, groupId: string | null) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, name, apiKey, groupId);
      setEditingAccount(null);
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    await addGroup(newGroupName.trim());
    setNewGroupName('');
    setShowAddGroup(false);
  };

  const handleRenameGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;
    await renameGroup(editingGroup.id, newGroupName.trim());
    setEditingGroup(null);
    setNewGroupName('');
  };

  const handleDeleteGroup = async (id: string) => {
    await removeGroup(id);
    if (selectedGroupId === id) {
      setSelectedGroupId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirmDelete === id) {
      await removeAccount(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

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

  if (!isAuthenticated) {
    return authView === 'login' ? (
      <LoginPage onSwitchToRegister={() => setAuthView('register')} />
    ) : (
      <RegisterPage onSwitchToLogin={() => setAuthView('login')} />
    );
  }

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 blur-[100px] opacity-20 dark:opacity-10" />
        <div className="absolute top-1/3 -right-48 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300 via-indigo-300 to-purple-300 blur-[100px] opacity-15 dark:opacity-10" />
        <div className="absolute -bottom-24 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-300 via-purple-300 to-indigo-300 blur-[120px] opacity-15 dark:opacity-10" />
      </div>

      <div className="flex min-h-screen bg-gradient-to-br from-indigo-50/50 via-white/50 to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300">

        {/* 侧边栏 */}
        <aside className="w-56 shrink-0 sticky top-0 h-screen backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-r border-white/20 dark:border-slate-700/20 flex flex-col">
          <div className="px-5 py-5 border-b border-white/20 dark:border-slate-700/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center shadow-lg animate-float">
                <span className="text-2xl">🎯</span>
              </div>
              <div>
                <span className="text-base font-bold text-indigo-900 dark:text-indigo-100">Token Plan</span>
                <span className="block text-xs text-indigo-400 dark:text-indigo-500">{user?.username}</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-3">
            <div className="space-y-1">
              <button
                onClick={() => setSelectedGroupId(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedGroupId === null
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                全部
              </button>

              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                    selectedGroupId === group.id
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <span className="flex-1 text-left truncate">{group.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border-t border-white/20 dark:border-slate-700/20">
            <button
              onClick={() => setShowGroupManager(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              管理分组
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-b border-white/20 dark:border-slate-700/20 shadow-sm">
            <div className="px-5 h-16 flex items-center justify-end gap-2">
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

              <button
                onClick={() => void refreshAll()}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl btn-glass text-indigo-600 dark:text-indigo-400 shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                刷新全部
              </button>

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

              <button
                onClick={logout}
                className="w-9 h-9 flex items-center justify-center rounded-xl glass text-red-400 dark:text-red-500 transition-all hover:scale-105 btn-press"
                title="退出登录"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>

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
          </header>

          <main className="flex-1 max-w-4xl w-full mx-auto px-5 py-8">
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
                  <AccountForm
                    groups={groups}
                    selectedGroupId={selectedGroupId}
                    onSubmit={handleAddAccount}
                    onCancel={() => setShowAddForm(false)}
                  />
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

            {filteredAccounts.length === 0 ? (
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
                {filteredAccounts.map(account => {
                  const status = statusMap[account.id];
                  if (!status) return null;
                  return (
                    <AccountCard
                      key={account.id}
                      status={status}
                      globalCollapsed={globalCollapsed}
                      confirmDelete={confirmDelete === account.id}
                      groups={groups}
                      onDelete={() => handleDelete(account.id)}
                      onRefresh={() => void refreshAccount(account.id)}
                      onEdit={() => setEditingAccount(account)}
                    />
                  );
                })}
              </div>
            )}
          </main>

          <footer className="text-center py-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-indigo-400 dark:text-indigo-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              数据每 60 秒自动刷新
            </div>
          </footer>
        </div>
      </div>

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
                groups={groups}
                selectedGroupId={selectedGroupId}
                onSubmit={handleUpdateAccount}
                onCancel={() => setEditingAccount(null)}
              />
            </div>
          </div>
        </div>
      )}

      {showChangePassword && (
        <ChangePasswordPage
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => {}}
        />
      )}

      {showGroupManager && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowGroupManager(false); }}
        >
          <div className="glass rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">管理分组</h2>
                </div>
                <button
                  onClick={() => setShowGroupManager(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl glass text-indigo-400 hover:text-indigo-600 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {showAddGroup ? (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="分组名称"
                    className="flex-1 px-3 py-2 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') void handleAddGroup(); }}
                  />
                  <button
                    onClick={() => void handleAddGroup()}
                    className="px-4 py-2 text-sm rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => { setShowAddGroup(false); setNewGroupName(''); }}
                    className="px-4 py-2 text-sm rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-500"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddGroup(true)}
                  className="w-full mb-4 py-2 text-sm rounded-xl border-2 border-dashed border-indigo-300/50 dark:border-indigo-500/30 text-indigo-500 dark:text-indigo-400 hover:border-indigo-400 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  新建分组
                </button>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groups.length === 0 ? (
                  <p className="text-center text-sm text-indigo-400 dark:text-indigo-500 py-4">
                    暂无分组
                  </p>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 group">
                      {editingGroup?.id === group.id ? (
                        <>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm rounded-lg border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') void handleRenameGroup(); }}
                          />
                          <button
                            onClick={() => void handleRenameGroup()}
                            className="text-xs text-emerald-500 hover:text-emerald-600"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => { setEditingGroup(null); setNewGroupName(''); }}
                            className="text-xs text-indigo-400 hover:text-indigo-600"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-indigo-900 dark:text-indigo-100 truncate">{group.name}</span>
                          <button
                            onClick={() => { setEditingGroup({ id: group.id, name: group.name }); setNewGroupName(group.name); }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-indigo-400 hover:text-indigo-600 transition-opacity"
                          >
                            重命名
                          </button>
                          <button
                            onClick={() => void handleDeleteGroup(group.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity"
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
