/**
 * AES 加密密钥配置
 * 客户端写死与服务器相同的 AES 密钥，避免动态获取导致的密钥不同步问题。
 *
 * dev 环境使用配置文件中的 sports.aes-key 默认值，
 * prod 环境通过环境变量 SPORTS_AES_KEY 注入（构建时或 CI 替换此文件）。
 */
import { CURRENT_ENV } from './env';

const DEV_AES_KEY = 'NWbIx5ZfyLQiaGfoHQcGmT09S352so7Gf8azjlTHmFw=';
const PROD_AES_KEY = 'NWbIx5ZfyLQiaGfoHQcGmT09S352so7Gf8azjlTHmFw='; // 生产环境替换为实际密钥

export const AES_KEY = CURRENT_ENV === 'development' ? DEV_AES_KEY : PROD_AES_KEY;
