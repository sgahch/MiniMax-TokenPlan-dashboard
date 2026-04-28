import { Users, AlertTriangle, CheckCircle, Box, Layers } from 'lucide-react';
import type { AccountStatus } from '../useAccounts';
import type { Group } from '../types';

interface DashboardStatsProps {
  statusMap: Record<string, AccountStatus>;
  groups: Group[];
  selectedGroupId: string | null;
}

function isMiniMaxM(modelName: string) {
  return /^MiniMax-M/i.test(modelName);
}

export function DashboardStats({ statusMap, groups, selectedGroupId }: DashboardStatsProps) {
  const statuses = Object.values(statusMap);
  const totalAccounts = statuses.length;

  let errorCount = 0;
  let warningCount = 0;
  let healthyCount = 0;
  let totalModels = 0;
  let totalMModels = 0;

  for (const s of statuses) {
    if (s.error) {
      errorCount++;
    } else {
      const hasWarning = s.data.some(m => {
        const total = m.current_interval_total_count || 0;
        const remaining = total - (m.current_interval_usage_count || 0);
        return total > 0 && (remaining / total) < 0.15;
      });
      if (hasWarning) warningCount++;
      else healthyCount++;
    }
    totalModels += s.data.length;
    totalMModels += s.data.filter(m => isMiniMaxM(m.model_name)).length;
  }

  const stats = [
    {
      label: '总账号',
      value: totalAccounts,
      icon: Users,
      color: 'text-primary-500',
      bg: 'bg-primary-50 dark:bg-primary-500/10',
      border: 'border-primary-200/50 dark:border-primary-500/20',
    },
    {
      label: '正常',
      value: healthyCount,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-500/10',
      border: 'border-emerald-200/50 dark:border-emerald-500/20',
    },
    {
      label: '预警',
      value: warningCount,
      icon: AlertTriangle,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-500/10',
      border: 'border-amber-200/50 dark:border-amber-500/20',
    },
    {
      label: '模型数',
      value: totalModels,
      icon: Box,
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-500/10',
      border: 'border-violet-200/50 dark:border-violet-500/20',
    },
  ];

  return (
    <div className="space-y-4"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {stats.map((stat, idx) => (
          <div
            key={stat.label}
            className={`glass-card rounded-2xl p-4 border ${stat.border} animate-slide-up`}
            style={{ animationDelay: `${idx * 80}ms` }}
          >
            <div className="flex items-center justify-between mb-2"
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400"
              >{stat.label}</span
              >
              <div className={`w-8 h-8 rounded-lg ${stat.bg} flex items-center justify-center`}
              >
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight"
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {groups.length > 0 && (
        <div className="glass-card rounded-2xl p-4 animate-slide-up animate-delay-200"
        >
          <div className="flex items-center gap-2 mb-3"
          >
            <Layers className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >分组分布</span
            >
          </div>
          <div className="flex flex-wrap gap-2"
          >
            {groups.map(group => {
              const count = Object.values(statusMap).filter(
                s => s.account.groupId === group.id
              ).length;
              const isActive = selectedGroupId === group.id;
              return (
                <div
                  key={group.id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary-500 text-white shadow-md shadow-primary-500/25'
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/50'
                  }`}
                >
                  <span>{group.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                  >
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
