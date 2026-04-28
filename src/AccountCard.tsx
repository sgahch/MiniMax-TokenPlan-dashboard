import { useState, useEffect } from 'react';
import {
  Copy, Check, RefreshCw, Settings, Trash2, ChevronDown, ChevronUp,
  AlertCircle, Box,
} from 'lucide-react';
import type { AccountStatus } from './useAccounts';
import type { Group } from './types';
import { ModelCard } from './ModelCard';
import { formatDuration } from './types';
import { AccountWeeklySummary } from './components/AccountWeeklySummary';

interface AccountCardProps {
  status: AccountStatus;
  globalCollapsed: boolean;
  groups: Group[];
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}

function isMiniMaxM(modelName: string) {
  return /^MiniMax-M/i.test(modelName);
}

export function AccountCard({
  status,
  globalCollapsed,
  groups,
  selected,
  onToggleSelect,
  onDelete,
  onRefresh,
  onEdit,
}: AccountCardProps) {
  const { account, data, loading, error, lastFetched } = status;
  const accountGroup = groups.find(g => g.id === account.groupId);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setCollapsed(globalCollapsed);
  }, [globalCollapsed]);

  const copyApiKey = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(account.apiKey);
      } else {
        const input = document.createElement('input');
        input.value = account.apiKey;
        input.style.position = 'fixed';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        const input = document.createElement('input');
        input.value = account.apiKey;
        input.style.position = 'fixed';
        input.style.top = '0';
        input.style.left = '0';
        input.style.width = '1px';
        input.style.height = '1px';
        input.style.opacity = '0';
        document.body.appendChild(input);
        input.focus();
        input.select();
        const success = document.execCommand('copy');
        document.body.removeChild(input);
        if (success) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      } catch {
        // silent
      }
    }
  };

  const visibleData = collapsed ? data.filter(m => isMiniMaxM(m.model_name)) : data;

  const avatarGradients = [
    'from-primary-400 to-violet-400',
    'from-cyan-400 to-blue-400',
    'from-pink-400 to-rose-400',
    'from-amber-400 to-orange-400',
    'from-emerald-400 to-teal-400',
    'from-violet-400 to-fuchsia-400',
  ];
  const colorIndex = account.name.charCodeAt(0) % avatarGradients.length;

  return (
    <div className="glass-card rounded-3xl overflow-hidden group">
      {/* 顶部渐变条 */}
      <div className={`h-1 bg-gradient-to-r ${avatarGradients[colorIndex]}`} />

      {/* 头部 */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* 选择框 */}
            <button
              onClick={onToggleSelect}
              className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                selected
                  ? 'bg-primary-500 border-primary-500 text-white'
                  : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-primary-400'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
            </button>

            {/* 头像 */}
            <div className={`w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br ${avatarGradients[colorIndex]} flex items-center justify-center text-white text-lg font-bold shadow-lg group-hover:scale-105 transition-transform duration-300`}>
              {account.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{account.name}</p>
                {accountGroup && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium shrink-0">
                    {accountGroup.name}
                  </span>
                )}
              </div>
              <button
                onClick={copyApiKey}
                className="group/api flex items-center gap-1.5 text-xs text-slate-400 font-mono truncate hover:text-primary-500 transition-colors"
                title="点击复制 API Key"
              >
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{account.apiKey.slice(0, 8)}···{account.apiKey.slice(-4)}</span>
                <span className="opacity-0 group-hover/api:opacity-100 transition-opacity">
                  {copied ? (
                    <span className="text-emerald-500 flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> 已复制
                    </span>
                  ) : (
                    <Copy className="w-3 h-3 inline ml-0.5" />
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* 操作区 */}
          <div className="flex items-center gap-1.5 shrink-0">
            {loading && (
              <div className="flex items-center gap-1.5 mr-1">
                <RefreshCw className="w-3.5 h-3.5 text-primary-400 animate-spin" />
                <span className="text-[10px] text-primary-400 font-medium">刷新中</span>
              </div>
            )}
            {!loading && lastFetched > 0 && (
              <span className="text-[10px] text-slate-300 dark:text-slate-600 mr-1 hidden sm:inline">
                {formatDuration(Date.now() - lastFetched)}前
              </span>
            )}

            <button
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? '展开全部' : '只看 MiniMax-M'}
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-slate-400 transition-all hover:scale-105"
            >
              {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>

            <button
              onClick={onRefresh}
              disabled={loading}
              title="刷新"
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-slate-400 disabled:opacity-40 transition-all hover:scale-105"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onEdit}
              title="编辑"
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-slate-400 transition-all hover:scale-105"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                if (confirmDelete) {
                  onDelete();
                  setConfirmDelete(false);
                } else {
                  setConfirmDelete(true);
                  setTimeout(() => setConfirmDelete(false), 3000);
                }
              }}
              title={confirmDelete ? '再次点击确认删除' : '删除'}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-105 ${
                confirmDelete
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                  : 'bg-red-50/50 dark:bg-red-500/10 text-red-400 dark:text-red-500 border border-red-200/30 dark:border-red-500/20'
              }`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="px-5 pb-5">
        {error ? (
          <div className="rounded-2xl bg-red-50/70 dark:bg-red-500/5 border border-red-200/40 dark:border-red-500/10 p-4">
            <div className="flex flex-col items-center py-4 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100/70 dark:bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button onClick={onRefresh} className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors">点击重试</button>
            </div>
          </div>
        ) : visibleData.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/50 dark:bg-slate-800/20 border border-slate-100/50 dark:border-slate-700/20 py-10">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass flex items-center justify-center">
                <Box className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                {loading ? '加载中…' : collapsed ? '无 MiniMax-M 模型数据' : '暂无数据'}
              </p>
            </div>
          </div>
        ) : collapsed ? (
          // 折叠时：左右布局
          <div className="flex gap-4">
            {/* 左侧：模型卡片 */}
            <div className="w-80 shrink-0">
              {visibleData.slice(0, 1).map((model, idx) => (
                <ModelCard key={`${model.model_name}-${idx}`} data={model} />
              ))}
            </div>
            {/* 右侧：7日图表 */}
            <div className="flex-1 min-w-0">
              <div className="glass-card rounded-2xl p-4 bg-white/60 dark:bg-slate-800/20 border border-slate-100/60 dark:border-slate-700/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">本周每日用量</span>
                  <span className="text-xs text-slate-400">汇总</span>
                </div>
                <AccountWeeklySummary
                  accountId={account.id}
                  weekStart={data[0]?.weekly_start_time ? new Date(data[0].weekly_start_time).toISOString().split('T')[0] : ''}
                />
              </div>
            </div>
          </div>
        ) : (
          // 展开时：2列网格
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleData.map((model, idx) => (
              <ModelCard key={`${model.model_name}-${idx}`} data={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
