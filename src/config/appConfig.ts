/**
 * 应用配置获取
 * 启动时从服务端获取 BD_APP_ID、APP_SECRET 等配置（用于百度 oCPX SDK 初始化）
 * AES 加密密钥已硬编码在客户端，不再从此接口获取。
 */

import env from './env';

const API_BASE_URL = env.API_BASE_URL;

interface AppConfig {
  bdAppId: number;
  appSecret: string;
}

let cachedConfig: AppConfig | null = null;
let fetchPromise: Promise<AppConfig> | null = null;

/**
 * 获取应用配置
 * 优先从服务端获取，失败时返回默认值
 */
export async function fetchAppConfig(): Promise<AppConfig> {
  if (cachedConfig) return cachedConfig;

  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/app/config`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await response.json();
      if (json.code === 200 && json.data) {
        cachedConfig = {
          bdAppId: Number(json.data.bdAppId) || 22870,
          appSecret: json.data.appSecret || '',
        };
        return cachedConfig;
      }
    } catch (e) {
      console.warn('[Config] Failed to fetch app config:', e);
    }

    fetchPromise = null;
    cachedConfig = null;
    return { bdAppId: 22870, appSecret: '' };
  })();

  return fetchPromise;
}
