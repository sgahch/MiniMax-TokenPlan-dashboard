"use client";

import { apiRequest } from "@/lib/apiClient";

export type ModelRemain = {
  start_time: number;
  end_time: number;
  remains_time: number;
  current_interval_total_count: number;
  current_interval_usage_count: number;
  model_name: string;
  current_weekly_total_count: number;
  current_weekly_usage_count: number;
  weekly_start_time: number;
  weekly_end_time: number;
  weekly_remains_time: number;
};

type RemainsResponse = {
  model_remains?: ModelRemain[];
};

export const fetchTokenPlanRemains = async (apiKey: string) => {
  const data = await apiRequest<RemainsResponse>({
    path: "https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains",
    apiKey,
  });
  return Array.isArray(data.model_remains) ? data.model_remains : [];
};

export const formatDateTime = (timestamp: number) => {
  if (!Number.isFinite(timestamp)) {
    return "-";
  }
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
};

export const formatDuration = (ms: number) => {
  if (!Number.isFinite(ms) || ms <= 0) {
    return "0秒";
  }
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) {
    return `${days}天${hours}小时${minutes}分钟`;
  }
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds}秒`;
  }
  return `${seconds}秒`;
};

export const getUsageStats = (total: number, available: number) => {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeAvailable = Number.isFinite(available) ? Math.max(0, available) : 0;
  const used = Math.max(safeTotal - safeAvailable, 0);
  const ratio = safeTotal > 0 ? used / safeTotal : 0;
  const percent = Math.max(0, Math.min(100, Math.round(ratio * 100)));
  return {
    total: safeTotal,
    available: safeAvailable,
    used,
    percent,
  };
};

export const buildProgressBar = (percent: number) => {
  const normalized = Math.max(0, Math.min(100, percent));
  const filled = Math.round(normalized / 10);
  return `${"█".repeat(filled)}${"░".repeat(10 - filled)}`;
};

export const getUsageColorClass = (percent: number) => {
  if (percent >= 85) {
    return "text-red-500";
  }
  if (percent >= 60) {
    return "text-yellow-500";
  }
  return "text-emerald-500";
};

export const getExpireColorClass = (days: number) => {
  if (days <= 3) {
    return "text-red-500";
  }
  if (days <= 7) {
    return "text-yellow-500";
  }
  return "text-emerald-500";
};
