import env from '../config/env';
import { ensureDeviceId } from '../device/deviceId';
import { encryptAES, decryptAES } from '../device/crypto';

const BASE_URL = env.API_BASE_URL;
const API_PREFIX = '/api/v2';

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

  // 配置接口不走 v2 前缀和加密
  const isConfigUrl = url.includes('/api/app/config');
  let fullUrl = isConfigUrl ? BASE_URL + url : BASE_URL + API_PREFIX + url;
  if (params) {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    if (query) fullUrl += '?' + query;
  }

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 自动添加 deviceId
  try {
    const deviceId = await ensureDeviceId();
    requestHeaders['X-Device-Id'] = deviceId;
  } catch {
    // 非致命
  }

  // 自动添加 token
  if (needAuth) {
    const token = globalThis.__AUTH_TOKEN__;
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // v2 接口全走密文，配置接口走明文
  const shouldEncrypt = !isConfigUrl;

  let body: string | undefined;
  if (data) {
    const jsonStr = JSON.stringify(data);
    body = shouldEncrypt ? encryptAES(jsonStr) : jsonStr;
  }

  const response = await fetch(fullUrl, { method, headers: requestHeaders, body });
  const responseText = await response.text();

  // 解密响应
  let result: any;
  if (shouldEncrypt && responseText) {
    try {
      result = JSON.parse(decryptAES(responseText));
    } catch {
      // 服务端未加密时回退明文
      result = JSON.parse(responseText);
    }
  } else {
    result = JSON.parse(responseText);
  }

  if (result.code !== 200) {
    throw new HttpError(result.message || '请求失败', result.code);
  }

  return result.data as T;
}

// 存储 token（全局变量）
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
