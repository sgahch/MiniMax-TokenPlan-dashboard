import type { ModelRemain } from './types';
import { formatDateTime, formatDuration, getUsageStats, buildProgressBar, getUsageColor, getDaysLeft } from './types';

interface ModelCardProps {
  data: ModelRemain;
}

export function ModelCard({ data }: ModelCardProps) {
  const intervalStats = getUsageStats(data.current_interval_total_count, data.current_interval_usage_count);
  const weeklyStats = getUsageStats(data.current_weekly_total_count, data.current_weekly_usage_count);
  const intervalBar = buildProgressBar(intervalStats.percent);
  const weeklyBar = buildProgressBar(weeklyStats.percent);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 mb-3">
        <span className="font-medium text-slate-800 dark:text-slate-100">{data.model_name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${getDaysLeft(data.end_time) <= 3 ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'}`}>
          剩余 {getDaysLeft(data.end_time)} 天
        </span>
      </div>

      {/* 周期配额 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>当前周期</span>
          <span>{formatDateTime(data.start_time)} - {formatDateTime(data.end_time)}</span>
        </div>
        <div className={`text-sm font-mono ${getUsageColor(intervalStats.percent)}`}>
          {intervalBar} {intervalStats.percent}%
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          已用: {intervalStats.available.toLocaleString()} / 总计: {intervalStats.total.toLocaleString()}
        </div>
      </div>

      {/* 周配额 */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
          <span>本周配额</span>
          <span>{formatDateTime(data.weekly_start_time)} - {formatDateTime(data.weekly_end_time)}</span>
        </div>
        <div className={`text-sm font-mono ${getUsageColor(weeklyStats.percent)}`}>
          {weeklyBar} {weeklyStats.percent}%
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          已用: {weeklyStats.available.toLocaleString()} / 总计: {weeklyStats.total.toLocaleString()}
        </div>
      </div>

      {/* 剩余时间 */}
      <div className="text-xs text-slate-500 dark:text-slate-400">
        周期剩余时间: <span className="text-slate-700 dark:text-slate-200">{formatDuration(data.remains_time)}</span>
      </div>
    </div>
  );
}