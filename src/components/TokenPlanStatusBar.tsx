"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { useSettingsStore } from "@/store/useSettingsStore";
import { ApiError } from "@/lib/apiClient";
import {
  ModelRemain,
  buildProgressBar,
  findModelRemain,
  fetchTokenPlanRemains,
  formatDuration,
  getDaysLeft,
  getExpireColorClass,
  getUsageColorClass,
  getUsageStats,
} from "@/lib/tokenPlan";
import { Badge, Button, Group, Paper, Stack, Text } from "@mantine/core";

type Snapshot = {
  data: ModelRemain[];
  fetchedAt: number;
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

  const chatRemain = useMemo(() => findModelRemain(snapshot.data, appConfig.models.chatDefault), [snapshot.data]);
  const videoRemain = useMemo(() => findModelRemain(snapshot.data, appConfig.models.videoDefault), [snapshot.data]);

  const chatIntervalStats = useMemo(() => {
    if (!chatRemain) {
      return { total: 0, available: 0, used: 0, percent: 0 };
    }
    return getUsageStats(chatRemain.current_interval_total_count, chatRemain.current_interval_usage_count);
  }, [chatRemain]);

  const videoIntervalStats = useMemo(() => {
    if (!videoRemain) {
      return { total: 0, available: 0, used: 0, percent: 0 };
    }
    return getUsageStats(videoRemain.current_interval_total_count, videoRemain.current_interval_usage_count);
  }, [videoRemain]);

  const liveIntervalRemainMs = chatRemain ? toLiveRemainsMs(chatRemain.remains_time, snapshot.fetchedAt, now) : 0;
  const expireAt = chatRemain ? Math.max(chatRemain.end_time, chatRemain.weekly_end_time) : 0;
  const daysLeft = getDaysLeft(expireAt);
  const chatUsageColor = getUsageColorClass(chatIntervalStats.percent);
  const videoUsageColor = getUsageColorClass(videoIntervalStats.percent);
  const expireColor = getExpireColorClass(daysLeft);
  const chatUsageBar = buildProgressBar(chatIntervalStats.percent);
  const videoUsageBar = buildProgressBar(videoIntervalStats.percent);

  return (
    <Paper className="fixed bottom-0 left-0 right-0 z-30 border-t border-gray-200/80 dark:border-zinc-800 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-md px-4 py-2" radius={0}>
      <div className="font-mono text-xs text-gray-700 dark:text-gray-200 overflow-x-auto whitespace-nowrap">
        {error ? (
          <span className="text-red-500">Token Plan 状态异常：{error}</span>
        ) : (
          <>
            <span>Usage </span>
            <span className={chatUsageColor}>{chatUsageBar}</span>
            <span className="ml-1">
              {chatIntervalStats.percent}%({chatIntervalStats.available.toLocaleString("zh-CN")}/{chatIntervalStats.total.toLocaleString("zh-CN")})
            </span>
            <span className="mx-2 text-gray-400">│</span>
            <span>Video </span>
            <span className={videoUsageColor}>{videoUsageBar}</span>
            <span className="ml-1">
              {videoIntervalStats.percent}%({videoIntervalStats.available.toLocaleString("zh-CN")}/{videoIntervalStats.total.toLocaleString("zh-CN")})
            </span>
            <span className="mx-2 text-gray-400">│</span>
            <span>⏱ {formatDuration(liveIntervalRemainMs)}</span>
            <span className="mx-2 text-gray-400">│</span>
            <span className={expireColor}>到期 {daysLeft} 天</span>
            <Button variant="default" size="compact-xs" className="ml-3" onClick={() => setExpanded((v) => !v)}>{expanded ? "收起" : "详细"}</Button>
            {loading && <span className="ml-2 text-gray-500">刷新中...</span>}
          </>
        )}
      </div>

      {expanded && !error && chatRemain && (
        <Stack className="border-t border-gray-200/80 dark:border-zinc-800 py-3 mt-2" gap={8}>
          <Group gap={8}>
            <Badge color="cyan" variant="light">聊天模型</Badge>
            <Text size="xs">{chatRemain.model_name}</Text>
          </Group>
          <Text size="xs">周期窗口：{new Date(chatRemain.start_time).toLocaleString("zh-CN", { hour12: false })} - {new Date(chatRemain.end_time).toLocaleString("zh-CN", { hour12: false })}</Text>
          <Text size="xs">Usage：{chatUsageBar} {chatIntervalStats.percent}%（{chatIntervalStats.available.toLocaleString("zh-CN")}/{chatIntervalStats.total.toLocaleString("zh-CN")}）</Text>
          <Text size="xs">重置倒计时：{formatDuration(liveIntervalRemainMs)}</Text>
          <Group gap={8} mt={4}>
            <Badge color="grape" variant="light">视频模型</Badge>
            <Text size="xs">{videoRemain?.model_name ?? appConfig.models.videoDefault}</Text>
          </Group>
          <Text size="xs">Usage：{videoUsageBar} {videoIntervalStats.percent}%（{videoIntervalStats.available.toLocaleString("zh-CN")}/{videoIntervalStats.total.toLocaleString("zh-CN")}）</Text>
          <Text size="xs">到期：{expireAt > 0 ? new Date(expireAt).toLocaleDateString("zh-CN") : "-"}（还剩 {daysLeft} 天）</Text>
        </Stack>
      )}
    </Paper>
  );
}
