import { useState } from 'react';
import type { AccountStatus } from './useAccounts';
import { ModelCard } from './ModelCard';
import { formatDuration } from './types';

interface AccountCardProps {
  status: AccountStatus;
  onDelete: () => void;
  onRefresh: () => void;
  onEdit: () => void;
}

function isMiniMaxM(modelName: string) {
  return /^MiniMax-M/i.test(modelName);
}

export function AccountCard({ status, onDelete, onRefresh, onEdit }: AccountCardProps) {
  const { account, data, loading, error, lastFetched } = status;
  const [collapsed, setCollapsed] = useState(false);

  const visibleData = collapsed ? data.filter(m => isMiniMaxM(m.model_name)) : data;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* 账号头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{account.name}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              {account.apiKey.slice(0, 8)}...{account.apiKey.slice(-4)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-blue-500">刷新中...</span>}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            title={collapsed ? '展开全部' : '折叠只显示 MiniMax-M'}
          >
            {collapsed ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
          {!loading && lastFetched > 0 && (
            <span className="text-xs text-slate-400">{formatDuration(Date.now() - lastFetched)}前</span>
          )}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50"
            title="刷新"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
            title="编辑"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
            title="删除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">{error}</div>
            <button
              onClick={onRefresh}
              className="text-sm text-blue-500 hover:underline"
            >
              重试
            </button>
          </div>
        ) : visibleData.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            {loading ? '加载中...' : collapsed ? '无 MiniMax-M 模型数据' : '暂无数据'}
          </div>
        ) : (
          <div className="grid gap-4">
            {visibleData.map((model, idx) => (
              <ModelCard key={`${model.model_name}-${idx}`} data={model} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}