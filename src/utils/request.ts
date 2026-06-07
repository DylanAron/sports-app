import env from '../config/env';

const BASE_URL = env.API_BASE_URL;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  params?: Record<string, any>;
  data?: any;
  headers?: Record<string, string>;
  needAuth?: boolean;
}

class HttpError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;
  }
}

async function request<T = any>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    params,
    data,
    headers = {},
    needAuth = true,
  } = options;

  // 拼接 query 参数
  let fullUrl = BASE_URL + url;
  if (params) {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) fullUrl += '?' + query;
  }

  // 请求头
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 自动添加 token
  if (needAuth) {
    const token = globalThis.__AUTH_TOKEN__;
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(fullUrl, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (result.code !== 200) {
      throw new HttpError(result.message || '请求失败', result.code);
    }

    return result.data as T;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError('网络请求失败，请检查网络连接', 0);
  }
}

// 存储 token（全局变量，生产环境建议用更安全的方式）
globalThis.__AUTH_TOKEN__ = undefined as string | undefined;

export function setToken(token: string | undefined) {
  globalThis.__AUTH_TOKEN__ = token;
}

export function getToken(): string | undefined {
  return globalThis.__AUTH_TOKEN__;
}

export const api = {
  get: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'GET' }),
  post: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'POST', data }),
  put: <T = any>(url: string, data?: any, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'PUT', data }),
  delete: <T = any>(url: string, options?: RequestOptions) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};

export default api;
