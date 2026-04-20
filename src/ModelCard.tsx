import type { ModelRemain } from './types';
import { formatDateTime, formatDuration, getUsageStats } from './types';

interface ModelCardProps {
  data: ModelRemain;
}

function UsageBar({ percent }: { percent: number }) {
  const getColor = () => {
    if (percent >= 85) return 'from-red-400 to-rose-500';
    if (percent >= 60) return 'from-amber-400 to-orange-400';
    return 'from-indigo-400 to-purple-400';
  };

  return (
    <div className="w-full h-2.5 rounded-full bg-indigo-100/60 dark:bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-500`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function ModelCard({ data }: ModelCardProps) {
  const intervalStats = getUsageStats(data.current_interval_total_count, data.current_interval_usage_count);
  const weeklyStats = getUsageStats(data.current_weekly_total_count, data.current_weekly_usage_count);

  return (
    <div className="group bg-white/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-white/30 dark:border-slate-700/20 transition-all duration-300 hover:bg-white/70 dark:hover:bg-slate-800/50 hover:shadow-lg hover:shadow-indigo-500/5">

      {/* 模型名 + 状态指示 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm">🤖</span>
          <span className="text-sm font-medium text-indigo-900 dark:text-indigo-100 truncate">{data.model_name}</span>
        </div>
        {intervalStats.percent >= 85 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
            ⚠️ 即将用尽
          </span>
        )}
      </div>

      {/* 当前周期 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-indigo-400 dark:text-indigo-500">当前周期</span>
          <span className={`text-xs font-semibold ${
            intervalStats.percent >= 85 ? 'text-red-500' :
            intervalStats.percent >= 60 ? 'text-amber-500' :
            'text-indigo-500 dark:text-indigo-400'
          }`}>
            {intervalStats.percent}%
          </span>
        </div>
        <UsageBar percent={intervalStats.percent} />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-indigo-300 dark:text-indigo-600">
            剩余 {intervalStats.remaining.toLocaleString()}
          </span>
          <span className="text-xs text-indigo-400 dark:text-indigo-500">
            共 {intervalStats.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 本周配额 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-indigo-400 dark:text-indigo-500">本周配额</span>
          <span className={`text-xs font-semibold ${
            weeklyStats.percent >= 85 ? 'text-red-500' :
            weeklyStats.percent >= 60 ? 'text-amber-500' :
            'text-indigo-500 dark:text-indigo-400'
          }`}>
            {weeklyStats.percent}%
          </span>
        </div>
        <UsageBar percent={weeklyStats.percent} />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-indigo-300 dark:text-indigo-600">
            剩余 {weeklyStats.remaining.toLocaleString()}
          </span>
          <span className="text-xs text-indigo-400 dark:text-indigo-500">
            共 {weeklyStats.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 底部时间信息 */}
      <div className="pt-2.5 border-t border-indigo-100/50 dark:border-slate-700/30 flex items-center justify-between">
        <span className="text-[11px] text-indigo-300 dark:text-indigo-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDateTime(data.start_time).split(' ')[0]} – {formatDateTime(data.end_time).split(' ')[0]}
        </span>
        <span className="text-[11px] text-indigo-400 dark:text-indigo-500 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          剩 {formatDuration(data.remains_time)}
        </span>
      </div>
    </div>
  );
}
