import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import type { AccountStatus } from '../useAccounts';
// import { formatDuration } from '../types';

interface UsageChartsProps {
  statusMap: Record<string, AccountStatus>;
  viewMode: 'interval' | 'weekly';
  onViewModeChange: (mode: 'interval' | 'weekly') => void;
}

interface ChartProps {
  statusMap: Record<string, AccountStatus>;
  viewMode: 'interval' | 'weekly';
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#f43f5e', '#14b8a6'];

export function UsageDistributionChart({ statusMap, viewMode }: ChartProps) {
  const data = useMemo(() => {
    const modelUsage: Record<string, number> = {};
    for (const status of Object.values(statusMap)) {
      for (const m of status.data) {
        const total = viewMode === 'interval' ? (m.current_interval_total_count || 0) : (m.current_weekly_total_count || 0);
        const remaining = viewMode === 'interval' ? (m.current_interval_usage_count || 0) : (m.current_weekly_usage_count || 0);
        const used = total - remaining;
        if (used > 0) {
          modelUsage[m.model_name] = (modelUsage[m.model_name] || 0) + used;
        }
      }
    }
    return Object.entries(modelUsage)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [statusMap, viewMode]);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center"
      >
        <p className="text-sm text-slate-400"
        >暂无用量数据</p
        >
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5"
    >
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4"
      >模型用量分布</h3
      >
      <ResponsiveContainer width="100%" height={220}
      >
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            formatter={(value: any) => [Number(value).toLocaleString(), '已用']}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AccountUsageBarChart({ statusMap, viewMode }: ChartProps) {
  const data = useMemo(() => {
    return Object.values(statusMap).map(status => {
      const mModels = status.data.filter(m => /^MiniMax-M/i.test(m.model_name));
      const totalRemaining = mModels.reduce(
        (sum, m) => {
          const total = viewMode === 'interval' ? (m.current_interval_total_count || 0) : (m.current_weekly_total_count || 0);
          const usageCount = viewMode === 'interval' ? (m.current_interval_usage_count || 0) : (m.current_weekly_usage_count || 0);
          return sum + Math.max(0, total - usageCount);
        },
        0
      );
      const totalQuota = mModels.reduce(
        (sum, m) => sum + (viewMode === 'interval' ? (m.current_interval_total_count || 0) : (m.current_weekly_total_count || 0)),
        0
      );
      const percent = totalQuota > 0 ? Math.round(((totalQuota - totalRemaining) / totalQuota) * 100) : 0;

      return {
        name: status.account.name.length > 6 ? status.account.name.slice(0, 6) + '…' : status.account.name,
        fullName: status.account.name,
        used: totalRemaining,
        remaining: totalQuota - totalRemaining,
        percent,
      };
    }).filter(d => d.used + d.remaining > 0);
  }, [statusMap, viewMode]);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center"
      >
        <p className="text-sm text-slate-400"
        >暂无用量数据</p
        >
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5"
    >
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-4"
      >账号 MiniMax-M 用量对比</h3
      >
      <ResponsiveContainer width="100%" height={240}
      >
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -15 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '12px',
              fontSize: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            }}
            formatter={(value: any, name: any) => {
              const label = name === 'used' ? '已用' : '剩余';
              return [Number(value).toLocaleString(), label];
            }}
            labelFormatter={(label: any) => {
              const item = data.find((d: any) => d.name === label);
              return item?.fullName || label;
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px' }}
            formatter={(value: string) => (value === 'used' ? '已用' : '剩余')}
          />
          <Bar dataKey="used" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
          <Bar dataKey="remaining" stackId="a" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function UsageCharts({ statusMap, viewMode, onViewModeChange }: UsageChartsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => onViewModeChange('interval')}
          className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all ${
            viewMode === 'interval'
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          当前5h周期
        </button>
        <button
          onClick={() => onViewModeChange('weekly')}
          className={`text-[11px] px-3 py-1.5 rounded-lg font-medium transition-all ${
            viewMode === 'weekly'
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
              : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          本周配额
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2"
      >
        <UsageDistributionChart statusMap={statusMap} viewMode={viewMode} />
        <AccountUsageBarChart statusMap={statusMap} viewMode={viewMode} />
      </div>
    </div>
  );
}
