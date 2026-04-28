import { Bot, Calendar, Clock } from 'lucide-react';
import type { ModelRemain } from './types';
import { formatDateTime, formatDuration, getUsageStats } from './types';

interface ModelCardProps {
  data: ModelRemain;
}

function UsageBar({ percent }: { percent: number }) {
  const getColor = () => {
    if (percent >= 85) return 'from-red-400 to-rose-500';
    if (percent >= 60) return 'from-amber-400 to-orange-400';
    return 'from-primary-400 to-violet-400';
  };

  return (
    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/50 overflow-hidden">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${getColor()} transition-all duration-700 ease-spring`}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

export function ModelCard({ data }: ModelCardProps) {
  const intervalStats = getUsageStats(data.current_interval_total_count, data.current_interval_usage_count);
  const weeklyStats = getUsageStats(data.current_weekly_total_count, data.current_weekly_usage_count);
  const showWarning = intervalStats.percent >= 85 || weeklyStats.percent >= 85;

  return (
    <div className="group/card bg-white/60 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100/60 dark:border-slate-700/20 transition-all duration-300 hover:bg-white/80 dark:hover:bg-slate-800/40 hover:shadow-lg hover:shadow-primary-500/5 hover:border-primary-200/40 dark:hover:border-primary-500/10">
      {/* 模型名 + 状态 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{data.model_name}</span>
        </div>
        {showWarning && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-medium shrink-0">
            即将用尽
          </span>
        )}
      </div>

      {/* 用量统计 */}
      <div className="mb-3 space-y-2.5">
        {/* 当前5h周期 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">当前5h周期</span>
            <span className={`text-[11px] font-bold ${
              intervalStats.percent >= 85 ? 'text-red-500' :
              intervalStats.percent >= 60 ? 'text-amber-500' :
              'text-primary-500 dark:text-primary-400'
            }`}>
              {intervalStats.percent}%
            </span>
          </div>
          <UsageBar percent={intervalStats.percent} />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              已用 {intervalStats.used.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              共 {intervalStats.total.toLocaleString()}
            </span>
          </div>
        </div>
        {/* 本周配额 */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">本周配额</span>
            <span className={`text-[11px] font-bold ${
              weeklyStats.percent >= 85 ? 'text-red-500' :
              weeklyStats.percent >= 60 ? 'text-amber-500' :
              'text-primary-500 dark:text-primary-400'
            }`}>
              {weeklyStats.percent}%
            </span>
          </div>
          <UsageBar percent={weeklyStats.percent} />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              已用 {weeklyStats.used.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              共 {weeklyStats.total.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* 底部时间 */}
      <div className="pt-2.5 border-t border-slate-100/60 dark:border-slate-700/20 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDateTime(data.start_time).split(' ')[0]} – {formatDateTime(data.end_time).split(' ')[0]}
        </span>
        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          剩 {formatDuration(data.remains_time)}
        </span>
      </div>
    </div>
  );
}
