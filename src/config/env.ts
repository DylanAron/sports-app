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
  /** 百度归因调试弹窗（OAID/ANDROID_ID 等信息），测试时开启 */
  SHOW_ATTRIBUTION_DEBUG: boolean;
}

const DEV: EnvConfig = {
  API_BASE_URL: 'http://192.168.4.108:8086',
  CS_API_BASE_URL: 'http://192.168.4.108:8089',
  WS_BASE_URL: 'ws://192.168.4.108:9090/ws',
  ENV: 'development',
  SHOW_ATTRIBUTION_DEBUG: true,
};

const PROD: EnvConfig = {
  API_BASE_URL: 'https://6hlot.com',
  CS_API_BASE_URL: 'https://cs.6hlot.com',
  WS_BASE_URL: 'wss://cs.6hlot.com/ws',
  ENV: 'production',
  SHOW_ATTRIBUTION_DEBUG: false,
};

// 切换环境：development 使用 DEV，release/production 使用 PROD
// __DEV__ 是 React Native 全局变量，true=开发模式，false=生产打包
const CURRENT_ENV: Environment = __DEV__ ? 'development' : 'production';

const config: Record<Environment, EnvConfig> = {
  development: DEV,
  production: PROD,
};

export default config[CURRENT_ENV];
export { CURRENT_ENV };
