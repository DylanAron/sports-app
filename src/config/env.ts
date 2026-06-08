/**
 * 环境配置
 * 不同环境使用不同的 API 域名
 */

type Environment = 'development' | 'production';

interface EnvConfig {
  API_BASE_URL: string;
  ENV: Environment;
}

const DEV: EnvConfig = {
  API_BASE_URL: 'http://192.168.4.105:8081', // 真机调试
  ENV: 'development',
};

const PROD: EnvConfig = {
  API_BASE_URL: 'https://6hlot.com',
  ENV: 'production',
};

// 切换环境：修改此处即可
const CURRENT_ENV: Environment = 'production';

const config: Record<Environment, EnvConfig> = {
  development: DEV,
  production: PROD,
};

export default config[CURRENT_ENV];
export { CURRENT_ENV };
