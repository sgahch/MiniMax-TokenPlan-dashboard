import { appConfig } from "@/config/appConfig";

const DEFAULT_TIMEOUT = 30000;

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  path: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  apiKey: string;
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
};

const buildUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  if (path.startsWith("/")) {
    return `${appConfig.apiBaseUrl}${path}`;
  }
  return `${appConfig.apiBaseUrl}/${path}`;
};

export async function apiRequest<T>({
  path,
  method = "GET",
  apiKey,
  body,
  timeoutMs = DEFAULT_TIMEOUT,
  signal,
}: RequestOptions): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const stopAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timer);
      throw new ApiError("请求已取消");
    }
    signal.addEventListener("abort", stopAbort, { once: true });
  }

  try {
    const response = await fetch(buildUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => ({}));
    const baseRespCode = data?.base_resp?.status_code;
    const message =
      data?.base_resp?.status_msg ||
      data?.error?.message ||
      (response.ok ? "" : `API Error: ${response.status}`);

    if (!response.ok || (typeof baseRespCode === "number" && baseRespCode !== 0)) {
      throw new ApiError(message || "请求失败", response.status);
    }

    return data as T;
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("请求超时，请稍后重试");
    }
    throw new ApiError(error instanceof Error ? error.message : "未知错误");
  } finally {
    clearTimeout(timer);
    if (signal) {
      signal.removeEventListener("abort", stopAbort);
    }
  }
}
