import { useState, useEffect } from 'react';
import type { AccountStatus } from './useAccounts';
import type { Group } from './types';
import { ModelCard } from './ModelCard';
import { formatDuration } from './types';

interface AccountCardProps {
  status: AccountStatus;
  globalCollapsed: boolean;
  confirmDelete: boolean;
  groups: Group[];
  onDelete: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}

function isMiniMaxM(modelName: string) {
  return /^MiniMax-M/i.test(modelName);
}

export function AccountCard({ status, globalCollapsed, confirmDelete, groups, onDelete, onRefresh, onEdit }: AccountCardProps) {
  const { account, data, loading, error, lastFetched } = status;
  const accountGroup = groups.find(g => g.id === account.groupId);
  const [collapsed, setCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  // 同步全局折叠状态
  useEffect(() => {
    setCollapsed(globalCollapsed);
  }, [globalCollapsed]);

  const copyApiKey = async () => {
    try {
      // 优先使用 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(account.apiKey);
      } else {
        // Fallback: 使用旧方法创建临时输入框
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
      // 复制失败，尝试 Android 兼容方式
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
        // 静默失败
      }
    }
  };

  const visibleData = collapsed ? data.filter(m => isMiniMaxM(m.model_name)) : data;

  // 渐变色组合
  const avatarGradients = [
    'from-indigo-400 to-purple-400',
    'from-cyan-400 to-blue-400',
    'from-pink-400 to-rose-400',
    'from-amber-400 to-orange-400',
    'from-emerald-400 to-teal-400',
    'from-violet-400 to-fuchsia-400',
  ];
  const colorIndex = account.name.charCodeAt(0) % avatarGradients.length;

  return (
    <div className="group glass rounded-3xl shadow-lg card-hover animate-slide-up overflow-hidden">

      {/* 账号头部 */}
      <div className="relative px-5 py-4">
        {/* 顶部渐变装饰条 */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${avatarGradients[colorIndex]}`} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* 头像 */}
            <div className={`w-12 h-12 shrink-0 rounded-2xl bg-gradient-to-br ${avatarGradients[colorIndex]} flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-105 transition-transform duration-300`}>
              {account.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100 truncate">{account.name}</p>
                {accountGroup && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 font-medium shrink-0">
                    {accountGroup.name}
                  </span>
                )}
              </div>
              <button
                onClick={copyApiKey}
                className="group/api flex items-center gap-1.5 text-xs text-indigo-400 dark:text-indigo-500 font-mono truncate hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                title="点击复制 API Key"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{account.apiKey.slice(0, 8)}···{account.apiKey.slice(-4)}</span>
                <span className="opacity-0 group-hover/api:opacity-100 transition-opacity">
                  {copied ? (
                    <span className="text-emerald-500">✓ 已复制</span>
                  ) : (
                    <svg className="w-3 h-3 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* 操作区 */}
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            {loading && (
              <div className="flex items-center gap-1.5 mr-1">
                <div className="w-4 h-4 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
                <span className="text-xs text-indigo-500">刷新中</span>
              </div>
            )}
            {!loading && lastFetched > 0 && (
              <span className="text-xs text-indigo-300 dark:text-indigo-600 mr-1 hidden sm:inline">
                {formatDuration(Date.now() - lastFetched)}前
              </span>
            )}

            {/* 折叠 */}
            <button
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? '展开全部' : '只看 MiniMax-M'}
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-indigo-400 dark:text-indigo-500 transition-all hover:scale-105"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {collapsed
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                }
              </svg>
            </button>

            {/* 刷新 */}
            <button
              onClick={onRefresh}
              disabled={loading}
              title="刷新"
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-indigo-400 dark:text-indigo-500 disabled:opacity-40 transition-all hover:scale-105 btn-press"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>

            {/* 编辑 */}
            <button
              onClick={onEdit}
              title="编辑"
              className="w-8 h-8 flex items-center justify-center rounded-xl btn-glass text-indigo-400 dark:text-indigo-500 transition-all hover:scale-105 btn-press"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>

            {/* 删除（二次确认） */}
            <button
              onClick={onDelete}
              title={confirmDelete ? '再次点击确认删除' : '删除'}
              className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-105 btn-press ${
                confirmDelete
                  ? 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg'
                  : 'bg-red-50/50 dark:bg-red-900/20 text-red-400 dark:text-red-500 border border-red-200/30 dark:border-red-800/30'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="px-5 pb-5">
        {error ? (
          <div className="rounded-2xl bg-red-50/70 dark:bg-red-900/20 border border-red-200/40 dark:border-red-800/30 p-4">
            <div className="flex flex-col items-center py-4 gap-2">
              <div className="w-12 h-12 rounded-2xl bg-red-100/70 dark:bg-red-900/40 flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <p className="text-sm text-red-500 font-medium">{error}</p>
              <button onClick={onRefresh} className="text-xs text-red-400 hover:text-red-600 hover:underline transition-colors">点击重试</button>
            </div>
          </div>
        ) : visibleData.length === 0 ? (
          <div className="rounded-2xl bg-white/50 dark:bg-slate-800/30 border border-white/30 dark:border-slate-700/20 py-10">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass flex items-center justify-center">
                <svg className="w-6 h-6 text-indigo-300 dark:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-xs text-indigo-400 dark:text-indigo-500">
                {loading ? '加载中…' : collapsed ? '无 MiniMax-M 模型数据' : '暂无数据'}
              </p>
            </div>
          </div>
        ) : (
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
