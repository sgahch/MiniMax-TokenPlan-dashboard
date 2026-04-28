import { AlertTriangle } from 'lucide-react';
import type { AccountStatus } from '../useAccounts';

interface DangerRankingProps {
  statusMap: Record<string, AccountStatus>;
}

export function DangerRanking({ statusMap }: DangerRankingProps) {
  const rankings = Object.values(statusMap)
    .map(status => {
      const mModels = status.data.filter(m => /^MiniMax-M/i.test(m.model_name));
      const exhaustedModels = mModels.filter(m => {
        const remaining = (m.current_interval_total_count || 0) - (m.current_interval_usage_count || 0);
        return remaining === 0;
      });
      const nearExhaustModels = mModels.filter(m => {
        const total = m.current_interval_total_count || 0;
        const remaining = total - (m.current_interval_usage_count || 0);
        return total > 0 && remaining > 0 && (remaining / total) < 0.15;
      });
      const score = exhaustedModels.length * 2 + nearExhaustModels.length;
      return {
        accountId: status.account.id,
        accountName: status.account.name,
        exhaustedCount: exhaustedModels.length,
        nearExhaustCount: nearExhaustModels.length,
        score,
      };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (rankings.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
          危险账号排行
        </span>
      </div>
      <div className="space-y-2">
        {rankings.map((rank, idx) => (
          <div
            key={rank.accountId}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0 ${
              idx === 0 ? 'bg-red-500 text-white' :
              idx === 1 ? 'bg-amber-500 text-white' :
              'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
            }`}>
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate block">
                {rank.accountName}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                {rank.exhaustedCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-red-100 dark:bg-red-500/15 text-red-600 dark:text-red-400 font-medium">
                    <span className="w-1 h-1 rounded-full bg-red-500 dark:bg-red-400" />
                    已耗尽 {rank.exhaustedCount}
                  </span>
                )}
                {rank.nearExhaustCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                    <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400" />
                    即将耗尽 {rank.nearExhaustCount}
                  </span>
                )}
              </div>
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
              风险 {rank.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
