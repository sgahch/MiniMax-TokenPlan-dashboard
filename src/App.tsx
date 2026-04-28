import { useState, useMemo } from 'react';
import {
  Search, RefreshCw, Plus, Moon, Sun, LogOut, KeyRound, LayoutGrid,
  Trash2, Download, X, Settings, Camera,
  CheckSquare, Square, ArrowUpDown, Filter,
} from 'lucide-react';
import { useAccounts } from './useAccounts';
import { AccountCard } from './AccountCard';
import { AccountForm } from './AccountForm';
import { useAuth } from './useAuth';
import { useGroups } from './useGroups';
import { useToast } from './hooks/useToast';
import { ToastContainer } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { DashboardStats } from './components/DashboardStats';
import { UsageCharts } from './components/UsageCharts';
import { SkeletonStats } from './components/Skeleton';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import type { Account } from './types';

type AuthView = 'login' | 'register';
type SortBy = 'name' | 'created' | 'usage';

export default function App() {
  const { user, logout, loading: authLoading, isAuthenticated } = useAuth();
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
    dbReady,
  } = useAccounts();
  const { groups, addGroup, removeGroup, renameGroup } = useGroups();
  const { toasts, addToast, removeToast } = useToast();

  const [authView, setAuthView] = useState<AuthView>('login');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{ id: string; name: string } | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [showAddGroup, setShowAddGroup] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [globalCollapsed, setGlobalCollapsed] = useState(true);
  const [chartViewMode, setChartViewMode] = useState<'interval' | 'weekly'>('interval');
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 筛选和排序
  const filteredAccounts = useMemo(() => {
    let list = selectedGroupId
      ? accounts.filter(a => a.groupId === selectedGroupId)
      : [...accounts];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.apiKey.toLowerCase().includes(q));
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = a.name.localeCompare(b.name);
      } else if (sortBy === 'created') {
        cmp = 0; // created_at 目前在 Account 类型中没有，按索引排序
      } else if (sortBy === 'usage') {
        const usageA = statusMap[a.id]?.data.reduce((sum, m) => sum + ((m.current_interval_total_count || 0) - (m.current_interval_usage_count || 0)), 0) || 0;
        const usageB = statusMap[b.id]?.data.reduce((sum, m) => sum + ((m.current_interval_total_count || 0) - (m.current_interval_usage_count || 0)), 0) || 0;
        cmp = usageA - usageB;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [accounts, selectedGroupId, searchQuery, sortBy, sortOrder, statusMap]);

  // 全选切换
  const allSelected = filteredAccounts.length > 0 && filteredAccounts.every(a => selectedIds.has(a.id));
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredAccounts.forEach(a => next.delete(a.id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredAccounts.forEach(a => next.add(a.id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 批量刷新
  const handleBatchRefresh = async () => {
    if (selectedIds.size === 0) return;
    addToast(`正在刷新 ${selectedIds.size} 个账号...`, 'info');
    await Promise.all(Array.from(selectedIds).map(id => refreshAccount(id)));
    addToast('批量刷新完成', 'success');
  };

  // 批量删除
  const handleBatchDelete = async () => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      await removeAccount(id);
    }
    setSelectedIds(new Set());
    setConfirmBatchDelete(false);
    addToast(`已删除 ${ids.length} 个账号`, 'success');
  };

  // 导出数据
  const handleExport = (format: 'json' | 'csv') => {
    const data = filteredAccounts.map(acc => {
      const status = statusMap[acc.id];
      return {
        name: acc.name,
        apiKey: acc.apiKey,
        group: groups.find(g => g.id === acc.groupId)?.name || '无分组',
        models: status?.data.map(m => ({
          model: m.model_name,
          intervalTotal: m.current_interval_total_count,
          intervalUsed: m.current_interval_usage_count,
          weeklyTotal: m.current_weekly_total_count,
          weeklyUsed: m.current_weekly_usage_count,
          remainingTime: m.remains_time,
        })) || [],
        error: status?.error || null,
      };
    });

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `token-plan-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('JSON 导出成功', 'success');
    } else {
      const rows: string[] = [];
      rows.push('账号名称,分组,模型,周期总量,周期已用,周期剩余,本周总量,本周已用,剩余时间');
      for (const item of data) {
        if (item.models.length === 0) {
          rows.push(`${item.name},${item.group},,0,0,0,0,0,`);
        } else {
          for (const m of item.models) {
            rows.push(`${item.name},${item.group},${m.model},${m.intervalTotal},${m.intervalUsed},${m.intervalTotal - m.intervalUsed},${m.weeklyTotal},${m.weeklyUsed},${m.remainingTime}`);
          }
        }
      }
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `token-plan-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      addToast('CSV 导出成功', 'success');
    }
  };

  const handleAddAccount = async (name: string, apiKey: string, groupId: string | null) => {
    await addAccount(name, apiKey, groupId);
    setShowAddForm(false);
    setGlobalCollapsed(true);
    addToast('账号添加成功', 'success');
  };

  const handleUpdateAccount = (name: string, apiKey: string, groupId: string | null) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, name, apiKey, groupId);
      setEditingAccount(null);
      addToast('账号更新成功', 'success');
    }
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    await addGroup(newGroupName.trim());
    setNewGroupName('');
    setShowAddGroup(false);
    addToast('分组创建成功', 'success');
  };

  const handleRenameGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;
    await renameGroup(editingGroup.id, newGroupName.trim());
    setEditingGroup(null);
    setNewGroupName('');
    addToast('分组重命名成功', 'success');
  };

  const handleDeleteGroup = async (id: string) => {
    await removeGroup(id);
    if (selectedGroupId === id) setSelectedGroupId(null);
    addToast('分组删除成功', 'success');
  };

  const handleDeleteAccount = async (id: string) => {
    await removeAccount(id);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    addToast('账号已删除', 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center animate-fade-in">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl glass flex items-center justify-center animate-float shadow-glow">
            <LayoutGrid className="w-7 h-7 text-primary-500" />
          </div>
          <p className="text-sm text-slate-400 font-medium">加载中...</p>
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
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary-300/20 via-violet-300/20 to-pink-300/20 blur-[100px] dark:from-primary-500/10 dark:via-violet-500/10 dark:to-pink-500/10" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300/20 via-primary-300/20 to-violet-300/20 blur-[100px] dark:from-cyan-500/10 dark:via-primary-500/10 dark:to-violet-500/10" />
        <div className="absolute -bottom-20 left-1/3 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-pink-300/20 via-violet-300/20 to-primary-300/20 blur-[120px] dark:from-pink-500/10 dark:via-violet-500/10 dark:to-primary-500/10" />
      </div>

      {/* Toast */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="flex min-h-screen bg-slate-50/80 dark:bg-slate-950/80 transition-colors duration-300">
        {/* 移动端遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 侧边栏 */}
        <aside className={`
          fixed lg:sticky top-0 z-40 h-screen shrink-0
          backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70
          border-r border-white/30 dark:border-slate-700/20
          flex flex-col transition-all duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          ${sidebarCollapsed ? 'w-16' : 'w-60'}
        `}>
          <div className={`py-5 border-b border-white/20 dark:border-slate-700/20 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'px-5'}`}>
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
              <div className="w-10 h-10 rounded-2xl glass flex items-center justify-center shadow-glow animate-float shrink-0">
                <LayoutGrid className="w-5 h-5 text-primary-500" />
              </div>
              {!sidebarCollapsed && (
                <div>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">Token Plan</span>
                  <span className="block text-xs text-slate-400">{user?.username}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarCollapsed(c => !c)}
              className="hidden lg:flex ml-auto w-7 h-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {sidebarCollapsed
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M6 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 7H2M8 3L4 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              }
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto py-4 ${sidebarCollapsed ? 'px-2' : 'px-3'}`}>
            <div className="space-y-1">
              <button
                onClick={() => { setSelectedGroupId(null); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  selectedGroupId === null
                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? '全部账号' : undefined}
              >
                <LayoutGrid className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">全部账号</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      selectedGroupId === null ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {accounts.length}
                    </span>
                  </>
                )}
              </button>

              {groups.map(group => {
                const count = accounts.filter(a => a.groupId === group.id).length;
                return (
                  <button
                    key={group.id}
                    onClick={() => { setSelectedGroupId(group.id); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      selectedGroupId === group.id
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? group.name : undefined}
                  >
                    <Filter className="w-5 h-5 shrink-0" />
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1 text-left truncate">{group.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                          selectedGroupId === group.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}>
                          {count}
                        </span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={`p-3 border-t border-white/20 dark:border-slate-700/20 space-y-1 ${sidebarCollapsed ? 'px-2' : ''}`}>
            <button
              onClick={() => setShowGroupManager(true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all ${sidebarCollapsed ? 'justify-center' : ''}`}
              title={sidebarCollapsed ? '管理分组' : undefined}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>管理分组</span>}
            </button>
          </div>
        </aside>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 顶部导航 */}
          <header className="sticky top-0 z-20 backdrop-blur-2xl bg-white/60 dark:bg-slate-900/60 border-b border-white/30 dark:border-slate-700/20">
            <div className="px-4 lg:px-6 h-16 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl glass text-slate-500"
                >
                  <LayoutGrid className="w-5 h-5" />
                </button>

              </div>

              <div className="flex items-center gap-2">
                {/* 排序 */}
                <div className="relative hidden md:block">
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={e => {
                      const [field, order] = e.target.value.split('-') as [SortBy, 'asc' | 'desc'];
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-medium bg-slate-100/60 dark:bg-slate-800/60 border border-transparent focus:border-primary-300 dark:focus:border-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 text-slate-600 dark:text-slate-300 cursor-pointer"
                  >
                    <option value="created-desc">最近添加</option>
                    <option value="created-asc">最早添加</option>
                    <option value="name-asc">名称 A-Z</option>
                    <option value="name-desc">名称 Z-A</option>
                    <option value="usage-desc">用量从高</option>
                    <option value="usage-asc">用量从低</option>
                  </select>
                  <ArrowUpDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                </div>

                <button
                  onClick={() => void refreshAll()}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="hidden sm:inline">刷新全部</span>
                </button>

                <button
                  onClick={async () => {
                    try {
                      const { fetchTokenPlanRemains, fetchCreateSnapshot } = await import('./api');
                      addToast('正在采集快照...', 'info');

                      // 为每个账号采集数据
                      const allSnapshots: Array<{
                        account_id: string;
                        model_name: string;
                        weekly_usage: number;
                        weekly_total: number;
                        daily_usage: number;
                        week_start: string;
                      }> = [];

                      for (const account of accounts) {
                        try {
                          const remains = await fetchTokenPlanRemains(account.apiKey);
                          for (const model of remains) {
                            // 只存 MiniMax-M* 的数据
                            if (!/^MiniMax-M/i.test(model.model_name)) continue;
                            // current_weekly_usage_count 实际上是剩余额度，已用量 = 总额 - 剩余
                            const weeklyUsed = model.current_weekly_total_count - model.current_weekly_usage_count;
                            // 使用 API 返回的 weekly_start_time 作为周起始
                            const weekStart = model.weekly_start_time
                              ? new Date(model.weekly_start_time).toISOString().split('T')[0]
                              : '';
                            allSnapshots.push({
                              account_id: account.id,
                              model_name: model.model_name,
                              weekly_usage: weeklyUsed, // 存储已用量
                              weekly_total: model.current_weekly_total_count,
                              daily_usage: 0, // 后端会计算
                              week_start: weekStart,
                            });
                          }
                        } catch (e) {
                          console.error(`[Snapshot] Failed to fetch for account ${account.id}:`, e);
                        }
                      }

                      // 提交到后端
                      await fetchCreateSnapshot(allSnapshots);
                      addToast(`快照采集成功 (${allSnapshots.length} 条记录)`, 'success');
                      window.location.reload();
                    } catch {
                      addToast('快照采集失败', 'error');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all"
                  title="采集每日用量快照"
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">快照</span>
                </button>

                <button
                  onClick={toggleDarkMode}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass text-slate-500 dark:text-slate-300 transition-all hover:scale-105"
                >
                  {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowChangePassword(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass text-amber-500 dark:text-amber-400 transition-all hover:scale-105"
                  title="修改密码"
                >
                  <KeyRound className="w-4 h-4" />
                </button>

                <button
                  onClick={logout}
                  className="w-9 h-9 flex items-center justify-center rounded-xl glass text-red-400 dark:text-red-500 transition-all hover:scale-105"
                  title="退出登录"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 max-w-6xl w-full mx-auto px-4 lg:px-6 py-6 space-y-6">
            {/* 数据概览 */}
            {!dbReady ? <SkeletonStats /> : (
              <>
                <DashboardStats statusMap={statusMap} groups={groups} selectedGroupId={selectedGroupId} />              </>
            )}

            {/* 图表 */}
            {dbReady && (
              <div className="animate-slide-down">
                <UsageCharts statusMap={statusMap} viewMode={chartViewMode} onViewModeChange={setChartViewMode} />
              </div>
            )}

            {/* 批量操作栏 */}
            {filteredAccounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  {allSelected ? <CheckSquare className="w-4 h-4 text-primary-500" /> : <Square className="w-4 h-4" />}
                  {allSelected ? '取消全选' : '全选'}
                  {selectedIds.size > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[10px] font-bold">
                      {selectedIds.size}
                    </span>
                  )}
                </button>

                {selectedIds.size > 0 && (
                  <>
                    <button
                      onClick={() => void handleBatchRefresh()}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-500/20 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      批量刷新
                    </button>
                    <button
                      onClick={() => setConfirmBatchDelete(true)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      批量删除
                    </button>
                  </>
                )}

                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => handleExport('json')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-slate-100/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV
                  </button>
                </div>
              </div>
            )}

            {/* 添加账号按钮 */}
            <div>
              {showAddForm ? (
                <div className="glass-card rounded-3xl p-6 shadow-xl animate-scale-in">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white">
                      <Plus className="w-5 h-5" />
                    </div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">添加新账号</h2>
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
                  className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-300/60 dark:border-slate-600/30 text-slate-500 dark:text-slate-400 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-500/5 transition-all flex items-center justify-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-5 h-5" />
                  添加账号
                </button>
              )}
            </div>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="搜索账号..."
                className="w-full pl-9 pr-10 py-2.5 rounded-xl text-sm bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 focus:border-primary-300 dark:focus:border-primary-700 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 账号列表 */}
            {filteredAccounts.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 shadow-xl text-center animate-scale-in">
                <div className="w-16 h-16 mx-auto mb-5 rounded-2xl glass flex items-center justify-center">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {accounts.length === 0 ? '还没有添加账号' : '没有找到匹配的账号'}
                </h3>
                <p className="text-sm text-slate-400 dark:text-slate-500 mb-6 max-w-xs mx-auto">
                  {accounts.length === 0 ? '点击上方按钮添加你的 MiniMax API Key' : '尝试更换搜索关键词'}
                </p>
                {accounts.length === 0 && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    立即添加
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAccounts.map((account, idx) => {
                  const status = statusMap[account.id];
                  if (!status && dbReady) return null;
                  return (
                    <div key={account.id} className="animate-slide-up" style={{ animationDelay: `${idx * 60}ms` }}>
                      <AccountCard
                        status={status}
                        globalCollapsed={globalCollapsed}
                        groups={groups}
                        selected={selectedIds.has(account.id)}
                        onToggleSelect={() => toggleSelect(account.id)}
                        onDelete={() => handleDeleteAccount(account.id)}
                        onRefresh={() => { void refreshAccount(account.id); addToast('刷新成功', 'success'); }}
                        onEdit={() => setEditingAccount(account)}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </main>

          <footer className="text-center py-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-xs text-slate-400 dark:text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              数据每 60 秒自动刷新
            </div>
          </footer>
        </div>
      </div>

      {/* 编辑账号弹窗 */}
      {editingAccount && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setEditingAccount(null); }}
        >
          <div className="glass-card rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">编辑账号</h2>
                </div>
                <button
                  onClick={() => setEditingAccount(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl glass text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
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

      {/* 修改密码 */}
      {showChangePassword && (
        <ChangePasswordPage
          onClose={() => setShowChangePassword(false)}
          onSuccess={() => addToast('密码修改成功', 'success')}
        />
      )}

      {/* 批量删除确认 */}
      {confirmBatchDelete && (
        <ConfirmModal
          title="确认批量删除"
          message={`即将删除 ${selectedIds.size} 个账号，此操作不可恢复。确定继续吗？`}
          confirmText="删除"
          danger
          onConfirm={() => void handleBatchDelete()}
          onCancel={() => setConfirmBatchDelete(false)}
        />
      )}

      {/* 分组管理 */}
      {showGroupManager && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowGroupManager(false); }}
        >
          <div className="glass-card rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-400 flex items-center justify-center text-white">
                    <Settings className="w-5 h-5" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">管理分组</h2>
                </div>
                <button
                  onClick={() => setShowGroupManager(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl glass text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showAddGroup ? (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    placeholder="分组名称"
                    className="flex-1 px-3 py-2 rounded-xl text-sm input-field"
                    autoFocus
                    onKeyDown={e => { if (e.key === 'Enter') void handleAddGroup(); }}
                  />
                  <button
                    onClick={() => void handleAddGroup()}
                    className="px-4 py-2 text-sm rounded-xl btn-primary"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => { setShowAddGroup(false); setNewGroupName(''); }}
                    className="px-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddGroup(true)}
                  className="w-full mb-4 py-2 text-sm rounded-xl border-2 border-dashed border-slate-300/60 dark:border-slate-600/30 text-slate-500 dark:text-slate-400 hover:border-primary-400 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新建分组
                </button>
              )}

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {groups.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 dark:text-slate-500 py-4">暂无分组</p>
                ) : (
                  groups.map(group => (
                    <div key={group.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/30 group transition-colors">
                      {editingGroup?.id === group.id ? (
                        <>
                          <input
                            type="text"
                            value={newGroupName}
                            onChange={e => setNewGroupName(e.target.value)}
                            className="flex-1 px-2 py-1 text-sm rounded-lg input-field"
                            autoFocus
                            onKeyDown={e => { if (e.key === 'Enter') void handleRenameGroup(); }}
                          />
                          <button
                            onClick={() => void handleRenameGroup()}
                            className="text-xs text-emerald-500 hover:text-emerald-600 font-medium"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => { setEditingGroup(null); setNewGroupName(''); }}
                            className="text-xs text-slate-400 hover:text-slate-600"
                          >
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm text-slate-900 dark:text-slate-100 truncate">{group.name}</span>
                          <button
                            onClick={() => { setEditingGroup({ id: group.id, name: group.name }); setNewGroupName(group.name); }}
                            className="opacity-0 group-hover:opacity-100 text-xs text-slate-400 hover:text-primary-500 transition-opacity px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            重命名
                          </button>
                          <button
                            onClick={() => void handleDeleteGroup(group.id)}
                            className="opacity-0 group-hover:opacity-100 text-xs text-red-400 hover:text-red-600 transition-opacity px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
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
