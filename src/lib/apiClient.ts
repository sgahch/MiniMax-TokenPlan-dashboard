import { appConfig } from "@/config/appConfig";

const DEFAULT_TIMEOUT = 120000;

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
  retries?: number;
  initialBackoff?: number;
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

async function doApiRequest<T>({
  path,
  method = "GET",
  apiKey,
  body,
  timeoutMs = DEFAULT_TIMEOUT,
  signal,
}: Omit<RequestOptions, "retries" | "initialBackoff">): Promise<T> {
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

    let data;
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

export async function apiRequest<T>(options: RequestOptions): Promise<T> {
  const { retries = 3, initialBackoff = 1000, ...rest } = options;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await doApiRequest<T>(rest);
    } catch (error) {
      if (error instanceof ApiError && error.status === 429 && attempt < retries) {
        attempt++;
        const delay = initialBackoff * Math.pow(2, attempt - 1);
        console.warn(`[API] 429 Too Many Requests. Retrying in ${delay}ms (Attempt ${attempt} of ${retries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unreachable");
}
