"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ApiError } from "@/lib/apiClient";
import {
  ModelRemain,
  buildProgressBar,
  fetchTokenPlanRemains,
  formatDuration,
  getExpireColorClass,
  getUsageColorClass,
  getUsageStats,
} from "@/lib/tokenPlan";

type Snapshot = {
  data: ModelRemain[];
  fetchedAt: number;
};

const getActiveRemain = (list: ModelRemain[]) => {
  if (list.length === 0) {
    return undefined;
  }
  const preferred = list.find((item) => item.model_name === appConfig.models.chatDefault);
  return preferred ?? list[0];
};

const toDaysLeft = (endTime: number) => {
  if (!Number.isFinite(endTime)) {
    return 0;
  }
  return Math.max(0, Math.ceil((endTime - Date.now()) / 86400000));
};

const toLiveRemainsMs = (value: number, fetchedAt: number, now: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value - (now - fetchedAt));
};

export default function TokenPlanStatusBar() {
  const apiKey = useSettingsStore((state) => state.apiKey);
  const [snapshot, setSnapshot] = useState<Snapshot>({ data: [], fetchedAt: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  const appDir = process.env.NEXT_PUBLIC_APP_DIR || "MiniMax-TokenPlan-Agent";
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH || "main";

  const fetchRemains = useCallback(async () => {
    const key = apiKey.trim();
    if (!key) {
      setError("未配置 API Key");
      setSnapshot({ data: [], fetchedAt: 0 });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchTokenPlanRemains(key);
      setSnapshot({ data, fetchedAt: Date.now() });
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Token Plan 查询失败";
      setError(message || "Token Plan 查询失败");
      setSnapshot({ data: [], fetchedAt: 0 });
    } finally {
      setLoading(false);
    }
  }, [apiKey]);

  useEffect(() => {
    void fetchRemains();
  }, [fetchRemains]);

  useEffect(() => {
    const refresh = window.setInterval(() => {
      void fetchRemains();
    }, 60000);
    return () => {
      window.clearInterval(refresh);
    };
  }, [fetchRemains]);

  useEffect(() => {
    const ticker = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      window.clearInterval(ticker);
    };
  }, []);

  const active = useMemo(() => getActiveRemain(snapshot.data), [snapshot.data]);

  const intervalStats = useMemo(() => {
    if (!active) {
      return { total: 0, available: 0, used: 0, percent: 0 };
    }
    return getUsageStats(active.current_interval_total_count, active.current_interval_usage_count);
  }, [active]);

  const weeklyStats = useMemo(() => {
    if (!active) {
      return { total: 0, available: 0, used: 0, percent: 0 };
    }
    return getUsageStats(active.current_weekly_total_count, active.current_weekly_usage_count);
  }, [active]);

  const liveIntervalRemainMs = active ? toLiveRemainsMs(active.remains_time, snapshot.fetchedAt, now) : 0;
  const daysLeft = active ? toDaysLeft(active.end_time) : 0;
  const usageColor = getUsageColorClass(intervalStats.percent);
  const expireColor = getExpireColorClass(daysLeft);
  const usageBar = buildProgressBar(intervalStats.percent);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md">
      <div className="px-4 py-2 font-mono text-xs text-gray-700 dark:text-gray-200 overflow-x-auto whitespace-nowrap">
        {error ? (
          <span className="text-red-500">Token Plan 状态异常：{error}</span>
        ) : (
          <>
            <span>{appDir}</span>
            <span className="mx-2 text-gray-400">│</span>
            <span>{branch}</span>
            <span className="mx-2 text-gray-400">│</span>
            <span>Usage </span>
            <span className={usageColor}>{usageBar}</span>
            <span className="ml-1">
              {intervalStats.percent}%({intervalStats.available.toLocaleString("zh-CN")}/{intervalStats.total.toLocaleString("zh-CN")})
            </span>
            <span className="mx-2 text-gray-400">│</span>
            <span>⏱ {formatDuration(liveIntervalRemainMs)}</span>
            <span className="mx-2 text-gray-400">│</span>
            <span className={expireColor}>到期 {daysLeft} 天</span>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="ml-3 rounded border border-gray-300 dark:border-zinc-700 px-2 py-0.5 text-[11px] hover:bg-gray-100 dark:hover:bg-zinc-800"
            >
              {expanded ? "收起" : "详细"}
            </button>
            {loading && <span className="ml-2 text-gray-500">刷新中...</span>}
          </>
        )}
      </div>

      {expanded && !error && active && (
        <div className="border-t border-gray-200/80 dark:border-zinc-800 px-4 py-3">
          <pre className="text-xs leading-6 text-gray-800 dark:text-gray-100 font-mono whitespace-pre-wrap">
{`┌─────────────────────────────────────────────────────────────┐
│ MiniMax Claude Code 使用状态                                │
│                                                             │
│ 当前模型: ${active.model_name}
│ 时间窗口: ${new Date(active.start_time).toLocaleTimeString("zh-CN", { hour12: false })}-${new Date(active.end_time).toLocaleTimeString("zh-CN", { hour12: false })}(UTC+8)
│ 剩余时间: ${formatDuration(liveIntervalRemainMs)}后重置
│                                                             │
│ 已用额度: ${usageBar} ${intervalStats.percent}%                               
│      剩余: ${intervalStats.available.toLocaleString("zh-CN")}/${intervalStats.total.toLocaleString("zh-CN")} 次调用
│      套餐到期: ${new Date(active.end_time).toLocaleDateString("zh-CN")}（还剩 ${daysLeft} 天）
│                                                             │
│ 周维度: ${buildProgressBar(weeklyStats.percent)} ${weeklyStats.percent}%                             
│      周剩余: ${weeklyStats.available.toLocaleString("zh-CN")}/${weeklyStats.total.toLocaleString("zh-CN")} 次调用
│      周重置: ${formatDuration(toLiveRemainsMs(active.weekly_remains_time, snapshot.fetchedAt, now))}
│                                                             │
│ 状态: ${intervalStats.percent >= 85 || daysLeft <= 3 ? "⚠ 关注使用" : "✓ 正常使用"}
└─────────────────────────────────────────────────────────────┘`}
          </pre>
        </div>
      )}
    </div>
  );
}
