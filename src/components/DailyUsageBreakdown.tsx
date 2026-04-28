import { useDailyUsage } from '../hooks/useDailyUsage';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DailyUsageBreakdownProps {
  accountId: string;
  modelName: string;
  weekStart: string;
}

const COLORS = {
  bar: '#6366f1',
  barToday: '#8b5cf6',
  barEmpty: '#e2e8f0',
  text: '#94a3b8',
  bg: 'rgba(255,255,255,0.95)',
};

export function DailyUsageBreakdown({ accountId, modelName, weekStart }: DailyUsageBreakdownProps) {
  const { dailyUsage, loading, error } = useDailyUsage(accountId, modelName, weekStart);

  if (!weekStart) return null;

  const chartData = dailyUsage.map((day, idx) => ({
    name: day.day,
    date: day.date,
    usage: day.usage,
    percent_change: day.percent_change,
    isToday: idx === dailyUsage.length - 1 && day.usage > 0,
  }));

  return (
    <div className="mt-3 pt-3 border-t border-slate-100/60 dark:border-slate-700/20">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">本周每日用量</span>
        {dailyUsage.length > 0 && (
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <span className="w-2 h-2 rounded-sm bg-[#8b5cf6]" />
            <span>今日</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-3 text-xs text-slate-400">加载中...</div>
      )}
      {error && (
        <div className="text-center py-3 text-xs text-red-400">{error}</div>
      )}
      {!loading && !error && dailyUsage.length > 0 && (
        <>
          {/* 7天柱状图 */}
          <div className="h-24 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: COLORS.text }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: COLORS.text }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                  tickFormatter={(v) => Number(v).toLocaleString()}
                />
                <Tooltip
                  contentStyle={{
                    background: COLORS.bg,
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '10px',
                    fontSize: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value: any) => [Number(value).toLocaleString(), '用量']}
                  labelFormatter={(label: any) => {
                    const item = chartData.find((d: any) => d.name === label);
                    return item?.date || label;
                  }}
                />
                <Bar dataKey="usage" radius={[3, 3, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.isToday ? COLORS.barToday : entry.usage > 0 ? COLORS.bar : COLORS.barEmpty}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* 每日用量列表 */}
          <div className="grid grid-cols-7 gap-1">
            {dailyUsage.map((day, idx) => (
              <div key={day.date} className="text-center">
                <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">{day.day}</div>
                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{day.usage.toLocaleString()}</div>
                {day.percent_change !== null ? (
                  <div className={`flex items-center justify-center gap-0.5 text-[9px] ${
                    day.percent_change > 0 ? 'text-red-400' : day.percent_change < 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {day.percent_change > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : day.percent_change < 0 ? <TrendingDown className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                    <span>{day.percent_change > 0 ? '+' : ''}{day.percent_change}%</span>
                  </div>
                ) : (
                  <div className="text-[9px] text-slate-300 dark:text-slate-600">{idx === 0 ? '首日' : '—'}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && !error && dailyUsage.length === 0 && (
        <div className="text-center py-3 text-xs text-slate-400">暂无快照数据</div>
      )}
    </div>
  );
}
