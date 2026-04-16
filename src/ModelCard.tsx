import type { ModelRemain } from './types';
import { formatDateTime, formatDuration, getUsageStats, getUsageColor, getDaysLeft } from './types';

interface ModelCardProps {
  data: ModelRemain;
}

function UsageBar({ percent, colorClass }: { percent: number; colorClass: string }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${
          percent >= 85 ? 'bg-red-400' : percent >= 60 ? 'bg-amber-400' : 'bg-emerald-400'
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function ModelCard({ data }: ModelCardProps) {
  const intervalStats = getUsageStats(data.current_interval_total_count, data.current_interval_usage_count);
  const weeklyStats = getUsageStats(data.current_weekly_total_count, data.current_weekly_usage_count);
  const daysLeft = getDaysLeft(data.end_time);
  const intervalColor = getUsageColor(intervalStats.percent);
  const weeklyColor = getUsageColor(weeklyStats.percent);

  return (
    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/40">

      {/* 模型名 + 剩余天数 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mr-2">{data.model_name}</span>

      </div>

      {/* 当前周期 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">当前周期</span>
          <span className={`text-xs font-medium ${intervalColor}`}>{intervalStats.percent}%</span>
        </div>
        <UsageBar percent={intervalStats.percent} colorClass={intervalColor} />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            剩余 {intervalStats.remaining.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            共 {intervalStats.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 本周配额 */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">本周配额</span>
          <span className={`text-xs font-medium ${weeklyColor}`}>{weeklyStats.percent}%</span>
        </div>
        <UsageBar percent={weeklyStats.percent} colorClass={weeklyColor} />
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            剩余 {weeklyStats.remaining.toLocaleString()}
          </span>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            共 {weeklyStats.total.toLocaleString()}
          </span>
        </div>
      </div>

      {/* 底部时间信息 */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-700/40 flex items-center justify-between">
        <span className="text-xs text-slate-300 dark:text-slate-600">
          {formatDateTime(data.start_time).split(' ')[0]} – {formatDateTime(data.end_time).split(' ')[0]}
        </span>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          剩 {formatDuration(data.remains_time)}
        </span>
      </div>
    </div>
  );
}
