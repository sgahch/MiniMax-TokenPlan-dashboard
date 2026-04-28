import { useState, useEffect, useCallback } from 'react';
import type { DailyUsageItem } from '../types';
import { fetchDailyUsage } from '../api';

interface UseDailyUsageResult {
  dailyUsage: DailyUsageItem[];
  loading: boolean;
  error: string;
  weekStart: string;
  weekEnd: string;
}

export function useDailyUsage(
  accountId: string,
  modelName: string,
  weekStart: string
): UseDailyUsageResult {
  const [dailyUsage, setDailyUsage] = useState<DailyUsageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [weekEnd, setWeekEnd] = useState('');

  const load = useCallback(async () => {
    if (!accountId || !modelName || !weekStart) return;

    setLoading(true);
    setError('');
    try {
      const data = await fetchDailyUsage(accountId, modelName, weekStart);
      setDailyUsage(data.daily_usage);
      setWeekEnd(data.week_end);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取失败');
    } finally {
      setLoading(false);
    }
  }, [accountId, modelName, weekStart]);

  useEffect(() => {
    void load();
  }, [load]);

  return { dailyUsage, loading, error, weekStart, weekEnd };
}
