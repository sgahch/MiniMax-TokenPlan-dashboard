import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { fetchDailyUsageSummary } from '../api';
import { useState, useEffect } from 'react';

interface DailyUsageItem {
  date: string;
  day: string;
  usage: number;
  percent_change: number | null;
  weekly_used: number;
  weekly_total: number;
}

interface AccountWeeklySummaryProps {
  accountId: string;
  weekStart: string;
}

const COLORS = {
  bar: '#6366f1',
  barToday: '#8b5cf6',
  barEmpty: '#e2e8f0',
  text: '#94a3b8',
  bg: 'rgba(255,255,255,0.95)',
};

export function AccountWeeklySummary({ accountId, weekStart }: AccountWeeklySummaryProps) {
  const [dailyUsage, setDailyUsage] = useState<DailyUsageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accountId || !weekStart) return;

    setLoading(true);
    fetchDailyUsageSummary(accountId, weekStart)
      .then(data => {
        console.log('[AccountWeeklySummary] data:', data);
        setDailyUsage(data.daily_usage);
        setLoading(false);
      })
      .catch(err => {
        console.error('[AccountWeeklySummary] error:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [accountId, weekStart]);

  if (!weekStart) return null;

  const chartData = dailyUsage.map((day) => ({
    name: day.day,
    date: day.date,
    usage: day.usage,
    isToday: day.usage > 0,
  }));

  // 计算 Y 轴范围
  const maxUsage = Math.max(...dailyUsage.map(d => d.usage), 1);

  return (
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="text-xs text-slate-400">加载中...</div>
      )}
      {error && (
        <div className="text-xs text-red-400">数据加载失败</div>
      )}
      {!loading && !error && dailyUsage.length > 0 && (
        <>
          {/* 7天折线图 */}
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" vertical={false} />
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
                  width={50}
                  tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                  domain={[0, maxUsage * 1.1]}
                />
                <Tooltip
                  contentStyle={{
                    background: COLORS.bg,
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                  formatter={(value: any) => [Number(value).toLocaleString(), '用量']}
                  labelFormatter={(label: any) => {
                    const item = chartData.find((d: any) => d.name === label);
                    return item?.date || label;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="usage"
                  stroke={COLORS.bar}
                  strokeWidth={2}
                  dot={{ r: 3, fill: COLORS.bar }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* 每日数据 - 与图表对齐 */}
          <div className="flex justify-between px-2">
            {dailyUsage.map((day) => (
              <div key={day.date} className="text-center flex-1">
                <div className="text-[9px] text-slate-400">{day.day}</div>
                <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300">
                  {day.usage.toLocaleString()}
                </div>
                {day.percent_change !== null ? (
                  <div className={`flex items-center justify-center gap-0.5 text-[8px] ${
                    day.percent_change > 0 ? 'text-red-400' : day.percent_change < 0 ? 'text-emerald-400' : 'text-slate-400'
                  }`}>
                    {day.percent_change > 0 ? <TrendingUp className="w-2 h-2" /> : day.percent_change < 0 ? <TrendingDown className="w-2 h-2" /> : <Minus className="w-2 h-2" />}
                  </div>
                ) : (
                  <div className="h-2" />
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && !error && dailyUsage.length === 0 && (
        <div className="text-xs text-slate-400">暂无数据</div>
      )}
    </div>
  );
}
