/**
 * 应用配置
 * BD_APP_ID 和 APP_SECRET 已在 android/app/.../MainApplication.kt 中硬编码
 * 百度归因 SDK 初始化必须在 Application.onCreate 中进行
 */

export interface AppConfig {
  bdAppId: number;
  appSecret: string;
}
