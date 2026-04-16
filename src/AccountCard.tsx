import { useState } from 'react';
import type { AccountStatus } from './useAccounts';
import { ModelCard } from './ModelCard';
import { formatDuration } from './types';

interface AccountCardProps {
  status: AccountStatus;
  confirmDelete: boolean;
  onDelete: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}

function isMiniMaxM(modelName: string) {
  return /^MiniMax-M/i.test(modelName);
}

export function AccountCard({ status, confirmDelete, onDelete, onRefresh, onEdit }: AccountCardProps) {
  const { account, data, loading, error, lastFetched } = status;
  const [collapsed, setCollapsed] = useState(false);

  const visibleData = collapsed ? data.filter(m => isMiniMaxM(m.model_name)) : data;

  return (
    <div className="bg-white dark:bg-[#161b22] rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm overflow-hidden">

      {/* 账号头部 */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {/* 头像 */}
          <div className="w-9 h-9 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{account.name}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">
              {account.apiKey.slice(0, 8)}···{account.apiKey.slice(-4)}
            </p>
          </div>
        </div>

        {/* 操作区 */}
        <div className="flex items-center gap-1 shrink-0 ml-3">
          {loading && (
            <span className="text-xs text-blue-400 mr-1">刷新中</span>
          )}
          {!loading && lastFetched > 0 && (
            <span className="text-xs text-slate-300 dark:text-slate-600 mr-1 hidden sm:inline">
              {formatDuration(Date.now() - lastFetched)}前
            </span>
          )}

          {/* 折叠 */}
          <button
            onClick={() => setCollapsed(v => !v)}
            title={collapsed ? '展开全部' : '只看 MiniMax-M'}
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 dark:text-slate-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 dark:text-slate-500 disabled:opacity-40 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* 编辑 */}
          <button
            onClick={onEdit}
            title="编辑"
            className="w-7 h-7 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-slate-400 dark:text-slate-500 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* 删除（二次确认） */}
          <button
            onClick={onDelete}
            title={confirmDelete ? '再次点击确认删除' : '删除'}
            className={`w-7 h-7 flex items-center justify-center rounded-xl transition-colors ${
              confirmDelete
                ? 'bg-red-500 text-white'
                : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 dark:text-slate-500 hover:text-red-500'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 分割线 */}
      <div className="h-px bg-slate-100 dark:bg-slate-700/50 mx-5" />

      {/* 内容区 */}
      <div className="p-5">
        {error ? (
          <div className="flex flex-col items-center py-6 gap-2">
            <div className="w-8 h-8 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={onRefresh} className="text-xs text-blue-500 hover:underline">重试</button>
          </div>
        ) : visibleData.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-300 dark:text-slate-600">
            {loading ? '加载中…' : collapsed ? '无 MiniMax-M 模型数据' : '暂无数据'}
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
