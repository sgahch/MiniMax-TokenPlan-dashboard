import type { RemainsResponse, ModelRemain, DailyUsageResponse, ShareUser } from './types';

const API_BASE = '/api';
const DEFAULT_TIMEOUT = 120000;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function apiRequest<T>({
  path,
  method = "GET",
  apiKey,
  body,
  timeoutMs = DEFAULT_TIMEOUT,
}: {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  apiKey: string;
  body?: unknown;
  timeoutMs?: number;
}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(path, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    const baseRespCode = data?.base_resp?.status_code;
    const message =
      data?.base_resp?.status_msg ||
      data?.error?.message ||
      (response.ok ? "" : `API Error: ${response.status}`);

    if (!response.ok || (typeof baseRespCode === "number" && baseRespCode !== 0)) {
      throw new Error(message || "请求失败");
    }

    return data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试");
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// 获取 Token Plan 额度
export const fetchTokenPlanRemains = async (apiKey: string): Promise<ModelRemain[]> => {
  const maskedKey = apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : '(empty)';
  console.log(`[API] fetchTokenPlanRemains 请求开始，apiKey: ${maskedKey}`);

  try {
    const data = await apiRequest<RemainsResponse>({
      path: "https://www.minimaxi.com/v1/api/openplatform/coding_plan/remains",
      apiKey,
    });

    const remains = Array.isArray(data.model_remains) ? data.model_remains : [];
    console.log(`[API] fetchTokenPlanRemains 请求成功，共 ${remains.length} 个套餐：`);
    for (const item of remains) {
      console.log(
        `  [套餐] ${item.model_name}` +
        ` | 周期用量: ${item.current_interval_usage_count}/${item.current_interval_total_count}` +
        ` | 周用量: ${item.current_weekly_usage_count}/${item.current_weekly_total_count}` +
        ` | 剩余时长: ${item.remains_time}ms`
      );
    }
    return remains;
  } catch (err) {
    console.error(`[API] fetchTokenPlanRemains 请求失败，apiKey: ${maskedKey}`, err);
    throw err;
  }
};

// 获取每日用量快照
export const fetchDailyUsage = async (
  accountId: string,
  modelName: string,
  weekStart: string
): Promise<DailyUsageResponse> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const params = new URLSearchParams({ account_id: accountId, model_name: modelName, week_start: weekStart });
  const res = await fetch(`${API_BASE}/usage/daily?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('获取每日用量失败');
  return res.json();
};

// 手动触发快照采集
export const fetchCreateSnapshot = async (
  snapshots: Array<{
    account_id: string;
    model_name: string;
    weekly_usage: number;
    weekly_total: number;
    daily_usage: number;
    week_start: string;
  }>
): Promise<{ success: boolean; snapshots_created: number; snapshots_updated: number }> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/usage/snapshots`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ snapshots }),
  });
  if (!res.ok) throw new Error('触发快照采集失败');
  return res.json();
};

// 获取账号每日用量汇总
export const fetchDailyUsageSummary = async (
  accountId: string,
  weekStart: string
): Promise<DailyUsageResponse> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const params = new URLSearchParams({ account_id: accountId, week_start: weekStart });
  const res = await fetch(`${API_BASE}/usage/daily-summary?${params}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('获取每日用量汇总失败');
  return res.json();
};

// 获取拼车用户列表
export const fetchShareUsers = async (accountId: string): Promise<ShareUser[]> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/accounts/${accountId}/share-users`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('获取拼车用户失败');
  return res.json();
};

// 添加拼车用户
export const addShareUser = async (accountId: string, username: string): Promise<ShareUser> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/accounts/${accountId}/share-users`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || '添加拼车用户失败');
  }
  return res.json();
};

// 删除拼车用户
export const removeShareUser = async (accountId: string, userId: string): Promise<void> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('未登录');

  const res = await fetch(`${API_BASE}/accounts/${accountId}/share-users/${userId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('删除拼车用户失败');
};