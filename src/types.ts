// API 类型定义
export interface ModelRemain {
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
}

export interface RemainsResponse {
  model_remains?: ModelRemain[];
}

export interface ApiError {
  message: string;
  status?: number;
}

// 账号配置
export interface Account {
  id: string;
  name: string;
  apiKey: string;
}

// 格式化时间
export const formatDateTime = (timestamp: number): string => {
  if (!Number.isFinite(timestamp)) return "-";
  return new Date(timestamp).toLocaleString("zh-CN", { hour12: false });
};

// 格式化时长
export const formatDuration = (ms: number): string => {
  if (!Number.isFinite(ms) || ms <= 0) return "0秒";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}天${hours}小时${minutes}分钟`;
  if (hours > 0) return `${hours}小时${minutes}分钟`;
  if (minutes > 0) return `${minutes}分钟${seconds}秒`;
  return `${seconds}秒`;
};

// 计算用量统计（API 返回 total 和 remaining）
export const getUsageStats = (total: number, remaining: number) => {
  const safeTotal = Number.isFinite(total) && total > 0 ? total : 0;
  const safeRemaining = Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
  const used = Math.max(safeTotal - safeRemaining, 0);
  const percent = safeTotal > 0 ? Math.round((used / safeTotal) * 100) : 0;
  return { total: safeTotal, remaining: safeRemaining, used, percent };
};

// 构建进度条
export const buildProgressBar = (percent: number): string => {
  const normalized = Math.max(0, Math.min(100, percent));
  const filled = Math.round(normalized / 5);
  return "█".repeat(filled) + "░".repeat(100 - filled);
};

// 获取用量颜色
export const getUsageColor = (percent: number): string => {
  if (percent >= 85) return "text-red-500";
  if (percent >= 60) return "text-yellow-500";
  return "text-emerald-500";
};

// 获取剩余天数
export const getDaysLeft = (endTime: number): number => {
  if (!Number.isFinite(endTime)) return 0;
  const ms = endTime - Date.now();
  if (ms <= 0) return 0;
  return Math.floor(ms / 86400000);
};