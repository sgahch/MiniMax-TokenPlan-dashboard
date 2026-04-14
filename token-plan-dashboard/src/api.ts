import type { RemainsResponse, ModelRemain } from './types';

const DEFAULT_TIMEOUT = 120000;

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