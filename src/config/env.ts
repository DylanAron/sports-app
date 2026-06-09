/**
 * 环境配置
 * 不同环境使用不同的 API 域名
 */

type Environment = 'development' | 'production';

interface EnvConfig {
  API_BASE_URL: string;
  /** 客服系统 REST API 地址 */
  CS_API_BASE_URL: string;
  /** 客服系统 WebSocket 地址 */
  WS_BASE_URL: string;
  ENV: Environment;
}

const DEV: EnvConfig = {
  API_BASE_URL: 'http://192.168.2.82:8086',
  CS_API_BASE_URL: 'http://192.168.2.82:8089',
  WS_BASE_URL: 'ws://192.168.2.82:9090',
  ENV: 'development',
};

const PROD: EnvConfig = {
  API_BASE_URL: 'https://6hlot.com',
  CS_API_BASE_URL: 'https://6hlot.com',
  WS_BASE_URL: 'wss://6hlot.com',
  ENV: 'production',
};

// 切换环境：调试用 development，正式打包设 production
const CURRENT_ENV: Environment = 'development';

const config: Record<Environment, EnvConfig> = {
  development: DEV,
  production: PROD,
};

export default config[CURRENT_ENV];
export { CURRENT_ENV };
