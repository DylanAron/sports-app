/**
 * 应用配置
 * BD_APP_ID 和 APP_SECRET 通过服务端接口获取
 */

import env from './env';

export interface AppConfig {
  bdAppId: number;
  appSecret: string;
}

// 本地硬编码密钥，作为服务端接口的 fallback
const LOCAL_BD_APP_ID = 22870;
const LOCAL_APP_SECRET = '0ce63b2c2dee0b50c6664c6d7b7e166c';
const CONFIG_API = '/api/app/config';

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${env.API_BASE_URL}${CONFIG_API}`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await res.json();
    // 服务端返回格式兼容：{ code: 200, data: { bdAppId, appSecret } }
    if (data?.code === 200 && data?.data?.appSecret) {
      return { bdAppId: data.data.bdAppId, appSecret: data.data.appSecret };
    }
    if (data?.appSecret) {
      return { bdAppId: data.bdAppId, appSecret: data.appSecret };
    }
    throw new Error('Invalid response');
  } catch {
    console.warn('[AppConfig] 服务端获取失败，使用本地密钥');
    return { bdAppId: LOCAL_BD_APP_ID, appSecret: LOCAL_APP_SECRET };
  }
}
